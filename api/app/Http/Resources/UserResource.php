<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),

            // Relacije (lazy, samo ako su učitane)
            'run_plans'          => RunPlanResource::collection($this->whenLoaded('runPlans')),
            'organized_events'   => RunEventResource::collection($this->whenLoaded('organizedEvents')),
            'participating_events'=> RunEventResource::collection($this->whenLoaded('participatingEvents')),
            'comments'           => CommentResource::collection($this->whenLoaded('comments')),
            'stats'              => RunStatResource::collection($this->whenLoaded('stats')),
        ];
    }
}
