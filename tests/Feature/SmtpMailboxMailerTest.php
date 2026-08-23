<?php

use App\Models\Contact;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Services\Outbound\SmtpMailboxMailer;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mime\Email;

function makeSmtpMessage(Mailbox $mailbox): OutboundMessage
{
    $contact = Contact::factory()->create(['workspace_id' => $mailbox->workspace_id]);

    return OutboundMessage::query()->create([
        'workspace_id' => $mailbox->workspace_id,
        'contact_id' => $contact->id,
        'mailbox_id' => $mailbox->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Hello',
        'body' => 'Body text',
        'status' => 'queued',
    ]);
}

/**
 * A mailer that runs the real send path but stubs the transport call, so
 * tests decide what TransportInterface::send() returns without opening a
 * socket.
 */
function smtpMailerStub(Mailbox $mailbox, ?SentMessage $deliverResult = null, ?Throwable $deliverError = null): SmtpMailboxMailer
{
    return new class($mailbox, $deliverResult, $deliverError) extends SmtpMailboxMailer
    {
        public function __construct(
            Mailbox $mailbox,
            private ?SentMessage $deliverResult,
            private ?Throwable $deliverError,
        ) {
            parent::__construct($mailbox);
        }

        protected function shouldFakeSend(): bool
        {
            return false;
        }

        protected function deliver(string $dsn, Email $email): ?SentMessage
        {
            if ($this->deliverError) {
                throw $this->deliverError;
            }

            return $this->deliverResult;
        }
    };
}

it('marks the message sent when the transport accepts the mail but returns null', function () {
    $mailbox = Mailbox::factory()->create(['enabled' => true]);
    $message = makeSmtpMessage($mailbox);

    $result = smtpMailerStub($mailbox, null)->send($message);

    expect($result->status)->toBe('sent');
    expect($result->sent_at)->not->toBeNull();
    expect($result->message_id)->toBeNull();
    expect($result->failure_reason)->toBeNull();
});

it('stores the message id when the transport returns a sent message', function () {
    $mailbox = Mailbox::factory()->create(['enabled' => true]);
    $message = makeSmtpMessage($mailbox);

    $email = (new Email)
        ->from($mailbox->from_address)
        ->to($message->to_address)
        ->subject('Hello')
        ->text('Body text');
    $sent = new SentMessage($email, Envelope::create($email));

    $result = smtpMailerStub($mailbox, $sent)->send($message);

    expect($result->status)->toBe('sent');
    expect($result->sent_at)->not->toBeNull();
    expect($result->message_id)->toBe($sent->getMessageId());
    expect($result->failure_reason)->toBeNull();
});

it('marks the message failed when the transport throws', function () {
    $mailbox = Mailbox::factory()->create(['enabled' => true]);
    $message = makeSmtpMessage($mailbox);

    $result = smtpMailerStub($mailbox, null, new TransportException('Connection to outbound.evotechly.com:587 timed out'))->send($message);

    expect($result->status)->toBe('failed');
    expect($result->failure_reason)->toContain('timed out');
    expect($result->sent_at)->toBeNull();
});

it('ships an ad-hoc email through the mailbox transport', function () {
    $mailbox = Mailbox::factory()->create(['enabled' => true]);

    smtpMailerStub($mailbox)->sendAdHoc(
        'invitee@evotechly.com',
        'You are invited',
        'Plain body',
        '<p>HTML body</p>',
    );

    // No exception means the transport accepted the mail.
    expect(true)->toBeTrue();
});

it('refuses to send ad-hoc email from a disabled mailbox', function () {
    $mailbox = Mailbox::factory()->create(['enabled' => false]);

    smtpMailerStub($mailbox)->sendAdHoc(
        'invitee@evotechly.com',
        'You are invited',
        'Plain body',
        '<p>HTML body</p>',
    );
})->throws(RuntimeException::class, 'disabled');
