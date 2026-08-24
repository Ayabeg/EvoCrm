<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('opens the deals list with a create drawer and stays on the list after create', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $stage = $pipeline->stageBySlug('qualified');

    $this->actingAs($user)
        ->get('/crm/deals?create=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->where('createOpen', true)
            ->has('stageCounts')
            ->has('stages')
        );

    $this->actingAs($user)
        ->post('/crm/deals', [
            'title' => 'Drawer deal',
            'stage_id' => $stage->id,
            'amount_dzd' => 250000,
            'priority' => 'high',
            'type' => 'new_business',
        ])
        ->assertRedirect('/crm/deals');

    $deal = Deal::query()->where('title', 'Drawer deal')->first();

    expect($deal)->not->toBeNull()
        ->and($deal->currency)->toBe('DZD')
        ->and($deal->amount_cents)->toBe(25_000_000)
        ->and($deal->priority)->toBe('high')
        ->and($deal->type)->toBe('new_business')
        ->and($deal->stage_id)->toBe($stage->id);
});

it('renders the deal record as a dedicated show page', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Record deal',
        'amount_cents' => 100000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->where('deal.title', 'Record deal')
            ->has('associations')
            ->has('timeline')
            ->has('stages')
        );
});
