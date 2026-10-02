<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\User;
use App\Support\ListViewConfig;
use Illuminate\Support\Facades\Route;

/**
 * P07 — Deals list workspace migration.
 * Deals list joins DataWorkspace shared-table. Board / pipeline / forecast stay put.
 * P03C query adapter is mapped, not replaced.
 */
it('moves Deals list onto DataWorkspace shared-table without a domain children path', function () {
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($deals)->toContain('resultMode="shared-table"')
        ->and($deals)->toContain('rows={deals}')
        ->and($deals)->toContain('rowHref={dealRowHref}')
        ->and($deals)->toContain('empty={dealEmptyState')
        ->and($deals)->toContain('paginator={paginator}')
        ->and($deals)->toContain('loading={loading}')
        ->and($deals)->toContain('data-crm="deals-workspace"')
        ->and($deals)->toContain('entity="deal"')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->toContain('PipelineSwitcher')
        ->and($deals)->toContain('extraQuery={{ pipeline: pipeline.id }}')
        ->and($deals)->not->toContain('ListViewTable')
        ->and($deals)->not->toContain('CrmEmptyState')
        ->and($deals)->not->toContain('CrmListFooter')
        ->and($deals)->not->toContain('listPageHref')
        ->and($deals)->not->toContain('renderResults')
        ->and($deals)->not->toContain('{(columns)')
        ->and($deals)->not->toContain('CrmShell')
        ->and($deals)->not->toContain('chrome="workspace"')
        ->and($deals)->not->toContain('RoomShell')
        ->and($deals)->not->toContain('QuickRecordDrawer')
        ->and($deals)->not->toContain('onRowPeek')
        ->and($deals)->not->toContain('onModeChange')
        ->and($deals)->not->toContain('board={')
        ->and($deals)->not->toContain('mode="board"')
        ->and($deals)->not->toContain('PipelineKanban')
        ->and($deals)->not->toContain('<table');

    expect($shell)->toContain('resultMode="shared-table"')
        ->and($shell)->toContain('resultMode="domain"')
        ->and($shell)->toContain('rowHref={rowHref}')
        ->and($shell)->toContain('applyDealColumnContract')
        ->and($shell)->toContain('toolbarExtra')
        ->and($shell)->toContain("(entity === 'deal' || entity === 'ticket') &&")
        ->and($shell)->toContain("mode: mode ?? (entity === 'deal' ? 'list' as const : undefined)")
        ->and($shell)->not->toContain('rows={[]}')
        ->and($shell)->not->toContain("empty={{ title: '', body: '' }}");

    expect($workspace)->toContain("resultMode === 'shared-table'")
        ->and($workspace)->toContain('rowHref={props.rowHref}')
        ->and($workspace)->toContain('<ListDataTable')
        ->and($workspace)->toContain('<WorkspaceEmpty')
        ->and($workspace)->toContain('<WorkspacePaginator')
        ->and($workspace)->toContain('onRowPeek is reserved for P09')
        ->and($workspace)->toContain('resolveWorkspaceBoardSlot');
});

