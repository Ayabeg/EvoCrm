<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

/**
 * P05 — Companies workspace migration.
 * Companies joins DataWorkspace shared-table. No bulk. No CrmShell.
 */
it('moves Companies onto DataWorkspace shared-table without a domain children path', function () {
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($companies)->toContain('resultMode="shared-table"')
        ->and($companies)->toContain('rows={companies}')
        ->and($companies)->toContain('rowHref={companyRowHref}')
        ->and($companies)->toContain('empty={companyEmptyState')
        ->and($companies)->toContain('paginator={paginator}')
        ->and($companies)->toContain('loading={loading}')
        ->and($companies)->toContain('data-crm="companies-workspace"')
        ->and($companies)->toContain('entity="company"')
        ->and($companies)->not->toContain('ListViewTable')
        ->and($companies)->not->toContain('CrmEmptyState')
        ->and($companies)->not->toContain('CrmListFooter')
        ->and($companies)->not->toContain('listPageHref')
        ->and($companies)->not->toContain('renderResults')
        ->and($companies)->not->toContain('{(columns)')
        ->and($companies)->not->toContain('CrmShell')
        ->and($companies)->not->toContain('chrome="workspace"')
        ->and($companies)->not->toContain('RoomShell')
        ->and($companies)->not->toContain('QuickRecordDrawer')
        ->and($companies)->not->toContain('onRowPeek');

    expect($shell)->toContain('resultMode="shared-table"')
        ->and($shell)->toContain('resultMode="domain"')
        ->and($shell)->toContain('rowHref={rowHref}')
        ->and($shell)->toContain('applyCompanyColumnContract')
        ->and($shell)->not->toContain('rows={[]}')
        ->and($shell)->not->toContain("empty={{ title: '', body: '' }}");

    expect($workspace)->toContain("resultMode === 'shared-table'")
        ->and($workspace)->toContain('rowHref={props.rowHref}')
        ->and($workspace)->toContain('<ListDataTable')
        ->and($workspace)->toContain('<WorkspaceEmpty')
        ->and($workspace)->toContain('<WorkspacePaginator');
});

