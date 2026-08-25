<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

it('shows deal health factors and a next action on the record page', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Healthy clinic deal',
        'amount_cents' => 2_000_000,
        'currency' => 'DZD',
        'last_activity_at' => now()->subDays(2),
    ]);

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->where('dealHealth.label', 'Healthy')
            ->where('dealHealth.score', 86)
            ->has('dealHealth.factors', 3)
            ->where('dealHealth.next_action', fn ($action) => is_string($action) && $action !== '')
        );
});

it('keeps an honest low-data health state when amount and activity are missing', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Empty deal',
        'amount_cents' => 0,
        'currency' => 'DZD',
        'last_activity_at' => null,
    ]);

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('dealHealth.label', 'Low data')
            ->where('dealHealth.reason', fn ($reason) => str_contains($reason, 'no activity yet')
                && str_contains($reason, 'amount missing'))
            ->where('dealHealth.next_action', fn ($action) => str_contains($action, 'incomplete'))
        );
});

it('passes a computed forecast band to the deals board', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('qualified')->id,
        'title' => 'Board forecast deal',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->has('forecastBand.weighted_cents')
            ->has('forecastBand.low_cents')
            ->has('forecastBand.high_cents')
            ->has('forecastBand.band_label')
        );
});
