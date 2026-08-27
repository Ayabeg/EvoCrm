<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\EnrichmentRunFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'target_type',
    'target_id',
    'source',
    'field',
    'value',
    'confidence',
    'raw',
    'status',
    'error',
    'decided_by',
    'decided_at',
])]
class EnrichmentRun extends Model
{
    /** @use HasFactory<EnrichmentRunFactory> */
    use BelongsToWorkspace, HasFactory;

    public const TARGET_LEAD = 'lead';

    public const TARGET_CONTACT = 'contact';

    public const TARGET_COMPANY = 'company';

    public const SOURCE_WEBSITE = 'website';

    public const SOURCE_GOOGLE_PLACES = 'google_places';

    public const SOURCE_APOLLO = 'apollo';

    public const SOURCE_CLAY = 'clay';

    public const STATUS_QUEUED = 'queued';

    public const STATUS_PROPOSED = 'proposed';

    public const STATUS_APPLIED = 'applied';

    public const STATUS_DISMISSED = 'dismissed';

    public const STATUS_SKIPPED = 'skipped';

    public const STATUS_FAILED = 'failed';

    public const HIGH_CONFIDENCE = 0.85;

    /**
     * First-party sources implemented in E1. Paid slots exist on the enum only.
     *
     * @var list<string>
     */
    public const IMPLEMENTED_SOURCES = [
        self::SOURCE_WEBSITE,
        self::SOURCE_GOOGLE_PLACES,
    ];

    /**
     * Reserved paid connectors. Do not implement scrapers or unofficial APIs.
     *
     * @var list<string>
     */
    public const RESERVED_SOURCES = [
        self::SOURCE_APOLLO,
        self::SOURCE_CLAY,
    ];

    protected function casts(): array
    {
        return [
            'raw' => 'array',
            'confidence' => 'float',
            'decided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function isProposed(): bool
    {
        return $this->status === self::STATUS_PROPOSED;
    }
}
