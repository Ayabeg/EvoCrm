<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'slug',
    'name',
    'kind',
    'version',
    'status',
    'description',
    'settings',
])]
class LeadMagnetOffer extends Model
{
    use BelongsToWorkspace;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PAUSED = 'paused';

    protected function casts(): array
    {
        return ['settings' => 'array'];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(LeadMagnetSubmission::class);
    }
}
