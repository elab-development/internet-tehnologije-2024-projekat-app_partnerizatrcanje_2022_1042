<?php

namespace Database\Factories;

use App\Models\RunPlan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RunPlanFactory extends Factory
{
    protected $model = RunPlan::class;

    public function definition(): array
    {
        $distance = $this->faker->randomFloat(2, 3, 25); // 3–25 km
        $lat = $this->faker->latitude(44.6, 45.0);       // ~Beograd okolina
        $lng = $this->faker->longitude(20.2, 20.7);

        // jednostavna fiktivna ruta (GeoJSON LineString)
        $route = [
            'type' => 'LineString',
            'coordinates' => [
                [$lng, $lat],
                [$lng + 0.01, $lat + 0.01],
                [$lng + 0.02, $lat + 0.015],
            ],
        ];

        return [
            'user_id'         => User::factory(),
            'start_time'      => $this->faker->dateTimeBetween('+1 day', '+2 weeks'),
            'location'        => $this->faker->streetAddress(),
            'distance_km'     => $distance,
            'target_pace_sec' => $this->faker->numberBetween(280, 420), // 4:40–7:00 min/km
            'notes'           => $this->faker->optional()->sentence(),
            'meet_lat'        => $lat,
            'meet_lng'        => $lng,
            'route_polyline'  => null,     // koristi route_geojson u ovom primeru
            'route_geojson'   => $route,   // automatski će se sačuvati kao JSON
        ];
    }
}
