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
 * P06 — Leads workspace migration.
 * Leads joins DataWorkspace shared-table. No bulk. No invented query.
 * Qualification / conversion / deals board stay put.
 */
it('moves Leads onto DataWorkspace shared-table without a domain children path', function () {
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($leads)->toContain('resultMode="shared-table"')
        ->and($leads)->toContain('rows={leads}')
        ->and($leads)->toContain('rowHref={leadRowHref}')
        ->and($leads)->toContain('empty={leadEmptyState')
        ->and($leads)->toContain('paginator={paginator}')
        ->and($leads)->toContain('loading={loading}')
        ->and($leads)->toContain('data-crm="leads-workspace"')
        ->and($leads)->toContain('entity="lead"')
        ->and($leads)->not->toContain('ListViewTable')
        ->and($leads)->not->toContain('CrmEmptyState')
        ->and($leads)->not->toContain('CrmListFooter')
        ->and($leads)->not->toContain('listPageHref')
        ->and($leads)->not->toContain('renderResults')
        ->and($leads)->not->toContain('{(columns)')
        ->and($leads)->not->toContain('CrmShell')
        ->and($leads)->not->toContain('chrome="workspace"')
        ->and($leads)->not->toContain('RoomShell')
        ->and($leads)->not->toContain('QuickRecordDrawer')
        ->and($leads)->not->toContain('onRowPeek')
        ->and($leads)->not->toContain('<table');

    expect($shell)->toContain('resultMode="shared-table"')
        ->and($shell)->toContain('resultMode="domain"')
        ->and($shell)->toContain('rowHref={rowHref}')
        ->and($shell)->toContain('applyLeadColumnContract')
        ->and($shell)->not->toContain('rows={[]}')
        ->and($shell)->not->toContain("empty={{ title: '', body: '' }}");

    expect($workspace)->toContain("resultMode === 'shared-table'")
        ->and($workspace)->toContain('rowHref={props.rowHref}')
        ->and($workspace)->toContain('<ListDataTable')
        ->and($workspace)->toContain('<WorkspaceEmpty')
        ->and($workspace)->toContain('<WorkspacePaginator');
});

