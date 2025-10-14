<?php

namespace Database\Seeders;

use App\Models\RunEvent;
use App\Models\User;
use Illuminate\Database\Seeder;

class RunEventSeeder extends Seeder
{
    public function run(): void
    {
        // FACTORY (automatski doda učesnike u configure())
        RunEvent::factory()->count(8)->create();

        // PLAIN OBJECT + attach učesnika
        $organizer = User::inRandomOrder()->first();
        $event = RunEvent::create([
            'organizer_id' => $organizer->id,
            'start_time'   => now()->addWeek()->setTime(9, 0),
            'location'     => 'Košutnjak – Hajdučka česma',
            'distance_km'  => 12.5,
            'status'       => 'planned',
            'description'  => 'Brdsko trčanje, tempo umereno.',
        ]);

        $participants = User::inRandomOrder()->limit(4)->pluck('id');
        $event->participants()->attach($participants);
    }
}
