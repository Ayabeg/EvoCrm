<?php

use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\Lead;
use App\Models\User;
use App\Services\Funnels\FunnelEventRecorder;
use Illuminate\Support\Facades\Schema;

it('records order_placed when a deal is created', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
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
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
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

it('bounds attribution and strips query strings from public visit metadata', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    $this->withHeader('Referer', 'https://example.test/landing?email=person@example.test')
        ->get('/track/'.$workspace->slug.'/visit.gif?'.http_build_query([
            'utm_source' => str_repeat('s', 140),
            'path' => '/lead?email=person@example.test',
        ]))
        ->assertOk();

    $event = FunnelEvent::query()
        ->forWorkspace($workspace)
        ->where('event_type', FunnelEvent::TYPE_VISIT)
        ->latest('id')
        ->firstOrFail();

    expect($event->utm_source)->toHaveLength(100)
        ->and($event->meta['referrer'])->toBe('https://example.test/landing')
        ->and($event->meta['path'])->toBe('/lead');
});

it('records a visit when an ad-attributed lead is created', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    $campaign = AdCampaign::query()->create([
        'workspace_id' => $workspace->id,
        'ad_account_id' => AdAccount::query()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Acct',
            'status' => 'demo',
        ])->id,
        'name' => 'Lead campaign',
        'status' => 'active',
    ]);

    Lead::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
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
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Dedupe deal',
        'amount_cents' => 10_000,
        'currency' => 'DZD',
    ]);

    $first = $recorder->recordDealStage($deal, FunnelEvent::TYPE_CONFIRMED);
    $second = $recorder->recordDealStage($deal, FunnelEvent::TYPE_CONFIRMED);

    expect($first)->not->toBeNull()
        ->and($second)->toBeNull()
        ->and(
            FunnelEvent::query()
                ->forWorkspace($workspace)
                ->where('event_type', FunnelEvent::TYPE_CONFIRMED)
                ->where('deal_id', $deal->id)
                ->count()
        )->toBe(1);
});

it('fails the funnel uniqueness migration before changing schema when historical duplicates exist', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $funnel = $workspace->conversionFunnels()->where('is_default', true)->firstOrFail();
    $identity = [
        'workspace_id' => $workspace->id,
        'conversion_funnel_id' => $funnel->id,
        'event_type' => FunnelEvent::TYPE_CONFIRMED,
        'subject_type' => Deal::class,
        'subject_id' => 987654,
    ];

    Schema::table('funnel_events', function ($table): void {
        $table->dropUnique('funnel_events_subject_event_unique');
    });

    FunnelEvent::query()->create(array_merge($identity, [
        'occurred_at' => now(),
    ]));
    FunnelEvent::query()->create(array_merge($identity, [
        'occurred_at' => now(),
    ]));

    $migration = include base_path('database/migrations/2026_10_22_190000_add_funnel_event_subject_unique.php');

    expect(fn () => $migration->up())
        ->toThrow(RuntimeException::class, 'duplicate subject-scoped funnel events exist');
});
