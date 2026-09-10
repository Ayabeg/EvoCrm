<?php

use App\Jobs\LeadOs\CaptureDrainNode;
use App\Models\Activity;
use App\Models\AiInsight;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealHealthSnapshot;
use App\Models\DealSuggestion;
use App\Models\GraphRun;
use App\Models\User;
use App\Services\LeadOs\DealHealthScorer;
use App\Services\LeadOs\GraphRunner;
use App\Services\LeadOs\NextMoveAdvisor;
use App\Services\Outbound\OutboundDispatcher;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

function graphDeal(User $user, string $stageSlug, array $attributes = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    return Deal::query()->create(array_merge([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create([
            'workspace_id' => $workspace->id,
            'phone' => '0550123456',
            'email' => 'amine.clinic@example.com',
        ])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => 'Graph deal '.$stageSlug,
        'amount_cents' => 1_200_000,
        'currency' => 'DZD',
        'last_activity_at' => now()->subDays(2),
    ], $attributes));
}

it('runs the Lead OS graph end to end now that capture, enrich, and score have landed', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    graphDeal($user, 'proposal');

    expect(array_key_exists('leads:capture-drain', Artisan::all()))->toBeTrue()
        ->and(array_key_exists('leads:enrich', Artisan::all()))->toBeTrue()
        ->and(array_key_exists('leads:score', Artisan::all()))->toBeTrue();

    $this->artisan('lead-os:graph', [
        '--workspace' => $workspace->id,
        '--triggered-by' => 'manual',
    ])->assertSuccessful();

    $run = GraphRun::query()->forWorkspace($workspace)->latest('id')->first();

    expect($run)->not->toBeNull()
        ->and($run->triggered_by)->toBe('manual')
        ->and($run->status)->toBe(GraphRun::STATUS_OK)
        ->and($run->finished_at)->not->toBeNull();

    $nodes = $run->nodeMap();

    expect($nodes['capture-drain']['status'])->toBe(GraphRun::NODE_OK)
        ->and($nodes['enrich']['status'])->toBe(GraphRun::NODE_OK)
        ->and($nodes['score']['status'])->toBe(GraphRun::NODE_OK)
        ->and($nodes['research']['status'])->toBe(GraphRun::NODE_OK)
        ->and($nodes['deal-health']['status'])->toBe(GraphRun::NODE_OK)
        ->and($nodes['next-move']['status'])->toBe(GraphRun::NODE_OK)
        ->and($run->skipped_count)->toBe(0)
        ->and($run->ok_count)->toBe(6)
        ->and($run->failed_count)->toBe(0);

    expect(DealHealthSnapshot::query()->where('workspace_id', $workspace->id)->count())->toBe(1)
        ->and(DealSuggestion::query()->where('kind', DealSuggestion::KIND_NEXT_MOVE)->count())->toBe(1)
        ->and(AiInsight::query()->where('question', 'Research brief')->where('source', 'fields')->count())->toBe(1);
});

it('skips missing sibling commands without failing the graph', function () {
    $user = User::factory()->create();

    $result = app(\App\Services\LeadOs\SiblingCommand::class)->invoke('leads:not-registered', [
        '--workspace' => $user->workspace_id,
    ]);

    expect($result['status'])->toBe('skipped')
        ->and($result['error'])->toBe('leads:not-registered is not registered');
});

it('invokes a registered sibling command when the parallel PR has landed', function () {
    Artisan::command('lead-os:test-sibling {--workspace=}', fn () => 0);

    $result = app(\App\Services\LeadOs\SiblingCommand::class)->invoke('lead-os:test-sibling', [
        '--workspace' => 1,
    ]);

    expect($result['status'])->toBe('ok')
        ->and($result['counts']['commands'])->toBe(1);
});

