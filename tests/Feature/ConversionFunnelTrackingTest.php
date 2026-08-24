<?php

use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\User;
use App\Services\Funnels\FunnelEventRecorder;

it('records order_placed when a deal is created', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => \App\Models\Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Test order',
        'amount_cents' => 50_000,
        'currency' => 'DZD',
        'source' => 'facebook',
    ]);

    expect(
        FunnelEvent::query()
            ->forWorkspace($workspace)
            ->where('event_type', FunnelEvent::TYPE_ORDER_PLACED)
            ->count()
    )->toBe(1);
});

it('records confirmed and delivered on deal stage moves', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => \App\Models\Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('demo')->id,
        'title' => 'Stage funnel deal',
        'amount_cents' => 50_000,
        'currency' => 'DZD',
    ]);

    $deal->update(['stage_id' => $pipeline->stageBySlug('proposal')->id]);

    expect(
        FunnelEvent::query()
            ->forWorkspace($workspace)
            ->where('event_type', FunnelEvent::TYPE_CONFIRMED)
            ->where('deal_id', $deal->id)
            ->exists()
    )->toBeTrue();

    $deal->update(['stage_id' => $pipeline->stageBySlug('won')->id]);

    expect(
        FunnelEvent::query()
            ->forWorkspace($workspace)
            ->where('event_type', FunnelEvent::TYPE_DELIVERED)
            ->where('deal_id', $deal->id)
            ->exists()
    )->toBeTrue();
});

it('records a visit from the public tracking pixel', function () {
    $user = User::factory()->create();
    $slug = $user->workspace->slug;

    $this->get("/track/{$slug}/visit.gif?utm_source=facebook&utm_campaign=spring")
        ->assertOk()
        ->assertHeader('Content-Type', 'image/gif');

    expect(
        FunnelEvent::query()
            ->forWorkspace($user->workspace)
            ->where('event_type', FunnelEvent::TYPE_VISIT)
            ->where('source', 'facebook')
            ->exists()
    )->toBeTrue();
});

it('records a visit when an ad-attributed lead is created', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    $campaign = \App\Models\AdCampaign::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => \App\Models\AdAccount::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Acct',
            'status' => 'demo',
        ])->id,
        'name' => 'Lead campaign',
        'status' => 'active',
    ]);

    Lead::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => \App\Models\Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'ad_campaign_id' => $campaign->id,
        'title' => 'Meta lead',
        'status' => 'new',
        'source' => 'facebook',
    ]);

    expect(
        FunnelEvent::query()
            ->forWorkspace($workspace)
            ->where('event_type', FunnelEvent::TYPE_VISIT)
            ->where('ad_campaign_id', $campaign->id)
            ->exists()
    )->toBeTrue();
});

it('dedupes funnel events for the same deal and event type', function () {
    $user = User::factory()->create();
    $recorder = app(FunnelEventRecorder::class);
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => \App\Models\Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Dedupe deal',
        'amount_cents' => 10_000,
        'currency' => 'DZD',
    ]);

    $recorder->recordDealCreated($deal);

    expect(
        FunnelEvent::query()
            ->forWorkspace($workspace)
            ->where('event_type', FunnelEvent::TYPE_ORDER_PLACED)
            ->where('deal_id', $deal->id)
            ->count()
    )->toBe(1);
});
