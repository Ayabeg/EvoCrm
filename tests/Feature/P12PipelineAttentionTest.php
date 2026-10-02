<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Crm\DealAttentionEvaluator;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * P12 — Pipeline attention & sales execution.
 * Deterministic overdue + no-next-action only. Stale / stage aging deferred.
 */

function p12DealFor(User $user, string $stageSlug, array $overrides = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => $overrides['title'] ?? 'P12 '.$stageSlug,
        'amount_cents' => $overrides['amount_cents'] ?? 1_000_000,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'next_activity_at' => $overrides['next_activity_at'] ?? null,
        'next_step' => $overrides['next_step'] ?? null,
    ]);
}

function p12Activity(Deal $deal, array $overrides = []): Activity
{
    return Activity::query()->create([
        'workspace_id' => $deal->workspace_id,
        'deal_id' => $deal->id,
        'contact_id' => $deal->contact_id,
        'type' => $overrides['type'] ?? 'task',
        'subject' => $overrides['subject'] ?? 'Follow up',
        'due_at' => $overrides['due_at'] ?? null,
        'done' => $overrides['done'] ?? false,
        'completed_at' => $overrides['completed_at'] ?? null,
        'owner_id' => $deal->owner_id,
    ]);
}

function p12Now(): Carbon
{
    return Carbon::parse('2026-09-16 12:00:00', DealAttentionEvaluator::TIMEZONE);
}

function p12Evaluate(Deal $deal): array
{
    $deal->loadMissing('stage');

    return app(DealAttentionEvaluator::class)->evaluate(
        $deal,
        $deal->activities()->where('done', false)->whereNotNull('due_at')->get(),
        p12Now(),
    );
}

beforeEach(function () {
    Carbon::setTestNow(p12Now());
});

afterEach(function () {
    Carbon::setTestNow();
});

it('locks P12 one evaluator two shipped signals and no invented engines', function () {
    $evaluator = File::get(app_path('Services/Crm/DealAttentionEvaluator.php'));
    $filter = File::get(app_path('Services/Crm/CrmFilter.php'));
    $controller = File::get(app_path('Http/Controllers/Crm/DealController.php'));
    $adapter = File::get(resource_path('js/lib/list-query/adapters.ts'));
    $keys = File::get(resource_path('js/lib/list-query/keys.ts'));
    $queue = File::get(resource_path('js/components/crm/deal-attention-queue.tsx'));
    $board = File::get(resource_path('js/pages/crm/deals/deal-pipeline-board.tsx'))
        .File::get(resource_path('js/evo/crm/pipeline/DealCard.tsx'));
    $columns = File::get(resource_path('js/pages/crm/deals/deal-columns.tsx'));
    $drawer = File::get(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));
    $url = File::get(resource_path('js/ds/workspace/quick-record/url.ts'));

    expect($evaluator)->toContain('class DealAttentionEvaluator')
        ->and($evaluator)->toContain('overdue_activity')
        ->and($evaluator)->toContain('no_next_action')
        ->and($evaluator)->toContain("TIMEZONE = 'Africa/Algiers'")
        ->and($evaluator)->not->toContain('BoardAttention')
        ->and($evaluator)->not->toContain('health score')
        ->and($evaluator)->not->toContain('OpenRouter');

    expect($filter)->toContain('applyDealAttention')
        ->and($controller)->toContain('attentionQueue')
        ->and($adapter)->toContain("'attention'")
        ->and($keys)->toContain("'attention'")
        ->and($keys)->toContain("'peek'");

    expect($queue)->toContain('openRecord')
        ->and($queue)->toContain('needs_attention')
        ->and($queue)->toContain('View all')
        ->and($queue)->not->toContain('/crm/deals/attention');

    expect($board)->toContain('data-attention')
        ->and($columns)->toContain('DealAttentionCell')
        ->and($drawer)->toContain('Needs attention')
        ->and($url)->toContain('P10 defers URL sync (decision B)');

    expect(file_exists(app_path('Services/Crm/BoardAttention.php')))->toBeFalse()
        ->and(file_exists(app_path('Services/Crm/AttentionQuery.php')))->toBeFalse();
});

