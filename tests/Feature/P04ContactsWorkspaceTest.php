<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

/**
 * P04 — Contacts workspace migration.
 * Contacts is the first shared-table consumer. Other objects stay domain.
 */

it('moves Contacts onto DataWorkspace shared-table without a domain children path', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($contacts)->toContain('resultMode="shared-table"')
        ->and($contacts)->toContain('rows={contacts}')
        ->and($contacts)->toContain('rowHref={contactRowHref}')
        ->and($contacts)->toContain('empty={contactEmptyState')
        ->and($contacts)->toContain('paginator={paginator}')
        ->and($contacts)->toContain('loading={loading}')
        ->and($contacts)->toContain('data-crm="contacts-workspace"')
        ->and($contacts)->not->toContain('ListViewTable')
        ->and($contacts)->not->toContain('CrmEmptyState')
        ->and($contacts)->not->toContain('CrmListFooter')
        ->and($contacts)->not->toContain('listPageHref')
        ->and($contacts)->not->toContain('renderResults')
        ->and($contacts)->not->toContain('{(columns, selection)')
        ->and($contacts)->not->toContain('QuickRecordDrawer')
        ->and($contacts)->not->toContain('onRowPeek');

    expect($shell)->toContain('resultMode="shared-table"')
        ->and($shell)->toContain('resultMode="domain"')
        ->and($shell)->toContain('rowHref={rowHref}')
        ->and($shell)->not->toContain('rows={[]}')
        ->and($shell)->not->toContain("empty={{ title: '', body: '' }}");

    expect($workspace)->toContain("resultMode === 'shared-table'")
        ->and($workspace)->toContain('rowHref={props.rowHref}')
        ->and($workspace)->toContain('<ListDataTable')
        ->and($workspace)->toContain('<WorkspaceEmpty')
        ->and($workspace)->toContain('<WorkspacePaginator');
});

it('keeps Contacts row identity href columns and selection on the shared contracts', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $columns = file_get_contents(resource_path('js/pages/crm/contacts/contact-columns.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $selection = file_get_contents(resource_path('js/ds/workspace/selection.ts'));
    $contract = file_get_contents(resource_path('js/pages/crm/contacts/contact-columns-contract.ts'));

    expect($contacts)->toContain("mode: 'uncontrolled'")
        ->and($contacts)->toContain('selectable: canBulk')
        ->and($contacts)->toContain('pageIds: contacts.map((contact) => contact.id)')
        ->and($contacts)->toContain('selectedIds={selection.selectedIds}')
        ->and($contacts)->toContain('onClear={selection.clearSelection}')
        ->and($contacts)->not->toContain('useState<number[]>([])')
        ->and($contacts)->not->toContain('setSelectedIds')
        ->and($contacts)->not->toContain('selectedIds={[');

    expect($columns)->toContain('export function contactRowHref')
        ->and($columns)->toContain('export function ContactIdentityCell')
        ->and($columns)->toContain('export function applyContactColumnContract')
        ->and($columns)->toContain("label: 'Contact'")
        ->and($columns)->toContain('contactIdentitySecondary')
        ->and($columns)->toContain('Secondary line is association only')
        ->and($columns)->not->toContain('row.email?.trim()');

    expect($table)->toContain('ContactNameCell')
        ->and($table)->toContain('resolveRowHref(row, rowHref, basePath)')
        ->and($table)->toContain("target.closest('a, input, button, label')")
        ->and($table)->toContain('aria-label="Select page"')
        ->and($table)->toContain("aria-checked={")
        ->and($table)->toContain("'mixed'")
        ->and($table)->toContain('aria-label={`Select ${row.id}`}');

    expect($selection)->toContain('Select-all = current rendered page only')
        ->and($selection)->toContain('togglePageSelectedIds')
        ->and($selection)->toContain('bulkActive: selectedIds.length > 0');

    expect($contract)->toContain('rowHref is /crm/contacts/:id')
        ->and($contract)->toContain('true empty vs filtered empty')
        ->and($contract)->toContain('name column relabels to Contact')
        ->and($contract)->toContain('identity secondary is company only');
});

it('preserves Contact bulk actions permissions header and query ownership', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $bar = file_get_contents(resource_path('js/components/crm/bulk-action-bar.tsx'));
    $dsBar = file_get_contents(resource_path('js/ds/workspace/BulkActionBar.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $empty = file_get_contents(resource_path('js/ds/workspace/WorkspaceEmpty.tsx'));

    expect($contacts)->toContain("from '@/components/crm/bulk-action-bar'")
        ->and($contacts)->toContain("entity=\"contact\"")
        ->and($contacts)->toContain("primaryLabel=\"Create contact\"")
        ->and($contacts)->toContain("href=\"/crm/contacts/duplicates\"")
        ->and($contacts)->toContain("href=\"/crm/contacts/import\"")
        ->and($contacts)->toContain("capabilities.includes('crm.import')")
        ->and($contacts)->toContain("capabilities.includes('crm.merge')")
        ->and($contacts)->toContain('bulk?.enabled')
        ->and($contacts)->toContain('hasActiveListFilters(activeFilters)')
        ->and($contacts)->toContain('CreateDrawer')
        ->and($contacts)->not->toContain('searchParams.set')
        ->and($contacts)->not->toContain('history.replaceState');

    expect($bar)->toContain("['assign_owner', 'enroll_sequence', 'delete']")
        ->and($dsBar)->toContain("'/crm/contacts/bulk'")
        ->and($dsBar)->toContain('ids: selectedIds');

    expect($workspace)->toContain('typeof bulk === \'function\'')
        ->and($workspace)->not->toContain('searchParams.set');

    expect($paginator)->toContain('workspacePageHref')
        ->and($paginator)->toContain('exportHref')
        ->and($paginator)->toContain("contact: 'contacts'")
        ->and($empty)->toContain('as="h2"');
});

it('does not migrate Deals Quotes or Leads and does not invent QuickRecordDrawer', function () {
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($companies)->toContain('CrmListShell')
        ->and($companies)->toContain('resultMode="shared-table"')
        ->and($companies)->not->toContain('CrmShell');

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

    expect($contacts)->not->toContain('QuickRecordDrawer')
        ->and($workspace)->toContain('onRowPeek is reserved for P09');
});

it('keeps the Contacts Inertia backend shape routes and permissions', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
        'email' => 'amel@clinic.dz',
        'lead_status' => 'open',
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
            ->has('listView.columns')
            ->has('savedFilters')
            ->has('activeFilters')
            ->has('recordCount')
            ->has('paginator')
            ->has('members')
            ->has('cities')
            ->has('wilayas')
            ->has('bulk.enabled')
            ->where('listView.columnDefs', fn ($defs) => collect($defs)->contains(
                fn ($def) => ($def['id'] ?? '') === 'lead_status'
            ))
        );

    $this->actingAs($user)
        ->get('/crm/contacts?q=amel&owner='.$user->id.'&view=my')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/contacts/index')
            ->where('activeFilters.q', 'amel')
            ->where('activeFilters.owner', (string) $user->id)
        );

    $this->actingAs($user)
        ->get('/crm/contacts?page=2')
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
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/quotes/index'));

    $this->actingAs($user)
        ->get('/crm/leads')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/leads/index'));
});
