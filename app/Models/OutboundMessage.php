<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'workspace_id',
    'contact_id',
    'mailbox_id',
    'sequence_id',
    'campaign_id',
    'channel',
    'direction',
    'to_address',
    'message_id',
    'in_reply_to',
    'subject',
    'body',
    'body_html',
    'status',
    'failure_reason',
    'deferred_until',
    'defer_reason',
    'sent_at',
    'replied_at',
    'opened_at',
    'open_count',
    'clicked_at',
    'click_count',
    'track_token',
])]
class OutboundMessage extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'replied_at' => 'datetime',
            'opened_at' => 'datetime',
            'open_count' => 'integer',
            'clicked_at' => 'datetime',
            'click_count' => 'integer',
            'deferred_until' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (OutboundMessage $message): void {
            if ($message->direction === 'out' && blank($message->track_token)) {
                $message->track_token = (string) Str::ulid();
            }
        });
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }

    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(OutboundCampaign::class, 'campaign_id');
    }

    /**
     * Queued but held back by quiet hours or the mailbox daily cap — the
     * runner retries once deferred_until passes.
     */
    public function deferred(): bool
    {
        return $this->status === 'queued'
            && $this->deferred_until !== null
            && $this->deferred_until->isFuture();
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(OutboundMessage::class, 'in_reply_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(OutboundMessage::class, 'in_reply_to');
    }
}
