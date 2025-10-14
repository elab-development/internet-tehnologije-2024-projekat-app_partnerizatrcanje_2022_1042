<?php

namespace Database\Seeders;

use App\Models\RunPlan;
use App\Models\User;
use Illuminate\Database\Seeder;

class RunPlanSeeder extends Seeder
{
    public function run(): void
    {
        // factories
        User::all()->each(function ($u) {
            RunPlan::factory()->count(2)->for($u)->create();
        });

        // plain
        $user = User::first();
        RunPlan::create([
            'user_id' => $user->id,
            'start_time' => now()->addDays(3)->setTime(7, 30),
            'location' => 'Ada Ciganlija – parking H',
            'distance_km' => 10.0,
            'target_pace_sec' => 330,
            'notes' => 'Lagani tempo, ravno.',
            'meet_lat' => 44.7866,
            'meet_lng' => 20.4489,
            'route_geojson' => [
                'type' => 'LineString',
                'coordinates' => [[20.4489,44.7866],[20.46,44.79]],
            ],
        ]);
    }
}
