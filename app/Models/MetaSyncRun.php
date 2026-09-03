<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'workspace_id',
    'kind',
    'mode',
    'status',
    'cursor',
    'processed',
    'stats',
    'error',
    'started_at',
    'finished_at',
])]
class MetaSyncRun extends Model
{
    use BelongsToWorkspace;

    public const KIND_ADS = 'ads';

    public const KIND_FORMS = 'forms';

    public const KIND_LEADS = 'leads';

    public const KIND_INSIGHTS = 'insights';

    public const MODE_INITIAL = 'initial';

    public const MODE_INCREMENTAL = 'incremental';

    public const MODE_MANUAL = 'manual';

    public const MODE_SCHEDULED = 'scheduled';

    public const MODE_WEBHOOK = 'webhook';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_PARTIAL = 'partial';

    public const STATUS_FAILED = 'failed';

    protected function casts(): array
    {
        return [
            'processed' => 'integer',
            'stats' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }
}
