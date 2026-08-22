<?php

namespace App\Services\Outbound;

use App\Models\Mailbox;
use App\Models\Workspace;
use App\Services\Outbound\Contracts\OutboundMailer;

class MailerFactory
{
    public function for(Workspace $workspace, ?Mailbox $mailbox = null): OutboundMailer
    {
        $mailbox ??= Mailbox::query()
            ->forWorkspace($workspace)
            ->where('enabled', true)
            ->orderByDesc('is_default')
            ->first();

        if (! $mailbox) {
            return new DisabledMailer;
        }

        return new SmtpMailboxMailer($mailbox);
    }
}
