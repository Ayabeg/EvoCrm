<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Support\ListViewConfig;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'user_id', 'name', 'entity', 'visibility', 'filters', 'columns', 'sort', 'is_default', 'is_workspace_default'])]
class SavedFilter extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'columns' => 'array',
            'sort' => 'array',
            'is_default' => 'boolean',
            'is_workspace_default' => 'boolean',
        ];
    }

    public function isShared(): bool
    {
        return $this->visibility === 'workspace';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<int, array{id: string, visible: bool, order: int}>
     */
    public function resolvedColumns(): array
    {
        return ListViewConfig::normalizeColumns($this->entity, $this->columns);
    }

    /**
     * @return array{field: string, direction: string}
     */
    public function resolvedSort(): array
    {
        $sort = $this->sort ?? [];

        if (! filled($sort['field'] ?? null)) {
            return ListViewConfig::defaultSort($this->entity);
        }

        return [
            'field' => (string) $sort['field'],
            'direction' => in_array($sort['direction'] ?? '', ['asc', 'desc'], true)
                ? (string) $sort['direction']
                : 'desc',
        ];
    }
}
