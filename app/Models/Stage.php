<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Services\Crm\DealBoardForecast;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'pipeline_id', 'name', 'slug', 'position', 'is_won', 'is_lost', 'probability', 'required_properties', 'requires_approval'])]
class Stage extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'is_won' => 'boolean',
            'is_lost' => 'boolean',
            'probability' => 'integer',
            'required_properties' => 'array',
            'requires_approval' => 'boolean',
        ];
    }

    /**
     * @return list<string>
     */
    public function requiredPropertyKeys(): array
    {
        $keys = $this->required_properties ?? [];

        return array_values(array_filter(array_map('strval', $keys)));
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
