<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RunStatResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'user_id'      => $this->user_id,
            'run_event_id' => $this->run_event_id,
            'recorded_at'  => $this->recorded_at,
            'distance_km'  => $this->distance_km,
            'duration_sec' => $this->duration_sec,
            'avg_pace_sec' => $this->avg_pace_sec,
            'calories'     => $this->calories,
            'gps_track'    => $this->gps_track,
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,

            'user'  => new UserResource($this->whenLoaded('user')),
            'event' => new RunEventResource($this->whenLoaded('event')),
        ];
    }
}
