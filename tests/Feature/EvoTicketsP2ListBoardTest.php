<?php

use App\Models\Contact;
use App\Models\Ticket;
use App\Models\User;

function ticketFor(User $user, array $overrides = []): Ticket
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

it('renders the tickets list with Help Desk columns and open-by-default', function () {
    $user = User::factory()->create();
    $open = ticketFor($user, ['subject' => 'Waiting on parts']);
    $closed = ticketFor($user, [
        'subject' => 'Already closed',
        'status' => Ticket::STATUS_CLOSED,
    ]);

    $this->actingAs($user)
        ->get('/crm/tickets')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/index')
            ->has('tickets', 1)
            ->where('tickets.0.id', $open->id)
            ->where('tickets.0.number', 'EVO-000001')
            ->where('tickets.0.subject', 'Waiting on parts')
            ->where('tickets.0.status', Ticket::STATUS_NEW)
            ->where('tickets.0.contact.first_name', 'Amel')
            ->has('stagePills', 4)
            ->where('stagePills.0.name', 'New')
            ->where('stagePills.0.slug', 'new')
            ->where('stagePills.1.name', 'Waiting on contact')
            ->where('stagePills.2.name', 'Waiting on us')
            ->where('stagePills.3.name', 'Closed')
            ->where('stagePills.3.count', 1)
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->pluck('id')->contains('number')
                && collect($defs)->pluck('id')->contains('subject')
                && collect($defs)->pluck('id')->contains('sla_due_at'))
            ->where('activeFilters.view', 'all')
        );

    $this->actingAs($user)
        ->get('/crm/tickets?view=closed')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tickets', 1)
            ->where('tickets.0.id', $closed->id)
            ->where('activeFilters.view', 'closed')
        );
});

it('filters assigned, unassigned, unanswered, and search on the tickets list', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);
    $mine = ticketFor($user, ['subject' => 'My open ticket']);
    $queue = ticketFor($user, ['subject' => 'Unassigned intake', 'owner_id' => null]);
    ticketFor($user, [
        'subject' => 'Already replied',
        'owner_id' => $other->id,
        'first_response_at' => now(),
    ]);
    ticketFor($user, ['subject' => 'Delivery delay', 'number' => 'EVO-000099']);

    $this->actingAs($user)
        ->get('/crm/tickets?view=my')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tickets', 2)
            ->where('tickets.0.subject', 'Delivery delay')
            ->where('tickets.1.id', $mine->id)
        );

    $this->actingAs($user)
        ->get('/crm/tickets?view=unassigned')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tickets', 1)
            ->where('tickets.0.id', $queue->id)
        );

    $this->actingAs($user)
        ->get('/crm/tickets?unanswered=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tickets', fn ($rows) => collect($rows)->every(fn ($row) => $row['subject'] !== 'Already replied'))
        );

    $this->actingAs($user)
        ->get('/crm/tickets?q=EVO-000099')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tickets', 1)
            ->where('tickets.0.subject', 'Delivery delay')
            ->where('activeFilters.q', 'EVO-000099')
        );
});

it('creates a ticket with a required contact and refuses unknown visitors', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->from('/crm/tickets')
        ->post('/crm/tickets', [
            'subject' => 'WhatsApp refund',
            'contact_id' => $contact->id,
            'priority' => 'high',
            'channel' => 'whatsapp_cloud',
        ])
        ->assertRedirect('/crm/tickets');

    $ticket = Ticket::query()->where('subject', 'WhatsApp refund')->first();

    expect($ticket)->not->toBeNull()
        ->and($ticket->contact_id)->toBe($contact->id)
        ->and($ticket->owner_id)->toBe($user->id)
        ->and($ticket->number)->toBe('EVO-000001')
        ->and($ticket->priority)->toBe(Ticket::PRIORITY_HIGH)
        ->and($ticket->channel)->toBe(Ticket::CHANNEL_WHATSAPP_CLOUD)
        ->and($ticket->status)->toBe(Ticket::STATUS_NEW);

    $this->actingAs($user)
        ->from('/crm/tickets')
        ->post('/crm/tickets', [
            'subject' => 'Unknown visitor',
        ])
        ->assertSessionHasErrors('contact_id');

    $foreign = User::factory()->create();
    $foreignContact = Contact::factory()->create(['workspace_id' => $foreign->workspace_id]);

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Other workspace',
            'contact_id' => $foreignContact->id,
        ])
        ->assertNotFound();
});

it('renders the Help Desk board columns and moves a ticket', function () {
    $user = User::factory()->create();
    $ticket = ticketFor($user, ['subject' => 'Waiting on contact reply']);

    $this->actingAs($user)
        ->get('/crm/tickets/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/board')
            ->has('columns', 4)
            ->where('columns.0.name', 'New')
            ->where('columns.0.slug', 'new')
            ->where('columns.0.count', 1)
            ->where('columns.1.name', 'Waiting on contact')
            ->where('columns.1.slug', 'waiting_on_contact')
            ->where('columns.2.name', 'Waiting on us')
            ->where('columns.2.slug', 'waiting_on_us')
            ->where('columns.3.name', 'Closed')
            ->where('columns.3.slug', 'closed')
            ->has('tickets', 1)
            ->where('tickets.0.id', $ticket->id)
            ->where('tickets.0.subject', 'Waiting on contact reply')
            ->where('tickets.0.status', Ticket::STATUS_NEW)
            ->where('tickets.0.url', '/crm/tickets/'.$ticket->id)
        );

    $this->actingAs($user)
        ->from('/crm/tickets/board')
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_WAITING_ON_CONTACT])
        ->assertRedirect('/crm/tickets/board');

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_WAITING_ON_CONTACT)
        ->and($ticket->fresh()->resolved_at)->toBeNull();

    $this->actingAs($user)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_CLOSED])
        ->assertRedirect();

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_CLOSED)
        ->and($ticket->fresh()->resolved_at)->not->toBeNull();

    $foreign = User::factory()->create();
    $this->actingAs($foreign)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_NEW])
        ->assertNotFound();
});

it('keeps Tickets next to Leads and does not add a second Help Desk app', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $list = file_get_contents(resource_path('js/pages/crm/tickets/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/tickets/board.tsx'));
    $table = file_get_contents(resource_path('js/evo/data/crm-list/table.tsx')).file_get_contents(resource_path('js/evo/data/crm-list/cells.tsx'));
    $palette = file_get_contents(resource_path('js/lib/command-os.ts'));
    $routes = file_get_contents(base_path('routes/web.php'));

    expect($rail)->toContain("label: 'Tickets'")
        ->and($rail)->toContain("href: '/crm/tickets'")
        ->and($rail)->not->toContain('Help Desk')
        ->and(strpos($rail, "label: 'Leads'"))->toBeLessThan(strpos($rail, "label: 'Tickets'"))
        ->and($list)->toContain('CrmListShell')
        ->and($list)->toContain('TicketLayoutToggle')
        ->and($list)->toContain('Create ticket')
        ->and($list)->toContain('entity="ticket"')
        ->and($board)->toContain('PipelineKanban')
        ->and($board)->toContain('TicketLayoutToggle')
        ->and($board)->toContain('Assigned to me')
        ->and($board)->not->toContain('Copilot')
        ->and($board)->not->toContain('There are no conversations')
        ->and($palette)->toContain("label: 'Tickets'")
        ->and($table)->toContain('renderTicketCell')
        ->and($table)->toContain("case 'sla_due_at'")
        ->and($routes)->toContain("name('crm.tickets.index')")
        ->and($routes)->toContain("name('crm.tickets.board')")
        ->and($routes)->toContain("name('crm.tickets.move')");
});
