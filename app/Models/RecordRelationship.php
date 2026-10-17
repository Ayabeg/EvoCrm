<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'workspace_id',
    'from_type',
    'from_id',
    'to_type',
    'to_id',
    'relationship_type',
    'meta',
    'valid_from',
    'valid_until',
])]
class RecordRelationship extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function fromRecord(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'from_type', 'from_id');
    }

    public function toRecord(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'to_type', 'to_id');
    }

    public function isActive(): bool
    {
        return ($this->valid_from === null || $this->valid_from->isPast())
            && ($this->valid_until === null || $this->valid_until->isFuture());
    }
}
