<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use Illuminate\Http\Request; 

 use App\Http\Controllers\RunEventController;
use App\Http\Controllers\RunPlanController;
use App\Http\Controllers\RunStatController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// javno: lista & detalj 
Route::get('/run-events', [RunEventController::class, 'index']);
Route::get('/run-events/{runEvent}', [RunEventController::class, 'show']);

Route::middleware(['auth:sanctum'])->group(function () {
    // CRUD
    Route::post('/run-events', [RunEventController::class, 'store']);
    Route::put('/run-events/{runEvent}', [RunEventController::class, 'update']);
    Route::patch('/run-events/{runEvent}', [RunEventController::class, 'update']);
    Route::delete('/run-events/{runEvent}', [RunEventController::class, 'destroy']);

    // akcije
    Route::post('/run-events/{runEvent}/join',    [RunEventController::class, 'join']);
    Route::delete('/run-events/{runEvent}/leave', [RunEventController::class, 'leave']);
    Route::post('/run-events/{runEvent}/complete',[RunEventController::class, 'complete']);
    Route::post('/run-events/{runEvent}/cancel',  [RunEventController::class, 'cancel']);
});

 Route::apiResource('run-plans', RunPlanController::class);

 Route::apiResource('run-stats', RunStatController::class);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // samo admin:
    Route::middleware('role:admin')->group(function () {
      
    });

    // user ili admin:
    Route::middleware('role:user,admin')->group(function () {
       
    });
});

/* --- RunEvent pomoćne rute --- */
Route::get   ('/run-events/{runEvent}/participants', [RunEventController::class, 'participants']);
Route::get   ('/run-events/{runEvent}/summary',      [RunEventController::class, 'summary']);

/* --- Komentari za event --- */
Route::get   ('/run-events/{runEvent}/comments',  [CommentController::class, 'indexByEvent']);
Route::post  ('/run-events/{runEvent}/comments',  [CommentController::class, 'store'])->middleware('auth:sanctum');
Route::delete('/comments/{comment}',               [CommentController::class, 'destroy'])->middleware('auth:sanctum');

/* --- Statistika korisnika (widgeti za profil/dashboard) --- */
Route::get('/stats/user/{user}/summary', [RunStatController::class, 'summary']);
Route::get('/stats/user/{user}/by-month', [RunStatController::class, 'byMonth']);

/* --- Profil / korisnici --- */
Route::middleware('auth:sanctum')->group(function () {
    Route::put ('/me',            [UserController::class, 'update']);
    Route::post('/me/password',   [UserController::class, 'changePassword']);
});

Route::middleware(['auth:sanctum','role:admin'])->group(function () {
    Route::get  ('/users',             [UserController::class, 'index']);
    Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/me/location',  [AuthController::class, 'updateLocation']);
    Route::get('/me/location',   [AuthController::class, 'myLocation'] ?? fn() => abort(404));  
    Route::get('/nearby-users',  [AuthController::class, 'nearbyUsers']);  
});

Route::get('/stats/global-averages', [RunStatController::class, 'globalAverages']);
Route::get('/stats/leaderboard/total-distance', [RunStatController::class, 'leaderboardTotalDistance']);
Route::get('/stats/leaderboard/avg-pace', [RunStatController::class, 'leaderboardAvgPace']);