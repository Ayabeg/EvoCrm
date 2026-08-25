<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'deal_id',
    'status',
    'currency',
    'total_cents',
    'notes',
    'snapshot_html',
    'snapshot',
    'expires_at',
    'sent_at',
    'public_token',
    'token_expires_at',
    'revoked_at',
    'accepted_at',
    'accepted_ip',
])]
class Quote extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'expires_at' => 'datetime',
            'sent_at' => 'datetime',
            'token_expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function totalDzd(): float
    {
        return round($this->total_cents / 100, 2);
    }

    public function isImmutable(): bool
    {
        return filled($this->sent_at) || filled($this->accepted_at);
    }

    public function tokenIsUsable(): bool
    {
        if (blank($this->public_token) || $this->revoked_at !== null) {
            return false;
        }

        return $this->token_expires_at === null || $this->token_expires_at->isFuture();
    }
}
