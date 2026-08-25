<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $workspace_id
 * @property string $provider
 * @property string $key
 * @property bool $active
 * @property Carbon|null $last_received_at
 * @property Workspace $workspace
 */
#[Fillable([
    'workspace_id',
    'provider',
    'key_hash',
    'key',
    'active',
    'last_received_at',
    'last_event',
])]
class WebhookEndpoint extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'key' => 'encrypted',
            'active' => 'boolean',
            'last_received_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
