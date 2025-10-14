<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('run_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('run_event_id')->nullable()->constrained('run_events')->nullOnDelete();

            $table->dateTime('recorded_at')->index();
            $table->decimal('distance_km', 8, 2);
            $table->unsignedInteger('duration_sec');
            $table->unsignedInteger('avg_pace_sec');
            $table->unsignedInteger('calories');

            $table->json('gps_track'); 

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('run_stats');
    }
};
