<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'ad_account_id',
    'external_id',
    'name',
    'objective',
    'status',
    'click_to_whatsapp',
    'lead_form',
])]
class AdCampaign extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'click_to_whatsapp' => 'boolean',
            'lead_form' => 'boolean',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(AdAccount::class, 'ad_account_id');
    }

    public function adLeads(): HasMany
    {
        return $this->hasMany(AdLead::class);
    }
}