it('evaluates overdue future no-next won and lost fixtures without inventing stale', function () {
    $user = User::factory()->create();

    $overdue = p12DealFor($user, 'qualified', ['title' => 'A overdue']);
    p12Activity($overdue, [
        'subject' => 'Call clinic',
        'due_at' => p12Now()->copy()->subDay(),
    ]);

    $future = p12DealFor($user, 'demo', ['title' => 'B future']);
    p12Activity($future, [
        'subject' => 'Demo prep',
        'due_at' => p12Now()->copy()->addDay(),
    ]);

    $noNext = p12DealFor($user, 'proposal', ['title' => 'C no next']);

    $won = p12DealFor($user, 'won', ['title' => 'D won']);
    $lost = p12DealFor($user, 'lost', ['title' => 'E lost']);

    $overdueEval = p12Evaluate($overdue);
    $futureEval = p12Evaluate($future);
    $noNextEval = p12Evaluate($noNext);
    $wonEval = p12Evaluate($won);
    $lostEval = p12Evaluate($lost);

    expect($overdueEval['primary']['type'])->toBe(DealAttentionEvaluator::TYPE_OVERDUE_ACTIVITY)
        ->and($overdueEval['primary']['severity'])->toBe('critical')
        ->and($overdueEval['primary']['reason'])->toContain('Call clinic')
        ->and(collect($overdueEval['signals'])->pluck('type'))->not->toContain('no_next_action');

    expect($futureEval['primary'])->toBeNull()
        ->and($futureEval['signals'])->toBe([]);

    expect($noNextEval['primary']['type'])->toBe(DealAttentionEvaluator::TYPE_NO_NEXT_ACTION)
        ->and($noNextEval['primary']['severity'])->toBe('warning');

    expect($wonEval['primary'])->toBeNull()
        ->and($lostEval['primary'])->toBeNull();

    expect(json_encode($overdueEval))->not->toContain('stale')
        ->and(json_encode($overdueEval))->not->toContain('stage_aging');
});

it('treats date boundaries completed and null due as not overdue', function () {
    $user = User::factory()->create();
    $deal = p12DealFor($user, 'qualified', ['title' => 'Boundary']);

    p12Activity($deal, [
        'subject' => 'Future hour',
        'due_at' => p12Now()->copy()->addHour(),
    ]);
    expect(p12Evaluate($deal->fresh())['primary'])->toBeNull();
    $deal->activities()->delete();

    p12Activity($deal, [
        'subject' => 'Exactly now',
        'due_at' => p12Now(),
    ]);
    expect(p12Evaluate($deal->fresh())['primary'])->toBeNull();
    $deal->activities()->delete();

    p12Activity($deal, [
        'subject' => 'Earlier today',
        'due_at' => p12Now()->copy()->setTime(9, 0),
    ]);
    expect(p12Evaluate($deal->fresh())['primary']['type'])->toBe('overdue_activity');
    $deal->activities()->delete();

    p12Activity($deal, [
        'subject' => 'Completed overdue',
        'due_at' => p12Now()->copy()->subDay(),
        'done' => true,
        'completed_at' => p12Now()->copy()->subHour(),
    ]);
    expect(p12Evaluate($deal->fresh())['primary']['type'])->toBe('no_next_action');
    $deal->activities()->delete();

    p12Activity($deal, [
        'subject' => 'No due',
        'due_at' => null,
    ]);
    expect(p12Evaluate($deal->fresh())['primary']['type'])->toBe('no_next_action');
});

it('does not treat deal next_step text as a scheduled next action', function () {
    $user = User::factory()->create();
    $deal = p12DealFor($user, 'qualified', [
        'title' => 'Text only',
        'next_step' => 'Call them Friday',
    ]);

    expect(p12Evaluate($deal)['primary']['type'])->toBe('no_next_action');
});

it('treats a future deal next_activity_at as a next action', function () {
    $user = User::factory()->create();
    $deal = p12DealFor($user, 'qualified', [
        'title' => 'Deal datetime',
        'next_activity_at' => p12Now()->copy()->addDays(2),
    ]);

    expect(p12Evaluate($deal)['primary'])->toBeNull();
});

it('composes attention filters with owner search and pipeline on list and board', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);

    $mineOverdue = p12DealFor($user, 'qualified', ['title' => 'Clinic overdue']);
    p12Activity($mineOverdue, ['due_at' => p12Now()->copy()->subDay(), 'subject' => 'Overdue call']);

    $mineNoNext = p12DealFor($user, 'demo', ['title' => 'Clinic quiet']);
    $theirs = p12DealFor($user, 'proposal', ['title' => 'Other overdue', 'owner_id' => $other->id]);
    p12Activity($theirs, ['due_at' => p12Now()->copy()->subDays(2), 'subject' => 'Their call']);

    $this->actingAs($user)
        ->get('/crm/deals?attention=overdue&owner='.$user->id.'&q=Clinic')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->where('activeFilters.attention', 'overdue')
            ->where('activeFilters.owner', (string) $user->id)
            ->where('activeFilters.q', 'Clinic')
            ->has('deals', 1)
            ->where('deals.0.id', $mineOverdue->id)
            ->where('deals.0.attention.primary.type', 'overdue_activity')
        );

    $this->actingAs($user)
        ->get('/crm/deals?attention=no_next_action')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('deals', 1)
            ->where('deals.0.id', $mineNoNext->id)
            ->where('deals.0.attention.primary.type', 'no_next_action')
        );

    $this->actingAs($user)
        ->get('/crm/deals?attention=needs_attention&owner='.$user->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('deals', 2)
        );

    $this->actingAs($user)
        ->get('/crm/deals/board?attention=overdue&q=Clinic&owner='.$user->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->where('activeFilters.attention', 'overdue')
            ->has('deals', 1)
            ->where('deals.0.id', $mineOverdue->id)
            ->where('deals.0.attention.primary.type', 'overdue_activity')
            ->where('deals.0.amount_cents', 1_000_000)
        );
});

