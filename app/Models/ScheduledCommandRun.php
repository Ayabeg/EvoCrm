<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $workspace_id
 * @property string $run_uuid
 * @property string $command
 * @property string $status
 * @property string|null $instance_id
 * @property Carbon $started_at
 * @property Carbon|null $finished_at
 * @property int|null $duration_ms
 * @property string|null $error_type
 * @property string|null $error_summary
 */
#[Fillable([
    'workspace_id',
    'run_uuid',
    'command',
    'status',
    'instance_id',
    'started_at',
    'finished_at',
    'duration_ms',
    'error_type',
    'error_summary',
])]
class ScheduledCommandRun extends Model
{
    public const STATUS_RUNNING = 'running';

    public const STATUS_SUCCESS = 'success';

    public const STATUS_FAILED = 'failed';

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'duration_ms' => 'integer',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function scopeForWorkspace(Builder $query, Workspace|int $workspace): Builder
    {
        $workspaceId = $workspace instanceof Workspace ? $workspace->id : $workspace;

        return $query->where(function (Builder $query) use ($workspaceId): void {
            $query->whereNull('workspace_id')->orWhere('workspace_id', $workspaceId);
        });
    }
}
