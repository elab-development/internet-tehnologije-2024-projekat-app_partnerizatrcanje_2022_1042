<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RunEventResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'organizer_id'=> $this->organizer_id,
            'start_time'  => $this->start_time,
            'location'    => $this->location,
            'distance_km' => $this->distance_km,
            'status'      => $this->status,
            'description' => $this->description ?? $this->desc ?? null,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
            'deleted_at'  => $this->deleted_at,

            // relacije (učitavati po potrebi u kontroleru)
            'organizer'    => new UserResource($this->whenLoaded('organizer')),
            'participants' => UserResource::collection($this->whenLoaded('participants')),
            'comments'     => CommentResource::collection($this->whenLoaded('comments')),
            'stats'        => RunStatResource::collection($this->whenLoaded('stats')),

            // korisni agregati kad su dostupni
            'participants_count' => $this->when(isset($this->participants_count), $this->participants_count),
            'comments_count'     => $this->when(isset($this->comments_count), $this->comments_count),
        ];
    }
}
