<?php

namespace App\Services\Outbound;

use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Services\Outbound\Contracts\OutboundMailer;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Mailer;
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
            $dsn = sprintf(
                'smtp://%s:%s@%s:%d',
                rawurlencode($this->mailbox->username),
                rawurlencode((string) $this->mailbox->password),
                $this->mailbox->host,
                $this->mailbox->port,
            );

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

            if (app()->environment('testing') || config('mail.default') === 'array') {
                Mail::raw((string) $message->body, function ($mail) use ($message): void {
                    $mail->to($message->to_address)->subject($message->subject ?: 'EvoSales');
                });

                $message->forceFill([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'failure_reason' => null,
                ])->save();
            } else {
                $sent = (new Mailer(Transport::fromDsn($dsn)))->send($email);

                $message->forceFill([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'failure_reason' => null,
                    'message_id' => $sent->getMessageId() ?: null,
                ])->save();
            }
        } catch (\Throwable $e) {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => $e->getMessage(),
            ])->save();
        }

        return $message;
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
