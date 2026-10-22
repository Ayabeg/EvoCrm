<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'outbound_message_id',
    'provider',
    'provider_event_id',
    'event_type',
    'payload',
    'received_at',
])]
class OutboundProviderEvent extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'received_at' => 'datetime',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(OutboundMessage::class, 'outbound_message_id');
    }
}
