<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // predložene role
    public const ROLE_USER  = 'user';
    public const ROLE_ADMIN = 'admin';

    protected $fillable = ['name','email','password','role'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'role' => 'string',
    ];

    /* ----------- helpers ----------- */
    public function isAdmin(): bool     { return $this->role === self::ROLE_ADMIN; }  
    public function isUser(): bool      { return $this->role === self::ROLE_USER; }

    /* ----------- relacije ----------- */
    public function runPlans(): HasMany
    {
        return $this->hasMany(RunPlan::class);
    }

    public function organizedEvents(): HasMany
    {
        return $this->hasMany(RunEvent::class, 'organizer_id');
    }

    public function participatingEvents(): BelongsToMany
    {
        return $this->belongsToMany(RunEvent::class, 'run_event_user')->withTimestamps();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function stats(): HasMany
    {
        return $this->hasMany(RunStat::class);
    }
}
