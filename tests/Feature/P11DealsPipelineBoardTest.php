<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\SavedFilter;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

/**
 * P11 — Deals pipeline board normalization.
 * List and Board are two views of one Deal workspace.
 */

function p11DealFor(User $user, string $stageSlug, int $amountCents, array $overrides = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $overrides['pipeline'] ?? $workspace->defaultPipeline();
    unset($overrides['pipeline']);
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'company_id' => $overrides['company_id'] ?? null,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => $overrides['title'] ?? 'P11 '.$stageSlug,
        'amount_cents' => $amountCents,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
    ]);
}

it('locks P11 source contracts for one Deal workspace and two views', function () {
    $board = File::get(resource_path('js/pages/crm/deals/board.tsx'));
    $list = File::get(resource_path('js/pages/crm/deals/index.tsx'));
    $pipelineBoard = File::get(resource_path('js/pages/crm/deals/deal-pipeline-board.tsx'));
    $toggle = File::get(resource_path('js/components/crm/deal-layout-toggle.tsx'));
    $switcher = File::get(resource_path('js/components/crm/pipeline-switcher.tsx'));
    $layout = File::get(resource_path('js/lib/list-query/deal-layout.ts'));
    $shell = File::get(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = File::get(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $surface = File::get(resource_path('js/ds/workspace/surface.ts'));
    $kanban = File::get(resource_path('js/components/crm/pipeline-kanban.tsx'));
    $cardInteraction = File::get(resource_path('js/components/crm/pipeline-card-interaction.ts'));
    $adapter = File::get(resource_path('js/ds/workspace/record-adapters/deal.ts'));
    $keys = File::get(resource_path('js/lib/list-query/keys.ts'));
    $url = File::get(resource_path('js/ds/workspace/quick-record/url.ts'));
    $controller = File::get(app_path('Http/Controllers/Crm/DealController.php'));
    $routes = File::get(base_path('routes/web.php'));
    $layoutContract = File::get(resource_path('js/lib/list-query/deal-layout-contract.ts'));
    $boardContract = File::get(resource_path('js/pages/crm/deals/deal-board-contract.ts'));
    $jsRunner = File::get(base_path('tests/js/p11-deals-pipeline-board.ts'));

    expect($board)->toContain('CrmListShell')
        ->and($board)->toContain('resultMode="shared-table"')
        ->and($board)->toContain('mode="board"')
        ->and($board)->toContain('board={')
        ->and($board)->toContain('DealPipelineBoard')
        ->and($board)->toContain('DealLayoutToggle')
        ->and($board)->toContain('PipelineSwitcher')
        ->and($board)->toContain('DealForecastSummary')
        ->and($board)->toContain('Create deal')
        ->and($board)->toContain('EmptyState')
        ->and($board)->toContain('density="banner"')
        ->and($board)->toContain("action=\"/crm/deals\"")
        ->and($board)->toContain('selectable: false')
        ->and($board)->toContain('overflow-x-hidden')
        ->and($board)->not->toContain('CrmObjectHeader')
        ->and($board)->not->toContain('data-crm="pipeline-workspace"')
        ->and($board)->not->toContain('onModeChange')
        ->and($board)->not->toContain('BoardDealDrawer')
        ->and($board)->not->toContain('KanbanDealModel')
        ->and($board)->not->toContain('BoardQuery')
        ->and($board)->not->toContain('peek=');

    expect($list)->toContain('DealLayoutToggle')
        ->and($list)->toContain('activeFilters={activeFilters}')
        ->and($list)->not->toContain('mode="board"')
        ->and($list)->not->toContain('board={')
        ->and($list)->not->toContain('onModeChange')
        ->and($list)->not->toContain('PipelineKanban');

    expect($pipelineBoard)->toContain("openRecord({ type: 'deal', id: deal.id }")
        ->and($pipelineBoard)->toContain('/crm/deals/${dealId}/move')
        ->and($pipelineBoard)->toContain('preserveScroll: true')
        ->and($pipelineBoard)->toContain('Move to stage')
        ->and($pipelineBoard)->toContain('formatDzd')
        ->and($pipelineBoard)->toContain('dealStageColumnAccent')
        ->and($pipelineBoard)->not->toContain('BoardDealDrawer')
        ->and($pipelineBoard)->not->toContain('router.visit(deal.url)');

    expect($toggle)->toContain('dealLayoutHrefFromFilters')
        ->and($toggle)->not->toContain('`${query}`')
        ->and($toggle)->not->toContain('mode=board');

    expect($switcher)->toContain('fromActiveFilters(')
        ->and($switcher)->toContain('applyPipeline(')
        ->and($switcher)->not->toContain('emptyCanonicalListQuery');

    expect($layout)->toContain('page: target === \'board\' ? null : current.page')
        ->and($layout)->toContain('Never writes peek / mode / create');

    expect($shell)->toContain('mode="board"')
        ->and($workspace)->toContain('resolveWorkspaceBoardSlot')
        ->and($surface)->toContain('resolveWorkspaceBoardSlot');

    expect($cardInteraction)->toContain('CARD_DRAG_THRESHOLD_PX')
        ->and($kanban)->toContain('pointerMovedPastThreshold')
        ->and($kanban)->toContain('resolveRowActivation')
        ->and($kanban)->toContain('tabIndex={0}')
        ->and($kanban)->toContain('rounded-[10px]')
        ->and($kanban)->toContain('shadow-none')
        ->and($kanban)->toContain('overflow-x-auto');

    expect($adapter)->toContain("type: 'deal'")
        ->and($adapter)->toContain('formatMoneyCents');

    expect($keys)->toContain("'peek'")
        ->and($keys)->toContain("'mode'")
        ->and($url)->toContain('P10 defers URL sync (decision B)');

    expect($controller)->toContain("apply('deal'")
        ->and($controller)->toContain("'activeFilters' => \$filters")
        ->and($controller)->toContain("Inertia::render('crm/deals/board'")
        ->and($controller)->toContain('$deal->moveTo($stage, $request->user())');

    expect($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')")
        ->and($routes)->toContain("Route::get('/crm/deals/board'");

    expect($layoutContract)->toContain('list→board preserves compatible query and drops page')
        ->and($layoutContract)->toContain('board→list restores compatible query')
        ->and($boardContract)->toContain('card background peeks')
        ->and($jsRunner)->toContain('deal-layout-contract');
});

it('keeps exact default stages and the existing move route', function () {
    $user = User::factory()->create();
    $deal = p11DealFor($user, 'new', 1_000_000, ['title' => 'Move me']);
    $demo = $user->workspace->defaultPipeline()->stageBySlug('demo');

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/board')
            ->has('stages', 6)
            ->where('stages.0.name', 'New')
            ->where('stages.1.name', 'Qualified')
            ->where('stages.2.name', 'Demo')
            ->where('stages.3.name', 'Proposal')
            ->where('stages.4.name', 'Won')
            ->where('stages.5.name', 'Lost')
            ->has('activeFilters')
            ->has('savedFilters')
            ->has('listView')
            ->missing('peek')
        );

    $this->actingAs($user)
        ->from('/crm/deals/board?q=Move')
        ->post("/crm/deals/{$deal->id}/move", ['stage_id' => $demo->id])
        ->assertRedirect('/crm/deals/board?q=Move');

    expect($deal->fresh()->stage->slug)->toBe('demo');
});

it('applies the Deal list query to the board without inventing a BoardQuery', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);
    $keep = p11DealFor($user, 'qualified', 10_000_000, ['title' => 'Clinic Atlas']);
    p11DealFor($user, 'new', 4_000_000, ['title' => 'Other intake', 'owner_id' => $other->id]);
    $saved = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => 'Atlas view',
        'entity' => 'deal',
        'filters' => ['q' => 'Atlas'],
    ]);

    $this->actingAs($user)
        ->get('/crm/deals/board?q=Atlas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.q', 'Atlas')
            ->has('deals', 1)
            ->where('deals.0.id', $keep->id)
            ->where('forecast.count', 1)
            ->where('forecast.amount_cents', 10_000_000)
        );

    $this->actingAs($user)
        ->get('/crm/deals/board?owner='.$user->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.owner', (string) $user->id)
            ->has('deals', 1)
            ->where('deals.0.id', $keep->id)
        );

    $this->actingAs($user)
        ->get('/crm/deals/board?stage=qualified')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.stage', 'qualified')
            ->has('deals', 1)
            ->where('deals.0.stage_id', $keep->stage_id)
            ->where('stages.0.count', 0)
            ->where('stages.1.count', 1)
        );

    $this->actingAs($user)
        ->get('/crm/deals/board?filter_id='.$saved->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeFilters.filter_id', $saved->id)
            ->has('deals', 1)
            ->where('deals.0.id', $keep->id)
        );
});

