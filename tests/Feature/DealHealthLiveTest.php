<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealHealthSnapshot;
use App\Models\DealProbabilitySnapshot;
use App\Models\DealSuggestion;
use App\Models\User;
use App\Services\Evolution\EvolutionWebhookProcessor;
use App\Services\LeadOs\DealHealthScorer;

function liveHealthDeal(User $user, array $attributes = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    $deal = Deal::query()->create(array_merge([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create([
            'workspace_id' => $workspace->id,
            'phone' => '0555000111',
        ])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Live health deal',
        'amount_cents' => 1_200_000,
        'currency' => 'DZD',
    ], $attributes));

    $deal->forceFill([
        'created_at' => now()->subDays(30),
        'last_activity_at' => now()->subDays(21),
    ])->save();

    return $deal->fresh();
}

it('writes a deal health snapshot when the stage changes', function () {
    $user = User::factory()->create();
    $deal = liveHealthDeal($user);
    $pipeline = $user->workspace->defaultPipeline();

    expect(DealHealthSnapshot::query()->where('deal_id', $deal->id)->count())->toBe(0);

    $deal->moveTo($pipeline->stageBySlug('demo'), $user);

    $snapshot = DealHealthSnapshot::query()->where('deal_id', $deal->id)->latest('id')->first();

    expect($snapshot)->not->toBeNull()
        ->and($snapshot->graph_run_id)->toBeNull()
        ->and($snapshot->score)->toBeGreaterThanOrEqual(0)
        ->and($snapshot->band)->not->toBe('')
        ->and(DealSuggestion::query()
            ->where('deal_id', $deal->id)
            ->where('kind', DealSuggestion::KIND_NEXT_MOVE)
            ->where('status', DealSuggestion::STATUS_PENDING)
            ->count())->toBe(1);

    $deal->moveTo($pipeline->stageBySlug('won'), $user);

    expect(DealHealthSnapshot::query()->where('deal_id', $deal->id)->count())->toBe(1)
        ->and($deal->fresh()->closed_at)->not->toBeNull()
        ->and(DealSuggestion::query()
            ->where('deal_id', $deal->id)
            ->where('kind', DealSuggestion::KIND_NEXT_MOVE)
            ->where('status', DealSuggestion::STATUS_PENDING)
            ->count())->toBe(0)
        ->and(DealSuggestion::query()
            ->where('deal_id', $deal->id)
            ->where('kind', DealSuggestion::KIND_LOST_REASON)
            ->count())->toBe(0);
});

it('records an auditable probability snapshot when a deal changes stage', function () {
    $user = User::factory()->create();
    $deal = liveHealthDeal($user);
    $pipeline = $user->workspace->defaultPipeline();

    $deal->moveTo($pipeline->stageBySlug('demo'), $user);

    $snapshot = DealProbabilitySnapshot::query()
        ->where('deal_id', $deal->id)
        ->latest('id')
        ->first();

    expect($snapshot)->not->toBeNull()
        ->and($snapshot->stage_id)->toBe($pipeline->stageBySlug('demo')->id)
        ->and($snapshot->probability)->toBe(50)
        ->and($snapshot->amount_cents)->toBe($deal->amount_cents)
        ->and($snapshot->recorded_by)->toBe($user->id)
        ->and($snapshot->reason)->toBe('stage_change');
});

it('drafts a loss reason when a deal is marked lost', function () {
    $user = User::factory()->create();
    $deal = liveHealthDeal($user);
    $pipeline = $user->workspace->defaultPipeline();

    $deal->moveTo($pipeline->stageBySlug('lost'), $user);

    $row = DealSuggestion::query()
        ->where('deal_id', $deal->id)
        ->where('kind', DealSuggestion::KIND_LOST_REASON)
        ->latest('id')
        ->first();

    expect($row)->not->toBeNull()
        ->and($row->status)->toBe(DealSuggestion::STATUS_PENDING)
        ->and($row->body)->not->toBeEmpty()
        ->and(DealSuggestion::query()
            ->where('deal_id', $deal->id)
            ->where('kind', DealSuggestion::KIND_NEXT_MOVE)
            ->where('status', DealSuggestion::STATUS_PENDING)
            ->count())->toBe(0);

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('lostReason.id', $row->id)
            ->where('lostReason.kind', DealSuggestion::KIND_LOST_REASON)
            ->where('nextMove', null)
        );
});

it('does not draft a loss reason when the seller already wrote one', function () {
    $user = User::factory()->create();
    $deal = liveHealthDeal($user);
    $deal->forceFill(['lost_reason' => 'Budget / timing'])->save();

    $deal->moveTo($user->workspace->defaultPipeline()->stageBySlug('lost'), $user);

    expect(DealSuggestion::query()
        ->where('deal_id', $deal->id)
        ->where('kind', DealSuggestion::KIND_LOST_REASON)
        ->count())->toBe(0);
});

