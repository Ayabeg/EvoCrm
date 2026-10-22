<?php

namespace App\Services\Outbound;

use App\Models\OutboundMessage;
use App\Services\Outbound\Contracts\OutboundMailer;

class DisabledMailer implements OutboundMailer
{
    public function enabled(): bool
    {
        return false;
    }

    public function send(OutboundMessage $message): OutboundMessage
    {
        $message->forceFill([
            'status' => 'failed',
            'sending_at' => null,
            'failure_reason' => 'No mailbox configured. SMTP send is disabled until a mailbox is added.',
        ])->save();

        return $message;
    }
}
