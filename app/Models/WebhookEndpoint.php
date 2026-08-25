<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
