<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;

it('§8.1 board columns match HubSpot Help Desk plus inactivity', function () {
    $board = file_get_contents(resource_path('js/pages/crm/tickets/board.tsx'));
    $path = file_get_contents(app_path('Support/TicketPath.php'));

    expect($path)->toContain("'label' => 'New'")
        ->and($path)->toContain("'label' => 'Waiting on contact'")
        ->and($path)->toContain("'label' => 'Waiting on us'")
        ->and($path)->toContain("'label' => 'Closed'")
        ->and($board)->toContain('All open')
        ->and($board)->toContain('Assigned to me')
        ->and($board)->toContain('Inactive for')
        ->and($board)->toContain('Create ticket')
        ->and($board)->toContain('PipelineKanban')
        ->and($board)->not->toContain("My Team")
        ->and($board)->not->toContain('Mentions')
        ->and($board)->not->toContain('Copilot');
});

it('§8.2 list has All open views, chips, and Create ticket', function () {
    $index = file_get_contents(resource_path('js/pages/crm/tickets/index.tsx'));
    $tabs = file_get_contents(resource_path('js/components/crm/saved-view-tabs.tsx'));
    $filters = file_get_contents(resource_path('js/components/crm/column-filter-row.tsx'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));

    expect($index)->toContain('primaryLabel="Create ticket"')
        ->and($index)->toContain('CrmListShell')
        ->and($index)->toContain('entity="ticket"')
        ->and($tabs)->toContain('All open')
        ->and($tabs)->toContain('Assigned to me')
        ->and($tabs)->toContain('Unassigned')
        ->and($tabs)->toContain('Closed')
        ->and($filters)->toContain('name="priority"')
        ->and($filters)->toContain('name="channel"')
        ->and($filters)->toContain('name="unanswered"')
        ->and($config)->toContain("'id' => 'number'")
        ->and($config)->toContain("'id' => 'sla_due_at'");
});

it('§8.3 record is Path plus a live Desk thread, not an empty conversation', function () {
    $show = file_get_contents(resource_path('js/pages/crm/tickets/show.tsx'));

    expect($show)->toContain('RecordShell')
        ->and($show)->toContain('RecordPath')
        ->and($show)->toContain('label="Ticket path"')
        ->and($show)->toContain('AskEvoPanel')
        ->and($show)->toContain('DeskGlass')
        ->and($show)->toContain('Send on WhatsApp')
        ->and($show)->toContain('Open WhatsApp / attach thread')
        ->and($show)->not->toContain('There are no conversations')
        ->and($show)->not->toContain('Add Contact')
        ->and($show)->not->toContain('Unknown Contact')
        ->and($show)->not->toContain('Copilot')
        ->and($show)->not->toContain('Breeze');
});

it('§8.4 Desk thread header opens a ticket', function () {
    $inbox = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));

    expect($inbox)->toContain('Open ticket')
        ->and($inbox)->toContain('desk-open-ticket')
        ->and($inbox)->toContain('/desk/threads/${selected.id}/ticket')
        ->and($routes)->toContain("name('desk.ticket.open')")
        ->and($inbox)->not->toContain('Unknown Contact');
});

it('§8.5 contact and deal records show the Tickets card', function () {
    $contact = file_get_contents(resource_path('js/pages/crm/contacts/show.tsx'));
    $deal = file_get_contents(resource_path('js/pages/crm/deals/show.tsx'));
    $card = file_get_contents(resource_path('js/components/crm/tickets-related-card.tsx'));

    expect($contact)->toContain('TicketsRelatedCard')
        ->and($deal)->toContain('TicketsRelatedCard')
        ->and($card)->toContain('title="Tickets"')
        ->and($card)->toContain('open')
        ->and($card)->not->toContain('Cases')
        ->and($contact)->not->toContain('Help Desk');
});

