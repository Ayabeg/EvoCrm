<?php

use App\Models\Contact;
use App\Models\Ticket;
use App\Models\User;
use App\Support\TicketSla;
use Illuminate\Support\Carbon;

it('adds 8 working hours for high and 24 otherwise, skipping 21:00–08:00 Africa/Algiers', function () {
    $ten = Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers');
    expect(TicketSla::dueAt(Ticket::PRIORITY_HIGH, $ten)->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-08 18:00');

    $sixteen = Carbon::parse('2026-09-08 16:00:00', 'Africa/Algiers');
    expect(TicketSla::dueAt(Ticket::PRIORITY_HIGH, $sixteen)->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-09 11:00');

    $late = Carbon::parse('2026-09-08 22:00:00', 'Africa/Algiers');
    expect(TicketSla::dueAt(Ticket::PRIORITY_HIGH, $late)->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-09 16:00');

    $dawn = Carbon::parse('2026-09-08 07:00:00', 'Africa/Algiers');
    expect(TicketSla::dueAt(Ticket::PRIORITY_HIGH, $dawn)->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-08 16:00');

    $eight = Carbon::parse('2026-09-08 08:00:00', 'Africa/Algiers');
    expect(TicketSla::dueAt(Ticket::PRIORITY_MEDIUM, $eight)->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-09 19:00');
});

it('stamps sla_due_at on create and shows remaining on list, board, and record', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $high = Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Door off hinge',
        'priority' => Ticket::PRIORITY_HIGH,
        'owner_id' => $user->id,
    ]);

    expect($high->sla_due_at)->not->toBeNull()
        ->and($high->sla_due_at->timezone('Africa/Algiers')->format('Y-m-d H:i'))->toBe('2026-09-08 18:00')
        ->and(TicketSla::label($high))->toBe('8h left');

    $this->actingAs($user)
        ->get('/crm/tickets')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tickets.0.sla_label', '8h left')
            ->where('tickets.0.sla_breached', false)
        );

    $this->actingAs($user)
        ->get('/crm/tickets/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tickets.0.sla_label', '8h left')
            ->where('tickets.0.inactive_days', 0)
            ->where('tickets.0.is_inactive', false)
        );

    $this->actingAs($user)
        ->get("/crm/tickets/{$high->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('ticket.sla_label', '8h left')
            ->where('ticket.sla_breached', false)
        );
});

it('marks board cards inactive after two Algiers days and SLA overdue after the due time', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $ticket = Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'subject' => 'Waiting on parts',
        'priority' => Ticket::PRIORITY_HIGH,
        'owner_id' => $user->id,
    ]);

    $this->travelTo(Carbon::parse('2026-09-11 11:00:00', 'Africa/Algiers'));

    $this->actingAs($user)
        ->get('/crm/tickets/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tickets.0.inactive_days', 3)
            ->where('tickets.0.is_inactive', true)
            ->where('tickets.0.sla_breached', true)
            ->where('tickets.0.sla_label', 'Overdue')
        );
});

it('resets the SLA clock on reopen and on unanswered priority change', function () {
    $this->travelTo(Carbon::parse('2026-09-08 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $ticket = Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'subject' => 'Warranty',
        'priority' => Ticket::PRIORITY_MEDIUM,
        'owner_id' => $user->id,
    ]);

    $firstDue = $ticket->sla_due_at->copy();
    $ticket->moveTo(Ticket::STATUS_CLOSED);

    $this->travelTo(Carbon::parse('2026-09-09 10:00:00', 'Africa/Algiers'));
    $ticket->moveTo(Ticket::STATUS_WAITING_ON_US);

    expect($ticket->fresh()->sla_due_at->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-10 21:00')
        ->and($ticket->fresh()->sla_due_at->eq($firstDue))->toBeFalse();

    $this->actingAs($user)
        ->put("/crm/tickets/{$ticket->id}", ['priority' => Ticket::PRIORITY_HIGH])
        ->assertRedirect();

    expect($ticket->fresh()->priority)->toBe(Ticket::PRIORITY_HIGH)
        ->and($ticket->fresh()->sla_due_at->timezone('Africa/Algiers')->format('Y-m-d H:i'))
        ->toBe('2026-09-09 18:00');
});

it('keeps the Help Desk inactivity line and Algiers SLA, not a second clock', function () {
    $board = file_get_contents(resource_path('js/pages/crm/tickets/board.tsx'));
    $show = file_get_contents(resource_path('js/pages/crm/tickets/show.tsx'));
    $sla = file_get_contents(app_path('Support/TicketSla.php'));

    expect($board)->toContain('Inactive for')
        ->and($board)->toContain('SLA {ticket.sla_label}')
        ->and($board)->not->toContain('Copilot')
        ->and($show)->toContain('label="SLA"')
        ->and($sla)->toContain('Africa/Algiers')
        ->and($sla)->toContain("WORK_START = '08:00'")
        ->and($sla)->toContain("WORK_END = '21:00'")
        ->and($sla)->toContain('HIGH_HOURS = 8')
        ->and($sla)->toContain('DEFAULT_HOURS = 24');
});
