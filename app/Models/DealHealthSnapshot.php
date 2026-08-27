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
    'score',
    'band',
    'label',
    'reason',
    'factors',
])]
class DealHealthSnapshot extends Model
{
    use BelongsToWorkspace;

    public const BAND_HEALTHY = 'healthy';

    public const BAND_AT_RISK = 'at_risk';

    public const BAND_STALLED = 'stalled';

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'factors' => 'array',
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

    /**
     * @return array{score: int, band: string, label: string, reason: string, factors: list<array{key: string, label: string, detail: string}>, next_action?: string}
     */
    public function present(): array
    {
        $factors = is_array($this->factors) ? $this->factors : [];

        return [
            'score' => (int) $this->score,
            'band' => $this->band,
            'label' => $this->label,
            'reason' => $this->reason,
            'factors' => $factors,
            'next_action' => $this->nextAction(),
        ];
    }

    public function nextAction(): string
    {
        return match ($this->band) {
            self::BAND_STALLED => 'Book a follow-up — this deal has gone quiet.',
            self::BAND_AT_RISK => 'Keep the next step current before this slips.',
            default => 'Keep the next step current and move the stage when the buyer advances.',
        };
    }
}
