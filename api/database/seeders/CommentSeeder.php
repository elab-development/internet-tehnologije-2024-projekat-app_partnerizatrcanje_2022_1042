<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\RunEvent;
use App\Models\User;
use Illuminate\Database\Seeder;

class CommentSeeder extends Seeder
{
    public function run(): void
    {
        // FACTORY
        Comment::factory()->count(30)->create();

        // PLAIN OBJECT
        $event = RunEvent::inRandomOrder()->first();
        $author = User::inRandomOrder()->first();

        Comment::create([
            'user_id'      => $author->id,
            'run_event_id' => $event->id,
            'content'      => 'Super tura, sledeći put pojačavamo tempo!',
            'posted_at'    => now()->subHours(6),
        ]);
    }
}
