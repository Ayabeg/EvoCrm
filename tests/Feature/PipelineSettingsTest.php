<?php

use App\Models\Pipeline;
use App\Models\User;

it('scopes the deals list hub to the selected pipeline', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $sales = $workspace->defaultPipeline();

    $enterprise = Pipeline::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Enterprise',
        'is_default' => false,
    ]);

    foreach (config('evosales.pipeline') as $stage) {
        $enterprise->stages()->create([
            'workspace_id' => $workspace->id,
            'name' => $stage['name'],
            'slug' => $stage['slug'],
            'position' => $stage['position'],
            'is_won' => $stage['is_won'],
            'is_lost' => $stage['is_lost'],
            'probability' => $stage['probability'] ?? null,
        ]);
    }

    $salesDeal = boardDealFor($user, 'new', 3_000_000, [
        'title' => 'Sales list card',
        'pipeline' => $sales,
    ]);
    boardDealFor($user, 'proposal', 12_000_000, [
        'title' => 'Enterprise list card',
        'pipeline' => $enterprise,
    ]);

    $this->actingAs($user)
        ->get('/crm/deals?pipeline='.$enterprise->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->where('pipeline.id', $enterprise->id)
            ->has('deals', 1)
            ->where('deals.0.title', 'Enterprise list card')
            ->has('forecast')
            ->where('forecast.amount_cents', 12_000_000)
        );

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertInertia(fn ($page) => $page
            ->where('pipeline.id', $sales->id)
            ->has('deals', 1)
            ->where('deals.0.id', $salesDeal->id)
        );
});

it('lets admins create and manage pipelines from settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/pipelines')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/pipelines')
            ->has('pipelines', 1)
        );

    $this->actingAs($user)
        ->post('/settings/pipelines', [
            'name' => 'Renewals',
        ])
        ->assertRedirect();

    $pipeline = Pipeline::query()->where('name', 'Renewals')->first();

    expect($pipeline)->not->toBeNull()
        ->and($pipeline->stages()->count())->toBe(6);

    $this->actingAs($user)
        ->patch("/settings/pipelines/{$pipeline->id}", [
            'is_default' => true,
        ])
        ->assertRedirect();

    expect($pipeline->fresh()->is_default)->toBeTrue()
        ->and($user->workspace->defaultPipeline()->id)->toBe($pipeline->id);
});
