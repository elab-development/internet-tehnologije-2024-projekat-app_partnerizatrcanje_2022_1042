<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
public function run(): void
    {
        // factories
        User::factory()->count(5)->create();

        // plain objects (kao do sada)
        $admin = User::create([
            'name' => 'Admin Runner',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $mila = User::create([
            'name' => 'Mila Trkac',
            'email' => 'mila@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        //   dodeli im poslednju lokaciju (približno BG)
        $admin->update([
            'last_lat' => 44.8070, // Slavija okvirno
            'last_lng' => 20.4520,
            'last_accuracy_m' => 20,
            'last_seen_at' => now()->subMinutes(5),
        ]);

        $mila->update([
            'last_lat' => 44.8205, // Ušće okvirno
            'last_lng' => 20.4366,
            'last_accuracy_m' => 15,
            'last_seen_at' => now()->subMinutes(12),
        ]);
    }

}
