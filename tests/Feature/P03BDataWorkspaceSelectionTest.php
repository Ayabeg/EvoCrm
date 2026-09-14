<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

/**
 * P03B — Selection ownership + bulk state.
 * Shared contract. Domain tables consume it. No URL / backend / bar redesign.
 */

it('defines a typed shared selection contract with explicit controlled and uncontrolled modes', function () {
    $types = file_get_contents(resource_path('js/ds/workspace/types.ts'));
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $contract = file_get_contents(resource_path('js/ds/workspace/data-workspace-contract.ts'));

    expect($selection)->toContain('export type RowId = string | number')
        ->and($selection)->toContain('selectedIds: Id[]')
        ->and($selection)->toContain('isSelected:')
        ->and($selection)->toContain('toggleOne:')
        ->and($selection)->toContain('togglePage:')
        ->and($selection)->toContain('clearSelection:')
        ->and($selection)->toContain('selectedCount:')
        ->and($selection)->toContain('allPageSelected:')
        ->and($selection)->toContain('somePageSelected:')
        ->and($selection)->toContain('bulkActive:')
        ->and($selection)->toContain("mode?: 'uncontrolled'")
        ->and($selection)->toContain("mode: 'controlled'")
        ->and($selection)->toContain('isRowSelectable?')
        ->and($selection)->toContain('Select-all = current rendered page only');

    expect($types)->toContain('selection?: WorkspaceSelectionInput')
        ->and($types)->toContain('renderResults: DataWorkspaceRenderResults')
        ->and($types)->toContain('selection: WorkspaceSelection<Id>')
        ->and($types)->not->toContain('selectedIds?: number[]')
        ->and($types)->not->toContain('selectedIds?: never');

    expect($contract)->toContain("mode: 'uncontrolled'")
        ->and($contract)->toContain("mode: 'controlled'")
        ->and($contract)->toContain('@ts-expect-error uncontrolled selection cannot pass selectedIds')
        ->and($contract)->toContain('@ts-expect-error uncontrolled selection cannot pass onSelectedIdsChange')
        ->and($contract)->toContain('@ts-expect-error controlled selection requires onSelectedIdsChange')
        ->and($contract)->toContain('@ts-expect-error controlled selection requires selectedIds')
        ->and($contract)->toContain('@ts-expect-error controlled selection cannot take defaultSelectedIds')
        ->and($contract)->toContain("id: 'uuid-1'");
});

it('lets DataWorkspace orchestrate selection and bulk-active state in both result modes', function () {
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));

    expect($workspace)->toContain('useWorkspaceSelection')
        ->and($workspace)->toContain('data-bulk-active={selection.bulkActive ? \'true\' : \'false\'}')
        ->and($workspace)->toContain('data-selected-count={selection.selectedCount}')
        ->and($workspace)->toContain('selection.bulkActive && bulk')
        ->and($workspace)->toContain('props.renderResults({ columns, selection })')
        ->and($workspace)->not->toContain("resultMode === 'shared-table' ? (props.selectedIds ?? []) : []");

    expect($shell)->toContain('selection={selection}')
        ->and($shell)->toContain('children(nextColumns, workspaceSelection)')
        ->and($shell)->not->toContain('rows={[]}')
        ->and($shell)->not->toContain('selectedIds={[]}');
});

it('wires Contacts and Deals onto the shared contract without page-local selectedIds state', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));

    expect($contacts)->toContain("mode: 'uncontrolled'")
        ->and($contacts)->toContain('selectable: canBulk')
        ->and($contacts)->toContain('pageIds: contacts.map((contact) => contact.id)')
        ->and($contacts)->toContain('selectedIds={selection.selectedIds}')
        ->and($contacts)->toContain('onClear={selection.clearSelection}')
        ->and($contacts)->not->toContain('useState<number[]>([])')
        ->and($contacts)->not->toContain('setSelectedIds');

    expect($deals)->toContain("mode: 'uncontrolled'")
        ->and($deals)->toContain('selectable: canBulk')
        ->and($deals)->toContain('pageIds: deals.map((deal) => deal.id)')
        ->and($deals)->toContain('(columns, selection)')
        ->and($deals)->toContain('selection.bulkActive')
        ->and($deals)->toContain('onClear={selection.clearSelection}')
        ->and($deals)->not->toContain('useState<number[]>([])')
        ->and($deals)->not->toContain('setSelectedIds');
});

it('wires Companies and Quotes to the contract without inventing selectable bulk UI', function () {
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));

    expect($companies)->toContain("mode: 'uncontrolled'")
        ->and($companies)->toContain('selectable: false')
        ->and($companies)->toContain('pageIds: companies.map((company) => company.id)')
        ->and($companies)->toContain('Not a permanent bulk ban')
        ->and($companies)->not->toContain('selectable={true}')
        ->and($companies)->not->toContain('BulkActionBar')
        ->and($companies)->not->toContain('type="checkbox"');

    expect($quotes)->toContain("mode: 'uncontrolled'")
        ->and($quotes)->toContain('selectable: false')
        ->and($quotes)->toContain('pageIds: quotes.map((quote) => quote.id)')
        ->and($quotes)->toContain('Not a permanent bulk ban')
        ->and($quotes)->not->toContain('BulkActionBar')
        ->and($quotes)->not->toContain('type="checkbox"');
});

