<?php

namespace App\Http\Controllers;

use App\Http\Resources\RunEventResource;
use App\Http\Resources\UserResource;
use App\Models\RunEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RunEventController extends Controller
{
    /**
     * GET /api/run-events
     * Filtri: status, q (location), date_from, date_to, mine=organized|participating|all
     */
        public function index(Request $request)
        {
            $user = $request->user();

            // umesto $request->integer('per_page', 15)
            $perPage = (int) $request->query('per_page', 15);
            if ($perPage <= 0) $perPage = 15;
            if ($perPage > 100) $perPage = 100;

            $q = RunEvent::query()
                ->withCount(['participants','comments'])
                ->with(['organizer']);

            // pretraga po lokaciji
            if ($request->filled('q')) {
                $q->where('location', 'like', '%'.$request->query('q').'%');
            }

            // status filter
            if ($request->filled('status')) {
                $q->where('status', $request->query('status'));
            }

            // vremenski opseg
            if ($request->filled('date_from')) {
                $q->where('start_time', '>=', $request->query('date_from'));
            }
            if ($request->filled('date_to')) {
                $q->where('start_time', '<=', $request->query('date_to'));
            }

            // mine: organized | participating
            $mine = $request->query('mine');
            if ($mine === 'organized' && $user) {
                $q->where('organizer_id', $user->id);
            } elseif ($mine === 'participating' && $user) {
                $q->whereHas('participants', fn($qq) => $qq->where('users.id', $user->id));
            }

            $q->orderBy('start_time');

            return RunEventResource::collection(
                $q->paginate($perPage)->appends($request->query())
            );
        }



    /**
     * POST /api/run-events
     * Kreira event; organizer je trenutni korisnik osim ako je prosleđen eksplicitno i user je admin.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'start_time'  => ['required','date'],
            'location'    => ['nullable','string','max:255'],
            'distance_km' => ['nullable','numeric','min:0','max:9999.99'],
            'status'      => ['nullable', Rule::in(['planned','completed','cancelled'])],
            'description' => ['nullable','string'],
            // opciono: početni učesnici
            'participants' => ['sometimes','array'],
            'participants.*' => ['integer','exists:users,id'],
            // opciono: organizer_id (dozvoljeno samo adminu)
            'organizer_id' => ['sometimes','integer','exists:users,id'],
        ]);

        $organizerId = $user->isAdmin() && isset($data['organizer_id'])
            ? $data['organizer_id']
            : $user->id;

        $event = RunEvent::create([
            'organizer_id' => $organizerId,
            'start_time'   => $data['start_time'],
            'location'     => $data['location'] ?? null,
            'distance_km'  => $data['distance_km'] ?? null,
            'status'       => $data['status'] ?? 'planned',
            'description'  => $data['description'] ?? null,
        ]);

        if (!empty($data['participants'])) {
            $event->participants()->syncWithoutDetaching($data['participants']);
        }

        // organizator je automatski učesnik
        $event->participants()->syncWithoutDetaching([$organizerId]);

        return new RunEventResource($event->load(['organizer','participants']));
    }

    /**
     * GET /api/run-events/{runEvent}
     */
    public function show(RunEvent $runEvent)
    {
        $runEvent->load(['organizer','participants','comments','stats']);
        return new RunEventResource($runEvent);
    }

    /**
     * PUT/PATCH /api/run-events/{runEvent}
     * Dozvoljeno organizatoru ili adminu.
     */
    public function update(Request $request, RunEvent $runEvent)
    {
        $this->authorizeEvent($request->user(), $runEvent);

        $data = $request->validate([
            'start_time'  => ['sometimes','date'],
            'location'    => ['sometimes','nullable','string','max:255'],
            'distance_km' => ['sometimes','nullable','numeric','min:0','max:9999.99'],
            'status'      => ['sometimes', Rule::in(['planned','completed','cancelled'])],
            'description' => ['sometimes','nullable','string'],
            'participants'   => ['sometimes','array'],
            'participants.*' => ['integer','exists:users,id'],
        ]);

        $runEvent->fill($data)->save();

        if (array_key_exists('participants', $data)) {
            $runEvent->participants()->sync($data['participants'] ?? []);
        }

        return new RunEventResource($runEvent->load(['organizer','participants']));
    }

    /**
     * DELETE /api/run-events/{runEvent}
     * Dozvoljeno organizatoru ili adminu.
            */
        public function destroy(Request $request, RunEvent $runEvent)
        {
            $this->authorizeEvent($request->user(), $runEvent);

            DB::transaction(function () use ($runEvent) {
                // 1) obriši sve komentare vezane za event
                $runEvent->comments()->delete();

                // (opciono ali preporučljivo)
                // 2) ukloni sve učesnike iz pivot tabele
                $runEvent->participants()->detach();

                // (opciono, ako imaš relaciju RunEvent::stats())
                // 3) obriši sve run-stat zapise vezane za event
                if (method_exists($runEvent, 'stats')) {
                    $runEvent->stats()->delete();
                }

                // 4) na kraju — obriši sam event
                $runEvent->delete();
            });

            return response()->json(['message' => 'Deleted']);
        }


    /**
     * POST /api/run-events/{runEvent}/join
     */
    public function join(Request $request, RunEvent $runEvent)
    {
        $userId = $request->user()->id;
        $runEvent->participants()->syncWithoutDetaching([$userId]);
        return response()->json(['message' => 'Joined']);
    }

    /**
     * DELETE /api/run-events/{runEvent}/leave
     */
    public function leave(Request $request, RunEvent $runEvent)
    {
        $userId = $request->user()->id;
        $runEvent->participants()->detach($userId);
        return response()->json(['message' => 'Left']);
    }

    /**
     * POST /api/run-events/{runEvent}/complete
     * Postavlja status na 'completed' (organizer/admin).
     */
    public function complete(Request $request, RunEvent $runEvent)
    {
        $this->authorizeEvent($request->user(), $runEvent);
        $runEvent->update(['status' => 'completed']);
        return new RunEventResource($runEvent);
    }

    /**
     * POST /api/run-events/{runEvent}/cancel
     * Postavlja status na 'cancelled' (organizer/admin).
     */
    public function cancel(Request $request, RunEvent $runEvent)
    {
        $this->authorizeEvent($request->user(), $runEvent);
        $runEvent->update(['status' => 'cancelled']);
        return new RunEventResource($runEvent);
    }

    /** Helper: organizator ili admin */
    private function authorizeEvent($user, RunEvent $event): void
    {
        if (!$user || (!$user->isAdmin() && $event->organizer_id !== $user->id)) {
            abort(403, 'Forbidden');
        }
    }


    public function participants(RunEvent $runEvent)
    {
        // GET /api/run-events/{runEvent}/participants
        $users = $runEvent->participants()->paginate(20);
        return UserResource::collection($users);
    }

    public function summary(RunEvent $runEvent)
    {
        // GET /api/run-events/{runEvent}/summary
        $stats = $runEvent->stats(); // relacija RunEvent::stats()

        $summary = [
            'participants'   => $runEvent->participants()->count(),
            'comments'       => $runEvent->comments()->count(),
            'distance_avg'   => (float) $stats->avg('distance_km'),
            'pace_avg_sec'   => (int)   $stats->avg('avg_pace_sec'),
            'total_runs'     => (int)   $stats->count(),
            'total_distance' => (float) $stats->sum('distance_km'),
        ];

        return response()->json($summary);
    }
}
