<?php

use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Crm\DealAttentionEvaluator;
use App\Services\Home\HomeDashboardBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

function p17Now(): Carbon
{
    return Carbon::parse('2026-09-16 12:00:00', DealAttentionEvaluator::TIMEZONE);
}

function p17DealFor(User $user, string $stageSlug, array $overrides = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = $overrides['contact'] ?? Contact::factory()->create([
        'workspace_id' => $workspace->id,
        'first_name' => $overrides['contact_first'] ?? 'Amine',
        'last_name' => $overrides['contact_last'] ?? 'Benali',
    ]);

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $overrides['pipeline_id'] ?? $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => $overrides['title'] ?? 'P17 '.$stageSlug,
        'amount_cents' => $overrides['amount_cents'] ?? 2_400_000,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'closed_at' => $overrides['closed_at'] ?? null,
        'next_activity_at' => $overrides['next_activity_at'] ?? null,
    ]);
}

function p17Activity(User $user, array $overrides = []): Activity
{
    $activity = Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => $overrides['type'] ?? 'task',
        'subject' => $overrides['subject'] ?? 'Follow up',
        'body' => $overrides['body'] ?? 'Internal note that must not leak',
        'due_at' => $overrides['due_at'] ?? null,
        'done' => $overrides['done'] ?? false,
        'completed_at' => $overrides['completed_at'] ?? null,
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'actor_id' => $overrides['actor_id'] ?? $user->id,
        'contact_id' => $overrides['contact_id'] ?? null,
        'deal_id' => $overrides['deal_id'] ?? null,
    ]);

    if (isset($overrides['created_at']) || isset($overrides['updated_at'])) {
        $activity->timestamps = false;
        $activity->forceFill([
            'created_at' => $overrides['created_at'] ?? $activity->created_at,
            'updated_at' => $overrides['updated_at'] ?? $activity->updated_at,
        ])->save();
    }

    return $activity->fresh();
}

beforeEach(function () {
    Carbon::setTestNow(p17Now());
});

afterEach(function () {
    Carbon::setTestNow();
});

it('locks one operating home and consumes P11 P12 P15 without a V2', function () {
    $home = File::get(resource_path('js/pages/home.tsx'));
    $builder = File::get(app_path('Services/Home/HomeDashboardBuilder.php'));
    $controller = File::get(app_path('Http/Controllers/HomeController.php'));
    $header = File::get(resource_path('js/components/dashboard/dashboard-header.tsx'));
    $attention = File::get(resource_path('js/components/dashboard/dashboard-attention.tsx'));
    $work = File::get(resource_path('js/components/dashboard/dashboard-work.tsx'));
    $lib = File::get(resource_path('js/lib/dashboard-operating-home.ts'));
    $queue = File::get(app_path('Services/Crm/ActivityWorkQueueQuery.php'));
    $evaluator = File::get(app_path('Services/Crm/DealAttentionEvaluator.php'));

    expect(class_exists('App\\Http\\Controllers\\DashboardV2Controller'))->toBeFalse()
        ->and($home)->not->toContain('DashboardV2')
        ->and($home)->not->toContain('HomeV2')
        ->and($home)->not->toContain('SalesDashboardNew')
        ->and($home)->not->toContain('OperatingDashboard')
        ->and($home)->not->toContain('DashboardDealDrawer')
        ->and($home)->not->toContain('DealPipelineBoard')
        ->and($home)->not->toContain('Date.now')
        ->and($home)->toContain('Needs attention')
        ->and($home)->toContain("t('Today')")
        ->and($home)->toContain('HomeKpiStrip')
        ->and($home)->toContain('Pipeline')
        ->and($home)->toContain('Recent records')
        ->and($home)->toContain('overflow-x-hidden')
        ->and($builder)->toContain('DealAttentionEvaluator')
        ->and($builder)->toContain('dashboardWork')
        ->and($builder)->not->toContain("latest('updated_at')")
        ->and($builder)->not->toContain('QuotaTracker')
        ->and($controller)->toContain('HomeDashboardBuilder')
        ->and($controller)->not->toContain('QuotaTracker')
        ->and($controller)->not->toContain('GraphRunner')
        ->and($header)->toContain('create=1')
        ->and($header)->not->toContain('owner_id')
        ->and($attention)->toContain('openRecord')
        ->and($work)->not->toContain('Date.now')
        ->and($work)->not->toContain('/complete')
        ->and($lib)->toContain('activityQueueHref')
        ->and($lib)->toContain('Africa/Algiers')
        ->and($queue)->toContain('function dashboardWork')
        ->and($evaluator)->toContain('class DealAttentionEvaluator');

    expect(strpos($home, "title={t('Needs attention')}"))->toBeLessThan(strpos($home, '<HomeKpiStrip'))
        ->and(strpos($home, "title={t('Today')}"))->toBeLessThan(strpos($home, '<HomeKpiStrip'))
        ->and(strpos($home, '<HomeKpiStrip'))->toBeLessThan(strpos($home, "title={t('Pipeline')}"));
});

