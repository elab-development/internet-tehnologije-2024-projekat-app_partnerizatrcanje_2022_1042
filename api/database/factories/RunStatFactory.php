<?php

namespace Database\Factories;

use App\Models\RunEvent;
use App\Models\RunStat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RunStatFactory extends Factory
{
    protected $model = RunStat::class;

    public function definition(): array
    {
        $distance = $this->faker->randomFloat(2, 2, 21.1);         // 2–21.1 km
        $pace     = $this->faker->numberBetween(270, 420);         // 4:30–7:00 min/km u sekundama
        $duration = (int) round($distance * $pace);                 // sekunde

        // jednostavan "track" kao niz tačaka (lng,lat)
        $lat = $this->faker->latitude(44.6, 45.0);
        $lng = $this->faker->longitude(20.2, 20.7);
        $track = [
            ['lng' => $lng,             'lat' => $lat],
            ['lng' => $lng + 0.005,     'lat' => $lat + 0.004],
            ['lng' => $lng + 0.010,     'lat' => $lat + 0.008],
        ];

        return [
            'user_id'      => User::factory(),
            'run_event_id' => null, // ili ->for(RunEvent::factory()) kroz state
            'recorded_at'  => $this->faker->dateTimeBetween('-10 days', 'now'),
            'distance_km'  => $distance,
            'duration_sec' => $duration,
            'avg_pace_sec' => $pace,
            'calories'     => $this->faker->numberBetween(150, 1200),
            'gps_track'    => $track, // čuva se kao JSON
        ];
    }

    /**
     * State koji vezuje statistiku za konkretan događaj.
     */
    public function forEvent(): self
    {
        return $this->state(fn () => [
            'run_event_id' => RunEvent::factory(),
        ]);
    }
}
