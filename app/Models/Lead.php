<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'workspace_id',
    'contact_id',
    'company_id',
    'ad_campaign_id',
    'title',
    'status',
    'source',
    'score',
    'payload',
    'qualified_at',
])]
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'qualified_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function adCampaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class);
    }

    public function deal(): HasOne
    {
        return $this->hasOne(Deal::class);
    }

    public function qualify(): void
    {
        $this->forceFill([
            'status' => 'qualified',
            'qualified_at' => now(),
        ])->save();
    }
}
