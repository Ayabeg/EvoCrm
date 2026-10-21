<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadLeakageResultMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $result
     */
    public function __construct(
        public string $recipientName,
        public string $workspaceName,
        public array $result,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Lead Leakage Calculator estimate',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.lead-leakage-result',
            text: 'mail.lead-leakage-result-text',
        );
    }
}
