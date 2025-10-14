<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RunPlanResource extends JsonResource
{
    public function toArray($request): array    
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'start_time'      => $this->start_time,
            'location'        => $this->location,
            'distance_km'     => $this->distance_km,
            'target_pace_sec' => $this->target_pace_sec,
            'notes'           => $this->notes,
            'meet_lat'        => $this->meet_lat,
            'meet_lng'        => $this->meet_lng,
            'route_polyline'  => $this->route_polyline,
            'route_geojson'   => $this->route_geojson,
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,

            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
