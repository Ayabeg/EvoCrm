<?php

use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Crm\ActivityTiming;
use App\Services\Crm\DealAttentionEvaluator;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

function p15Now(): Carbon
{
    return Carbon::parse('2026-09-16 12:00:00', DealAttentionEvaluator::TIMEZONE);
}

function p15DealFor(User $user, string $stageSlug, array $overrides = []): Deal
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
        'company_id' => $overrides['company_id'] ?? $contact->company_id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => $overrides['title'] ?? 'P15 '.$stageSlug,
        'amount_cents' => $overrides['amount_cents'] ?? 2_400_000,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'next_activity_at' => $overrides['next_activity_at'] ?? null,
    ]);
}

function p15Activity(User $user, array $overrides = []): Activity
{
    return Activity::query()->create([
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
        'company_id' => $overrides['company_id'] ?? null,
    ]);
}

function p15Evaluate(Deal $deal): array
{
    $deal->loadMissing('stage');

    return app(DealAttentionEvaluator::class)->evaluate(
        $deal,
        $deal->activities()->where('done', false)->whereNotNull('due_at')->get(),
        p15Now(),
    );
}

beforeEach(function () {
    Carbon::setTestNow(p15Now());
});

afterEach(function () {
    Carbon::setTestNow();
});

it('locks one Activity domain and P12 overdue clock without a second model', function () {
    $timing = File::get(app_path('Services/Crm/ActivityTiming.php'));
    $query = File::get(app_path('Services/Crm/ActivityWorkQueueQuery.php'));
    $controller = File::get(app_path('Http/Controllers/Crm/ActivityController.php'));
    $page = File::get(resource_path('js/pages/crm/activities/index.tsx'));
    $surface = File::get(resource_path('js/components/crm/activity-work-queue.tsx'));
    $lib = File::get(resource_path('js/lib/activity-work-queue.ts'));
    $js = File::get(base_path('tests/js/p15-activities-work-queue.ts'));
    $evaluator = File::get(app_path('Services/Crm/DealAttentionEvaluator.php'));
    $composer = File::get(app_path('Services/Desk/InboxCrmContextComposer.php'));

    expect(class_exists('App\\Models\\Task'))->toBeFalse()
        ->and($timing)->toContain('class ActivityTiming')
        ->and($timing)->toContain('DealAttentionEvaluator::now')
        ->and($timing)->toContain("due_at', '<'")
        ->and($query)->toContain('class ActivityWorkQueueQuery')
        ->and($query)->not->toContain('amount_cents')
        ->and($query)->not->toContain("'body'")
        ->and($controller)->toContain('ActivityWorkQueueQuery')
        ->and($controller)->toContain("authorize('update'")
        ->and($controller)->toContain('function store')
        ->and($controller)->toContain('function complete')
        ->and($controller)->toContain('function attendance')
        ->and($page)->not->toContain('Date.now')
        ->and($page)->not->toContain('DataWorkspace')
        ->and($page)->not->toContain('ActivityRecordDrawer')
        ->and($surface)->not->toContain('Date.now')
        ->and($surface)->toContain('RecordLink')
        ->and($surface)->toContain('/crm/activities/')
        ->and($surface)->toContain('complete')
        ->and($lib)->toContain('isStaleActivityQueueVisit')
        ->and($js)->toContain('Overdue → Today → Upcoming')
        ->and($evaluator)->toContain('class DealAttentionEvaluator')
        ->and($evaluator)->toContain('TYPE_OVERDUE_ACTIVITY')
        ->and($composer)->toContain('DealAttentionEvaluator::evaluate');

    expect($query)->not->toContain('WorkQueueActivity')
        ->and($query)->not->toContain('SalesTaskActivity')
        ->and($query)->not->toContain('ActivityV2');
});