it('rescores open deals when inbound WhatsApp lands', function () {
    $user = User::factory()->create();
    $deal = liveHealthDeal($user);
    $contact = $deal->contact;
    $stalled = app(DealHealthScorer::class)->score($deal);

    expect($stalled['band'])->toBe(DealHealthSnapshot::BAND_STALLED);

    app(EvolutionWebhookProcessor::class)->handle($user->workspace, [
        'event' => 'MESSAGES_UPSERT',
        'instance' => 'evosales',
        'data' => [
            'key' => [
                'remoteJid' => '213555000111@s.whatsapp.net',
                'fromMe' => false,
                'id' => 'wamid.HEALTH',
            ],
            'pushName' => $contact->first_name,
            'message' => ['conversation' => 'On est là demain'],
        ],
    ]);

    $deal->refresh();
    $live = DealHealthSnapshot::query()->where('deal_id', $deal->id)->latest('id')->first();

    $move = DealSuggestion::query()
        ->where('deal_id', $deal->id)
        ->where('kind', DealSuggestion::KIND_NEXT_MOVE)
        ->where('status', DealSuggestion::STATUS_PENDING)
        ->latest('id')
        ->first();
    $after = DealSuggestion::query()
        ->where('deal_id', $deal->id)
        ->where('kind', DealSuggestion::KIND_AFTER_TOUCH)
        ->where('status', DealSuggestion::STATUS_PENDING)
        ->latest('id')
        ->first();

    expect($deal->last_activity_at?->gt(now()->subMinute()))->toBeTrue()
        ->and($live)->not->toBeNull()
        ->and($live->score)->toBeGreaterThan($stalled['score'])
        ->and($live->band)->not->toBe(DealHealthSnapshot::BAND_STALLED)
        ->and($live->graph_run_id)->toBeNull()
        ->and($move)->not->toBeNull()
        ->and($move->payload['auto_send'] ?? null)->toBeFalse()
        ->and($after)->not->toBeNull()
        ->and(data_get($after->payload, 'auto_advance'))->toBeFalse()
        ->and(data_get($after->payload, 'source_activity_type'))->toBe('whatsapp');

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('afterTouch.id', $after->id)
            ->where('afterTouch.kind', DealSuggestion::KIND_AFTER_TOUCH)
        );
});

it('does not rescore on outbound WhatsApp', function () {
    $user = User::factory()->create();
    $deal = liveHealthDeal($user);

    app(EvolutionWebhookProcessor::class)->handle($user->workspace, [
        'event' => 'MESSAGES_UPSERT',
        'instance' => 'evosales',
        'data' => [
            'key' => [
                'remoteJid' => '213555000111@s.whatsapp.net',
                'fromMe' => true,
                'id' => 'wamid.OUT',
            ],
            'pushName' => 'Rep',
            'message' => ['conversation' => 'Je vous rappelle'],
        ],
    ]);

    expect(DealHealthSnapshot::query()->where('deal_id', $deal->id)->count())->toBe(0)
        ->and(DealSuggestion::query()->where('deal_id', $deal->id)->count())->toBe(0)
        ->and(Activity::query()->where('deal_id', $deal->id)->where('type', 'whatsapp')->count())->toBe(0)
        ->and($deal->fresh()->last_activity_at?->lt(now()->subDays(7)))->toBeTrue();
});

it('does not rescore a foreign contact deal on inbound WhatsApp', function () {
    $user = User::factory()->create();
    $mine = liveHealthDeal($user);
    $other = liveHealthDeal($user, [
        'contact_id' => Contact::factory()->create([
            'workspace_id' => $user->workspace_id,
            'phone' => '0666000222',
        ])->id,
    ]);

    app(EvolutionWebhookProcessor::class)->handle($user->workspace, [
        'event' => 'MESSAGES_UPSERT',
        'instance' => 'evosales',
        'data' => [
            'key' => [
                'remoteJid' => '213555000111@s.whatsapp.net',
                'fromMe' => false,
                'id' => 'wamid.MINE',
            ],
            'pushName' => 'Khaled',
            'message' => ['conversation' => 'Salam'],
        ],
    ]);

    expect(DealHealthSnapshot::query()->where('deal_id', $mine->id)->count())->toBe(1)
        ->and(DealHealthSnapshot::query()->where('deal_id', $other->id)->count())->toBe(0)
        ->and(DealSuggestion::query()->where('deal_id', $mine->id)->where('kind', DealSuggestion::KIND_NEXT_MOVE)->count())->toBe(1)
        ->and(DealSuggestion::query()->where('deal_id', $other->id)->count())->toBe(0)
        ->and(DealSuggestion::query()->where('deal_id', $mine->id)->where('kind', DealSuggestion::KIND_AFTER_TOUCH)->count())->toBe(1);
});
