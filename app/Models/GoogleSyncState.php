<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'workspace_id',
    'provider',
    'status',
    'cursor',
    'last_synced_at',
    'last_error',
])]
class GoogleSyncState extends Model
{
    use BelongsToWorkspace;

    public const STATUS_IDLE = 'idle';

    public const STATUS_RUNNING = 'running';

    public const STATUS_PAUSED = 'paused';

    public const STATUS_ERROR = 'error';

    protected function casts(): array
    {
        return [
            'last_synced_at' => 'datetime',
        ];
    }

    public function isPaused(): bool
    {
        return $this->status === self::STATUS_PAUSED;
    }
}