it('classifies fixtures A–M with P12 overdue and My work assignee', function () {
    $user = User::factory()->create();
    $other = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Other Owner',
    ]);
    $stranger = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Hydra',
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
    ]);
    $deal = p15DealFor($user, 'qualified', [
        'title' => 'Clinic package',
        'contact' => $contact,
        'company_id' => $company->id,
        'amount_cents' => 8_000_000,
    ]);
    $secretDeal = p15DealFor($stranger, 'proposal', [
        'title' => 'Secret retainer',
        'amount_cents' => 99_000_000,
    ]);

    $a = p15Activity($user, [
        'subject' => 'A overdue clinic',
        'type' => 'task',
        'due_at' => p15Now()->copy()->subDay(),
        'deal_id' => $deal->id,
        'contact_id' => $contact->id,
    ]);
    p15Activity($user, [
        'subject' => 'B today call',
        'type' => 'call',
        'due_at' => p15Now()->copy()->addHour(),
        'contact_id' => $contact->id,
    ]);
    p15Activity($user, [
        'subject' => 'C upcoming meeting',
        'type' => 'meeting',
        'due_at' => p15Now()->copy()->addDay(),
    ]);
    p15Activity($user, [
        'subject' => 'D completed yesterday',
        'type' => 'task',
        'due_at' => p15Now()->copy()->subDays(2),
        'done' => true,
        'completed_at' => p15Now()->copy()->subDay(),
    ]);
    p15Activity($user, [
        'subject' => 'E unscheduled note',
        'type' => 'note',
        'due_at' => null,
    ]);
    p15Activity($user, [
        'subject' => 'F other overdue',
        'type' => 'task',
        'due_at' => p15Now()->copy()->subDays(3),
        'owner_id' => $other->id,
    ]);
    p15Activity($user, [
        'subject' => 'G multi related',
        'type' => 'task',
        'due_at' => p15Now()->copy()->addHours(2),
        'deal_id' => $deal->id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
    ]);
    p15Activity($user, [
        'subject' => 'H restricted deal',
        'type' => 'task',
        'due_at' => p15Now()->copy()->addHours(3),
        'deal_id' => $secretDeal->id,
    ]);
    p15Activity($user, [
        'subject' => str_repeat('I long subject ', 12),
        'type' => 'email',
        'due_at' => p15Now()->copy()->addDays(3),
    ]);
    $j = p15Activity($user, [
        'subject' => 'J exactly now',
        'type' => 'task',
        'due_at' => p15Now(),
    ]);
    $k = p15Activity($user, [
        'subject' => 'K earlier today',
        'type' => 'task',
        'due_at' => p15Now()->copy()->setTime(9, 0),
    ]);
    $l = p15Activity($user, [
        'subject' => 'L later today',
        'type' => 'task',
        'due_at' => p15Now()->copy()->setTime(15, 0),
    ]);
    $m = p15Activity($user, [
        'subject' => 'M completed was overdue',
        'type' => 'task',
        'due_at' => p15Now()->copy()->subDay(),
        'deal_id' => $deal->id,
    ]);

    expect(ActivityTiming::bucket($a, p15Now()))->toBe('overdue')
        ->and(ActivityTiming::bucket($j, p15Now()))->toBe('today')
        ->and(ActivityTiming::bucket($k, p15Now()))->toBe('overdue')
        ->and(ActivityTiming::bucket($l, p15Now()))->toBe('today')
        ->and(p15Evaluate($deal)['primary']['type'])->toBe(DealAttentionEvaluator::TYPE_OVERDUE_ACTIVITY);

    $this->actingAs($user)
        ->get('/crm/activities')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/activities/index')
            ->where('filters.scope', 'mine')
            ->where('queue.counts.overdue', 3)
            ->where('queue.counts.today', 5)
            ->where('queue.counts.upcoming', 2)
            ->where('queue.counts.unscheduled', 1)
            ->where('queue.counts.completed', 1)
            ->missing('queue.groups.overdue.items.0.body')
            ->where('queue.groups.overdue.items.0.subject', 'A overdue clinic')
            ->where('queue.groups.today.items', fn ($items) => collect($items)->pluck('subject')->contains('J exactly now'))
            ->where('queue.groups.overdue.items', fn ($items) => collect($items)->pluck('subject')->contains('K earlier today'))
            ->where('activities', fn ($rows) => collect($rows)->pluck('subject')->doesntContain('F other overdue'))
            ->where('queue.groups.today.items', function ($items) {
                $row = collect($items)->firstWhere('subject', 'G multi related');

                return is_array($row)
                    && collect($row['related'])->pluck('type')->all() === ['deal', 'contact', 'company']
                    && ! array_key_exists('amount_cents', $row)
                    && ! isset($row['body']);
            })
            ->where('queue.groups.today.items', function ($items) {
                $row = collect($items)->firstWhere('subject', 'H restricted deal');

                return is_array($row)
                    && collect($row['related'])->pluck('type')->doesntContain('deal')
                    && json_encode($row) !== false
                    && ! str_contains(json_encode($row), 'Secret retainer')
                    && ! str_contains(json_encode($row), '99000000');
            }));

    $this->actingAs($user)
        ->get('/crm/activities?scope=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.scope', 'all')
            ->where('queue.groups.overdue.items', fn ($items) => collect($items)->pluck('subject')->contains('F other overdue')));

    $this->actingAs($user)
        ->get('/crm/activities?group=overdue')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.group', 'overdue')
            ->has('activities', 3)
            ->where('queue.counts.overdue', 3));

    $this->actingAs($user)
        ->post("/crm/activities/{$m->id}/complete")
        ->assertRedirect();

    expect($m->fresh()->done)->toBeTrue()
        ->and(ActivityTiming::bucket($m->fresh(), p15Now()))->toBe('completed');

    $this->actingAs($user)
        ->get('/crm/activities?group=overdue')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('queue.counts.overdue', 2)
            ->where('activities', fn ($rows) => collect($rows)->pluck('subject')->doesntContain('M completed was overdue')));

    $this->actingAs($user)
        ->get('/crm/deals?attention=overdue')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 1)->where('deals.0.id', $deal->id));

    $this->actingAs($user)
        ->post("/crm/activities/{$a->id}/complete")
        ->assertRedirect();

    $this->actingAs($user)
        ->get('/crm/deals?attention=overdue')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('deals', 0));

    $this->actingAs($user)
        ->get('/crm/activities?group=overdue')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('queue.counts.overdue', 1)
            ->where('queue.groups.overdue.items.0.subject', 'K earlier today'));

    expect(p15Evaluate($deal->fresh())['primary']['type'] ?? null)
        ->not->toBe(DealAttentionEvaluator::TYPE_OVERDUE_ACTIVITY)
        ->and(File::get(app_path('Services/Desk/InboxCrmContextComposer.php')))
        ->toContain('! $activity->due_at->lt($now)');
});

