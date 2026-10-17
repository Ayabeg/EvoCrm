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
    'probability',
    'amount_cents',
    'reason',
    'recorded_by',
    'recorded_at',
])]
class DealProbabilitySnapshot extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'probability' => 'integer',
            'amount_cents' => 'integer',
            'recorded_at' => 'datetime',
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

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
