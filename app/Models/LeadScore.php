<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'lead_id',
    'score',
    'fit',
    'intent',
    'timing',
    'reason',
    'breakdown',
])]
class LeadScore extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'fit' => 'integer',
            'intent' => 'integer',
            'timing' => 'integer',
            'breakdown' => 'array',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * @return array{score: int, fit: int, intent: int, timing: int, reason: string|null, breakdown: list<array{pillar: string, key: string, label: string, points: int}>}
     */
    public function present(): array
    {
        $breakdown = $this->breakdown;

        return [
            'score' => (int) $this->score,
            'fit' => (int) $this->fit,
            'intent' => (int) $this->intent,
            'timing' => (int) $this->timing,
            'reason' => $this->reason,
            'breakdown' => is_array($breakdown) ? $breakdown : [],
        ];
    }
}
