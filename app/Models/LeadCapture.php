<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\LeadCaptureFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'created_by_id',
    'matched_lead_id',
    'source',
    'status',
    'raw_payload',
    'name',
    'phone',
    'email',
    'company',
    'wilaya',
    'error',
])]
class LeadCapture extends Model
{
    /** @use HasFactory<LeadCaptureFactory> */
    use BelongsToWorkspace, HasFactory;

    public const SOURCE_META_FORM = 'meta_form';

    public const SOURCE_CSV = 'csv';

    public const SOURCE_URL = 'url';

    public const SOURCE_MAPS_SEARCH = 'maps_search';

    public const SOURCES = [
        self::SOURCE_META_FORM,
        self::SOURCE_CSV,
        self::SOURCE_URL,
        self::SOURCE_MAPS_SEARCH,
    ];

    public const STATUS_NEW = 'new';

    public const STATUS_MERGED = 'merged';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_ERROR = 'error';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_MERGED,
        self::STATUS_REJECTED,
        self::STATUS_ERROR,
    ];

    protected function casts(): array
    {
        return [
            'raw_payload' => 'array',
        ];
    }

    public function matchedLead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'matched_lead_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_NEW;
    }
}
