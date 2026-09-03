<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'webhook_endpoint_id',
    'provider_event_id',
    'event_type',
    'payload',
    'status',
    'attempts',
    'processed_at',
    'failed_at',
    'error',
])]
class MetaWebhookEvent extends Model
{
    use BelongsToWorkspace;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_PROCESSED = 'processed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_DUPLICATE = 'duplicate';

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
            'processed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function endpoint(): BelongsTo
    {
        return $this->belongsTo(WebhookEndpoint::class, 'webhook_endpoint_id');
    }

    public function isProcessed(): bool
    {
        return in_array($this->status, [self::STATUS_PROCESSED, self::STATUS_DUPLICATE], true);
    }
}
