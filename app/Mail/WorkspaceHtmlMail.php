<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class WorkspaceHtmlMail extends Mailable
{
    /**
     * @param  array<int, array{name: string, data: string, mime: string}>  $attachments
     */
    public function __construct(
        public string $subjectLine,
        public string $htmlBody,
        public ?string $fromAddress = null,
        public ?string $fromName = null,
        public array $fileAttachments = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
            from: $this->fromAddress
                ? new Address($this->fromAddress, $this->fromName ?? 'EvoSales')
                : null,
        );
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->htmlBody);
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return collect($this->fileAttachments)
            ->map(fn (array $file) => Attachment::fromData(fn () => $file['data'], $file['name'])
                ->withMime($file['mime']))
            ->all();
    }
}
