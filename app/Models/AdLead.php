<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'ad_account_id',
    'ad_campaign_id',
    'ad_set_id',
    'ad_id',
    'contact_id',
    'lead_id',
    'external_id',
    'form_id',
    'page_id',
    'page_name',
    'fields',
    'attribution',
])]
class AdLead extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'attribution' => 'array',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class, 'ad_campaign_id');
    }

    public function adSet(): BelongsTo
    {
        return $this->belongsTo(AdSet::class);
    }

    public function adCreative(): BelongsTo
    {
        return $this->belongsTo(Ad::class, 'ad_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