it('serves a bounded operating payload without quota reports or updated_at events', function () {
    $user = User::factory()->create(['name' => 'Amine Benali']);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('context')
            ->where('context.name', 'Amine')
            ->where('context.date', 'Wednesday, 16 September 2026')
            ->where('context.timezone', 'Africa/Algiers')
            ->has('metrics.window')
            ->where('metrics.window.from', '2026-09-01')
            ->where('metrics.window.to', '2026-09-30')
            ->has('attention.items')
            ->has('work.counts')
            ->has('pipeline.stages')
            ->has('recent.items')
            ->missing('quota')
            ->missing('guidedActions')
            ->missing('activityFeed')
            ->missing('leadOsGraph')
            ->missing('placesRun')
            ->missing('researchBrief')
            ->missing('primaryChart')
            ->missing('salesPerformance'));
});

it('computes honest month KPIs and P11 pipeline parity', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();

    p17DealFor($user, 'new', ['title' => 'Open New', 'amount_cents' => 1_000_000]);
    p17DealFor($user, 'proposal', ['title' => 'Open Proposal', 'amount_cents' => 3_000_000]);
    p17DealFor($user, 'won', [
        'title' => 'Won September',
        'amount_cents' => 5_000_000,
        'closed_at' => p17Now()->copy()->subDay(),
    ]);
    p17DealFor($user, 'won', [
        'title' => 'Won August',
        'amount_cents' => 2_000_000,
        'closed_at' => Carbon::parse('2026-08-31 23:00:00', DealAttentionEvaluator::TIMEZONE),
    ]);
    p17DealFor($user, 'lost', [
        'title' => 'Lost September',
        'amount_cents' => 800_000,
        'closed_at' => p17Now()->copy()->subDays(2),
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('metrics.kpis.0.key', 'revenue')
            ->where('metrics.kpis.0.label', 'Won this month')
            ->where('metrics.kpis.0.value', 5_000_000)
            ->where('metrics.kpis.0.change', 150)
            ->where('metrics.kpis.1.key', 'pipeline')
            ->where('metrics.kpis.1.value', 4_000_000)
            ->where('metrics.kpis.1.change', null)
            ->where('metrics.kpis.2.key', 'win_rate')
            ->where('metrics.kpis.2.value', 50)
            ->where('metrics.kpis.3.key', 'open_deals')
            ->where('metrics.kpis.3.value', 2)
            ->where('pipeline.deal_count', 2)
            ->where('pipeline.amount_cents', 4_000_000)
            ->where('pipeline.weighted', false)
            ->where('pipeline.pipeline_id', $pipeline->id)
            ->where('pipeline.stages.0.slug', 'new')
            ->where('pipeline.stages.0.count', 1)
            ->where('pipeline.stages.0.amount_cents', 1_000_000)
            ->where('pipeline.stages.0.href', '/crm/deals?pipeline='.$pipeline->id.'&stage=new'));
});

it('omits win rate and the KPI strip when there is no sample', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('metrics.kpis', [])
            ->where('pipeline.deal_count', 0)
            ->has('activation', 3)
            ->where('activation.0.href', '/crm/deals?create=1')
            ->where('activation.1.href', '/crm/contacts?create=1')
            ->where('activation.2.href', '/crm/activities?create=1'));

    p17DealFor($user, 'new', ['amount_cents' => 1_500_000]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('metrics.kpis.0.value', 0)
            ->where('metrics.kpis.0.change', null)
            ->where('metrics.kpis.2.value', null)
            ->where('metrics.kpis.2.hint', 'No closed deals this month')
            ->where('activation', []));
});

it('mirrors P12 attention order and clears after completing the overdue activity', function () {
    $user = User::factory()->create();
    $overdue = p17DealFor($user, 'qualified', ['title' => 'Overdue deal']);
    $noNext = p17DealFor($user, 'proposal', ['title' => 'No next deal']);
    $healthy = p17DealFor($user, 'demo', [
        'title' => 'Healthy deal',
        'next_activity_at' => p17Now()->copy()->addDay(),
    ]);
    $activity = p17Activity($user, [
        'deal_id' => $overdue->id,
        'subject' => 'Overdue task',
        'due_at' => p17Now()->copy()->subDay(),
    ]);
    p17Activity($user, [
        'deal_id' => $healthy->id,
        'subject' => 'Tomorrow',
        'due_at' => p17Now()->copy()->addDay(),
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('attention.items', 2)
            ->where('attention.items.0.id', $overdue->id)
            ->where('attention.items.0.primary.type', DealAttentionEvaluator::TYPE_OVERDUE_ACTIVITY)
            ->where('attention.items.1.id', $noNext->id)
            ->where('attention.items.1.primary.type', DealAttentionEvaluator::TYPE_NO_NEXT_ACTION)
            ->where('attention.view_all_href', '/crm/deals?attention=needs_attention'));

    $this->actingAs($user)
        ->post("/crm/activities/{$activity->id}/complete")
        ->assertRedirect();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('attention.items', 2)
            ->where('attention.items.0.id', $overdue->id)
            ->where('attention.items.0.primary.type', DealAttentionEvaluator::TYPE_NO_NEXT_ACTION)
            ->where('attention.items.1.id', $noNext->id));
});

