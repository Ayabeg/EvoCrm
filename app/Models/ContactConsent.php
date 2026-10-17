<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'contact_id',
    'channel',
    'purpose',
    'status',
    'source',
    'captured_at',
    'expires_at',
    'revoked_at',
    'meta',
])]
class ContactConsent extends Model
{
    use BelongsToWorkspace;

    public const STATUS_GRANTED = 'granted';

    public const STATUS_DENIED = 'denied';

    public const STATUS_UNKNOWN = 'unknown';

    protected function casts(): array
    {
        return [
            'captured_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function isGranted(): bool
    {
        return $this->status === self::STATUS_GRANTED
            && $this->revoked_at === null
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }
}
