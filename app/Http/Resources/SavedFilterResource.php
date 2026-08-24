<?php

namespace App\Http\Resources;

use App\Models\SavedFilter;
use App\Support\ListViewConfig;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SavedFilter */
class SavedFilterResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'entity' => $this->entity,
            'filters' => $this->filters ?? [],
            'columns' => ListViewConfig::normalizeColumns($this->entity, $this->columns),
            'sort' => $this->sort ?? ListViewConfig::defaultSort($this->entity),
            'is_default' => (bool) $this->is_default,
            'is_workspace_default' => (bool) $this->is_workspace_default,
            'visibility' => $this->visibility ?? 'private',
            'record_count' => $this->when(isset($this->record_count), fn () => $this->record_count),
            'user_id' => $this->user_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
