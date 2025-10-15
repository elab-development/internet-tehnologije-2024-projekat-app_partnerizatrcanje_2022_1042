<?php

namespace App\Http\Controllers;

use App\Http\Resources\RunPlanResource;
use App\Models\RunPlan;
use Illuminate\Http\Request;

class RunPlanController extends Controller
{
    // GET /api/run-plans?q=&date_from=&date_to=&user_id=
    public function index(Request $request)
    {
        $q = RunPlan::query()->with('user');

        if ($request->filled('q')) {
            $q->where('location', 'like', '%'.$request->query('q').'%');
        }
        if ($request->filled('date_from')) {
            $q->where('start_time', '>=', $request->date('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->where('start_time', '<=', $request->date('date_to'));
        }
        if ($request->filled('user_id')) {
            $q->where('user_id', (int) $request->query('user_id'));
        }

        $q->orderBy('start_time');

        return RunPlanResource::collection(
            $q->paginate($request->integer('per_page', 15))
              ->appends($request->query())
        );
    }

    // POST /api/run-plans
    public function store(Request $request)
    {
        $data = $request->validate([
            'start_time'      => ['required','date'],
            'location'        => ['nullable','string','max:255'],
            'distance_km'     => ['nullable','numeric','min:0','max:9999.99'],
            'target_pace_sec' => ['nullable','integer','min:0','max:10000'],
            'notes'           => ['nullable','string'],
            'meet_lat'        => ['nullable','numeric','between:-90,90'],
            'meet_lng'        => ['nullable','numeric','between:-180,180'],
            'route_polyline'  => ['nullable','string'],
            'route_geojson'   => ['nullable','array'],
            'user_id'         => ['required','integer','exists:users,id'], // eksplicitno prosleđuješ vlasnika
        ]);

        $plan = RunPlan::create($data);

        return new RunPlanResource($plan->load('user'));
    }

    // GET /api/run-plans/{runPlan}
    public function show(RunPlan $runPlan)
    {
        return new RunPlanResource($runPlan->load('user'));
    }

    // PUT/PATCH /api/run-plans/{runPlan}
    public function update(Request $request, RunPlan $runPlan)
    {
        $data = $request->validate([
            'start_time'      => ['sometimes','date'],
            'location'        => ['sometimes','nullable','string','max:255'],
            'distance_km'     => ['sometimes','nullable','numeric','min:0','max:9999.99'],
            'target_pace_sec' => ['sometimes','nullable','integer','min:0','max:10000'],
            'notes'           => ['sometimes','nullable','string'],
            'meet_lat'        => ['sometimes','nullable','numeric','between:-90,90'],
            'meet_lng'        => ['sometimes','nullable','numeric','between:-180,180'],
            'route_polyline'  => ['sometimes','nullable','string'],
            'route_geojson'   => ['sometimes','nullable','array'],
            'user_id'         => ['sometimes','integer','exists:users,id'],
        ]);

        $runPlan->fill($data)->save();

        return new RunPlanResource($runPlan->load('user'));
    }

    // DELETE /api/run-plans/{runPlan}
    public function destroy(RunPlan $runPlan)
    {
        $runPlan->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
