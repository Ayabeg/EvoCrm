<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'name',
    'slug',
    'is_active',
    'round_robin',
    'round_robin_cursor',
])]
class SupportQueue extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'round_robin' => 'boolean',
            'round_robin_cursor' => 'integer',
        ];
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'queue_id');
    }
}
