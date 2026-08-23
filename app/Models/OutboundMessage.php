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
    'channel',
    'direction',
    'to_address',
    'message_id',
    'in_reply_to',
    'subject',
    'body',
    'status',
    'failure_reason',
    'sent_at',
    'replied_at',
    'opened_at',
    'open_count',
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(OutboundMessage::class, 'in_reply_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(OutboundMessage::class, 'in_reply_to');
    }
}
