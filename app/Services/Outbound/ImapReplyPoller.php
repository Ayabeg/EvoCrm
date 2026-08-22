<?php

namespace App\Services\Outbound;

use RuntimeException;

/**
 * Stub only — IMAP reply polling is later work (EvoOutreach mail server).
 */
class ImapReplyPoller
{
    public function poll(): never
    {
        throw new RuntimeException(
            'IMAP reply poller is not implemented. Later work: EvoOutreach mail server + IMAP poller.'
        );
    }
}
