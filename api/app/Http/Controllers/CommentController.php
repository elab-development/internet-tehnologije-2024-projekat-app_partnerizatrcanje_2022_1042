<?php

namespace App\Http\Controllers;

use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\RunEvent;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    // GET /api/run-events/{runEvent}/comments
    public function indexByEvent(RunEvent $runEvent)
    {
        $q = $runEvent->comments()->with('user')->orderByDesc('posted_at');
        return CommentResource::collection($q->paginate(20));
    }

    // POST /api/run-events/{runEvent}/comments
    public function store(Request $request, RunEvent $runEvent)
    {
        $data = $request->validate([
            'content'   => ['required','string'],
            'posted_at' => ['nullable','date'],
        ]);

        $comment = Comment::create([
            'user_id'      => $request->user()->id,
            'run_event_id' => $runEvent->id,
            'content'      => $data['content'],
            'posted_at'    => $data['posted_at'] ?? now(),
        ]);

        return new CommentResource($comment->load(['user','event']));
    }

    // DELETE /api/comments/{comment}
    public function destroy(Request $request, Comment $comment)
    {
        // autor ili admin
        $u = $request->user();
        if (!$u || (!$u->isAdmin() && $u->id !== $comment->user_id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $comment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
