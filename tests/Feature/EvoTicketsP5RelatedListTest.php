<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Ticket;
use App\Models\User;

it('shows the Tickets card on the contact with open count, number, subject, and priority', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
    ]);
    $open = Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Refund on quote',
        'priority' => Ticket::PRIORITY_HIGH,
        'owner_id' => $user->id,
    ]);
    Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'subject' => 'Already shipped',
        'status' => Ticket::STATUS_CLOSED,
        'priority' => Ticket::PRIORITY_LOW,
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get("/crm/contacts/{$contact->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/show')
            ->where('associations.tickets.open_count', 1)
            ->has('associations.tickets.rows', 2)
            ->where('associations.tickets.rows.0.number', 'EVO-000002')
            ->where('associations.tickets.rows.1.number', $open->number)
            ->where('associations.tickets.rows.1.subject', 'Refund on quote')
            ->where('associations.tickets.rows.1.priority', 'high')
            ->where('associations.tickets.rows.1.priority_label', 'High')
            ->where('associations.tickets.rows.1.url', '/crm/tickets/'.$open->id)
        );
});

it('shows the Tickets card on the deal and links create with contact + deal', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Won kitchen',
        'currency' => 'DZD',
    ]);
    Ticket::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'deal_id' => $deal->id,
        'subject' => 'Warranty follow-up',
        'priority' => Ticket::PRIORITY_MEDIUM,
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->where('associations.tickets.open_count', 1)
            ->has('associations.tickets.rows', 1)
            ->where('associations.tickets.rows.0.subject', 'Warranty follow-up')
            ->where('associations.tickets.rows.0.priority_label', 'Medium')
        );

    $this->actingAs($user)
        ->get("/crm/tickets?create=1&contact_id={$contact->id}&deal_id={$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/tickets/index')
            ->where('createOpen', true)
            ->where('createDefaults.contact_id', $contact->id)
            ->where('createDefaults.deal_id', $deal->id)
        );

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Parts delayed',
            'contact_id' => $contact->id,
            'deal_id' => $deal->id,
            'priority' => 'high',
        ])
        ->assertRedirect('/crm/tickets');

    $created = Ticket::query()->where('subject', 'Parts delayed')->first();

    expect($created)->not->toBeNull()
        ->and($created->deal_id)->toBe($deal->id)
        ->and($created->contact_id)->toBe($contact->id);
});

it('404s a foreign deal_id on create and 422s a deal on another contact', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $foreignContact = Contact::factory()->create(['workspace_id' => $other->workspace_id]);
    $foreignPipeline = $other->workspace->defaultPipeline();
    $foreignDeal = Deal::query()->create([
        'workspace_id' => $other->workspace_id,
        'contact_id' => $foreignContact->id,
        'pipeline_id' => $foreignPipeline->id,
        'stage_id' => $foreignPipeline->stageBySlug('new')->id,
        'title' => 'Other workspace',
        'currency' => 'DZD',
    ]);
    $localPipeline = $user->workspace->defaultPipeline();
    $otherContact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $mismatch = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $otherContact->id,
        'pipeline_id' => $localPipeline->id,
        'stage_id' => $localPipeline->stageBySlug('new')->id,
        'title' => 'Wrong contact',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Should 404',
            'contact_id' => $contact->id,
            'deal_id' => $foreignDeal->id,
        ])
        ->assertNotFound();

    $this->actingAs($user)
        ->post('/crm/tickets', [
            'subject' => 'Should 422',
            'contact_id' => $contact->id,
            'deal_id' => $mismatch->id,
        ])
        ->assertStatus(422);
});

it('places Tickets with Deals and Company, not Cases or Help Desk', function () {
    $contact = file_get_contents(resource_path('js/pages/crm/contacts/show.tsx'));
    $deal = file_get_contents(resource_path('js/pages/crm/deals/show.tsx'));
    $card = file_get_contents(resource_path('js/components/crm/tickets-related-card.tsx'));

    expect($contact)->toContain('TicketsRelatedCard')
        ->and($contact)->toContain('title="Deals"')
        ->and($contact)->toContain('title="Company"')
        ->and($contact)->not->toContain('Cases')
        ->and($contact)->not->toContain('Help Desk')
        ->and($deal)->toContain('TicketsRelatedCard')
        ->and($deal)->not->toContain('Cases')
        ->and($deal)->not->toContain('Help Desk')
        ->and($card)->toContain('title="Tickets"')
        ->and($card)->toContain('open')
        ->and($card)->toContain('priority_label')
        ->and($card)->not->toContain('Copilot')
        ->and($card)->not->toContain('Unknown Contact');
});