it('keeps complete behind update permission and omits body from the queue payload', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $activity = p15Activity($owner, [
        'subject' => 'Member cannot complete',
        'due_at' => p15Now()->copy()->subHour(),
        'owner_id' => $member->id,
        'body' => 'Secret body',
    ]);

    $this->actingAs($member)
        ->get('/crm/activities')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('capabilities.can_complete', false)
            ->where('queue.groups.overdue.items.0.can_complete', false)
            ->where('queue.groups.overdue.items.0.subject', 'Member cannot complete')
            ->missing('queue.groups.overdue.items.0.body'));

    $this->actingAs($member)
        ->post("/crm/activities/{$activity->id}/complete")
        ->assertForbidden();

    expect($activity->fresh()->done)->toBeFalse();
});

it('does not N+1 activities or leak a DataWorkspace / Date.now overdue path', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
    ]);

    foreach (range(1, 8) as $i) {
        $deal = p15DealFor($user, 'qualified', [
            'title' => "Deal {$i}",
            'contact' => $contact,
            'company_id' => $company->id,
        ]);
        p15Activity($user, [
            'subject' => "Overdue {$i}",
            'due_at' => p15Now()->copy()->subDays($i),
            'deal_id' => $deal->id,
            'contact_id' => $contact->id,
            'company_id' => $company->id,
        ]);
    }

    $this->actingAs($user)->get('/crm/activities')->assertOk();

    $queries = [];
    DB::listen(function ($query) use (&$queries): void {
        $queries[] = $query->sql;
    });

    $this->actingAs($user)->get('/crm/activities')->assertOk();

    $perRow = collect($queries)->filter(function (string $sql): bool {
        $normalized = strtolower($sql);

        return str_contains($normalized, 'from `deals` where `deals`.`id` =')
            || str_contains($normalized, 'from `contacts` where `contacts`.`id` =')
            || str_contains($normalized, 'from `companies` where `companies`.`id` =')
            || str_contains($normalized, 'from `activities` where `activities`.`id` =');
    });

    expect($perRow->count())->toBe(0)
        ->and(File::get(resource_path('js/pages/crm/activities/index.tsx')))
        ->not->toContain('Date.now(')
        ->and(File::get(resource_path('js/components/crm/activity-work-queue.tsx')))
        ->not->toContain('Date.now(')
        ->and(File::get(resource_path('js/pages/crm/activities/index.tsx')))
        ->not->toContain('DataWorkspace');
});

it('opens create through the existing composer flag and keeps store/attendance routes', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $this->actingAs($user)
        ->get('/crm/activities?create=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('filters.create', true));

    $this->actingAs($user)
        ->post('/crm/activities', [
            'type' => 'task',
            'subject' => 'Queue create',
            'due_at' => p15Now()->copy()->addHour()->toDateTimeString(),
            'contact_id' => $contact->id,
            'owner_id' => $user->id,
        ])
        ->assertRedirect();

    expect(Activity::query()->where('subject', 'Queue create')->exists())->toBeTrue();

    $routes = File::get(base_path('routes/web.php'));
    expect($routes)->toContain('crm.activities.store')
        ->and($routes)->toContain('crm.activities.complete')
        ->and($routes)->toContain('crm.activities.attendance')
        ->and($routes)->not->toContain('ActivityRecordDrawer');
});
