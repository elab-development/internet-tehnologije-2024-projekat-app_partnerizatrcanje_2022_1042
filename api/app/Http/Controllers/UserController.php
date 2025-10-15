<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // GET /api/users  (admin)
    public function index(Request $request)
    {
        $q = User::query()->orderBy('name');
        if ($request->filled('q')) {
            $q->where(function($qq) use ($request) {
                $qq->where('name', 'like', '%'.$request->query('q').'%')
                   ->orWhere('email','like','%'.$request->query('q').'%');
            });
        }
        return UserResource::collection($q->paginate(20)->appends($request->query()));
    }

    // PUT /api/me
    public function update(Request $request)
    {
        $u = $request->user();

        $data = $request->validate([
            'name'  => ['sometimes','string','max:100'],
            'email' => ['sometimes','email','max:255', Rule::unique('users','email')->ignore($u->id)],
        ]);

        $u->fill($data)->save();

        return new UserResource($u);
    }

    // POST /api/me/password
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required','string'],
            'new_password'     => ['required','string','min:6'],
        ]);

        $u = $request->user();
        if (!Hash::check($request->input('current_password'), $u->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $u->password = Hash::make($request->input('new_password'));
        $u->save();

        return response()->json(['message' => 'Password changed']);
    }

    // PATCH /api/users/{user}/role (admin)
    public function updateRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', Rule::in([User::ROLE_USER, User::ROLE_ADMIN])],
        ]);
        $user->role = $data['role'];
        $user->save();

        return new UserResource($user);
    }
}
