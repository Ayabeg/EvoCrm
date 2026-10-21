<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'lead_magnet_offer_id',
    'contact_id',
    'lead_id',
    'idempotency_key',
    'name',
    'email',
    'company',
    'assumptions',
    'result',
    'attribution',
    'delivery_status',
    'delivery_error',
    'accepted_at',
    'marketing_consent',
])]
class LeadMagnetSubmission extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'assumptions' => 'array',
            'result' => 'array',
            'attribution' => 'array',
            'accepted_at' => 'datetime',
            'marketing_consent' => 'boolean',
        ];
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(LeadMagnetOffer::class, 'lead_magnet_offer_id');
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
