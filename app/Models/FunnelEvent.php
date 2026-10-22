<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'conversion_funnel_id',
    'event_type',
    'subject_type',
    'subject_id',
    'contact_id',
    'lead_id',
    'deal_id',
    'ad_campaign_id',
    'source',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'occurred_at',
    'meta',
])]
class FunnelEvent extends Model
{
    use BelongsToWorkspace;

    public const TYPE_VISIT = 'visit';

    public const TYPE_ORDER_PLACED = 'order_placed';

    public const TYPE_CONFIRMED = 'confirmed';

    public const TYPE_DELIVERED = 'delivered';

    public const TYPE_LEAD_QUALIFIED = 'lead_qualified';

    public const TYPE_LEAD_MAGNET_SUBMITTED = 'lead_magnet_submitted';

    public const TYPE_LEAD_MAGNET_FORM_STARTED = 'lead_magnet_form_started';

    public const TYPE_LEAD_MAGNET_USED = 'lead_magnet_used';

    public const TYPE_DEMO_REQUESTED = 'demo_requested';

    public const TYPE_MEETING_BOOKED = 'meeting_booked';

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function funnel(): BelongsTo
    {
        return $this->belongsTo(ConversionFunnel::class, 'conversion_funnel_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function adCampaign(): BelongsTo
    {
        return $this->belongsTo(AdCampaign::class);
    }
}
