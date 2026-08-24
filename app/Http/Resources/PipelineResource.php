<?php

namespace App\Http\Resources;

use App\Models\Pipeline;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Pipeline */
class PipelineResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_default' => (bool) $this->is_default,
            'stages_count' => $this->when(isset($this->stages_count), fn () => $this->stages_count),
            'deals_count' => $this->when(isset($this->deals_count), fn () => $this->deals_count),
        ];
    }
}
