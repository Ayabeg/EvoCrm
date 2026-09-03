<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'meta_conversion_config_id',
    'event_id',
    'crm_event',
    'meta_event',
    'subject_type',
    'subject_id',
    'status',
    'attempts',
    'request_meta',
    'error',
    'sent_at',
    'failed_at',
])]
class MetaConversionEvent extends Model
{
    use BelongsToWorkspace;

    public const STATUS_PENDING = 'pending';

    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    public const STATUS_SKIPPED = 'skipped';

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'request_meta' => 'array',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function config(): BelongsTo
    {
        return $this->belongsTo(MetaConversionConfig::class, 'meta_conversion_config_id');
    }
}