it('keeps Companies row identity href columns and selection on the shared contracts', function () {
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $columns = file_get_contents(resource_path('js/pages/crm/companies/company-columns.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $contract = file_get_contents(resource_path('js/pages/crm/companies/company-columns-contract.ts'));

    expect($companies)->toContain("mode: 'uncontrolled'")
        ->and($companies)->toContain('selectable: false')
        ->and($companies)->toContain('pageIds: companies.map((company) => company.id)')
        ->and($companies)->toContain('Not a permanent bulk ban')
        ->and($companies)->not->toContain('useState<number[]>([])')
        ->and($companies)->not->toContain('setSelectedIds')
        ->and($companies)->not->toContain('BulkActionBar')
        ->and($companies)->not->toContain('type="checkbox"');

    expect($columns)->toContain('export function companyRowHref')
        ->and($columns)->toContain('export function CompanyIdentityCell')
        ->and($columns)->toContain('export function applyCompanyColumnContract')
        ->and($columns)->toContain("label: 'Company'")
        ->and($columns)->toContain('companyIdentitySecondary')
        ->and($columns)->toContain('Secondary line is compact location')
        ->and($columns)->not->toContain('row.owner?.name')
        ->and($columns)->not->toContain('contacts_count')
        ->and($columns)->not->toContain('deals_count');

    expect($table)->toContain('CompanyNameCell')
        ->and($table)->toContain('applyCompanyColumnContract')
        ->and($table)->toContain('resolveRowHref(row, rowHref, basePath)')
        ->and($table)->toContain("target.closest('a, input, button, label')");

    expect($selection)->toContain('Select-all = current rendered page only')
        ->and($selection)->toContain('togglePageSelectedIds')
        ->and($selection)->toContain('bulkActive: selectedIds.length > 0');

    expect($contract)->toContain('rowHref is /crm/companies/:id')
        ->and($contract)->toContain('true empty vs filtered empty')
        ->and($contract)->toContain('name column relabels to Company')
        ->and($contract)->toContain('identity secondary is compact location');
});

it('preserves Company create filters header and query ownership without inventing bulk', function () {
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $controller = file_get_contents(app_path('Http/Controllers/Crm/CompanyController.php'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $empty = file_get_contents(resource_path('js/ds/workspace/WorkspaceEmpty.tsx'));
    $config = file_get_contents(app_path('Support/ListViewConfig.php'));

    expect($companies)->toContain('primaryLabel="Create company"')
        ->and($companies)->toContain('onCreate=')
        ->and($companies)->toContain('hasActiveListFilters(activeFilters)')
        ->and($companies)->toContain('CreateDrawer')
        ->and($companies)->toContain('cities={cities}')
        ->and($companies)->toContain('wilayas={wilayas}')
        ->and($companies)->not->toContain('searchParams.set')
        ->and($companies)->not->toContain('history.replaceState')
        ->and($companies)->not->toContain('/crm/companies/bulk')
        ->and($companies)->not->toContain('exportHref');

    expect($controller)->toContain("Inertia::render('crm/companies/index'")
        ->and($controller)->toContain("'cities' => config('evosales.cities')")
        ->and($controller)->toContain("'wilayas' => config('evosales.wilayas')")
        ->and($controller)->not->toContain('bulk');

    expect($config)->toContain("['id' => 'city', 'label' => 'City', 'defaultVisible' => true]")
        ->and($config)->toContain("['id' => 'wilaya', 'label' => 'Wilaya', 'defaultVisible' => true]");

    expect($workspace)->not->toContain('searchParams.set');

    expect($paginator)->toContain('workspacePageHref')
        ->and($paginator)->toContain("company: 'companies'")
        ->and($empty)->toContain('as="h2"');
});

it('does not migrate Deals Quotes or Leads and does not invent QuickRecordDrawer', function () {
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($deals)->toContain('ListViewTable')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->toContain('CrmListFooter')
        ->and($deals)->not->toContain('resultMode=')
        ->and($deals)->not->toContain('QuickRecordDrawer');

    expect($quotes)->toContain('ListViewTable')
        ->and($quotes)->toContain('CrmListFooter')
        ->and($quotes)->not->toContain('resultMode=');

    expect($leads)->toContain('<table')
        ->and($leads)->not->toContain('CrmListShell')
        ->and($leads)->not->toContain('DataWorkspace')
        ->and($leads)->not->toContain('resultMode=');

    expect($companies)->not->toContain('QuickRecordDrawer')
        ->and($workspace)->toContain('onRowPeek is reserved for P09');
});

it('keeps the Companies Inertia backend shape routes and permissions', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinic Atlas',
        'city' => 'Hydra',
        'wilaya' => 'Alger',
        'owner_id' => $user->id,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
    ]);
    $pipeline = $user->workspace->defaultPipeline();
    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'company_id' => $company->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinic fit-out',
        'currency' => 'DZD',
    ]);

    $this->actingAs($user)
        ->get('/crm/companies')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/companies/index')
            ->has('companies')
            ->has('listView.columnDefs')
            ->has('listView.filterFields')
            ->has('listView.columns')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
            ->has('members')
            ->has('cities')
            ->has('wilayas')
            ->missing('bulk')
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->contains(
                fn ($def) => ($def['id'] ?? '') === 'wilaya'
            ))
        );

    $this->actingAs($user)
        ->get('/crm/companies?q=atlas&wilaya=Alger&city=Hydra&view=all')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/companies/index')
            ->where('activeFilters.q', 'atlas')
            ->where('activeFilters.wilaya', 'Alger')
            ->where('activeFilters.city', 'Hydra')
        );

    $this->actingAs($user)
        ->get('/crm/companies?page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/companies/index'));

    $this->actingAs($user)
        ->get("/crm/companies/{$company->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/companies/show'));

    $this->actingAs($user)
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/contacts/index'));

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/index'));

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/quotes/index'));

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/index'));
});
