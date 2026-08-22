<?php

namespace App\Services\Outbound\Contracts;

use App\Models\OutboundMessage;

interface OutboundMailer
{
    public function enabled(): bool;

    public function send(OutboundMessage $message): OutboundMessage;
}
