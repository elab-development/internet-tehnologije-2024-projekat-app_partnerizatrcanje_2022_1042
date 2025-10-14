<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('run_stats', function (Blueprint $table) {
            $table->dateTime('recorded_at')->nullable()->change();
            $table->decimal('distance_km', 8, 2)->nullable()->change();
            $table->unsignedInteger('duration_sec')->nullable()->change();
            $table->unsignedInteger('avg_pace_sec')->nullable()->change();
            $table->unsignedInteger('calories')->nullable()->change();
            $table->json('gps_track')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('run_stats', function (Blueprint $table) {
            $table->dateTime('recorded_at')->nullable(false)->change();
            $table->decimal('distance_km', 8, 2)->nullable(false)->change();
            $table->unsignedInteger('duration_sec')->nullable(false)->change();
            $table->unsignedInteger('avg_pace_sec')->nullable(false)->change();
            $table->unsignedInteger('calories')->nullable(false)->change();
            $table->json('gps_track')->nullable(false)->change();
        });
    }
};
