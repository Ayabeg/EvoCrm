<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sequence_id',
    'position',
    'delay_hours',
    'channel',
    'subject',
    'body',
    'wa_template_name',
    'wa_template_language',
])]
class SequenceStep extends Model
{
    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }
}
