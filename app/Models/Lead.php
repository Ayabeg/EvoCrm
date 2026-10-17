<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Models\Concerns\HasRecordRelationships;
use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'workspace_id',
    'contact_id',
    'company_id',
    'ad_campaign_id',
    'ad_set_id',
    'ad_id',
    'title',
    'status',
    'source',
    'source_detail',
    'source_campaign',
    'source_medium',
    'score',
    'payload',
    'qualified_at',
    'first_touch_at',
    'last_touch_at',
])]
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use BelongsToWorkspace, HasFactory, HasRecordRelationships;

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'score' => 'integer',
            'qualified_at' => 'datetime',
            'first_touch_at' => 'datetime',
            'last_touch_at' => 'datetime',
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

    public function adSet(): BelongsTo
    {
        return $this->belongsTo(AdSet::class);
    }

    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class);
    }

    public function deal(): HasOne
    {
        return $this->hasOne(Deal::class);
    }

    public function captures(): HasMany
    {
        return $this->hasMany(LeadCapture::class, 'matched_lead_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(LeadScore::class);
    }

    public function latestScore(): HasOne
    {
        return $this->hasOne(LeadScore::class)->latestOfMany();
    }

    public function qualify(): void
    {
        $payload = is_array($this->payload) ? $this->payload : [];
        $payload['path_step'] = 'converted';

        $this->forceFill([
            'status' => 'qualified',
            'qualified_at' => now(),
            'payload' => $payload,
        ])->save();
    }
}
