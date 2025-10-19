<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

   public function definition(): array
{
    $roles = [User::ROLE_USER, User::ROLE_ADMIN];

    // oko centra BG: (44.8125, 20.4612)
    $baseLat = 44.8125;
    $baseLng = 20.4612;
    $jitter = fn($max=0.02) => $this->faker->randomFloat(6, -$max, $max); // ~par km

    return [
        'name'              => $this->faker->name(),
        'email'             => $this->faker->unique()->safeEmail(),
        'email_verified_at' => now(),
        'password'          => Hash::make('password'),
        'remember_token'    => Str::random(10),
        'role'              => $this->faker->randomElement($roles),

        //   nova polja (dummy lokacije oko BG)
        'last_lat'          => $baseLat + $jitter(),
        'last_lng'          => $baseLng + $jitter(),
        'last_accuracy_m'   => $this->faker->numberBetween(5, 50),
        'last_seen_at'      => now()->subMinutes($this->faker->numberBetween(1, 60)),
    ];
}

}
