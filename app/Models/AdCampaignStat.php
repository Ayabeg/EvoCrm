<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'workspace_id',
    'ad_campaign_id',
    'date',
    'impressions',
    'clicks',
    'spend_cents',
])]
class AdCampaignStat extends Model
{
    use BelongsToWorkspace;

    protected function date(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value): string => Carbon::parse($value)->toDateString(),
        );
    }

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'impressions' => 'integer',
            'clicks' => 'integer',
            'spend_cents' => 'integer',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class, 'ad_campaign_id');
    }
}
