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

    public function updateLocation(Request $request)
    {
        $data = $request->validate([
            'lat'        => ['required','numeric','between:-90,90'],
            'lng'        => ['required','numeric','between:-180,180'],
            'accuracy_m' => ['nullable','integer','min:0'],
        ]);

        $u = $request->user();
        $u->last_lat        = (float)$data['lat'];
        $u->last_lng        = (float)$data['lng'];
        $u->last_accuracy_m = $data['accuracy_m'] ?? null;
        $u->last_seen_at    = now();
        $u->save();
 
        return response()->json(['message' => 'ok']);
    }

    // GET /api/me/location  (auth)
    public function myLocation(Request $request)
    {
        $u = $request->user();

        return response()->json([
            'id'              => $u->id,
            'name'            => $u->name,
            'last_lat'        => $u->last_lat,
            'last_lng'        => $u->last_lng,
            'last_accuracy_m' => $u->last_accuracy_m,
            'last_seen_at'    => optional($u->last_seen_at)->toDateTimeString(),
        ]);
    }

    // GET /api/nearby-users  (auth)
    // Query: ?lat=&lng=&radius_km=5&limit=200&include_self=0
    public function nearbyUsers(Request $request)
    {
        $data = $request->validate([
            'lat'          => ['nullable','numeric','between:-90,90'],
            'lng'          => ['nullable','numeric','between:-180,180'],
            'radius_km'    => ['nullable','numeric','min:0.1','max:100'],
            'limit'        => ['nullable','integer','between:1,500'],
            'include_self' => ['nullable','boolean'],
        ]);

        $me = $request->user();

        // Ako lat/lng nisu prosleđeni, koristi poslednju sačuvanu lokaciju korisnika
        $lat = $data['lat'] ?? $me->last_lat;
        $lng = $data['lng'] ?? $me->last_lng;

        if ($lat === null || $lng === null) {
            return response()->json(['message' => 'Missing lat/lng and no saved location'], 422);
        }

        $radiusKm    = (float)($data['radius_km'] ?? 5);
        $limit       = (int)  ($data['limit'] ?? 200);
        $includeSelf = (bool) ($data['include_self'] ?? false);

        // Haversine (km)
        $expr = "(
            6371 * acos(
                cos(radians(?)) * cos(radians(last_lat)) *
                cos(radians(last_lng) - radians(?)) +
                sin(radians(?)) * sin(radians(last_lat))
            )
        )";

        $q = \App\Models\User::query()
            ->whereNotNull('last_lat')->whereNotNull('last_lng')
            ->selectRaw("id, name, last_lat as lat, last_lng as lng, last_seen_at, $expr as distance_km", [$lat,$lng,$lat])
            ->having('distance_km','<=',$radiusKm)
            ->orderBy('distance_km')
            ->limit($limit);

        if (!$includeSelf) {
            $q->where('id', '<>', $me->id);
        }

        $users = $q->get();

        return response()->json([
            'origin' => ['lat' => (float)$lat, 'lng' => (float)$lng],
            'users'  => $users->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'lat' => (float)$u->lat,
                'lng' => (float)$u->lng,
                'last_seen_at' => optional($u->last_seen_at)->toDateTimeString(),
                'distance_km' => round((float)$u->distance_km, 2),
            ]),
        ]);
    }

}
