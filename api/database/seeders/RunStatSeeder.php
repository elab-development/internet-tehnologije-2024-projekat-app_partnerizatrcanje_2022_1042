<?php

namespace Database\Seeders;

use App\Models\RunEvent;
use App\Models\RunStat;
use App\Models\User;
use Illuminate\Database\Seeder;

class RunStatSeeder extends Seeder
{
    public function run(): void
    {
        // FACTORY (nevezano za event)
        RunStat::factory()->count(20)->create();

        // FACTORY state: vezano za event
        RunStat::factory()->count(6)->forEvent()->create();

        // PLAIN OBJECT (ručna statistika)
        $u = User::inRandomOrder()->first();
        $e = RunEvent::inRandomOrder()->first();

        RunStat::create([
            'user_id'      => $u->id,
            'run_event_id' => $e->id,
            'recorded_at'  => now()->subDays(1)->setTime(7,30),
            'distance_km'  => 8.40,
            'duration_sec' => 8.40 * 360,        // baš grubo
            'avg_pace_sec' => 360,               // 6:00 min/km
            'calories'     => 620,
            'gps_track'    => [
                ['lng'=>20.410,'lat'=>44.802],
                ['lng'=>20.418,'lat'=>44.806],
                ['lng'=>20.424,'lat'=>44.811],
            ],
        ]);
    }
}
