<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'contact_id',
    'mailbox_id',
    'sequence_id',
    'channel',
    'to_address',
    'subject',
    'body',
    'status',
    'failure_reason',
    'sent_at',
])]
class OutboundMessage extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }
}
