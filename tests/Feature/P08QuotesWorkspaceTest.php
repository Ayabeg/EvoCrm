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
 * P08 — Quotes list workspace migration.
 * Quotes list joins DataWorkspace shared-table. Builder / send / accept stay put.
 * P03C query adapter is mapped, not replaced. No bulk. Saved views stay consume-only.
 *
 * Locks the 38 P08 acceptance items: list-only boundary, shared-table migration,
 * query/search/saved-view honesty, selection decision, identity/customer/status/
 * money/validity/deal, nav/actions/create, filters/columns/width/empty/pagination/
 * loading, visual baseline, first-wave consistency, no P09/P18 reopen.
 */
it('moves Quotes list onto DataWorkspace shared-table without a domain children path', function () {
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($quotes)->toContain('resultMode="shared-table"')
        ->and($quotes)->toContain('rows={quotes}')
        ->and($quotes)->toContain('rowHref={quoteRowHref}')
        ->and($quotes)->toContain('empty={quoteEmptyState')
        ->and($quotes)->toContain('paginator={paginator}')
        ->and($quotes)->toContain('loading={loading}')
        ->and($quotes)->toContain('data-crm="quotes-workspace"')
        ->and($quotes)->toContain('entity="quote"')
        ->and($quotes)->toContain('primaryLabel="Create quote"')
        ->and($quotes)->toContain('MorphingForm')
        ->and($quotes)->toContain('/crm/deals/${dealId}/quotes')
        ->and($quotes)->not->toContain('ListViewTable')
        ->and($quotes)->not->toContain('CrmEmptyState')
        ->and($quotes)->not->toContain('CrmListFooter')
        ->and($quotes)->not->toContain('listPageHref')
        ->and($quotes)->not->toContain('renderResults')
        ->and($quotes)->not->toContain('{(columns)')
        ->and($quotes)->not->toContain('CrmShell')
        ->and($quotes)->not->toContain('chrome="workspace"')
        ->and($quotes)->not->toContain('RoomShell')
        ->and($quotes)->not->toContain('QuickRecordDrawer')
        ->and($quotes)->not->toContain('onRowPeek')
        ->and($quotes)->not->toContain('QuoteWorkspaceTable')
        ->and($quotes)->not->toContain('QuotePaginator')
        ->and($quotes)->not->toContain('QuoteSavedViews')
        ->and($quotes)->not->toContain('QuoteFilterBar')
        ->and($quotes)->not->toContain('<table');

    expect($shell)->toContain('resultMode="shared-table"')
        ->and($shell)->toContain('resultMode="domain"')
        ->and($shell)->toContain('rowHref={rowHref}')
        ->and($shell)->toContain('applyQuoteColumnContract')
        ->and($shell)->toContain("quote: 'quotes'")
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

it('keeps Quotes row identity customer status money validity deal and selection on the shared contracts', function () {
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $columns = file_get_contents(resource_path('js/pages/crm/quotes/quote-columns.tsx'));
    $table = file_get_contents(resource_path('js/evo/data/crm-list/table.tsx')).file_get_contents(resource_path('js/evo/data/crm-list/cells.tsx'));
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $contract = file_get_contents(resource_path('js/pages/crm/quotes/quote-columns-contract.ts'));
    $controller = file_get_contents(app_path('Http/Controllers/Crm/QuoteController.php'));

    expect($quotes)->toContain("mode: 'uncontrolled'")
        ->and($quotes)->toContain('selectable: false')
        ->and($quotes)->toContain('Not a permanent bulk ban')
        ->and($quotes)->toContain('pageIds: quotes.map((quote) => quote.id)')
        ->and($quotes)->not->toContain('BulkActionBar')
        ->and($quotes)->not->toContain('useState<number[]>([])')
        ->and($quotes)->not->toContain('setSelectedIds')
        ->and($quotes)->not->toContain('type="checkbox"');

    expect($columns)->toContain('export function quoteRowHref')
        ->and($columns)->toContain('export function QuoteIdentityCell')
        ->and($columns)->toContain('export function applyQuoteColumnContract')
        ->and($columns)->toContain("label: 'Quote'")
        ->and($columns)->toContain('quoteIdentitySecondary')
        ->and($columns)->toContain('Customer lives on the Deal')
        ->and($columns)->toContain('flex w-full min-w-0 items-start gap-2')
        ->and($columns)->toContain('block truncate text-[13px] leading-[18px]')
        ->and($columns)->toContain('title={name}')
        ->and($columns)->toContain('export function QuoteAmountCell')
        ->and($columns)->toContain('formatDzd')
        ->and($columns)->toContain('export function QuoteStatusCell')
        ->and($columns)->toContain("tone === 'accepted'")
        ->and($columns)->toContain("tone === 'sent'")
        ->and($columns)->toContain("tone === 'draft'")
        ->and($columns)->toContain('text-mute')
        ->and($columns)->toContain("['draft', 'sent', 'accepted']")
        ->and($columns)->toContain('Do not infer expired from expires_at')
        ->and($columns)->toContain('Customer lives on the Deal')
        ->and($columns)->toContain('Do not invent a universal')
        ->and($columns)->not->toContain('forecast')
        ->and($columns)->not->toContain('QuickRecordDrawer');

    expect($table)->toContain('QuoteNameCell')
        ->and($table)->toContain('QuoteStatusCell')
        ->and($table)->toContain('QuoteAmountCell')
        ->and($table)->toContain('applyQuoteColumnContract')
        ->and($table)->toContain('resolveRowHref(row, rowHref, basePath)')
        ->and($table)->toContain("target.closest('a, input, button, label')")
        ->and($table)->toContain("title: 'w-[26%] min-w-[12rem]'")
        ->and($table)->toContain("status: 'w-[10%] min-w-[6.5rem]'")
        ->and($table)->toContain("amount: 'w-[16%] min-w-[8.5rem]'")
        ->and($table)->toContain('table-fixed min-w-[64rem]');

    expect($selection)->toContain('Select-all = current rendered page only')
        ->and($selection)->toContain('togglePageSelectedIds')
        ->and($selection)->toContain('bulkActive: selectedIds.length > 0');

    expect($controller)->toContain("'deal' => \$quote->deal ? [")
        ->and($controller)->toContain("'total_cents' => \$quote->total_cents")
        ->and($controller)->toContain("'expires_at' => \$quote->expires_at")
        ->and($controller)->toContain("'draft', 'sent', 'accepted'");

    expect($contract)->toContain('rowHref is /crm/quotes/:id')
        ->and($contract)->toContain('true empty vs filtered empty')
        ->and($contract)->toContain('title column relabels to Quote')
        ->and($contract)->toContain('identity is deal title with quote number secondary')
        ->and($contract)->toContain('amount uses existing formatDzd')
        ->and($contract)->toContain('statuses are draft sent accepted')
        ->and($contract)->toContain('do not invent expired status');
});

it('preserves Quote query adapter search saved-view consume-only filters create and pagination without inventing bulk', function () {
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $controller = file_get_contents(app_path('Http/Controllers/Crm/QuoteController.php'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $filterBar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $saved = file_get_contents(resource_path('js/ds/workspace/SavedViews.tsx'));
    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $empty = file_get_contents(resource_path('js/ds/workspace/WorkspaceEmpty.tsx'));
    $adapters = file_get_contents(resource_path('js/lib/list-query/adapters.ts'));
    $contract = file_get_contents(resource_path('js/lib/list-query/list-query-contract.ts'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));
    $dataTable = file_get_contents(resource_path('js/ds/workspace/DataTable.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));

    expect($quotes)->toContain('primaryLabel="Create quote"')
        ->and($quotes)->toContain('onCreate=')
        ->and($quotes)->toContain('hasActiveListFilters(activeFilters)')
        ->and($quotes)->toContain('MorphingForm')
        ->and($quotes)->toContain('items[0][unit_dzd]')
        ->and($quotes)->not->toContain('searchParams.set')
        ->and($quotes)->not->toContain('history.replaceState')
        ->and($quotes)->not->toContain('name="q"');

    expect($controller)->toContain("Inertia::render('crm/quotes/index'")
        ->and($controller)->toContain("Inertia::render('crm/quotes/show'")
        ->and($controller)->toContain("'savedFilters' => \$hub->filters(\$workspace, 'quote', \$user)")
        ->and($controller)->toContain("apply('quote'")
        ->and($controller)->toContain("in_array(\$status, ['draft', 'sent', 'accepted'], true)")
        ->and($controller)->toContain('latest(\'id\')')
        ->and($controller)->toContain('$filter->paginate');

    expect($adapters)->toContain("object: 'quote'")
        ->and($adapters)->toContain('supportsQuery: true')
        ->and($adapters)->toContain("searchParam: 'q'")
        ->and($adapters)->toContain('filterKeys: QUOTE_FILTER_KEYS')
        ->and($adapters)->toContain("'owner',")
        ->and($adapters)->toContain("'created',")
        ->and($adapters)->toContain("'status',");

    expect($contract)->toContain('quotes request shape');

    expect($filterBar)->toContain("t('Search quotes…')")
        ->and($filterBar)->toContain("object === 'quote'")
        ->and($filterBar)->not->toContain('searchParams.set');

    expect($saved)->toContain("object === 'ticket' || object === 'quote' ? null")
        ->and($saved)->toContain("t('Add view')");

    expect($workspace)->not->toContain('searchParams.set');

    expect($paginator)->toContain("quote: 'quotes'")
        ->and($empty)->toContain('as="h2"');

    $quoteColumns = collect(ListViewConfig::columns('quote'))->pluck('id')->all();
    $quoteFilters = collect(ListViewConfig::filterFields('quote'))->pluck('id')->all();

    expect($quoteColumns)->toBe([
        'title',
        'amount',
        'status',
        'owner',
        'created_at',
        'expires_at',
        'sent_at',
    ])
        ->and($quoteFilters)->toBe([
            'status',
            'owner',
            'created',
        ])
        ->and($config)->toContain("['id' => 'title', 'label' => 'Quote', 'defaultVisible' => true]")
        ->and($config)->toContain("'options' => ['draft', 'sent', 'accepted']");

    expect($dataTable)->toContain("object === 'company' || object === 'lead' || object === 'deal' || object === 'quote'");

    expect($routes)->not->toContain('crm/quotes/bulk')
        ->and($routes)->toContain("Route::post('/crm/deals/{deal}/quotes'");
});

it('does not migrate Tickets Deals board or invent QuickRecordDrawer builder or quote lifecycle', function () {
    $tickets = file_get_contents(resource_path('js/pages/crm/tickets/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));
    $kanban = file_get_contents(resource_path('js/components/crm/pipeline-kanban.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $show = file_get_contents(resource_path('js/pages/crm/quotes/show.tsx'));
    $public = file_get_contents(resource_path('js/pages/public/quote.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $mailer = file_get_contents(app_path('Services/Crm/QuoteMailer.php'));
    $acceptor = file_get_contents(app_path('Services/Crm/QuoteAcceptor.php'));
    $totals = file_get_contents(app_path('Services/Crm/QuoteTotals.php'));

    expect($tickets)->toContain('resultMode="shared-table"')
        ->and($tickets)->toContain('rowHref={ticketRowHref}')
        ->and($tickets)->not->toContain('ListViewTable')
        ->and($tickets)->not->toContain('CrmListFooter');

    expect($board)->toContain('DealPipelineBoard')
        ->and($board)->toContain('DealLayoutToggle')
        ->and($board)->toContain('resultMode="shared-table"')
        ->and($board)->toContain('mode="board"')
        ->and($board)->not->toContain('WorkspaceBoard')
        ->and($board)->not->toContain('BoardDealDrawer');

    $pipelineBoard = file_get_contents(resource_path('js/pages/crm/deals/deal-pipeline-board.tsx'));
    expect($pipelineBoard)->toContain('/crm/deals/${dealId}/move')
        ->and($kanban)->toContain('Weighted:');

    expect($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')")
        ->and($routes)->toContain("Route::get('/crm/deals/board'");

    expect($quotes)->not->toContain('QuickRecordDrawer')
        ->and($quotes)->not->toContain('onRowPeek')
        ->and($quotes)->not->toContain('QuoteBuilder')
        ->and($workspace)->toContain('onRowPeek is reserved for P09');

    expect($show)->toContain('RecordPageFrame')
        ->and($show)->toContain('Preview PDF')
        ->and($public)->toContain('Accept quote')
        ->and($mailer)->toContain('function send')
        ->and($acceptor)->toContain('lockForUpdate')
        ->and($totals)->toContain('function sync');

    expect($deals)->toContain('resultMode="shared-table"')
        ->and($deals)->toContain('DealLayoutToggle');
});

it('keeps the Quotes Inertia backend shape routes query and lifecycle without inventing list query keys', function () {
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
        'title' => 'Clinic landing page',
        'amount_cents' => 500_000,
        'currency' => 'DZD',
    ]);
    $quote = Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 500_000,
        'expires_at' => now()->addDays(14),
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Clinic Atlas inbound',
        'status' => 'new',
    ]);

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->has('quotes')
            ->has('deals')
            ->has('members')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('listView.columnDefs')
            ->has('listView.filterFields')
            ->has('listView.columns')
            ->has('recordCount')
            ->has('paginator')
            ->where('savedFilters', [])
            ->where('quotes.0.id', $quote->id)
            ->where('quotes.0.title', 'Clinic landing page')
            ->where('quotes.0.status', 'draft')
            ->where('quotes.0.total_cents', 500_000)
            ->where('quotes.0.deal.id', $deal->id)
            ->where('quotes.0.deal.title', 'Clinic landing page')
            ->where('quotes.0.owner.name', $user->name)
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->pluck('id')->values()->all() === [
                'title',
                'amount',
                'status',
                'owner',
                'created_at',
                'expires_at',
                'sent_at',
            ])
        );

    $this->actingAs($user)
        ->get('/crm/quotes?q=Clinic&status=draft&view=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->where('activeFilters.q', 'Clinic')
            ->where('activeFilters.status', 'draft')
            ->where('activeFilters.view', 'all')
            ->has('quotes', 1)
            ->where('quotes.0.id', $quote->id)
        );

    $this->actingAs($user)
        ->get('/crm/quotes?page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->has('paginator.page')
        );

    $this->actingAs($user)
        ->get("/crm/quotes/{$quote->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/quotes/show'));

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
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->where('deals.0.id', $deal->id)
        );

    expect(Route::getRoutes()->getByName('crm.quotes.index')?->uri())->toBe('crm/quotes')
        ->and(Route::getRoutes()->getByName('crm.quotes.show')?->uri())->toBe('crm/quotes/{quote}')
        ->and(Route::getRoutes()->getByName('crm.quotes.store')?->uri())->toBe('crm/deals/{deal}/quotes')
        ->and(Route::getRoutes()->getByName('crm.quotes.bulk'))->toBeNull();
});