it('§8.6 anti-patterns stay out of the tickets product', function () {
    $files = [
        resource_path('js/pages/crm/tickets/index.tsx'),
        resource_path('js/pages/crm/tickets/board.tsx'),
        resource_path('js/pages/crm/tickets/show.tsx'),
        resource_path('js/pages/desk/inbox.tsx'),
        resource_path('js/pages/crm/contacts/show.tsx'),
        resource_path('js/components/crm/tickets-related-card.tsx'),
        resource_path('js/components/app-sidebar.tsx'),
        resource_path('js/components/crm/ask-evo-panel.tsx'),
        base_path('routes/web.php'),
    ];

    foreach ($files as $path) {
        $src = file_get_contents($path);

        expect($src)->not->toContain('Copilot')
            ->and($src)->not->toContain('Breeze')
            ->and($src)->not->toContain('Einstein')
            ->and($src)->not->toContain('Unknown Contact')
            ->and($src)->not->toContain('#0176D3')
            ->and($src)->not->toContain('#00A4BD');
    }

    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));
    $ask = file_get_contents(resource_path('js/components/crm/ask-evo-panel.tsx'));

    expect($rail)->toContain("label: 'Tickets'")
        ->and($rail)->toContain("href: '/crm/tickets'")
        ->and($rail)->not->toContain('Help Desk')
        ->and($rail)->not->toContain("href: '/leads'")
        ->and($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')")
        ->and($routes)->toContain("name('desk.inbox')")
        ->and($ask)->not->toContain('Slack');
});

it('serves the live surfaces the Mobbin checklist names', function () {
    config()->set('evosales.inbox_url', '');

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => null]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amel',
        'owner_id' => $user->id,
    ]);
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
        'body' => 'Parts delayed',
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);
    $ticket = Ticket::openFromThread($thread, $user);

    $this->actingAs($user)->get('/crm/tickets')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/index')
            ->has('tickets', 1)
            ->has('stagePills', 4)
            ->where('stagePills.0.name', 'New')
            ->where('stagePills.1.name', 'Waiting on contact')
            ->where('stagePills.2.name', 'Waiting on us')
            ->where('stagePills.3.name', 'Closed')
            ->has('listView.columnDefs')
        );

    $this->actingAs($user)->get('/crm/tickets/board')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/board')
            ->has('columns', 4)
            ->where('columns.0.name', 'New')
            ->where('columns.1.name', 'Waiting on contact')
            ->where('columns.2.name', 'Waiting on us')
            ->where('columns.3.name', 'Closed')
            ->has('tickets', 1)
            ->where('tickets.0.subject', $ticket->subject)
        );

    $this->actingAs($user)->get("/crm/tickets/{$ticket->id}")->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/show')
            ->where('path.steps.0.label', 'New')
            ->where('path.steps.3.label', 'Closed')
            ->where('thread.id', $thread->id)
            ->has('askEvo.summary')
        );

    $this->actingAs($user)->get('/inbox?thread='.$thread->id)->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('selected.ticket.id', $ticket->id)
            ->where('selected.ticket.number', $ticket->number)
        );

    $this->actingAs($user)->get("/crm/contacts/{$contact->id}")->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->where('associations.tickets.open_count', 1)
            ->where('associations.tickets.rows.0.id', $ticket->id)
        );

    $this->actingAs($user)->get('/leads')->assertRedirect('/crm/deals/board');
});

it('keeps the written QA checklist in lockstep with §8', function () {
    $checklist = file_get_contents(base_path('docs/evotickets-qa-checklist.md'));
    $plan = file_get_contents(base_path('docs/evotickets-plan.md'));
    $contract = file_get_contents(base_path('docs/evotickets-mobbin-contract.md'));

    expect($checklist)->toContain('f9b9fcf1-0767-4ee5-adad-12003a31331e')
        ->and($checklist)->toContain('d99d4a6b-9634-4cd3-8ae1-39e337ebd2ea')
        ->and($checklist)->toContain('8967ff1d-c744-4825-9f99-7449632e4b6d')
        ->and($checklist)->toContain('56cf36dd-2345-49d2-8284-df2965a29945')
        ->and($checklist)->toContain('a6d82c16-51a1-4ad7-ba34-f4ebdd3f3aed')
        ->and($checklist)->toContain('DONE')
        ->and($checklist)->toContain('EvoTicketsP7MobbinQaTest')
        ->and($plan)->toContain('EvoTicketsP7MobbinQaTest')
        ->and($contract)->toContain('Unknown Contact');
});
