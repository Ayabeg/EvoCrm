<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\User;
use App\Services\Crm\DealBoardForecast;

function boardDealFor(User $user, string $stageSlug, int $amountCents, array $overrides = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $overrides['pipeline'] ?? $workspace->defaultPipeline();
    unset($overrides['pipeline']);
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => $overrides['title'] ?? 'Board '.$stageSlug,
        'amount_cents' => $amountCents,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
    ]);
}

it('renders the deals board next to the list hub with existing stage names', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/hub'));

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->has('stages', 6)
            ->where('stages.0.name', 'New')
            ->where('stages.0.slug', 'new')
            ->where('stages.0.probability', 10)
            ->where('stages.1.name', 'Qualified')
            ->where('stages.1.probability', 25)
            ->where('stages.2.name', 'Demo')
            ->where('stages.2.probability', 50)
            ->where('stages.3.name', 'Proposal')
            ->where('stages.3.probability', 75)
            ->where('stages.4.name', 'Won')
            ->where('stages.4.probability', 100)
            ->where('stages.5.name', 'Lost')
            ->where('stages.5.slug', 'lost')
            ->where('stages.5.probability', 0)
            ->has('pipelines', 1)
            ->missing('pipelines.1')
        );
});

it('moves a deal between board stages and persists the change', function () {
    $user = User::factory()->create();
    $deal = boardDealFor($user, 'new', 1_000_000, ['title' => 'Move me']);
    $demo = $user->workspace->defaultPipeline()->stageBySlug('demo');

    $this->actingAs($user)
        ->from('/crm/deals/board')
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $demo->id])
        ->assertRedirect('/crm/deals/board');

    expect($deal->fresh()->stage_id)->toBe($demo->id)
        ->and($deal->fresh()->stage->slug)->toBe('demo');

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertInertia(fn ($page) => $page
            ->where('deals.0.id', $deal->id)
            ->where('deals.0.stage_id', $demo->id)
            ->where('stages.2.slug', 'demo')
            ->where('stages.2.count', 1)
        );
});

it('computes column count, DZD totals, and weighted forecast from stage probabilities', function () {
    $user = User::factory()->create();

    // New 10%: 100_000 DZD = 10_000_000 cents → weighted 1_000_000
    boardDealFor($user, 'new', 10_000_000, ['title' => 'Intake A']);
    boardDealFor($user, 'new', 5_000_000, ['title' => 'Intake B']);
    // Qualified 25%: 200_000 DZD = 20_000_000 cents → weighted 5_000_000
    boardDealFor($user, 'qualified', 20_000_000, ['title' => 'Qualified clinic']);
    // Lost 0%
    boardDealFor($user, 'lost', 8_000_000, ['title' => 'Dead']);

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stages.0.slug', 'new')
            ->where('stages.0.count', 2)
            ->where('stages.0.amount_cents', 15_000_000)
            ->where('stages.0.weighted_cents', 1_500_000)
            ->where('stages.1.slug', 'qualified')
            ->where('stages.1.count', 1)
            ->where('stages.1.amount_cents', 20_000_000)
            ->where('stages.1.weighted_cents', 5_000_000)
            ->where('stages.5.slug', 'lost')
            ->where('stages.5.count', 1)
            ->where('stages.5.amount_cents', 8_000_000)
            ->where('stages.5.weighted_cents', 0)
            ->where('forecast.count', 4)
            ->where('forecast.amount_cents', 43_000_000)
            ->where('forecast.weighted_cents', 6_500_000)
        );
});

it('uses a stored stage probability when present and defaults when missing', function () {
    $new = new Stage(['slug' => 'new', 'is_won' => false, 'is_lost' => false]);
    $custom = new Stage(['slug' => 'new', 'is_won' => false, 'is_lost' => false, 'probability' => 40]);
    $unknown = new Stage(['slug' => 'discovery', 'is_won' => false, 'is_lost' => false]);

    expect(DealBoardForecast::probabilityFor($new))->toBe(10)
        ->and(DealBoardForecast::probabilityFor($custom))->toBe(40)
        ->and(DealBoardForecast::probabilityFor($unknown))->toBe(20)
        ->and(DealBoardForecast::weightedCents(10_000_000, 10))->toBe(1_000_000);
});

it('shows a pipeline picker and scopes the board when multiple pipelines exist', function () {
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
        'title' => 'Sales card',
        'pipeline' => $sales,
    ]);
    $enterpriseDeal = boardDealFor($user, 'proposal', 12_000_000, [
        'title' => 'Enterprise card',
        'pipeline' => $enterprise,
    ]);

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->has('pipelines', 2)
            ->where('pipeline.id', $sales->id)
            ->where('pipeline.name', 'Sales')
            ->has('deals', 1)
            ->where('deals.0.id', $salesDeal->id)
            ->where('forecast.count', 1)
            ->where('forecast.amount_cents', 3_000_000)
            ->where('forecast.weighted_cents', 300_000)
        );

    $this->actingAs($user)
        ->get('/crm/deals/board?pipeline='.$enterprise->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pipeline.id', $enterprise->id)
            ->where('pipeline.name', 'Enterprise')
            ->has('deals', 1)
            ->where('deals.0.id', $enterpriseDeal->id)
            ->where('stages.3.slug', 'proposal')
            ->where('stages.3.count', 1)
            ->where('stages.3.amount_cents', 12_000_000)
            ->where('stages.3.weighted_cents', 9_000_000)
            ->where('forecast.weighted_cents', 9_000_000)
        );
});
