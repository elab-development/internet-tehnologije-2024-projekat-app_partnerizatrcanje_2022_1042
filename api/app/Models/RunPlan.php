<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RunPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'start_time',       // datum i vreme polaska
        'location',         // opis mesta (npr. "Ada Ciganlija – Parking H")
        'distance_km',      // planirana kilometraža
        'target_pace_sec',  // cilj tempo (sek/km)
        'notes',

        // --- mapa ---
        'meet_lat',         // lat početne tačke
        'meet_lng',         // lng početne tačke
        'route_polyline',   // Google Encoded Polyline (ili)
        'route_geojson',    // alternativno: GeoJSON linija (JSON)
    ];

    protected $casts = [
        'start_time'      => 'datetime',
        'distance_km'     => 'decimal:2',
        'target_pace_sec' => 'integer',
        'meet_lat'        => 'float',
        'meet_lng'        => 'float',
        'route_geojson'   => 'array',   // čuva se kao JSON
    ];

    // QoL – dobijanje tačke kao array
    public function getMeetingPointAttribute(): array
    {
        return ['lat' => $this->meet_lat, 'lng' => $this->meet_lng];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
