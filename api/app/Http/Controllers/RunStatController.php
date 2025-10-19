<?php

namespace App\Http\Controllers;

use App\Http\Resources\RunStatResource;
use App\Models\RunStat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RunStatController extends Controller
{
    // GET /api/run-stats?user_id=&run_event_id=&date_from=&date_to=&per_page=
    public function index(Request $request)
    {
        $q = RunStat::query()->with(['user','event']);

        if ($request->filled('user_id')) {
            $q->where('user_id', (int)$request->query('user_id'));
        }
        if ($request->filled('run_event_id')) {
            $q->where('run_event_id', (int)$request->query('run_event_id'));
        }
        if ($request->filled('date_from')) {
            $q->where('recorded_at', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->where('recorded_at', '<=', $request->date('date_to'));
        }

        $q->orderByDesc('recorded_at');

        return RunStatResource::collection(
            $q->paginate($request->integer('per_page', 15))
              ->appends($request->query())
        );
    }

    // POST /api/run-stats
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'      => ['required','integer','exists:users,id'],
            'run_event_id' => ['nullable','integer','exists:run_events,id'],
            'recorded_at'  => ['required','date'],
            'distance_km'  => ['nullable','numeric','min:0','max:9999.99'],
            'duration_sec' => ['nullable','integer','min:0'],
            'avg_pace_sec' => ['nullable','integer','min:0'],
            'calories'     => ['nullable','integer','min:0'],
            'gps_track'    => ['nullable','array'],
        ]);

        // Ako pace nije prosleđen, izračunaj ga iz distance/duration (ako je moguće)
        if (!isset($data['avg_pace_sec']) && !empty($data['distance_km']) && !empty($data['duration_sec']) && $data['distance_km'] > 0) {
            $data['avg_pace_sec'] = (int) round($data['duration_sec'] / $data['distance_km']);
        }

        $stat = RunStat::create($data);

        return new RunStatResource($stat->load(['user','event']));
    }

    // GET /api/run-stats/{runStat}
    public function show(RunStat $runStat)
    {
        return new RunStatResource($runStat->load(['user','event']));
    }

    // PUT/PATCH /api/run-stats/{runStat}
    public function update(Request $request, RunStat $runStat)
    {
        $data = $request->validate([
            'user_id'      => ['sometimes','integer','exists:users,id'],
            'run_event_id' => ['sometimes','nullable','integer','exists:run_events,id'],
            'recorded_at'  => ['sometimes','date'],
            'distance_km'  => ['sometimes','nullable','numeric','min:0','max:9999.99'],
            'duration_sec' => ['sometimes','nullable','integer','min:0'],
            'avg_pace_sec' => ['sometimes','nullable','integer','min:0'],
            'calories'     => ['sometimes','nullable','integer','min:0'],
            'gps_track'    => ['sometimes','nullable','array'],
        ]);

  
        if (
            !array_key_exists('avg_pace_sec', $data) &&
            (array_key_exists('distance_km', $data) || array_key_exists('duration_sec', $data))
        ) {
            $distance = $data['distance_km'] ?? $runStat->distance_km;
            $duration = $data['duration_sec'] ?? $runStat->duration_sec;
            if (!empty($distance) && !empty($duration) && $distance > 0) {
                $data['avg_pace_sec'] = (int) round($duration / $distance);
            }
        }

        $runStat->fill($data)->save();

        return new RunStatResource($runStat->load(['user','event']));
    }

    // DELETE /api/run-stats/{runStat}
    public function destroy(RunStat $runStat)
    {
        $runStat->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function summary(User $user)
    {
        // GET /api/stats/user/{user}/summary
        $q = $user->stats(); // relacija User::stats()
        return response()->json([
            'total_runs'     => (int)   $q->count(),
            'total_distance' => (float) $q->sum('distance_km'),
            'avg_pace_sec'   => (int)   $q->avg('avg_pace_sec'),
            'last_run_at'    => optional($q->max('recorded_at'))->format('Y-m-d H:i:s'),
        ]);
    }

    public function byMonth(User $user)
    {
        // GET /api/stats/user/{user}/by-month
        // MySQL: DATE_FORMAT; za druge DB prilagoditi
        $rows = $user->stats()
            ->selectRaw("DATE_FORMAT(recorded_at, '%Y-%m') as ym")
            ->selectRaw('COUNT(*) as runs')
            ->selectRaw('SUM(distance_km) as km')
            ->groupBy('ym')
            ->orderBy('ym')
            ->get();

        return response()->json($rows);
    }
    /** GET /api/stats/global-averages */
        public function globalAverages()
        {
            return response()->json([
                'avg_pace_sec'     => (int)  RunStat::avg('avg_pace_sec'),
                'avg_distance_km'  => (float) RunStat::avg('distance_km'),
                'total_distance'   => (float) RunStat::sum('distance_km'),
                'total_runs'       => (int)  RunStat::count(),
            ]);
        }

        /** GET /api/stats/leaderboard/total-distance?limit=5 */
        public function leaderboardTotalDistance(Request $request)
        {
            $limit = (int) $request->query('limit', 5);
            if ($limit < 1) $limit = 5; if ($limit > 50) $limit = 50;

            $rows = RunStat::query()
                ->select('user_id', DB::raw('SUM(distance_km) AS total_km'))
                ->groupBy('user_id')
                ->orderByDesc('total_km')
                ->limit($limit)
                ->get();

            // pridruži imena
            $userNames = DB::table('users')->whereIn('id', $rows->pluck('user_id'))->pluck('name','id');
            $data = $rows->map(function ($r) use ($userNames) {
                return [
                    'user_id'  => $r->user_id,
                    'name'     => $userNames[$r->user_id] ?? null,
                    'total_km' => (float) $r->total_km,
                ];
            });

            return response()->json($data);
        }

        /** GET /api/stats/leaderboard/avg-pace?limit=5
         *  rangira korisnike po najboljem (najmanjem) avg pace-u
         *  koristi prosečan pace po korisniku (prosek svih njegovih zapisa)
         */
        public function leaderboardAvgPace(Request $request)
        {
            $limit = (int) $request->query('limit', 5);
            if ($limit < 1) $limit = 5; if ($limit > 50) $limit = 50;

            $rows = RunStat::query()
                ->select('user_id', DB::raw('AVG(avg_pace_sec) AS avg_pace_sec'))
                ->whereNotNull('avg_pace_sec')
                ->groupBy('user_id')
                ->orderBy('avg_pace_sec', 'asc') // manji = bolji
                ->limit($limit)
                ->get();

            $userNames = DB::table('users')->whereIn('id', $rows->pluck('user_id'))->pluck('name','id');
            $data = $rows->map(function ($r) use ($userNames) {
                return [
                    'user_id'      => $r->user_id,
                    'name'         => $userNames[$r->user_id] ?? null,
                    'avg_pace_sec' => (int) $r->avg_pace_sec,
                ];
            });

            return response()->json($data);
        }
}