it('keeps Deals row identity amount stage owner next step and selection on the shared contracts', function () {
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $columns = file_get_contents(resource_path('js/pages/crm/deals/deal-columns.tsx'));
    $table = file_get_contents(resource_path('js/evo/data/crm-list/table.tsx')).file_get_contents(resource_path('js/evo/data/crm-list/cells.tsx'));
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $contract = file_get_contents(resource_path('js/pages/crm/deals/deal-columns-contract.ts'));
    $toggle = file_get_contents(resource_path('js/components/crm/deal-layout-toggle.tsx'));

    expect($deals)->toContain("mode: 'uncontrolled'")
        ->and($deals)->toContain('selectable: canBulk')
        ->and($deals)->toContain('pageIds: deals.map((deal) => deal.id)')
        ->and($deals)->toContain('BulkActionBar')
        ->and($deals)->toContain('entity="deal"')
        ->and($deals)->not->toContain('useState<number[]>([])')
        ->and($deals)->not->toContain('setSelectedIds');

    expect($columns)->toContain('export function dealRowHref')
        ->and($columns)->toContain('export function DealIdentityCell')
        ->and($columns)->toContain('export function applyDealColumnContract')
        ->and($columns)->toContain("label: 'Deal'")
        ->and($columns)->toContain('dealIdentitySecondary')
        ->and($columns)->toContain('Prefer company (the account)')
        ->and($columns)->toContain('flex h-9 w-full min-w-0 items-center gap-2')
        ->and($columns)->toContain('{secondary ? <span className="sr-only">{secondary}</span> : null}')
        ->and($columns)->toContain('block truncate text-[13px] leading-[18px]')
        ->and($columns)->toContain('title={name}')
        ->and($columns)->not->toContain('flex w-full min-w-0 items-start gap-2')
        ->and($columns)->toContain('export function DealAmountCell')
        ->and($columns)->toContain('formatDzd')
        ->and($columns)->toContain('export function DealStageCell')
        ->and($columns)->toContain("tone === 'won'")
        ->and($columns)->toContain("tone === 'lost'")
        ->and($columns)->toContain('text-destructive')
        ->and($columns)->toContain("tone === 'open' && 'text-mute'")
        ->and($columns)->not->toContain('forecast')
        ->and($columns)->not->toContain('next_activity_engine');

    expect($table)->toContain('DealNameCell')
        ->and($table)->toContain('DealStageCell')
        ->and($table)->toContain('DealAmountCell')
        ->and($table)->toContain('applyDealColumnContract')
        ->and($table)->toContain('resolveRowHref(row, rowHref, basePath)')
        ->and($table)->toContain("target.closest('a, input, button, label')")
        ->and($table)->toContain("title: 'w-[24%]'")
        ->and($table)->toContain("amount: 'w-[12%]'")
        ->and($table)->toContain('table-fixed min-w-[68rem]');

    expect($selection)->toContain('Select-all = current rendered page only')
        ->and($selection)->toContain('togglePageSelectedIds')
        ->and($selection)->toContain('bulkActive: selectedIds.length > 0');

    expect($toggle)->toContain('dealLayoutHrefFromFilters')
        ->and($toggle)->toContain("current === 'list'")
        ->and($toggle)->not->toContain('mode=board')
        ->and($toggle)->not->toContain('onModeChange');

    expect($contract)->toContain('rowHref is /crm/deals/:id')
        ->and($contract)->toContain('true empty vs filtered empty')
        ->and($contract)->toContain('title column relabels to Deal')
        ->and($contract)->toContain('identity secondary is company else contact')
        ->and($contract)->toContain('amount uses existing formatDzd')
        ->and($contract)->toContain('won is success and lost is quiet danger')
        ->and($contract)->toContain('open stages stay mute');
});