it('defers Leads selection because the list is still a raw table outside CrmListShell', function () {
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));

    expect($leads)->toContain('<table')
        ->and($leads)->not->toContain('CrmListShell')
        ->and($leads)->not->toContain('useWorkspaceSelection')
        ->and($leads)->not->toContain('selection={{')
        ->and($leads)->not->toContain('type="checkbox"')
        ->and($leads)->not->toContain('BulkActionBar');
});

it('preserves select-all as the current rendered page and marks indeterminate', function () {
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $dataTable = file_get_contents(resource_path('js/ds/workspace/DataTable.tsx'));
    $proofs = file_get_contents(resource_path('js/ds/workspace/selection-contract.ts'));

    expect($selection)->toContain('Select-all = current rendered page only')
        ->and($selection)->toContain('Dataset-wide select-all does not exist')
        ->and($selection)->toContain('Object.is')
        ->and($selection)->toContain('1` and `"1"` are different ids')
        ->and($selection)->toContain('Header flags are computed against CURRENT PAGE ids only')
        ->and($selection)->toContain('bulkActive: selectedIds.length > 0')
        ->and($table)->toContain('element.indeterminate = somePageSelected')
        ->and($table)->toContain("aria-checked={")
        ->and($table)->toContain("'mixed'")
        ->and($table)->toContain('aria-label="Select page"')
        ->and($table)->toContain('aria-label={`Select ${row.id}`}')
        ->and($dataTable)->toContain('element.indeterminate = somePageSelected')
        ->and($dataTable)->toContain('onTogglePage()')
        ->and($proofs)->toContain('select-all is current page and keeps other pages')
        ->and($proofs)->toContain('page2 deselect-all returns [1,2] not []')
        ->and($proofs)->toContain('indeterminate ignores other-page ids')
        ->and($proofs)->toContain('number 1 is not string 1')
        ->and($proofs)->toContain('select-all excludes non-selectable rows')
        ->and($proofs)->toContain('other-page ids keep bulkActive true')
        ->and($proofs)->toContain('unselectable protected')
        ->and($proofs)->toContain('string row ids');
});

it('does not redesign the bulk bar or change the bulk POST shape', function () {
    $dsBar = file_get_contents(resource_path('js/ds/workspace/BulkActionBar.tsx'));
    $domainBar = file_get_contents(resource_path('js/components/crm/bulk-action-bar.tsx'));
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));

    expect($dsBar)->toContain("actionPathFor")
        ->and($dsBar)->toContain("'/crm/contacts/bulk'")
        ->and($dsBar)->toContain("'/crm/deals/bulk'")
        ->and($dsBar)->toContain('ids: selectedIds')
        ->and($dsBar)->toContain('owner_id:')
        ->and($dsBar)->toContain('sequence_id:')
        ->and($dsBar)->toContain('stage_id:')
        ->and($dsBar)->toContain('data-ds="bulk-action-bar"')
        ->and($dsBar)->toContain('sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-hairline bg-white px-4 py-2 md:px-8');

    expect($domainBar)->toContain("from '@/ds/workspace/BulkActionBar'")
        ->and($contacts)->toContain("from '@/components/crm/bulk-action-bar'")
        ->and($deals)->toContain("from '@/components/crm/bulk-action-bar'");
});

it('leaves list-query URL keys and page filter write paths untouched', function () {
    $query = file_get_contents(resource_path('js/components/crm/list-query.ts'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));

    expect($query)->toContain('view: filters.view')
        ->and($query)->toContain('q: filters.q')
        ->and($query)->toContain('owner: filters.owner')
        ->and($query)->toContain('filter_id: filters.filter_id')
        ->and($query)->toContain('filter_groups: filters.filter_groups')
        ->and($query)->toContain('page: page > 1 ? page : null');

    expect($shell)->toContain('viewHref(')
        ->and($shell)->toContain('listQueryHref(')
        ->and($shell)->toContain('preserveState: true')
        ->and($workspace)->not->toContain('searchParams.set')
        ->and($workspace)->not->toContain('history.replaceState')
        ->and($contacts)->toContain('hasActiveListFilters');
});

it('keeps Contacts Companies Deals Quotes and Leads Inertia contracts', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
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
        ->get('/crm/contacts')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->has('contacts')
            ->has('listView.columnDefs')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
        );

    $this->actingAs($user)
        ->get('/crm/companies')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/companies/index')
            ->has('companies')
            ->has('listView.columnDefs')
            ->has('savedFilters')
            ->has('activeFilters')
        );

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals')
            ->has('pipeline')
            ->has('stages')
        );

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->has('quotes')
            ->has('deals')
        );

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/leads/index')
            ->has('leads')
            ->has('contacts')
        );
});
