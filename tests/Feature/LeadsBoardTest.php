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

it('redirects legacy /leads to the CRM pipeline board', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/leads')
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
