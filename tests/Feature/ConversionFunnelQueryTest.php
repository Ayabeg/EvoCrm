<?php

use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdCampaignStat;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\User;
use App\Services\Funnels\ConversionFunnelQuery;

it('returns funnel metrics with stage counts and source breakdown', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    $account = AdAccount::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Ads',
        'status' => 'demo',
    ]);

    $campaign = AdCampaign::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => $account->id,
        'name' => 'FB campaign',
        'status' => 'active',
    ]);

    AdCampaignStat::query()->create([
        'workspace_id' => $workspace->id,
        'ad_campaign_id' => $campaign->id,
        'date' => now()->toDateString(),
        'impressions' => 1000,
        'clicks' => 50,
        'spend_cents' => 200_000,
    ]);

    FunnelEvent::query()->create([
        'workspace_id' => $workspace->id,
        'conversion_funnel_id' => $workspace->conversionFunnels()->where('is_default', true)->first()->id,
        'event_type' => FunnelEvent::TYPE_VISIT,
        'source' => 'facebook',
        'ad_campaign_id' => $campaign->id,
        'occurred_at' => now(),
    ]);

    FunnelEvent::query()->create([
        'workspace_id' => $workspace->id,
        'conversion_funnel_id' => $workspace->conversionFunnels()->where('is_default', true)->first()->id,
        'event_type' => FunnelEvent::TYPE_VISIT,
        'source' => 'direct',
        'occurred_at' => now(),
    ]);

    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Order',
        'amount_cents' => 100_000,
        'currency' => 'DZD',
        'source' => 'facebook',
    ]);

    $report = app(ConversionFunnelQuery::class)->forFunnel($workspace, null, now()->subDay(), now());

    expect($report['stages'])->toHaveCount(4)
        ->and($report['kpis']['spend_cents'])->toBe(200_000)
        ->and($report['kpis']['visits'])->toBeGreaterThanOrEqual(2)
        ->and($report['sources'])->not->toBeEmpty();
});

it('attributes campaign spend, lead progression, and won revenue', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $funnel = $workspace->conversionFunnels()->where('is_default', true)->first();
    $account = AdAccount::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Ads',
        'status' => 'demo',
    ]);
    $campaign = AdCampaign::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => $account->id,
        'name' => 'Ramadan offer',
        'status' => 'active',
    ]);
    AdCampaignStat::query()->create([
        'workspace_id' => $workspace->id,
        'ad_campaign_id' => $campaign->id,
        'date' => now()->toDateString(),
        'spend_cents' => 50_000,
    ]);

    $lead = Lead::factory()->create([
        'workspace_id' => $workspace->id,
        'ad_campaign_id' => $campaign->id,
        'source' => 'facebook',
        'status' => 'qualified',
        'qualified_at' => now(),
    ]);
    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $lead->contact_id,
        'lead_id' => $lead->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('won')->id,
        'title' => 'Ramadan order',
        'amount_cents' => 250_000,
        'currency' => 'DZD',
    ]);

    foreach ([
        [
            'workspace_id' => $workspace->id,
            'conversion_funnel_id' => $funnel->id,
            'event_type' => FunnelEvent::TYPE_LEAD_QUALIFIED,
            'subject_type' => Lead::class,
            'subject_id' => $lead->id,
            'lead_id' => $lead->id,
            'ad_campaign_id' => $campaign->id,
            'source' => 'facebook',
            'occurred_at' => now(),
        ],
        [
            'workspace_id' => $workspace->id,
            'conversion_funnel_id' => $funnel->id,
            'event_type' => FunnelEvent::TYPE_DELIVERED,
            'subject_type' => Deal::class,
            'subject_id' => $deal->id,
            'deal_id' => $deal->id,
            'lead_id' => $lead->id,
            'ad_campaign_id' => $campaign->id,
            'source' => 'facebook',
            'occurred_at' => now(),
        ],
    ] as $event) {
        FunnelEvent::query()->create($event);
    }

    $report = app(ConversionFunnelQuery::class)->forFunnel($workspace, $funnel, now()->subDay(), now());
    $row = collect($report['campaigns'])->firstWhere('campaign_id', $campaign->id);

    expect($row)->not->toBeNull()
        ->and($row['campaign_name'])->toBe('Ramadan offer')
        ->and($row['spend_cents'])->toBe(50_000)
        ->and($row['visits'])->toBe(1)
        ->and($row['leads'])->toBe(1)
        ->and($row['qualified_leads'])->toBe(1)
        ->and($row['deals_created'])->toBe(1)
        ->and($row['won_deals'])->toBe(1)
        ->and($row['won_revenue_cents'])->toBe(250_000)
        ->and($row['cpl_cents'])->toBe(50_000)
        ->and($row['roas'])->toBe(5.0);
});

it('serves the funnel dashboard page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/reports/funnels')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/funnels/index')
            ->has('report.stages', 4)
            ->has('report.sources')
            ->has('funnels')
        );
});

it('serves funnel metrics as JSON', function () {
    $user = User::factory()->create();
    $funnel = $user->workspace->conversionFunnels()->where('is_default', true)->first();

    $this->actingAs($user)
        ->getJson("/api/funnels/{$funnel->id}")
        ->assertOk()
        ->assertJsonStructure([
            'funnel' => ['id', 'name', 'slug'],
            'stages',
            'kpis' => ['spend_cents', 'visits', 'orders', 'cpl_cents', 'conversion_rate'],
            'sources',
            'campaigns',
        ]);
});

it('provisions a default funnel when the dashboard is opened without one', function () {
    $user = User::factory()->create();
    $user->workspace->conversionFunnels()->delete();

    expect($user->workspace->conversionFunnels()->count())->toBe(0);

    $this->actingAs($user)
        ->get('/reports/funnels')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/funnels/index')
            ->has('report.stages', 4)
        );

    expect($user->workspace->fresh()->conversionFunnels()->where('is_default', true)->exists())->toBeTrue();
});
