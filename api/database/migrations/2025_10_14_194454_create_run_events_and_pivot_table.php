<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('run_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('start_time')->index();
            $table->string('location', 255)->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->enum('status', ['planned','completed','cancelled'])->default('planned')->index();
            $table->text('desc')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('run_event_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('run_event_id')->constrained('run_events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['run_event_id','user_id']); // jedan korisnik jednom po eventu
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('run_event_user');
        Schema::dropIfExists('run_events');
    }
};
