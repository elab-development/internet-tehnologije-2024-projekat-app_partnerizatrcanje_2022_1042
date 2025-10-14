<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RunEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'organizer_id',
        'start_time',
        'location',
        'distance_km',
        'status',       // planned|completed|cancelled
        'description'
    ];

    protected $casts = [
        'start_time'  => 'datetime',
        'distance_km' => 'decimal:2',
    ];

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }
 
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'run_event_user')->withTimestamps();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'run_event_id');
    }

    public function stats(): HasMany
    {
        return $this->hasMany(RunStat::class, 'run_event_id');
    }
}
