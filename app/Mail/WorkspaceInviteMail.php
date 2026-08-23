<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The workspace invite / first-login email. Content lives here and in the
 * two mail.workspace-invite views; the People invite service reads the
 * envelope/content back off this class so the testing path (Mail::fake)
 * and the real SMTP path (SmtpMailboxMailer) send the exact same mail.
 */
class WorkspaceInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $inviteeName,
        public string $workspaceName,
        public string $inviterName,
        public string $inviteUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "You're invited to {$this->workspaceName} on EvoSales",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.workspace-invite',
            text: 'mail.workspace-invite-text',
        );
    }
}
