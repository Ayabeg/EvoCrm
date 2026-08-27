<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'deal_id',
    'graph_run_id',
    'activity_id',
    'kind',
    'action',
    'confidence',
    'status',
    'title',
    'body',
    'payload',
    'applied_at',
    'dismissed_at',
])]
class DealSuggestion extends Model
{
    use BelongsToWorkspace;

    public const KIND_NEXT_MOVE = 'next_move';

    public const KIND_AFTER_TOUCH = 'after_touch';

    public const KIND_LOST_REASON = 'lost_reason';

    public const ACTION_CALL = 'call';

    public const ACTION_EMAIL = 'email';

    public const ACTION_WHATSAPP = 'whatsapp_cloud';

    public const ACTION_ADVANCE = 'advance';

    public const ACTION_CLOSE = 'close';

    public const ACTION_FOLLOW_UP = 'follow_up';

    public const ACTION_NEXT_STAGE = 'next_stage';

    public const ACTION_LEAVE_FOR_HUMAN = 'leave_for_human';

    public const CONFIDENCE_HIGH = 'high';

    public const CONFIDENCE_MID = 'mid';

    public const CONFIDENCE_LOW = 'low';

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPLIED = 'applied';

    public const STATUS_DISMISSED = 'dismissed';

    public const STATUS_CONFIRMED = 'confirmed';

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'applied_at' => 'datetime',
            'dismissed_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function graphRun(): BelongsTo
    {
        return $this->belongsTo(GraphRun::class);
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function apply(): void
    {
        $this->forceFill([
            'status' => $this->kind === self::KIND_LOST_REASON
                ? self::STATUS_CONFIRMED
                : self::STATUS_APPLIED,
            'applied_at' => now(),
        ])->save();
    }

    public function dismiss(): void
    {
        $this->forceFill([
            'status' => self::STATUS_DISMISSED,
            'dismissed_at' => now(),
        ])->save();
    }

    /**
     * @return array{
     *     id: int,
     *     kind: string,
     *     action: string,
     *     confidence: string,
     *     status: string,
     *     title: string,
     *     body: string|null,
     *     payload: array<string, mixed>,
     *     human_only: bool
     * }
     */
    public function present(): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kind,
            'action' => $this->action,
            'confidence' => $this->confidence,
            'status' => $this->status,
            'title' => $this->title,
            'body' => $this->body,
            'payload' => is_array($this->payload) ? $this->payload : [],
            'human_only' => $this->isHumanOnly(),
        ];
    }

    public function isHumanOnly(): bool
    {
        return $this->confidence !== self::CONFIDENCE_HIGH
            || $this->action === self::ACTION_LEAVE_FOR_HUMAN
            || in_array($this->action, [self::ACTION_EMAIL, self::ACTION_WHATSAPP], true);
    }
}
