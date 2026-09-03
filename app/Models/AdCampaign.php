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
    'daily_budget_cents',
    'lifetime_budget_cents',
    'starts_at',
    'ends_at',
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
            'daily_budget_cents' => 'integer',
            'lifetime_budget_cents' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(AdAccount::class, 'ad_account_id');
    }

    public function adSets(): HasMany
    {
        return $this->hasMany(AdSet::class);
    }

    public function stats(): HasMany
    {
        return $this->hasMany(AdCampaignStat::class);
    }

    public function adLeads(): HasMany
    {
        return $this->hasMany(AdLead::class);
    }

    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function kind(): string
    {
        if ($this->click_to_whatsapp && $this->lead_form) {
            return 'CTWA + Lead form';
        }

        if ($this->click_to_whatsapp) {
            return 'Click-to-WhatsApp';
        }

        if ($this->lead_form) {
            return 'Lead form';
        }

        return 'Traffic';
    }
}
