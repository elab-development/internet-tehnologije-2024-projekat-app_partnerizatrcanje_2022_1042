<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RunStat extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'run_event_id',   // opcionalno: statistika vezana za događaj
        'recorded_at',
        'distance_km',
        'duration_sec',
        'avg_pace_sec',
        'calories',
        'gps_track'       // JSON (opciono)
    ];

    protected $casts = [
        'recorded_at'  => 'datetime',
        'distance_km'  => 'decimal:2',
        'duration_sec' => 'integer',
        'avg_pace_sec' => 'integer',
        'calories'     => 'integer',
        'gps_track'    => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(RunEvent::class, 'run_event_id');
    }
}
