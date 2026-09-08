<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sequence_id',
    'position',
    'step_type',
    'delay_hours',
    'channel',
    'mailbox_id',
    'subject',
    'subject_b',
    'body',
    'meeting_url',
    'on_reply_step',
    'on_no_reply_step',
    'variant_key',
    'template_id',
    'wa_template_name',
    'wa_template_language',
])]
class SequenceStep extends Model
{
    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(OutboundTemplate::class);
    }
}
