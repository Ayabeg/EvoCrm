<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('paginates the deals list at 25 per page', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $stage = $pipeline->stageBySlug('new');

    foreach (range(1, 26) as $i) {
        Deal::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'title' => 'Deal '.$i,
            'currency' => 'DZD',
        ]);
    }

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals', 25)
            ->where('paginator.page', 1)
            ->where('paginator.per_page', 25)
            ->where('paginator.total', 26)
            ->where('paginator.last_page', 2));

    $this->actingAs($user)
        ->get('/crm/deals?page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('deals', 1)
            ->where('paginator.page', 2));
});

it('filters the deals list by search query', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $stage = $pipeline->stageBySlug('new');

    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $stage->id,
        'title' => 'Landing page project',
        'currency' => 'DZD',
    ]);
    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $stage->id,
        'title' => 'Other deal',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/deals?q=Landing')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('deals', 1)
            ->where('deals.0.title', 'Landing page project')
            ->where('activeFilters.q', 'Landing'));
});
