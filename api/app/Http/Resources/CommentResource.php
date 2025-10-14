<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'user_id'     => $this->user_id,
            'run_event_id'=> $this->run_event_id,
            'content'     => $this->content,
            'posted_at'   => $this->posted_at,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,

            'user'        => new UserResource($this->whenLoaded('user')),
            'event'       => new RunEventResource($this->whenLoaded('event')),
        ];
    }
}
