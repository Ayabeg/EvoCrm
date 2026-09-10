<?php

use App\Enums\ChannelType;
use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Carbon;

function r4Workflow(User $user, string $trigger, array $overrides = []): Workflow
{
    return Workflow::factory()->create(array_merge([
        'workspace_id' => $user->workspace_id,
        'name' => $trigger,
        'trigger' => $trigger,
        'action' => Workflow::ACTION_CREATE_TASK,
        'active' => true,
        'action_config' => ['subject' => 'Ticket follow-up {{ticket}}'],
    ], $overrides));
}

function r4Ticket(User $user, array $overrides = []): Ticket
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
        'subject' => 'Parts delayed',
        'owner_id' => $user->id,
        'priority' => Ticket::PRIORITY_HIGH,
    ], $overrides));
}

function r4Thread(User $user, ?Contact $contact = null): Thread
{
    $contact ??= Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
        'phone_e164' => '+213555000111',
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
        'body' => 'Parts still delayed, need a pickup today',
        'status' => 'received',
        'provider' => 'evolution_cloud',
    ]);

    return $thread;
}

function r4Tasks(?int $contactId = null): int
{
    $query = Activity::query()->where('type', 'task')->where('subject', 'like', 'Ticket follow-up%');

    if ($contactId) {
        $query->where('contact_id', $contactId);
    }

    return $query->count();
}

it('creates a follow-up task when a ticket is stored', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    r4Workflow($user, Workflow::TRIGGER_TICKET_CREATED);

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Door off hinge',
            'contact_id' => $contact->id,
        ])
        ->assertRedirect();

    $ticket = Ticket::query()->where('subject', 'Door off hinge')->first();
    $task = Activity::query()->where('type', 'task')->where('contact_id', $contact->id)->first();

    expect($ticket)->not->toBeNull()
        ->and($task)->not->toBeNull()
        ->and($task->subject)->toBe('Ticket follow-up '.$ticket->number)
        ->and($task->meta['source'] ?? null)->toBe('workflow')
        ->and($task->meta['ticket_id'] ?? null)->toBe($ticket->id)
        ->and($task->owner_id)->toBe($user->id);
});

it('creates a follow-up task when a Desk thread is opened as a ticket', function () {
    $user = User::factory()->create();
    r4Workflow($user, Workflow::TRIGGER_TICKET_CREATED);
    $thread = r4Thread($user);

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/ticket")
        ->assertRedirect();

    $ticket = Ticket::query()->where('thread_id', $thread->id)->first();

    expect($ticket)->not->toBeNull()
        ->and(r4Tasks($thread->contact_id))->toBe(1)
        ->and(Activity::query()->where('type', 'task')->where('contact_id', $thread->contact_id)->value('subject'))
        ->toBe('Ticket follow-up '.$ticket->number);

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/ticket")
        ->assertRedirect('/crm/tickets/'.$ticket->id);

    expect(Ticket::query()->where('thread_id', $thread->id)->count())->toBe(1)
        ->and(r4Tasks($thread->contact_id))->toBe(1);
});

it('fires ticket.status_changed from a board move and from reopen, not from the same status', function () {
    $user = User::factory()->create();
    r4Workflow($user, Workflow::TRIGGER_TICKET_STATUS_CHANGED);
    $ticket = r4Ticket($user);

    expect(r4Tasks($ticket->contact_id))->toBe(0);

    $this->actingAs($user)
        ->from('/crm/tickets/board')
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_WAITING_ON_US])
        ->assertRedirect('/crm/tickets/board');

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_WAITING_ON_US)
        ->and(r4Tasks($ticket->contact_id))->toBe(1);

    $this->actingAs($user)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_WAITING_ON_US])
        ->assertRedirect();

    expect(r4Tasks($ticket->contact_id))->toBe(1);

    $this->actingAs($user)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_CLOSED])
        ->assertRedirect();

    expect(r4Tasks($ticket->contact_id))->toBe(2);

    $thread = r4Thread($user, $ticket->contact);
    $ticket->forceFill(['thread_id' => $thread->id])->save();

    $this->actingAs($user)
        ->post("/desk/threads/{$thread->id}/ticket")
        ->assertRedirect('/crm/tickets/'.$ticket->id);

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_WAITING_ON_US)
        ->and(r4Tasks($ticket->contact_id))->toBe(3);
});

it('only runs ticket.status_changed when the optional to-status matches', function () {
    $user = User::factory()->create();
    r4Workflow($user, Workflow::TRIGGER_TICKET_STATUS_CHANGED, [
        'trigger_status' => Ticket::STATUS_CLOSED,
        'action_config' => ['subject' => 'Closed {{ticket}}'],
    ]);
    $ticket = r4Ticket($user);

    $this->actingAs($user)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_WAITING_ON_CONTACT])
        ->assertRedirect();

    expect(Activity::query()->where('type', 'task')->where('contact_id', $ticket->contact_id)->count())->toBe(0);

    $this->actingAs($user)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_CLOSED])
        ->assertRedirect();

    expect(Activity::query()->where('type', 'task')->where('contact_id', $ticket->contact_id)->value('subject'))
        ->toBe('Closed '.$ticket->number);
});