it('mirrors P15 today buckets and keeps other owners off My work', function () {
    $user = User::factory()->create();
    $other = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Other Owner',
    ]);
    $deal = p17DealFor($user, 'new');

    p17Activity($user, [
        'deal_id' => $deal->id,
        'subject' => 'Yesterday overdue',
        'due_at' => p17Now()->copy()->subDay(),
    ]);
    p17Activity($user, [
        'subject' => 'Earlier today',
        'due_at' => p17Now()->copy()->setTime(9, 0),
    ]);
    p17Activity($user, [
        'subject' => 'Exactly now',
        'due_at' => p17Now(),
    ]);
    p17Activity($user, [
        'subject' => 'Later today',
        'due_at' => p17Now()->copy()->setTime(15, 0),
    ]);
    p17Activity($user, [
        'subject' => 'Tomorrow',
        'due_at' => p17Now()->copy()->addDay(),
    ]);
    p17Activity($user, [
        'owner_id' => $other->id,
        'subject' => 'Other overdue',
        'due_at' => p17Now()->copy()->subDay(),
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('work.counts.overdue', 2)
            ->where('work.counts.today', 2)
            ->where('work.counts.upcoming', 1)
            ->where('work.items.0.subject', 'Yesterday overdue')
            ->where('work.items.1.subject', 'Earlier today')
            ->where('work.items.2.subject', 'Exactly now')
            ->where('work.view_all_href', '/crm/activities')
            ->where('work.overdue_href', '/crm/activities?group=overdue')
            ->where('work.today_href', '/crm/activities?group=today')
            ->missing('work.items.0.body')
            ->where('work.items', fn ($items) => collect($items)->pluck('subject')->doesntContain('Other overdue')));
});

it('lists recently logged activities by created_at and never updated_at', function () {
    $user = User::factory()->create();
    $deal = p17DealFor($user, 'new', ['title' => 'Logged deal']);

    p17Activity($user, [
        'deal_id' => $deal->id,
        'subject' => 'Old log',
        'created_at' => p17Now()->copy()->subDays(2),
        'updated_at' => p17Now(),
    ]);
    p17Activity($user, [
        'subject' => 'New log',
        'created_at' => p17Now()->copy()->subHour(),
        'updated_at' => p17Now()->copy()->subDays(3),
        'body' => 'SECRET-BODY',
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('recent.kind', 'logged_activity')
            ->where('recent.items.0.subject', 'New log')
            ->where('recent.items.1.subject', 'Old log')
            ->where('recent.items.1.recordRef.type', 'deal')
            ->where('recent.items.1.related.0.label', 'Logged deal')
            ->missing('recent.items.0.body'));
});

it('does not leak other workspaces or offer create to view-only members', function () {
    $user = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $stranger = User::factory()->create();

    p17DealFor($user, 'new', ['title' => 'Ours', 'amount_cents' => 9_900_000_00]);
    p17DealFor($stranger, 'new', ['title' => 'Theirs', 'amount_cents' => 1]);
    p17Activity($user, ['subject' => 'Our task', 'due_at' => p17Now()->copy()->subHour()]);
    p17Activity($stranger, ['subject' => 'Secret stranger', 'due_at' => p17Now()->copy()->subHour()]);

    $this->actingAs($member)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pipeline.deal_count', 1)
            ->where('metrics.kpis.1.value', 9_900_000_00)
            ->where('activation', [])
            ->where('recent.items', fn ($items) => collect($items)->pluck('subject')->doesntContain('Secret stranger'))
            ->where('attention.items', fn ($items) => collect($items)->pluck('title')->doesntContain('Theirs')));
});

it('does not N+1 deals or dump every deal onto the operating home', function () {
    $user = User::factory()->create();

    foreach (range(1, 12) as $i) {
        $deal = p17DealFor($user, 'qualified', [
            'title' => 'Long deal name that must truncate without horizontal overflow '.$i,
            'amount_cents' => 12_345_000,
        ]);
        p17Activity($user, [
            'deal_id' => $deal->id,
            'subject' => 'Overdue '.$i,
            'due_at' => p17Now()->copy()->subHours($i),
        ]);
    }

    DB::flushQueryLog();
    DB::enableQueryLog();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('attention.items', 6)
            ->has('work.items', 6)
            ->where('metrics.kpis.3.value', 12)
            ->where('pipeline.deal_count', 12));

    $perDealActivity = collect(DB::getQueryLog())->filter(function (array $query): bool {
        $sql = strtolower($query['query']);
        $fromActivities = str_contains($sql, 'from "activities"') || str_contains($sql, 'from `activities`');
        $singleDeal = (bool) preg_match('/["`]?deal_id["`]?\s*=\s*\?/', $sql);
        $batched = str_contains($sql, ' in (');

        return $fromActivities && $singleDeal && ! $batched;
    });

    expect($perDealActivity->count())->toBe(0)
        ->and(File::get(app_path('Services/Home/HomeDashboardBuilder.php')))
        ->not->toContain("with(['stage', 'owner'])->get()")
        ->and(app(HomeDashboardBuilder::class))->toBeInstanceOf(HomeDashboardBuilder::class);
});
