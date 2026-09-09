<?php

use App\Enums\ChannelType;
use App\Models\Activity;
use App\Models\AiInsight;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;

function recordTicket(User $user, array $overrides = []): Ticket
{
    $contact = $overrides['contact'] ?? Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
    ]);
    unset($overrides['contact']);

    return Ticket::query()->create(array_merge([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Refund on quote',
        'owner_id' => $user->id,
    ], $overrides));
}

function recordThread(User $user, Contact $contact, string $body = 'Salaam, parts delayed'): Thread
{
    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $user->workspace_id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'connected'],
    );

    $thread = Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'WhatsApp Cloud',
        'last_message_at' => now(),
    ]);

    Message::query()->create([
        'workspace_id' => $user->workspace_id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => $body,
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);

    return $thread;
}

it('renders the ticket record as Path plus a live Desk thread, not an empty conversation', function () {
    $user = User::factory()->create();
    $ticket = recordTicket($user);
    $thread = recordThread($user, $ticket->contact);
    $ticket->forceFill(['thread_id' => $thread->id, 'channel' => Ticket::CHANNEL_WHATSAPP_CLOUD])->save();

    $this->actingAs($user)
        ->get("/crm/tickets/{$ticket->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/show')
            ->where('ticket.number', 'EVO-000001')
            ->where('ticket.subject', 'Refund on quote')
            ->where('path.current', Ticket::STATUS_NEW)
            ->where('path.next', Ticket::STATUS_WAITING_ON_CONTACT)
            ->where('path.complete', false)
            ->where('path.steps.0.label', 'New')
            ->where('path.steps.1.label', 'Waiting on contact')
            ->where('path.steps.2.label', 'Waiting on us')
            ->where('path.steps.3.label', 'Closed')
            ->where('thread.id', $thread->id)
            ->where('messages.0.body', 'Salaam, parts delayed')
            ->has('askEvo.summary')
            ->where('associations.contact.first_name', 'Amel')
        );
});

it('offers Open WhatsApp / attach thread when the ticket has no Desk thread', function () {
    $user = User::factory()->create();
    $ticket = recordTicket($user);
    $thread = recordThread($user, $ticket->contact, 'Need a pickup');

    $this->actingAs($user)
        ->get("/crm/tickets/{$ticket->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/show')
            ->where('thread', null)
            ->has('attachableThreads', 1)
            ->where('attachableThreads.0.id', $thread->id)
            ->has('askEvo.summary')
        );

    $this->actingAs($user)
        ->from("/crm/tickets/{$ticket->id}")
        ->post("/crm/tickets/{$ticket->id}/thread", ['thread_id' => $thread->id])
        ->assertRedirect("/crm/tickets/{$ticket->id}");

    expect($ticket->fresh()->thread_id)->toBe($thread->id)
        ->and($ticket->fresh()->channel)->toBe(Ticket::CHANNEL_WHATSAPP_CLOUD);
});

it('advances Path one step and closes as terminal', function () {
    $user = User::factory()->create();
    $ticket = recordTicket($user);

    $this->actingAs($user)
        ->from("/crm/tickets/{$ticket->id}")
        ->put("/crm/tickets/{$ticket->id}", ['status' => Ticket::STATUS_WAITING_ON_CONTACT])
        ->assertRedirect();

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_WAITING_ON_CONTACT);

    $this->actingAs($user)
        ->put("/crm/tickets/{$ticket->id}", ['status' => Ticket::STATUS_CLOSED])
        ->assertRedirect();

    $this->actingAs($user)
        ->get("/crm/tickets/{$ticket->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('path.current', Ticket::STATUS_CLOSED)
            ->where('path.next', null)
            ->where('path.complete', true)
        );

    expect($ticket->fresh()->resolved_at)->not->toBeNull();

    $this->actingAs($user)
        ->put("/crm/tickets/{$ticket->id}", ['status' => Ticket::STATUS_WAITING_ON_US])
        ->assertRedirect();

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_WAITING_ON_US)
        ->and($ticket->fresh()->resolved_at)->toBeNull();
});

