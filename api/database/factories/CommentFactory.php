<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\RunEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        return [
            'user_id'      => User::factory(),
            'run_event_id' => RunEvent::factory(), 
            'content'      => $this->faker->paragraph(),
            'posted_at'    => $this->faker->dateTimeBetween('-3 days', 'now'),
        ];
    }
}
