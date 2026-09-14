<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MeetingReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $guestName,
        public string $hostName,
        public string $whenLabel,
        public string $timezone,
        public ?string $locationNote,
        public ?string $note,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('Reminder: meeting with :host — :when', [
                'host' => $this->hostName,
                'when' => $this->whenLabel,
            ]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.meeting-reminder',
            text: 'mail.meeting-reminder-text',
        );
    }
}