it('preserves Deal query adapter pipeline saved views filters bulk and create without inventing board chrome', function () {
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $controller = file_get_contents(app_path('Http/Controllers/Crm/DealController.php'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $filterBar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $empty = file_get_contents(resource_path('js/ds/workspace/WorkspaceEmpty.tsx'));
    $adapters = file_get_contents(resource_path('js/lib/list-query/adapters.ts'));
    $contract = file_get_contents(resource_path('js/lib/list-query/list-query-contract.ts'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));
    $bulk = file_get_contents(resource_path('js/components/crm/bulk-action-bar.tsx'));
    $dataTable = file_get_contents(resource_path('js/ds/workspace/DataTable.tsx'));

    expect($deals)->toContain('primaryLabel="Create deal"')
        ->and($deals)->toContain('onCreate=')
        ->and($deals)->toContain('hasActiveListFilters(activeFilters)')
        ->and($deals)->toContain('MorphingForm')
        ->and($deals)->toContain('/crm/deals/import')
        ->and($deals)->toContain('exportHref={`/crm/deals/export?pipeline=${pipeline.id}`}')
        ->and($deals)->not->toContain('searchParams.set')
        ->and($deals)->not->toContain('history.replaceState')
        ->and($deals)->not->toContain('name="q"');

    expect($controller)->toContain("Inertia::render('crm/deals/index'")
        ->and($controller)->toContain("Inertia::render('crm/deals/board'")
        ->and($controller)->toContain("\$filter->resolve(\$request, \$workspace, 'deal')")
        ->and($controller)->toContain('applyToDeals')
        ->and($controller)->toContain("'activeFilters' => \$filters")
        ->and($controller)->toContain("'savedFilters' => \$hub->filters(\$workspace, 'deal'")
        ->and($controller)->toContain("'bulk' => [")
        ->and($controller)->toContain("'next_step' => \$nextLabel");

    expect($adapters)->toContain("object: 'deal'")
        ->and($adapters)->toContain('supportsQuery: true')
        ->and($adapters)->toContain("extras: ['pipeline']")
        ->and($adapters)->toContain("searchParam: 'q'");

    expect($contract)->toContain('stage preserves search/filters/sort/view/pipeline and resets page')
        ->and($contract)->toContain('pipeline preserves search/filters/sort/view and drops stage');

    expect($filterBar)->toContain("t('Search deals…')")
        ->and($filterBar)->toContain("object === 'deal'")
        ->and($filterBar)->not->toContain('searchParams.set');

    expect($workspace)->not->toContain('searchParams.set');

    expect($paginator)->toContain("deal: 'deals'")
        ->and($empty)->toContain('as="h2"');

    $dealColumns = collect(ListViewConfig::columns('deal'))->pluck('id')->all();
    $dealFilters = collect(ListViewConfig::filterFields('deal'))->pluck('id')->all();

    expect($dealColumns)->toBe([
        'title',
        'stage',
        'amount',
        'close_date',
        'owner',
        'company',
        'contact',
        'attention',
        'health',
        'next_step',
        'last_activity_at',
        'created_at',
    ])
        ->and($dealFilters)->toBe([
            'stage',
            'owner',
            'city',
            'wilaya',
            'created',
            'last_activity',
            'status',
            'attention',
            'unanswered',
            'unassigned',
        ])
        ->and($config)->toContain("['id' => 'title', 'label' => 'Deal name', 'defaultVisible' => true]");

    expect($bulk)->toContain("entity === 'deal'")
        ->and($bulk)->toContain("'assign_owner', 'move_stage', 'delete'");

    expect($dataTable)->toContain("object === 'company' || object === 'lead' || object === 'deal' || object === 'quote'");
});

it('does not migrate Quotes Pipeline board or invent QuickRecordDrawer attention or Quotes list', function () {
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));
    $kanban = file_get_contents(resource_path('js/components/crm/pipeline-kanban.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $show = file_get_contents(resource_path('js/pages/crm/deals/show.tsx'));

    expect($quotes)->toContain('resultMode="shared-table"')
        ->and($quotes)->toContain('rowHref={quoteRowHref}')
        ->and($quotes)->not->toContain('CrmListFooter')
        ->and($quotes)->not->toContain('QuickRecordDrawer');

    expect($board)->toContain('DealPipelineBoard')
        ->and($board)->toContain('DealLayoutToggle')
        ->and($board)->toContain('resultMode="shared-table"')
        ->and($board)->toContain('mode="board"')
        ->and($board)->not->toContain('WorkspaceBoard')
        ->and($board)->not->toContain('BoardDealDrawer');

    expect($kanban)->toContain('Weighted:');

    $pipelineBoard = file_get_contents(resource_path('js/pages/crm/deals/deal-pipeline-board.tsx'));
    expect($pipelineBoard)->toContain('/crm/deals/${dealId}/move');

    expect($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')")
        ->and($routes)->toContain("Route::get('/crm/deals/board'");

    expect($deals)->not->toContain('QuickRecordDrawer')
        ->and($deals)->not->toContain('DealWorkspaceTable')
        ->and($deals)->not->toContain('PipelineKanban')
        ->and($deals)->not->toContain('onRowPeek')
        ->and($workspace)->toContain('onRowPeek is reserved for P09');

    $types = file_get_contents(resource_path('js/ds/workspace/types.ts'));
    expect($types)->toContain('Deals board passes');

    expect($show)->toContain('RecordPageFrame')
        ->and($show)->toContain('/move');
});

it('keeps the Deals Inertia backend shape routes query and board without inventing list query keys', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinic Atlas',
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic fit-out',
        'amount_cents' => 65_000_000,
        'currency' => 'DZD',
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Clinic Atlas inbound',
        'status' => 'new',
    ]);
    Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 0,
    ]);

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals')
            ->has('stages')
            ->has('stagePills')
            ->has('pipeline')
            ->has('pipelines')
            ->has('contacts')
            ->has('members')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('listView.columnDefs')
            ->has('listView.filterFields')
            ->has('listView.columns')
            ->has('recordCount')
            ->has('paginator')
            ->has('bulk')
            ->where('deals.0.id', $deal->id)
            ->where('deals.0.title', 'Clinic fit-out')
            ->where('deals.0.amount_cents', 65_000_000)
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->pluck('id')->values()->all() === [
                'title',
                'stage',
                'amount',
                'close_date',
                'owner',
                'company',
                'contact',
                'attention',
                'health',
                'next_step',
                'last_activity_at',
                'created_at',
            ])
        );

    $this->actingAs($user)
        ->get('/crm/deals?q=Clinic&stage=new&pipeline='.$pipeline->id.'&view=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->where('activeFilters.q', 'Clinic')
            ->where('activeFilters.stage', 'new')
            ->where('activeFilters.view', 'all')
            ->where('pipeline.id', $pipeline->id)
            ->has('deals', 1)
            ->where('deals.0.id', $deal->id)
        );

    $this->actingAs($user)
        ->get('/crm/deals?page=2&pipeline='.$pipeline->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('paginator.page')
            ->where('pipeline.id', $pipeline->id)
        );

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/board'));

    $this->actingAs($user)
        ->get("/crm/deals/{$deal->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/show'));

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/contacts/index'));

    $this->actingAs($user)
        ->get('/crm/companies')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/companies/index'));

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->where('leads.0.id', $lead->id)
        );

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/quotes/index'));

    expect(Route::getRoutes()->getByName('crm.deals.index')?->uri())->toBe('crm/deals')
        ->and(Route::getRoutes()->getByName('crm.deals.board')?->uri())->toBe('crm/deals/board')
        ->and(Route::getRoutes()->getByName('leads.index')?->uri())->toBe('leads');
});
