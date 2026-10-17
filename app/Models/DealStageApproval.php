<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'deal_id',
    'stage_id',
    'status',
    'note',
    'requested_by',
    'approved_by',
    'requested_at',
    'decided_at',
    'consumed_at',
])]
class DealStageApproval extends Model
{
    use BelongsToWorkspace;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'decided_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isUsable(): bool
    {
        return $this->status === self::STATUS_APPROVED && $this->consumed_at === null;
    }

    public function approve(User $actor): void
    {
        $this->forceFill([
            'status' => self::STATUS_APPROVED,
            'approved_by' => $actor->id,
            'decided_at' => now(),
        ])->save();
    }

    public function reject(User $actor, ?string $note = null): void
    {
        $this->forceFill([
            'status' => self::STATUS_REJECTED,
            'approved_by' => $actor->id,
            'decided_at' => now(),
            'note' => $note ?? $this->note,
        ])->save();
    }

    public function consume(): void
    {
        $this->forceFill(['consumed_at' => now()])->save();
    }
}
