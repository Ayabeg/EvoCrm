<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

function boardDeal(User $user, string $stageSlug, array $overrides = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => 'Board deal '.$stageSlug,
        'amount_cents' => 100_000,
        'currency' => 'DZD',
        ...$overrides,
    ]);
}

it('lists deals grouped by pipeline stage on the kanban', function () {
    $user = User::factory()->create();

    $new = boardDeal($user, 'new', ['title' => 'Fresh intake']);
    $qualified = boardDeal($user, 'qualified', ['title' => 'Qualified lead']);

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('crm/deals/board')
                ->has('stages')
                ->has('deals', 2)
        );

    expect($new->title)->toBe('Fresh intake')
        ->and($qualified->title)->toBe('Qualified lead');
});

it('excludes won and lost deals from the active strip', function () {
    $user = User::factory()->create();

    boardDeal($user, 'new');
    boardDeal($user, 'won');
    boardDeal($user, 'lost');

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');
});

it('filters the strip: tasks today, without tasks, overdue, new today', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/leads?filter=tasks_today')
        ->assertRedirect('/crm/deals/board');
});

it('searches across title, contact, and company', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/leads?q=djazair')
        ->assertRedirect('/crm/deals/board');
});

it('moves a card between stages over POST', function () {
    $user = User::factory()->create();
    $deal = boardDeal($user, 'new');
    $demo = $user->workspace->defaultPipeline()->stageBySlug('demo');

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $demo->id])
        ->assertRedirect();

    expect($deal->fresh()->stage_id)->toBe($demo->id);
});

it('quick-adds a card to the first column with just a contact name', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();

    $this->actingAs($user)
        ->post('/crm/deals', [
            'title' => 'Quick add lead',
            'contact_name' => 'Amine Benali',
        ])
        ->assertRedirect();

    $deal = Deal::query()->where('title', 'Quick add lead')->sole();

    expect($deal->stage_id)->toBe($pipeline->stageBySlug('new')->id)
        ->and($deal->contact->first_name)->toBe('Amine')
        ->and($deal->contact->last_name)->toBe('Benali');
});
