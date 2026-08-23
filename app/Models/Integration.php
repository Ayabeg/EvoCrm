<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A workspace-level connection to an external app (Meta, …). OAuth tokens
 * are encrypted at rest via the encrypted cast; never log or expose them.
 *
 * @property string $provider
 * @property string $status
 * @property string|null $access_token
 * @property array<int, string>|null $scopes
 * @property array<string, mixed>|null $meta
 */
#[Fillable([
    'workspace_id',
    'provider',
    'status',
    'access_token',
    'refresh_token',
    'expires_at',
    'scopes',
    'meta',
    'connected_at',
])]
class Integration extends Model
{
    use BelongsToWorkspace;

    public const PROVIDER_META = 'meta';

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'expires_at' => 'datetime',
            'connected_at' => 'datetime',
            'scopes' => 'array',
            'meta' => 'array',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function isConnected(): bool
    {
        return $this->status === 'connected' && filled($this->access_token);
    }

    public function grants(string $scope): bool
    {
        return in_array($scope, $this->scopes ?? [], true);
    }
}
