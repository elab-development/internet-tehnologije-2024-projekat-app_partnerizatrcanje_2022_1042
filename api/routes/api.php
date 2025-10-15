<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request; 

 use App\Http\Controllers\RunEventController;
use App\Http\Controllers\RunPlanController;
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