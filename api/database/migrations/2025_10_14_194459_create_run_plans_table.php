<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('run_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');

            $table->dateTime('start_time')->index();
            $table->string('location', 255)->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->unsignedInteger('target_pace_sec')->nullable(); // sek/km
            $table->text('notes')->nullable();

            // mapa / trasa
            $table->decimal('meet_lat', 9, 6)->nullable();
            $table->decimal('meet_lng', 9, 6)->nullable();
            $table->text('route_polyline')->nullable(); // encoded polyline
            $table->json('route_geojson')->nullable();  // LineString GeoJSON

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('run_plans');
    }
};