it('scores deal health from stage age, inactivity, amount, and open tasks and keeps history', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    $healthy = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('proposal')->id,
        'title' => 'Clinic hub',
        'amount_cents' => 2_400_000,
        'currency' => 'DZD',
        'last_activity_at' => now()->subDays(2),
    ]);

    $stalled = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Cold clinic',
        'amount_cents' => 0,
        'currency' => 'DZD',
        'last_activity_at' => now()->subDays(40),
        'created_at' => now()->subDays(45),
    ]);
    $stalled->forceFill(['created_at' => now()->subDays(45)])->save();

    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'deal_id' => $stalled->id,
        'type' => 'task',
        'subject' => 'Overdue follow-up',
        'done' => false,
        'due_at' => now()->subDays(10),
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'deal_id' => $stalled->id,
        'type' => 'task',
        'subject' => 'Second open',
        'done' => false,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'deal_id' => $stalled->id,
        'type' => 'task',
        'subject' => 'Third open',
        'done' => false,
    ]);

    $scorer = app(DealHealthScorer::class);
    $healthyScore = $scorer->score($healthy);
    $stalledScore = $scorer->score($stalled);

    expect($healthyScore['score'])->toBeGreaterThanOrEqual(70)
        ->and($healthyScore['band'])->toBe(DealHealthSnapshot::BAND_HEALTHY)
        ->and($healthyScore['label'])->toBe('Healthy')
        ->and($healthyScore['reason'])->not->toContain('Breeze')
        ->and($stalledScore['score'])->toBeLessThan(40)
        ->and($stalledScore['band'])->toBe(DealHealthSnapshot::BAND_STALLED)
        ->and($stalledScore['factors'])->toHaveCount(4)
        ->and($stalledScore['score'])->toBeLessThan($healthyScore['score']);

    $first = $scorer->persist($workspace, $stalled, $stalledScore);
    $later = $scorer->persist($workspace, $stalled, $scorer->score($stalled));

    expect(DealHealthSnapshot::query()->where('deal_id', $stalled->id)->count())->toBe(2)
        ->and($scorer->latestFor($stalled)->id)->toBe($later->id)
        ->and($first->id)->not->toBe($later->id);

    app(GraphRunner::class)->start($workspace, 'manual');

    $this->actingAs($user)
        ->get("/crm/deals/{$healthy->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/show')
            ->where('dealHealth.band', DealHealthSnapshot::BAND_HEALTHY)
            ->where('dealHealth.label', 'Healthy')
            ->has('nextMove')
        );
});

it('does not auto-send email or WhatsApp when next move is suggested or applied', function () {
    Mail::fake();
    Http::fake();

    $user = User::factory()->create();
    $workspace = $user->workspace;
    $deal = graphDeal($user, 'qualified', [
        'last_activity_at' => now()->subDays(12),
        'amount_cents' => 800_000,
    ]);

    $dispatcher = Mockery::mock(OutboundDispatcher::class);
    $dispatcher->shouldNotReceive('dispatch');
    $this->app->instance(OutboundDispatcher::class, $dispatcher);

    $suggestion = app(NextMoveAdvisor::class)->suggest($deal);

    expect($suggestion->payload['auto_send'] ?? null)->toBeFalse()
        ->and($suggestion->action)->not->toBeEmpty();

    Mail::assertNothingSent();
    Http::assertNothingSent();

    $this->actingAs($user)
        ->from("/crm/deals/{$deal->id}")
        ->post("/crm/deals/{$deal->id}/suggestions/{$suggestion->id}/apply")
        ->assertRedirect();

    expect($suggestion->fresh()->status)->toBe(DealSuggestion::STATUS_APPLIED);
    Mail::assertNothingSent();
    Http::assertNothingSent();

    $sent = Activity::query()
        ->where('deal_id', $deal->id)
        ->whereIn('type', ['email'])
        ->where('meta->auto_send', true)
        ->count();

    expect($sent)->toBe(0);
});

it('leaves mid-confidence next moves for a human', function () {
    $user = User::factory()->create();
    $deal = graphDeal($user, 'new', [
        'last_activity_at' => now()->subDays(16),
        'amount_cents' => 0,
    ]);

    $suggestion = app(NextMoveAdvisor::class)->suggest($deal);

    expect($suggestion->isHumanOnly())->toBeTrue()
        ->and($suggestion->action)->toBe(DealSuggestion::ACTION_LEAVE_FOR_HUMAN)
        ->and($suggestion->confidence)->toBe(DealSuggestion::CONFIDENCE_MID);
});