it('changes owner and answers Ask Evo from ticket fields', function () {
    $user = User::factory()->create(['name' => 'Amine Owner']);
    $other = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Sara Agent',
    ]);
    $ticket = recordTicket($user);

    $this->actingAs($user)
        ->put("/crm/tickets/{$ticket->id}", ['owner_id' => $other->id])
        ->assertRedirect();

    expect($ticket->fresh()->owner_id)->toBe($other->id);

    $this->actingAs($user)
        ->from("/crm/tickets/{$ticket->id}")
        ->post("/crm/tickets/{$ticket->id}/ask", ['question' => 'Who owns this ticket?'])
        ->assertRedirect("/crm/tickets/{$ticket->id}");

    $insight = AiInsight::query()->where('subject_type', 'ticket')->where('subject_id', $ticket->id)->first();

    expect($insight)->not->toBeNull()
        ->and($insight->answer)->not->toBe('');
});

it('writes ticket_opened and ticket_status on the contact timeline', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Warranty follow-up',
            'contact_id' => $contact->id,
        ])
        ->assertRedirect();

    $ticket = Ticket::query()->where('subject', 'Warranty follow-up')->first();

    $opened = Activity::query()
        ->where('contact_id', $contact->id)
        ->where('type', 'ticket_opened')
        ->first();

    expect($ticket)->not->toBeNull()
        ->and($opened)->not->toBeNull()
        ->and($opened->meta['ticket_id'] ?? null)->toBe($ticket->id);

    $this->actingAs($user)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_WAITING_ON_US])
        ->assertRedirect();

    $status = Activity::query()
        ->where('contact_id', $contact->id)
        ->where('type', 'ticket_status')
        ->first();

    expect($status)->not->toBeNull()
        ->and($status->meta['ticket_id'] ?? null)->toBe($ticket->id);
});

it('hides another workspace ticket and refuses a foreign thread', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $mine = recordTicket($user);
    $foreign = recordTicket($other);

    $this->actingAs($user)
        ->get("/crm/tickets/{$foreign->id}")
        ->assertNotFound();

    $foreignThread = recordThread($other, $foreign->contact);

    $this->actingAs($user)
        ->post("/crm/tickets/{$mine->id}/thread", ['thread_id' => $foreignThread->id])
        ->assertNotFound();

    $otherContact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $otherThread = recordThread($user, $otherContact);

    $this->actingAs($user)
        ->post("/crm/tickets/{$mine->id}/thread", ['thread_id' => $otherThread->id])
        ->assertNotFound();
});

it('refuses a Desk thread that already has a ticket', function () {
    $user = User::factory()->create();
    $first = recordTicket($user);
    $thread = recordThread($user, $first->contact);
    $first->forceFill(['thread_id' => $thread->id])->save();
    $second = recordTicket($user, ['contact' => $first->contact, 'subject' => 'Second ticket']);

    $this->actingAs($user)
        ->get("/crm/tickets/{$second->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('thread', null)
            ->has('attachableThreads', 0)
        );

    $this->actingAs($user)
        ->post("/crm/tickets/{$second->id}/thread", ['thread_id' => $thread->id])
        ->assertStatus(422);
});

it('keeps ticket record chrome on Path + WhatsApp, never HubSpot empty conversation', function () {
    $show = file_get_contents(resource_path('js/pages/crm/tickets/show.tsx'));
    $path = file_get_contents(resource_path('js/components/crm/record-path.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));

    expect($show)->toContain('RecordShell')
        ->and($show)->toContain('RecordPath')
        ->and($show)->toContain('AskEvoPanel')
        ->and($show)->toContain('Open WhatsApp / attach thread')
        ->and($show)->toContain('label="Ticket path"')
        ->and($show)->toContain('/desk/threads/')
        ->and($show)->toContain('Send on WhatsApp')
        ->and($show)->not->toContain('There are no conversations')
        ->and($show)->not->toContain('Add Contact to start')
        ->and($show)->not->toContain('Copilot')
        ->and($show)->not->toContain('Breeze')
        ->and($show)->not->toContain('Slack')
        ->and($path)->toContain('Mark Status as Complete')
        ->and($routes)->toContain("name('crm.tickets.show')")
        ->and($routes)->toContain("name('crm.tickets.update')")
        ->and($routes)->toContain("name('crm.tickets.thread')")
        ->and($routes)->toContain("name('crm.tickets.ask')");
});
