<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

/**
 * P03A — DataWorkspace ownership contract.
 * Domain-result mode is truthful. No fake rows. Selection / URL / backend stay put.
 */

it('lets domain-result mode render without fake rows', function () {
    $types = file_get_contents(resource_path('js/ds/workspace/types.ts'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $contract = file_get_contents(resource_path('js/ds/workspace/data-workspace-contract.ts'));

    expect($types)->toContain("resultMode: 'shared-table'")
        ->and($types)->toContain("resultMode: 'domain'")
        ->and($types)->toContain('renderResults: DataWorkspaceRenderResults')
        ->and($types)->toContain('rows?: never')
        ->and($types)->toContain('children?: never');

    expect($workspace)->toContain('resultMode')
        ->and($workspace)->toContain('data-result-mode={resultMode}')
        ->and($workspace)->toContain('props.renderResults')
        ->and($workspace)->not->toContain('hasChildren')
        ->and($workspace)->not->toContain('children !== undefined');

    expect($contract)->toContain("resultMode: 'domain'")
        ->and($contract)->toContain('@ts-expect-error domain mode cannot accept fake rows')
        ->and($contract)->toContain('@ts-expect-error shared-table cannot also mount a domain result surface');
});

it('stops CrmListShell from passing rows={[]} or stub selection', function () {
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));

    expect($shell)->toContain('resultMode="domain"')
        ->and($shell)->toContain('resultMode="shared-table"')
        ->and($shell)->toContain('renderResults=')
        ->and($shell)->toContain("from '@/ds/workspace/DataWorkspace'")
        ->and($shell)->not->toContain('rows={[]}')
        ->and($shell)->not->toContain('selectedIds={[]}')
        ->and($shell)->not->toContain('onSelectedIdsChange={() => undefined}')
        ->and($shell)->not->toContain("empty={{ title: '', body: '' }}");
});

it('keeps Contacts Companies Deals Quotes and Leads list behavior on the same owners', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $tickets = file_get_contents(resource_path('js/pages/crm/tickets/index.tsx'));

    expect($contacts)->toContain('CrmListShell')
        ->and($contacts)->toContain('resultMode="shared-table"')
        ->and($contacts)->toContain('rows={contacts}')
        ->and($contacts)->toContain('rowHref={contactRowHref}')
        ->and($contacts)->not->toContain('ListViewTable')
        ->and($contacts)->not->toContain('CrmEmptyState')
        ->and($contacts)->not->toContain('CrmListFooter')
        ->and($contacts)->not->toContain('DataWorkspace');

    expect($companies)->toContain('CrmListShell')
        ->and($companies)->toContain('ListViewTable')
        ->and($companies)->toContain('CrmEmptyState')
        ->and($companies)->toContain('chrome="workspace"')
        ->and($companies)->not->toContain('resultMode=');

    expect($deals)->toContain('CrmListShell')
        ->and($deals)->toContain('ListViewTable')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->toContain('PipelineSwitcher')
        ->and($deals)->not->toContain('resultMode=');

    expect($quotes)->toContain('CrmListShell')
        ->and($quotes)->toContain('ListViewTable')
        ->and($quotes)->toContain('primaryLabel="Create quote"')
        ->and($quotes)->not->toContain('resultMode=');

    expect($leads)->toContain('CrmObjectHeader')
        ->and($leads)->toContain('chrome="workspace"')
        ->and($leads)->toContain('<table')
        ->and($leads)->not->toContain('CrmListShell')
        ->and($leads)->not->toContain('DataWorkspace')
        ->and($leads)->not->toContain('ListViewTable');

    expect($tickets)->toContain('CrmListShell')
        ->and($tickets)->toContain('ListViewTable')
        ->and($tickets)->toContain('TicketLayoutToggle')
        ->and($tickets)->not->toContain('resultMode=');
});

it('keeps domain pages off the shared-table result mode after selection hoist', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($contacts)->toContain("entity=\"contact\"")
        ->and($contacts)->toContain('resultMode="shared-table"')
        ->and($deals)->not->toContain('resultMode=')
        ->and($shell)->toContain('resultMode="domain"')
        ->and($workspace)->toContain('useWorkspaceSelection');
});

it('preserves list-query URL keys and does not add a second write path', function () {
    $query = file_get_contents(resource_path('js/components/crm/list-query.ts'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($query)->toContain('view: filters.view')
        ->and($query)->toContain('q: filters.q')
        ->and($query)->toContain('owner: filters.owner')
        ->and($query)->toContain('filter_id: filters.filter_id')
        ->and($query)->toContain('filter_groups: filters.filter_groups')
        ->and($query)->toContain('page: page > 1 ? page : null');

    expect($shell)->toContain('viewHref(')
        ->and($shell)->toContain('listQueryHref(')
        ->and($shell)->toContain('preserveState: true')
        ->and($shell)->toContain('AdvancedFilterDrawer applies via GET + list-query')
        ->and($workspace)->toContain('WorkspacePaginator')
        ->and($workspace)->not->toContain('searchParams.set')
        ->and($workspace)->not->toContain('history.replaceState');
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
            ->has('listView.filterFields')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
            ->has('members')
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
            ->has('recordCount')
            ->has('paginator')
        );

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals')
            ->has('listView.columnDefs')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
            ->has('pipeline')
            ->has('stages')
        );

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/quotes/index')
            ->has('quotes')
            ->has('listView.columnDefs')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
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
