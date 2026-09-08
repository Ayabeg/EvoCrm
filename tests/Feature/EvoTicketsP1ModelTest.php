<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\QueryException;
use InvalidArgumentException;

it('numbers tickets EVO-000001 per workspace and requires a contact', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $first = Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Refund on quote',
    ]);

    $second = Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Delivery delay',
        'priority' => Ticket::PRIORITY_HIGH,
        'channel' => Ticket::CHANNEL_WHATSAPP_CLOUD,
    ]);

    expect($first->number)->toBe('EVO-000001')
        ->and($second->number)->toBe('EVO-000002')
        ->and($first->status)->toBe(Ticket::STATUS_NEW)
        ->and($first->contact_id)->toBe($contact->id)
        ->and($second->priority)->toBe(Ticket::PRIORITY_HIGH)
        ->and($contact->fresh()->tickets)->toHaveCount(2);

    $other = User::factory()->create();
    $otherContact = Contact::factory()->create(['workspace_id' => $other->workspace_id]);
    $foreign = Ticket::query()->create([
        'workspace_id' => $other->workspace_id,
        'contact_id' => $otherContact->id,
        'subject' => 'Other workspace',
    ]);

    expect($foreign->number)->toBe('EVO-000001');
});

it('refuses a ticket without a contact', function () {
    $user = User::factory()->create();

    Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'subject' => 'Unknown visitor',
    ]);
})->throws(InvalidArgumentException::class, 'A ticket requires a contact.');

it('allows one ticket per desk thread', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $channel = Channel::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => ChannelType::WhatsAppCloud,
        'name' => 'WhatsApp Cloud',
        'status' => 'connected',
    ]);
    $thread = Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'WhatsApp Cloud',
    ]);

    Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'thread_id' => $thread->id,
        'subject' => 'First open',
        'channel' => Ticket::CHANNEL_WHATSAPP_CLOUD,
    ]);

    expect(fn () => Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'thread_id' => $thread->id,
        'subject' => 'Duplicate',
    ]))->toThrow(QueryException::class);
});

it('builds a ticket from the factory with a generated number', function () {
    $ticket = Ticket::factory()->create();

    expect($ticket->number)->toStartWith('EVO-')
        ->and($ticket->contact_id)->not->toBeNull()
        ->and($ticket->isOpen())->toBeTrue();
});
