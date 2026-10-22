<?php

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\Sequence;
use App\Models\Suppression;
use App\Models\User;
use App\Services\Outbound\ImapReplyPoller;
use App\Services\Outbound\ReplyClassifier;

it('pauses the sequence enrollment when IMAP records a reply', function () {
    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'reply@clinic.dz',
    ]);
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
        'active' => true,
    ]);
    $sequence->steps()->create([
        'position' => 1,
        'delay_hours' => 0,
        'channel' => 'email',
        'subject' => 'Hello',
        'body' => 'First touch',
    ]);

    $enrollment = Enrollment::query()->create([
        'workspace_id' => $user->workspace_id,
        'sequence_id' => $sequence->id,
        'contact_id' => $contact->id,
        'status' => 'active',
        'next_step' => 1,
        'next_run_at' => now()->addHour(),
    ]);

    OutboundMessage::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'mailbox_id' => $mailbox->id,
        'sequence_id' => $sequence->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $contact->email,
        'subject' => 'Hello',
        'body' => 'First touch',
        'status' => 'sent',
        'sent_at' => now()->subHour(),
    ]);

    $reply = app(ImapReplyPoller::class)->recordContactReply($mailbox, $contact, [
        'subject' => 'Re: Hello',
        'body' => 'Thanks — interested.',
        'message_id' => '<reply-1@clinic.dz>',
    ]);

    $duplicate = app(ImapReplyPoller::class)->recordContactReply($mailbox, $contact, [
        'subject' => 'Re: Hello',
        'body' => 'Thanks — interested.',
        'message_id' => '<reply-1@clinic.dz>',
    ]);

    expect($enrollment->refresh()->status)->toBe('paused')
        ->and($enrollment->next_run_at)->toBeNull()
        ->and($reply->reply_classification)->toBe(ReplyClassifier::INTERESTED)
        ->and($duplicate->id)->toBe($reply->id)
        ->and(OutboundMessage::query()
            ->where('contact_id', $contact->id)
            ->where('direction', 'out')
            ->whereNotNull('replied_at')
            ->exists())->toBeTrue()
        ->and(OutboundMessage::query()
            ->where('contact_id', $contact->id)
            ->where('direction', 'in')
            ->count())->toBe(1);
});

it('suppresses a contact when a reply explicitly asks to stop contact', function () {
    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'stop@clinic.dz',
    ]);

    $reply = app(ImapReplyPoller::class)->recordContactReply($mailbox, $contact, [
        'subject' => 'Re: Hello',
        'body' => 'Please unsubscribe me and do not contact me again.',
        'message_id' => '<reply-stop@clinic.dz>',
    ]);

    expect($reply->reply_classification)->toBe(ReplyClassifier::UNSUBSCRIBE)
        ->and(Suppression::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('type', 'email')
            ->where('value', 'stop@clinic.dz')
            ->value('reason'))->toBe('reply_unsubscribe');
});
