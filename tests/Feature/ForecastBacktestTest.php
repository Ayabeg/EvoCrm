<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Ai\RecordInsight;

it('backtests last-open-stage predictions against closed deals within 15 percent', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $proposal = $pipeline->stageBySlug('proposal');
    $won = $pipeline->stageBySlug('won');
    $lost = $pipeline->stageBySlug('lost');

    foreach (range(1, 3) as $index) {
        $deal = Deal::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $proposal->id,
            'title' => "Won clinic {$index}",
            'amount_cents' => 1_000_000,
            'currency' => 'DZD',
        ]);
        $deal->load('stage');
        $deal->moveTo($won);
    }

    $lostDeal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $proposal->id,
        'title' => 'Lost clinic',
        'amount_cents' => 1_000_000,
        'currency' => 'DZD',
    ]);
    $lostDeal->load('stage');
    $lostDeal->moveTo($lost);

    $backtest = app(RecordInsight::class)->pipelineForecastBacktest($workspace, $pipeline);

    expect($backtest['sample_count'])->toBe(4)
        ->and($backtest['predicted_cents'])->toBe(3_000_000)
        ->and($backtest['actual_cents'])->toBe(3_000_000)
        ->and($backtest['error_pct'])->toBe(0.0)
        ->and($backtest['within_15'])->toBeTrue()
        ->and($backtest['status'])->toBe('within_15');
});

it('reports insufficient data when fewer than three deals have closed', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    $backtest = app(RecordInsight::class)->pipelineForecastBacktest($workspace, $pipeline);

    expect($backtest['status'])->toBe('insufficient_data')
        ->and($backtest['within_15'])->toBeFalse()
        ->and($backtest['sample_count'])->toBe(0);
});

it('passes the backtest onto the deals board', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $proposal = $pipeline->stageBySlug('proposal');
    $won = $pipeline->stageBySlug('won');

    foreach (range(1, 3) as $index) {
        $deal = Deal::query()->create([
            'workspace_id' => $user->workspace_id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $user->workspace_id])->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $proposal->id,
            'title' => "Board win {$index}",
            'amount_cents' => 2_000_000,
            'currency' => 'DZD',
        ]);
        $deal->load('stage');
        $deal->moveTo($won);
    }

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->where('forecastBacktest.status', 'outside_15')
            ->where('forecastBacktest.sample_count', 3)
            ->has('forecastBacktest.error_pct'));
});
