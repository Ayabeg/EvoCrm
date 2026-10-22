<?php

namespace App\Services\Outbound;

use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Services\Outbound\Contracts\OutboundMailer;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class SmtpMailboxMailer implements OutboundMailer
{
    public function __construct(private Mailbox $mailbox) {}

    public function enabled(): bool
    {
        return $this->mailbox->enabled;
    }

    public function send(OutboundMessage $message): OutboundMessage
    {
        if (! $this->enabled()) {
            return (new DisabledMailer)->send($message);
        }

        try {
            $dsn = $this->dsn();

            $email = (new Email)
                ->from(new Address($this->mailbox->from_address, $this->mailbox->from_name))
                ->to($message->to_address)
                ->subject($message->subject ?: 'EvoSales')
                ->text((string) $message->body)
                ->html($this->htmlBody($message));

            $unsubscribe = app(EmailHtml::class)->unsubscribeUrl($message);
            if ($unsubscribe) {
                $email->getHeaders()->addTextHeader('List-Unsubscribe', '<'.$unsubscribe.'>');
            }

            if ($this->shouldFakeSend()) {
                Mail::raw((string) $message->body, function ($mail) use ($message): void {
                    $mail->to($message->to_address)->subject($message->subject ?: 'EvoSales');
                });

                $message->forceFill([
                    'status' => 'sent',
                    'sending_at' => null,
                    'sent_at' => now(),
                    'failure_reason' => null,
                ])->save();
            } else {
                // A send that does not throw is a success. TransportInterface::send()
                // may return null even when the server accepted the mail (and the
                // Mailer wrapper discards the SentMessage entirely), so the message
                // id is read null-safely and the message is marked sent.
                $sent = $this->deliver($dsn, $email);

                $message->forceFill([
                    'status' => 'sent',
                    'sending_at' => null,
                    'sent_at' => now(),
                    'failure_reason' => null,
                    'message_id' => $sent?->getMessageId() ?: null,
                ])->save();
            }
        } catch (\Throwable $e) {
            $message->forceFill([
                'status' => 'failed',
                'sending_at' => null,
                'failure_reason' => $e->getMessage(),
            ])->save();
        }

        return $message;
    }

    /**
     * Send a one-off email that is not an OutboundMessage (workspace invites,
     * first-login links) through this mailbox's SMTP transport. Throws on
     * failure — the caller decides how to report it.
     */
    public function sendAdHoc(string $to, string $subject, string $text, string $html): void
    {
        if (! $this->enabled()) {
            throw new \RuntimeException("Mailbox [{$this->mailbox->name}] is disabled.");
        }

        $email = (new Email)
            ->from(new Address($this->mailbox->from_address, $this->mailbox->from_name))
            ->to($to)
            ->subject($subject)
            ->text($text)
            ->html($html);

        $this->deliver($this->dsn(), $email);
    }

    protected function dsn(): string
    {
        return sprintf(
            'smtp://%s:%s@%s:%d',
            rawurlencode($this->mailbox->username),
            rawurlencode((string) $this->mailbox->password),
            $this->mailbox->host,
            $this->mailbox->port,
        );
    }

    /**
     * Tests and the array mailer never open a real SMTP connection.
     */
    protected function shouldFakeSend(): bool
    {
        return app()->environment('testing') || config('mail.default') === 'array';
    }

    /**
     * Send through the transport directly: Mailer::send() returns void, so
     * only the transport exposes the SentMessage (and it may still be null).
     */
    protected function deliver(string $dsn, Email $email): ?SentMessage
    {
        return Transport::fromDsn($dsn)->send($email);
    }

    /**
     * HTML part with click-tracked links, an unsubscribe footer on the CRM
     * hostname, and the 1px open beacon. Opens/clicks only count recipients
     * whose client loads remote images or follows a link — the reports page
     * says so.
     */
    protected function htmlBody(OutboundMessage $message): string
    {
        return app(EmailHtml::class)->build($message);
    }
}
