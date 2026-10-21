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
    'verification_status',
    'evidence_url',
    'retrieved_at',
    'verified_at',
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

    public const VERIFICATION_VERIFIED = 'verified';

    public const VERIFICATION_EVIDENCE_SUPPORTED = 'evidence_supported';

    public const VERIFICATION_UNKNOWN = 'unknown';

    public const VERIFICATION_NOT_FOUND = 'not_found';

    public const VERIFICATION_NOT_DETECTED = 'not_detected';

    public const VERIFICATION_CONFLICTING = 'conflicting';

    public const VERIFICATION_INVALID = 'invalid';

    public const VERIFICATION_CATCH_ALL = 'catch_all';

    public const VERIFICATION_TEMPORARY_FAILURE = 'temporary_failure';

    public const VERIFICATION_UNSUPPORTED = 'unsupported';

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
            'retrieved_at' => 'datetime',
            'verified_at' => 'datetime',
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

    /**
     * Latest Google Places run for Home, same strip as Lead OS health.
     *
     * @return array{id: int, target_type: string, target_id: int, field: string, value: string|null, status: string, error: string|null, confidence: float|null, created_at: string|null, href: string|null}|null
     */
    public static function presentLatestPlaces(Workspace $workspace): ?array
    {
        $run = static::query()
            ->forWorkspace($workspace)
            ->where('source', self::SOURCE_GOOGLE_PLACES)
            ->latest('id')
            ->first();

        if (! $run instanceof self) {
            return null;
        }

        $href = match ($run->target_type) {
            self::TARGET_COMPANY => '/crm/companies/'.$run->target_id,
            self::TARGET_CONTACT => '/crm/contacts/'.$run->target_id,
            self::TARGET_LEAD => '/crm/leads/'.$run->target_id,
            default => null,
        };

        return [
            'id' => $run->id,
            'target_type' => $run->target_type,
            'target_id' => $run->target_id,
            'field' => $run->field,
            'value' => $run->value,
            'status' => $run->status,
            'error' => $run->error,
            'confidence' => $run->confidence,
            'created_at' => $run->created_at?->timezone('Africa/Algiers')->toIso8601String(),
            'href' => $href,
        ];
    }
}