it('keeps List Board and Show amount truth identical and does not recompute forecast math', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Clinic Atlas']);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'first_name' => 'Amel',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $a = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Fit-out A',
        'amount_cents' => 10_000_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);
    $b = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('qualified')->id,
        'title' => 'Fit-out B',
        'amount_cents' => 20_000_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);
    $c = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('lost')->id,
        'title' => 'Fit-out C',
        'amount_cents' => 8_000_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);
    Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $a->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 10_000_000,
    ]);

    $list = $this->actingAs($user)->get('/crm/deals')->assertOk();
    $board = $this->actingAs($user)->get('/crm/deals/board')->assertOk();
    $show = $this->actingAs($user)->get('/crm/deals/'.$a->id)->assertOk();

    $list->assertInertia(fn ($page) => $page
        ->where('deals', fn ($rows) => collect($rows)->firstWhere('id', $a->id)['amount_cents'] === 10_000_000
            && collect($rows)->firstWhere('id', $b->id)['amount_cents'] === 20_000_000
            && collect($rows)->firstWhere('id', $c->id)['amount_cents'] === 8_000_000)
    );

    $board->assertInertia(fn ($page) => $page
        ->where('deals.0.amount_cents', fn ($value) => in_array($value, [10_000_000, 20_000_000, 8_000_000], true))
        ->where('forecast.count', 3)
        ->where('forecast.amount_cents', 38_000_000)
        ->where('forecast.weighted_cents', 6_000_000)
        ->where('deals', fn ($rows) => collect($rows)->firstWhere('id', $a->id)['quote_count'] === 1)
    );

    $show->assertInertia(fn ($page) => $page
        ->where('deal.amount_cents', 10_000_000)
        ->where('deal.currency', 'DZD')
    );
});

it('leaves leads redirect inbox command and peek URL decision B frozen', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/index'));

    expect(Route::getRoutes()->getByName('crm.deals.board')?->uri())->toBe('crm/deals/board')
        ->and(Route::getRoutes()->getByName('crm.deals.index')?->uri())->toBe('crm/deals')
        ->and(Route::getRoutes()->getByName('crm.deals.move')?->uri())->toBe('crm/deals/{deal}/move');

    $inbox = File::get(resource_path('js/pages/desk/inbox.tsx'));
    $palette = File::get(resource_path('js/evo/patterns/command-palette/index.tsx'));
    $home = File::get(resource_path('js/pages/home.tsx'));
    $keys = File::get(resource_path('js/lib/list-query/keys.ts'));

    expect($inbox)->not->toContain('DealPipelineBoard')
        ->and($palette)->toContain('openRecord')
        ->and($palette)->not->toContain('CommandRecordDrawer')
        ->and($home)->not->toContain('DealPipelineBoard')
        ->and($keys)->toContain("'peek'");
});
