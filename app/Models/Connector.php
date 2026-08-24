<?php

namespace App\Models;

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\ConnectorFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Workspace-level official connector intent + status. Tokens are never
 * invented here — Desk placeholders persist `needs_token` until Evolution
 * Cloud or Meta credentials already exist; Google rows persist
 * `needs_reconnect` until the existing OAuth client has Gmail/Calendar scopes.
 *
 * @property int $id
 * @property int $workspace_id
 * @property ConnectorProvider $provider
 * @property string $intent
 * @property ConnectorStatus $status
 * @property array<string, mixed>|null $config
 * @property Carbon|null $connected_at
 */
#[Fillable([
    'workspace_id',
    'provider',
    'intent',
    'status',
    'config',
    'connected_at',
])]
class Connector extends Model
{
    /** @use HasFactory<ConnectorFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'provider' => ConnectorProvider::class,
            'status' => ConnectorStatus::class,
            'config' => 'array',
            'connected_at' => 'datetime',
        ];
    }

    public function isConnected(): bool
    {
        return $this->status === ConnectorStatus::Connected;
    }
}