it('is a no-op when a member moves a ticket to the same status', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => ['crm.edit'],
    ]);
    r4Workflow($owner, Workflow::TRIGGER_TICKET_STATUS_CHANGED);
    $ticket = r4Ticket($owner);

    $this->actingAs($member)
        ->post("/crm/tickets/{$ticket->id}/move", ['status' => Ticket::STATUS_NEW])
        ->assertRedirect();

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_NEW)
        ->and(r4Tasks($ticket->contact_id))->toBe(0);
});

it('does not run another workspace ticket.created workflow', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    r4Workflow($other, Workflow::TRIGGER_TICKET_CREATED);
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Local only',
            'contact_id' => $contact->id,
        ])
        ->assertRedirect();

    expect(r4Tasks())->toBe(0);
});

it('fires ticket.sla_breached once from tickets:check-sla', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    r4Workflow($user, Workflow::TRIGGER_TICKET_SLA_BREACHED);
    $ticket = r4Ticket($user);

    expect($ticket->sla_due_at->timezone('Africa/Algiers')->format('Y-m-d H:i'))->toBe('2026-09-08 18:00')
        ->and($ticket->sla_breached_at)->toBeNull();

    $this->artisan('tickets:check-sla')->assertSuccessful();

    expect($ticket->fresh()->sla_breached_at)->toBeNull()
        ->and(r4Tasks($ticket->contact_id))->toBe(0);

    $this->travelTo(Carbon::parse('2026-09-08 19:00:00', 'Africa/Algiers'));

    $this->artisan('tickets:check-sla')->assertSuccessful();

    $ticket->refresh();

    expect($ticket->sla_breached_at)->not->toBeNull()
        ->and(r4Tasks($ticket->contact_id))->toBe(1);

    $this->artisan('tickets:check-sla')->assertSuccessful();

    expect(r4Tasks($ticket->contact_id))->toBe(1);
});

it('marks SLA breached once when first response is already late', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    r4Workflow($user, Workflow::TRIGGER_TICKET_SLA_BREACHED);
    $ticket = r4Ticket($user);

    $this->travelTo(Carbon::parse('2026-09-08 19:00:00', 'Africa/Algiers'));
    $ticket->markFirstResponse();

    expect($ticket->fresh()->first_response_at)->not->toBeNull()
        ->and($ticket->fresh()->sla_breached_at)->not->toBeNull()
        ->and(r4Tasks($ticket->contact_id))->toBe(1);

    $this->artisan('tickets:check-sla')->assertSuccessful();

    expect(r4Tasks($ticket->contact_id))->toBe(1);
});

it('resets sla_breached_at when a closed ticket reopens onto a new clock', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $ticket = r4Ticket($user);

    $this->travelTo(Carbon::parse('2026-09-08 19:00:00', 'Africa/Algiers'));
    expect($ticket->markSlaBreached())->toBeTrue()
        ->and($ticket->fresh()->sla_breached_at)->not->toBeNull();

    $ticket->moveTo(Ticket::STATUS_CLOSED);
    $this->travelTo(Carbon::parse('2026-09-09 10:00:00', 'Africa/Algiers'));
    $ticket->moveTo(Ticket::STATUS_WAITING_ON_US);

    expect($ticket->fresh()->sla_breached_at)->toBeNull()
        ->and($ticket->fresh()->sla_due_at->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-09 18:00');
});

it('saves ticket.status_changed from the automation form with an optional to-status', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/workflows', [
            'name' => 'Waiting on us → task',
            'trigger' => Workflow::TRIGGER_TICKET_STATUS_CHANGED,
            'trigger_status' => Ticket::STATUS_WAITING_ON_US,
            'action' => Workflow::ACTION_CREATE_TASK,
            'subject' => 'Reply to {{ticket}}',
        ])
        ->assertRedirect('/crm/workflows');

    expect(Workflow::query()->where('name', 'Waiting on us → task')->first())
        ->not->toBeNull()
        ->trigger->toBe(Workflow::TRIGGER_TICKET_STATUS_CHANGED)
        ->trigger_status->toBe(Ticket::STATUS_WAITING_ON_US)
        ->action->toBe(Workflow::ACTION_CREATE_TASK);

    $this->actingAs($user)
        ->get('/crm/workflows')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/workflows/index')
            ->where('workflows.0.trigger', Workflow::TRIGGER_TICKET_STATUS_CHANGED)
            ->where('workflows.0.trigger_status', Ticket::STATUS_WAITING_ON_US)
            ->where('workflows.0.trigger_status_label', 'Waiting on us')
        );
});

it('attaches the ticket contact and deal onto the created task', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinique Hydra',
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);
    r4Workflow($user, Workflow::TRIGGER_TICKET_CREATED);

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Install question',
            'contact_id' => $contact->id,
            'deal_id' => $deal->id,
        ])
        ->assertRedirect();

    $ticket = Ticket::query()->where('subject', 'Install question')->first();
    $task = Activity::query()->where('type', 'task')->where('contact_id', $contact->id)->first();

    expect($ticket->deal_id)->toBe($deal->id)
        ->and($task)->not->toBeNull()
        ->and($task->deal_id)->toBe($deal->id)
        ->and($task->contact_id)->toBe($contact->id);
});

it('schedules tickets:check-sla every minute next to workflow:run', function () {
    $names = collect(app(Schedule::class)->events())->map->description->all();

    expect($names)->toContain('tickets:check-sla')
        ->and($names)->toContain('workflow:run');
});