it('builds a compact urgency queue and keeps view-all on the canonical attention param', function () {
    $user = User::factory()->create();
    $older = p12DealFor($user, 'new', ['title' => 'Older overdue']);
    p12Activity($older, ['due_at' => p12Now()->copy()->subDays(5), 'subject' => 'Old call']);
    $newer = p12DealFor($user, 'qualified', ['title' => 'Newer overdue']);
    p12Activity($newer, ['due_at' => p12Now()->copy()->subDay(), 'subject' => 'New call']);
    $quiet = p12DealFor($user, 'demo', ['title' => 'Quiet']);
    $healthy = p12DealFor($user, 'proposal', ['title' => 'Healthy']);
    p12Activity($healthy, ['due_at' => p12Now()->copy()->addDay()]);
    p12DealFor($user, 'won', ['title' => 'Closed won']);

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('attentionQueue', 3)
            ->where('attentionQueue.0.id', $older->id)
            ->where('attentionQueue.0.primary.type', 'overdue_activity')
            ->where('attentionQueue.1.id', $newer->id)
            ->where('attentionQueue.2.id', $quiet->id)
            ->where('attentionQueue.2.primary.type', 'no_next_action')
        );

    $queue = File::get(resource_path('js/components/crm/deal-attention-queue.tsx'));
    expect($queue)->toContain("attention: 'needs_attention'")
        ->and($queue)->not->toContain('/crm/deals/attention');
});

it('does not N+1 activities when presenting a deals list page', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $i) {
        $deal = p12DealFor($user, 'qualified', ['title' => "Deal {$i}"]);
        p12Activity($deal, ['due_at' => p12Now()->copy()->subDays($i), 'subject' => "Task {$i}"]);
    }

    DB::flushQueryLog();
    DB::enableQueryLog();

    $this->actingAs($user)->get('/crm/deals')->assertOk();

    $perDealActivity = collect(DB::getQueryLog())->filter(function (array $query): bool {
        $sql = strtolower($query['query']);
        $fromActivities = str_contains($sql, 'from "activities"') || str_contains($sql, 'from `activities`');
        $singleDeal = (bool) preg_match('/["`]?deal_id["`]?\s*=\s*\?/', $sql);
        $batched = str_contains($sql, ' in (');

        return $fromActivities && $singleDeal && ! $batched;
    });

    expect($perDealActivity->count())->toBe(0);
});

it('resolves overdue by completing the activity and no-next by scheduling one', function () {
    $user = User::factory()->create();
    $deal = p12DealFor($user, 'qualified', ['title' => 'Resolvable']);
    $activity = p12Activity($deal, [
        'due_at' => p12Now()->copy()->subDay(),
        'subject' => 'Overdue task',
    ]);

    $this->actingAs($user)
        ->get('/crm/deals?attention=overdue')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 1)->where('deals.0.id', $deal->id));

    $activity->markDone();

    $this->actingAs($user)
        ->get('/crm/deals?attention=overdue')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 0));

    $this->actingAs($user)
        ->get('/crm/deals?attention=no_next_action')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 1)->where('deals.0.id', $deal->id));

    p12Activity($deal, [
        'due_at' => p12Now()->copy()->addDay(),
        'subject' => 'Next call',
    ]);

    $this->actingAs($user)
        ->get('/crm/deals?attention=needs_attention')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 0));
});

it('re-evaluates attention after a move to Won and keeps forecast math frozen', function () {
    $user = User::factory()->create();
    $deal = p12DealFor($user, 'qualified', ['title' => 'Close me', 'amount_cents' => 10_000_000]);
    $won = $user->workspace->defaultPipeline()->stageBySlug('won');

    $this->actingAs($user)
        ->get('/crm/deals?attention=no_next_action')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 1));

    $this->actingAs($user)
        ->from('/crm/deals/board?attention=needs_attention')
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $won->id])
        ->assertRedirect('/crm/deals/board?attention=needs_attention');

    expect($deal->fresh()->stage->slug)->toBe('won');

    $this->actingAs($user)
        ->get('/crm/deals?attention=no_next_action')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 0));

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('forecast.amount_cents', 10_000_000)
            ->where('deals.0.amount_cents', 10_000_000)
        );
});

it('surfaces full signals on peek without leaking activity body and keeps peek out of the URL', function () {
    $user = User::factory()->create();
    $deal = p12DealFor($user, 'qualified', ['title' => 'Peek overdue']);
    p12Activity($deal, [
        'subject' => 'Secret call',
        'due_at' => p12Now()->copy()->subDay(),
        'type' => 'task',
    ]);

    $this->actingAs($user)
        ->getJson("/crm/records/deal/{$deal->id}/peek")
        ->assertOk()
        ->assertJsonPath('attention.primary.type', 'overdue_activity')
        ->assertJsonPath('attention.signals.0.label', 'Overdue activity')
        ->assertJsonMissingPath('attention.signals.0.body');

    $keys = File::get(resource_path('js/lib/list-query/keys.ts'));
    expect($keys)->toContain("'peek'");
});

it('keeps leads redirect and does not invent an attention route', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/index'));

    $this->actingAs($user)
        ->get('/crm/deals/attention')
        ->assertNotFound();
});
