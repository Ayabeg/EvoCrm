<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'ad_set_id',
    'ad_campaign_id',
    'external_id',
    'name',
    'status',
    'kind',
    'creative_id',
    'creative_name',
])]
class Ad extends Model
{
    use BelongsToWorkspace;

    public function adSet(): BelongsTo
    {
        return $this->belongsTo(AdSet::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class, 'ad_campaign_id');
    }
}
