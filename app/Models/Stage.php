<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Services\Crm\DealBoardForecast;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'pipeline_id', 'name', 'slug', 'position', 'is_won', 'is_lost', 'probability'])]
class Stage extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'is_won' => 'boolean',
            'is_lost' => 'boolean',
            'probability' => 'integer',
        ];
    }

    /**
     * Win probability 0–100 for forecast totals. Uses the stored override
     * when present; otherwise Evotechly defaults (see DealBoardForecast).
     */
    public function winProbability(): int
    {
        return DealBoardForecast::probabilityFor($this);
    }

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(Pipeline::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class);
    }

    public function isTerminal(): bool
    {
        return $this->is_won || $this->is_lost;
    }
}
