<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required','string','max:100'],
            'email'    => ['required','email','max:255','unique:users,email'],
            'password' => ['required','string','min:6'],
            'role'     => ['nullable', Rule::in([User::ROLE_USER, User::ROLE_ADMIN])],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'] ?? User::ROLE_USER,
        ]);

        // ability po roli
        $abilities = [$user->isAdmin() ? 'admin' : 'user'];
        $token = $user->createToken('api', $abilities)->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    // POST /api/login
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required','email'],
            'password' => ['required','string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Po želji obriši stare tokene:
        $user->tokens()->delete();

        $abilities = [$user->isAdmin() ? 'admin' : 'user'];
        $token = $user->createToken('api', $abilities)->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ]);
    }

    // GET /api/me
    public function me(Request $request)
    {
        // učitaj osnovne relacije po potrebi
        $user = $request->user()->load(['runPlans','organizedEvents','stats']);
        return new UserResource($user);
    }

    // POST /api/logout (trenutni token)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    // POST /api/logout-all (opciono: svi tokeni)
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out from all devices']);
    }
}
