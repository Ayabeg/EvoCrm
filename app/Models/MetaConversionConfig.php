<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'crm_event',
    'meta_event',
    'enabled',
    'pixel_id',
    'last_success_at',
    'last_failure_at',
    'sent_count',
    'failed_count',
])]
class MetaConversionConfig extends Model
{
    use BelongsToWorkspace;

    public const CRM_LEAD_CREATED = 'lead.created';

    public const CRM_LEAD_QUALIFIED = 'lead.qualified';

    public const CRM_DEAL_CREATED = 'deal.created';

    public const CRM_DEAL_WON = 'deal.won';

    public const META_LEAD = 'Lead';

    public const META_QUALIFIED_LEAD = 'QualifiedLead';

    public const META_CONTACT = 'Contact';

    public const META_SCHEDULE = 'Schedule';

    public const META_SUBMIT_APPLICATION = 'SubmitApplication';

    public const META_PURCHASE = 'Purchase';

    /**
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return [
            self::CRM_LEAD_CREATED => self::META_LEAD,
            self::CRM_LEAD_QUALIFIED => self::META_QUALIFIED_LEAD,
            self::CRM_DEAL_CREATED => self::META_SUBMIT_APPLICATION,
            self::CRM_DEAL_WON => self::META_PURCHASE,
        ];
    }

    /**
     * @return list<string>
     */
    public static function metaEvents(): array
    {
        return [
            self::META_LEAD,
            self::META_QUALIFIED_LEAD,
            self::META_CONTACT,
            self::META_SCHEDULE,
            self::META_SUBMIT_APPLICATION,
            self::META_PURCHASE,
        ];
    }

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'last_success_at' => 'datetime',
            'last_failure_at' => 'datetime',
            'sent_count' => 'integer',
            'failed_count' => 'integer',
        ];
    }

    public function events(): HasMany
    {
        return $this->hasMany(MetaConversionEvent::class);
    }
}
