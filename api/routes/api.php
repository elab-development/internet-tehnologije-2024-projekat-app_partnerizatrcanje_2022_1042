<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\RunEventController;
use App\Http\Controllers\RunPlanController;
use App\Http\Controllers\RunStatController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/* ----------------------- JAVNO (bez autentikacije) ----------------------- */

// RunEvents: lista, detalj
Route::get('/run-events', [RunEventController::class, 'index']);
Route::get('/run-events/{runEvent}', [RunEventController::class, 'show']);

// RunEvent pomoćne (read-only)
Route::get('/run-events/{runEvent}/participants', [RunEventController::class, 'participants']);
Route::get('/run-events/{runEvent}/summary',      [RunEventController::class, 'summary']);

// Komentari (read)
Route::get('/run-events/{runEvent}/comments', [CommentController::class, 'indexByEvent']);

// Statistika (widgeti/public pregledi)
Route::get('/stats/user/{user}/summary',   [RunStatController::class, 'summary']);
Route::get('/stats/user/{user}/by-month',  [RunStatController::class, 'byMonth']);
Route::get('/stats/global-averages',       [RunStatController::class, 'globalAverages']);
Route::get('/stats/leaderboard/total-distance', [RunStatController::class, 'leaderboardTotalDistance']);
Route::get('/stats/leaderboard/avg-pace',       [RunStatController::class, 'leaderboardAvgPace']);

// Auth (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);


/* --------------- AUTH: zajedničko za user + admin (većina) --------------- */

Route::middleware(['auth:sanctum', 'role:user,admin'])->group(function () {
    // RunEvents CRUD + akcije
    Route::post  ('/run-events',                 [RunEventController::class, 'store']);
    Route::put   ('/run-events/{runEvent}',      [RunEventController::class, 'update']);
    Route::patch ('/run-events/{runEvent}',      [RunEventController::class, 'update']);
    Route::delete('/run-events/{runEvent}',      [RunEventController::class, 'destroy']);
    Route::post  ('/run-events/{runEvent}/join', [RunEventController::class, 'join']);
    Route::delete('/run-events/{runEvent}/leave',[RunEventController::class, 'leave']);
    Route::post  ('/run-events/{runEvent}/complete', [RunEventController::class, 'complete']);
    Route::post  ('/run-events/{runEvent}/cancel',   [RunEventController::class, 'cancel']);

    // Komentari (write)
    Route::post  ('/run-events/{runEvent}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{comment}',             [CommentController::class, 'destroy']);

    // RunPlans i RunStats resursi (većina operacija dostupna useru i adminu)
    Route::apiResource('run-plans', RunPlanController::class);
    Route::apiResource('run-stats', RunStatController::class);

    // Moj profil / sesija
    Route::get ('/me',            [AuthController::class, 'me']);
    Route::post('/logout',        [AuthController::class, 'logout']);
    Route::put ('/me',            [UserController::class, 'update']);
    Route::post('/me/password',   [UserController::class, 'changePassword']);

    // Lokacija i nearby
    Route::post('/me/location', [AuthController::class, 'updateLocation']);
    Route::get ('/me/location', [AuthController::class, 'myLocation']);
    Route::get ('/nearby-users', [AuthController::class, 'nearbyUsers']);
});


/* ----------------------------- SAMO ADMIN ----------------------------- */

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get  ('/users',             [UserController::class, 'index']);
    Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);
});
