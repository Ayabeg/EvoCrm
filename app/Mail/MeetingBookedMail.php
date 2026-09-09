<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MeetingBookedMail extends Mailable
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
            subject: "Meeting with {$this->hostName} — {$this->whenLabel}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.meeting-booked',
            text: 'mail.meeting-booked-text',
        );
    }
}