it('queues an after-touch draft without advancing the deal', function () {
    $user = User::factory()->create();
    $deal = graphDeal($user, 'qualified');
    $stageId = $deal->stage_id;

    $this->actingAs($user)
        ->from("/crm/deals/{$deal->id}")
        ->post('/crm/activities', [
            'type' => 'note',
            'subject' => 'Spoke with finance',
            'body' => 'They asked for a revised quote',
            'deal_id' => $deal->id,
        ])
        ->assertRedirect();

    $draft = DealSuggestion::query()
        ->where('deal_id', $deal->id)
        ->where('kind', DealSuggestion::KIND_AFTER_TOUCH)
        ->first();

    expect($draft)->not->toBeNull()
        ->and($draft->action)->toBeIn([
            DealSuggestion::ACTION_NEXT_STAGE,
            DealSuggestion::ACTION_FOLLOW_UP,
        ])
        ->and(data_get($draft->payload, 'auto_advance'))->toBeFalse()
        ->and($deal->fresh()->stage_id)->toBe($stageId);

    $this->actingAs($user)
        ->post("/crm/deals/{$deal->id}/suggestions/{$draft->id}/apply")
        ->assertRedirect();

    expect($deal->fresh()->stage_id)->toBe($stageId)
        ->and($deal->fresh()->next_step)->not->toBeEmpty()
        ->and($draft->fresh()->status)->toBe(DealSuggestion::STATUS_APPLIED);
});

it('drafts weekly lost review reasons for a human to confirm', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $deal = graphDeal($user, 'lost', [
        'closed_at' => now()->subDays(2),
        'lost_reason' => null,
        'amount_cents' => 900_000,
    ]);

    $this->artisan('deals:lost-review', ['--workspace' => $workspace->id])
        ->assertSuccessful();

    $row = DealSuggestion::query()
        ->where('deal_id', $deal->id)
        ->where('kind', DealSuggestion::KIND_LOST_REASON)
        ->first();

    expect($row)->not->toBeNull()
        ->and($row->status)->toBe(DealSuggestion::STATUS_PENDING)
        ->and($row->body)->not->toBeEmpty();

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('lostReview', 1)
            ->where('lostReview.0.deal_id', $deal->id)
            ->has('leadOsGraph')
        );

    $this->actingAs($user)
        ->from('/reports')
        ->post("/crm/lost-reviews/{$row->id}/confirm")
        ->assertRedirect();

    expect($row->fresh()->status)->toBe(DealSuggestion::STATUS_CONFIRMED)
        ->and($deal->fresh()->lost_reason)->not->toBeEmpty();
});

it('surfaces last graph run on Home', function () {
    $user = User::factory()->create();
    app(GraphRunner::class)->start($user->workspace, 'nightly');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->where('leadOsGraph.triggered_by', 'nightly')
            ->where('leadOsGraph.nodes.0.key', 'capture-drain')
            ->where('leadOsGraph.nodes.4.key', 'deal-health')
        );
});

it('persists a research brief on the company when Ask Evo is live', function () {
    config(['services.openai.key' => 'sk-test']);
    Http::fake([
        'api.openai.com/*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'Clinique Atlas is a clinic in Alger. No invented emails.']],
            ],
        ]),
    ]);

    $user = User::factory()->create();
    $company = \App\Models\Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Atlas',
        'city' => 'Alger',
        'wilaya' => 'Alger',
        'domain' => 'clinique-atlas.dz',
    ]);
    $deal = graphDeal($user, 'demo');
    $deal->forceFill(['company_id' => $company->id])->save();

    $result = app(\App\Services\LeadOs\ResearchBrief::class)->run($user->workspace);

    expect($result['status'])->toBe('ok')
        ->and($result['counts']['briefs'])->toBeGreaterThan(0);

    $row = AiInsight::query()
        ->where('subject_type', 'company')
        ->where('subject_id', $company->id)
        ->where('question', 'Research brief')
        ->first();

    expect($row)->not->toBeNull()
        ->and($row->answer)->toContain('Clinique Atlas')
        ->and($row->answer)->not->toContain('@invented');
});

it('dispatches the graph as Laravel jobs, not a new product', function () {
    $user = User::factory()->create();

    CaptureDrainNode::dispatch($user->workspace_id, GraphRun::query()->create([
        'workspace_id' => $user->workspace_id,
        'triggered_by' => 'manual',
        'status' => GraphRun::STATUS_RUNNING,
        'started_at' => now(),
        'nodes' => [],
    ])->id);

    expect(GraphRun::query()->forWorkspace($user->workspace)->latest('id')->first()->status)
        ->toBe(GraphRun::STATUS_OK);
});
