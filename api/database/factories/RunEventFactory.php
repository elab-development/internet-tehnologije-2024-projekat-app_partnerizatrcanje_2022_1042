<?php

namespace Database\Factories;

use App\Models\RunEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RunEventFactory extends Factory
{
    protected $model = RunEvent::class;

    public function definition(): array
    {
        return [
            'organizer_id' => User::factory(),
            'start_time'   => $this->faker->dateTimeBetween('+1 day', '+1 month'),
            'location'     => $this->faker->address(),
            'distance_km'  => $this->faker->optional()->randomFloat(2, 3, 42.2),
            'status'       => $this->faker->randomElement(['planned','completed','cancelled']),
            'description'  => $this->faker->optional()->paragraph(),
        ];
    }

    /**
     * Stanje: planiran događaj
     */
    public function planned(): self
    {
        return $this->state(fn () => ['status' => 'planned']);
    }

    /**
     * Posle kreiranja može (opciono) da doda učesnike.
     */
    public function configure()
    {
        return $this->afterCreating(function (RunEvent $event) {
            if ($this->faker->boolean(70)) {
                $users = User::factory()->count($this->faker->numberBetween(1, 4))->create();
                $event->participants()->attach($users->pluck('id')->all());
            }
        });
    }
}
