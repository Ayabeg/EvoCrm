<?php

use App\Models\Contact;
use App\Models\Ticket;
use App\Models\User;

it('records customer satisfaction on a closed ticket and exposes it on the record', function () {
    $user = User::factory()->create();
    $ticket = Ticket::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'status' => Ticket::STATUS_CLOSED,
        'resolved_at' => now(),
    ]);

    $this->actingAs($user)
        ->from("/crm/tickets/{$ticket->id}")
        ->post("/crm/tickets/{$ticket->id}/satisfaction", [
            'rating' => 5,
            'feedback' => 'Fast and helpful.',
        ])
        ->assertRedirect("/crm/tickets/{$ticket->id}");

    expect($ticket->fresh()->satisfaction_rating)->toBe(5)
        ->and($ticket->fresh()->satisfaction_feedback)->toBe('Fast and helpful.')
        ->and($ticket->fresh()->satisfaction_submitted_at)->not->toBeNull();

    $this->actingAs($user)
        ->get("/crm/tickets/{$ticket->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/show')
            ->where('ticket.satisfaction_rating', 5)
            ->where('ticket.satisfaction_feedback', 'Fast and helpful.')
        );
});

it('does not accept satisfaction before ticket closure', function () {
    $user = User::factory()->create();
    $ticket = Ticket::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
    ]);

    $this->actingAs($user)
        ->post("/crm/tickets/{$ticket->id}/satisfaction", ['rating' => 4])
        ->assertStatus(422);

    expect($ticket->fresh()->satisfaction_rating)->toBeNull();
});