it('keeps Leads row identity href columns and selection on the shared contracts', function () {
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $columns = file_get_contents(resource_path('js/pages/crm/leads/lead-columns.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $contract = file_get_contents(resource_path('js/pages/crm/leads/lead-columns-contract.ts'));

    expect($leads)->toContain("mode: 'uncontrolled'")
        ->and($leads)->toContain('selectable: false')
        ->and($leads)->toContain('pageIds: leads.map((lead) => lead.id)')
        ->and($leads)->toContain('Not a permanent bulk ban')
        ->and($leads)->not->toContain('useState<number[]>([])')
        ->and($leads)->not->toContain('setSelectedIds')
        ->and($leads)->not->toContain('BulkActionBar')
        ->and($leads)->not->toContain('type="checkbox"')
        ->and($leads)->not->toContain('/crm/leads/bulk');

    expect($columns)->toContain('export function leadRowHref')
        ->and($columns)->toContain('export function LeadIdentityCell')
        ->and($columns)->toContain('export function applyLeadColumnContract')
        ->and($columns)->toContain("label: 'Lead'")
        ->and($columns)->toContain('leadIdentitySecondary')
        ->and($columns)->toContain('Secondary line is the linked contact')
        ->and($columns)->toContain('flex w-full min-w-0 items-start gap-2')
        ->and($columns)->toContain('block truncate text-[13px] leading-[18px]')
        ->and($columns)->toContain('title={name}')
        ->and($columns)->not->toContain('last_activity')
        ->and($columns)->not->toContain('owner_id')
        ->and($columns)->not->toContain('contacts_count');

    expect($table)->toContain('LeadNameCell')
        ->and($table)->toContain('applyLeadColumnContract')
        ->and($table)->toContain('LeadScorePill')
        ->and($table)->toContain('resolveRowHref(row, rowHref, basePath)')
        ->and($table)->toContain("target.closest('a, input, button, label')")
        ->and($table)->toContain("title: 'w-[40%]'")
        ->and($table)->toContain("status: 'w-[18%]'");

    expect($selection)->toContain('Select-all = current rendered page only')
        ->and($selection)->toContain('togglePageSelectedIds')
        ->and($selection)->toContain('bulkActive: selectedIds.length > 0');

    expect($contract)->toContain('rowHref is /crm/leads/:id')
        ->and($contract)->toContain('true empty vs filtered empty')
        ->and($contract)->toContain('title column relabels to Lead')
        ->and($contract)->toContain('identity secondary is contact');
});

it('preserves Lead create capture inbox and refuses invented query bulk and drawers', function () {
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $controller = file_get_contents(app_path('Http/Controllers/Crm/LeadController.php'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $filterBar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $empty = file_get_contents(resource_path('js/ds/workspace/WorkspaceEmpty.tsx'));
    $adapters = file_get_contents(resource_path('js/lib/list-query/adapters.ts'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));
    $filter = file_get_contents(app_path('Services/Crm/CrmFilter.php'));
    $saved = file_get_contents(app_path('Http/Controllers/Crm/SavedFilterController.php'));

    expect($leads)->toContain('primaryLabel="Create lead"')
        ->and($leads)->toContain('onCreate=')
        ->and($leads)->toContain('hasActiveListFilters(activeFilters)')
        ->and($leads)->toContain('CreateDrawer')
        ->and($leads)->toContain('/crm/leads/captures')
        ->and($leads)->toContain('Capture inbox')
        ->and($leads)->not->toContain('searchParams.set')
        ->and($leads)->not->toContain('history.replaceState')
        ->and($leads)->not->toContain('/crm/leads/bulk')
        ->and($leads)->not->toContain('exportHref')
        ->and($leads)->not->toContain('name="q"');

    expect($controller)->toContain("Inertia::render('crm/leads/index'")
        ->and($controller)->toContain("->limit(100)")
        ->and($controller)->toContain("listViewMeta('lead')")
        ->and($controller)->not->toContain("\$filter->resolve")
        ->and($controller)->not->toContain("apply('lead'")
        ->and($controller)->not->toContain("'activeFilters'")
        ->and($controller)->not->toContain("'savedFilters'");

    expect($adapters)->toContain("object: 'lead'")
        ->and($adapters)->toContain('supportsQuery: false');

    expect($filterBar)->toContain('listQueryAdapter(object).supportsQuery')
        ->and($filterBar)->not->toContain("t('Search leads…')");

    expect($workspace)->toContain('listQueryAdapter(object as ListQueryObject).supportsQuery')
        ->and($workspace)->toContain('onRowPeek is reserved for P09')
        ->and($workspace)->not->toContain('searchParams.set');

    expect($paginator)->toContain("lead: 'leads'")
        ->and($empty)->toContain('as="h2"');

    $leadColumns = collect(ListViewConfig::columns('lead'))->pluck('id')->all();
    $leadFilters = collect(ListViewConfig::filterFields('lead'))->pluck('id')->all();

    expect($leadColumns)->toBe(['title', 'contact', 'status', 'score'])
        ->and($leadFilters)->toBe([])
        ->and($config)->toContain("'lead' => [")
        ->and($config)->toContain("['id' => 'title', 'label' => 'Title', 'defaultVisible' => true]");

    expect($filter)->not->toContain('applyToLeads')
        ->and($saved)->toContain("'in:contact,deal,company'");
});

it('does not migrate Deals Quotes Pipeline or invent QuickRecordDrawer', function () {
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));
    $show = file_get_contents(resource_path('js/pages/crm/leads/show.tsx'));
    $converter = file_get_contents(app_path('Services/Crm/LeadConverter.php'));
    $path = file_get_contents(app_path('Support/LeadPath.php'));
    $qualify = file_get_contents(app_path('Http/Controllers/Crm/LeadController.php'));
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($deals)->toContain('ListViewTable')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->toContain('CrmListFooter')
        ->and($deals)->not->toContain('resultMode=')
        ->and($deals)->not->toContain('QuickRecordDrawer');

    expect($quotes)->toContain('ListViewTable')
        ->and($quotes)->toContain('CrmListFooter')
        ->and($quotes)->not->toContain('resultMode=');

    expect($board)->toContain('PipelineKanban')
        ->and($board)->not->toContain('resultMode=')
        ->and($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')");

    expect($show)->toContain('LeadConversionDialog')
        ->and($show)->toContain('LeadPath')
        ->and($converter)->toContain('public function convert')
        ->and($path)->toContain("'converted'")
        ->and($qualify)->toContain("function qualify")
        ->and($qualify)->toContain("'mode' => ['nullable', 'in:create,link']");

    expect($leads)->not->toContain('QuickRecordDrawer')
        ->and($leads)->not->toContain('LeadWorkspaceTable')
        ->and($leads)->not->toContain('PipelineKanban')
        ->and($workspace)->toContain('onRowPeek is reserved for P09');
});

it('keeps the Leads Inertia backend shape routes and permissions without inventing query', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
    ]);
    $lead = Lead::factory()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'title' => 'Clinic Atlas inbound',
        'status' => 'new',
        'source' => 'manual',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic fit-out',
        'currency' => 'DZD',
    ]);
    Quote::query()->create([
        'workspace_id' => $user->workspace_id,
        'deal_id' => $deal->id,
        'status' => 'draft',
        'currency' => 'DZD',
        'total_cents' => 0,
    ]);

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->has('leads')
            ->has('contacts')
            ->has('listView.columnDefs')
            ->has('listView.filterFields')
            ->has('listView.columns')
            ->has('recordCount')
            ->has('paginator')
            ->missing('activeFilters')
            ->missing('savedFilters')
            ->missing('bulk')
            ->where('leads.0.id', $lead->id)
            ->where('leads.0.title', 'Clinic Atlas inbound')
            ->where('listView.filterFields', [])
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->pluck('id')->values()->all() === ['title', 'contact', 'status', 'score'])
        );

    $this->actingAs($user)
        ->get('/crm/leads?q=ignored&status=working&page=2&view=my')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->has('leads', 1)
            ->where('leads.0.id', $lead->id)
            ->missing('activeFilters')
            ->where('paginator.page', 1)
            ->where('paginator.last_page', 1)
        );

    $this->actingAs($user)
        ->get('/leads')
        ->assertRedirect('/crm/deals/board');

    $this->actingAs($user)
        ->get("/crm/leads/{$lead->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/show'));

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/contacts/index'));

    $this->actingAs($user)
        ->get('/crm/companies')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/companies/index'));

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/index'));

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/board'));

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/quotes/index'));

    expect(Route::getRoutes()->getByName('crm.leads.index')?->uri())->toBe('crm/leads')
        ->and(Route::getRoutes()->getByName('leads.index')?->uri())->toBe('leads')
        ->and(Route::getRoutes()->getByName('crm.leads.qualify')?->uri())->toBe('crm/leads/{lead}/qualify')
        ->and(Route::getRoutes()->getByName('crm.deals.board')?->uri())->toBe('crm/deals/board');
});
