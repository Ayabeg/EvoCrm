<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;

/**
 * P03D — Empty, pagination, board slot helpers.
 * Shared-table helpers work without domain children. Live pages stay domain.
 */

it('exposes empty paginator and board helpers that do not require domain children', function () {
    $surface = file_get_contents(resource_path('js/ds/workspace/surface.ts'));
    $empty = file_get_contents(resource_path('js/ds/workspace/WorkspaceEmpty.tsx'));
    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $table = file_get_contents(resource_path('js/ds/workspace/DataTable.tsx'));
    $contract = file_get_contents(resource_path('js/ds/workspace/surface-contract.ts'));

    expect($surface)->toContain('export function resolveRowHref')
        ->and($surface)->toContain('export function workspacePageHref')
        ->and($surface)->toContain('export function resolveWorkspaceBoardSlot')
        ->and($surface)->toContain('listPageHref')
        ->and($surface)->toContain("input.mode === 'board' && input.board");

    expect($empty)->toContain('data-ds="workspace-empty"')
        ->and($empty)->toContain('as="h2"')
        ->and($empty)->toContain('empty.title');

    expect($paginator)->toContain('data-ds="workspace-paginator"')
        ->and($paginator)->toContain('workspacePageHref')
        ->and($paginator)->toContain('md:px-8')
        ->and($paginator)->toContain("aria-label={t('Pagination')}");

    expect($workspace)->toContain('resolveWorkspaceBoardSlot')
        ->and($workspace)->toContain('<WorkspaceEmpty')
        ->and($workspace)->toContain('<WorkspacePaginator')
        ->and($workspace)->toContain('rowHref={props.rowHref}')
        ->and($workspace)->toContain('boardSurface ??')
        ->and($workspace)->not->toContain('void props.rowHref')
        ->and($workspace)->not->toContain('hasChildren');

    expect($table)->toContain('rowHref: (row: Row) => string')
        ->and($table)->toContain('rowHref={rowHref');

    expect($contract)->toContain('rowHref is consumed instead of being voided')
        ->and($contract)->toContain('page 1 omits page and keeps siblings')
        ->and($contract)->toContain('page 2 keeps search/view/owner/extras')
        ->and($contract)->toContain('deal page nav preserves search/filters/pipeline')
        ->and($contract)->toContain('board slot ready for P11')
        ->and($contract)->toContain('list mode ignores board');
});

it('lets CrmListShell pass the P11 board slot without changing domain pages', function () {
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $listTable = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));

    expect($shell)->toContain('resultMode="domain"')
        ->and($shell)->toContain('resultMode="shared-table"')
        ->and($shell)->toContain('board,')
        ->and($shell)->toContain('onModeChange,')
        ->and($shell)->toContain("mode: mode ?? (entity === 'deal' ? 'list' as const : undefined)")
        ->and($shell)->toContain('CrmEmptyState +')
        ->and($shell)->toContain('CrmListFooter')
        ->and($shell)->not->toContain('rows={[]}');

    expect($listTable)->toContain('resolveRowHref(row, rowHref, basePath)')
        ->and($listTable)->toContain('rowHref?: (row: { id: RowId }) => string');
});

it('keeps Contacts and Companies on shared empty/paginator and other lists on domain footers', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));

    expect($contacts)->toContain('CrmListShell')
        ->and($contacts)->toContain('resultMode="shared-table"')
        ->and($contacts)->toContain('empty={contactEmptyState')
        ->and($contacts)->toContain('paginator={paginator}')
        ->and($contacts)->not->toContain('CrmEmptyState')
        ->and($contacts)->not->toContain('CrmListFooter')
        ->and($contacts)->not->toContain('listPageHref')
        ->and($contacts)->not->toContain('board=');

    expect($companies)->toContain('CrmListShell')
        ->and($companies)->toContain('resultMode="shared-table"')
        ->and($companies)->toContain('empty={companyEmptyState')
        ->and($companies)->toContain('paginator={paginator}')
        ->and($companies)->not->toContain('CrmEmptyState')
        ->and($companies)->not->toContain('CrmListFooter')
        ->and($companies)->not->toContain('listPageHref');

    expect($deals)->toContain('CrmListShell')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->toContain('PipelineSwitcher')
        ->and($deals)->toContain('CrmListFooter')
        ->and($deals)->not->toContain('onModeChange')
        ->and($deals)->not->toContain('board={');

    expect($quotes)->toContain('CrmListShell')
        ->and($quotes)->toContain('CrmListFooter')
        ->and($quotes)->not->toContain('WorkspaceEmpty');

    expect($leads)->toContain('CrmObjectHeader')
        ->and($leads)->toContain('<table')
        ->and($leads)->not->toContain('CrmListShell')
        ->and($leads)->not->toContain('DataWorkspace');

    expect($board)->toContain('PipelineKanban')
        ->and($board)->not->toContain('resultMode=')
        ->and($board)->not->toContain('mode="board"')
        ->and($board)->not->toContain('WorkspaceBoard');
});

it('does not change Inertia list contracts or invent a second query write path', function () {
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $surface = file_get_contents(resource_path('js/ds/workspace/surface.ts'));

    expect($workspace)->not->toContain('searchParams.set')
        ->and($workspace)->not->toContain('history.replaceState')
        ->and($paginator)->toContain('workspacePageHref')
        ->and($surface)->toContain('return listPageHref(basePath, filters, page, extraQuery)');

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
            ->has('paginator')
        );

    $this->actingAs($user)
        ->get('/crm/deals')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/deals/index')
            ->has('deals')
            ->has('pipeline')
            ->has('paginator')
        );

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/board'));
});
