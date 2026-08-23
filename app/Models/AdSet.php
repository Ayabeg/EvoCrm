<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'ad_campaign_id',
    'external_id',
    'name',
    'status',
    'daily_budget_cents',
])]
class AdSet extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'daily_budget_cents' => 'integer',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class, 'ad_campaign_id');
    }

    public function ads(): HasMany
    {
        return $this->hasMany(Ad::class);
    }
}
