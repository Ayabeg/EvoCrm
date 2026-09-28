<?php

use App\Models\Company;
use App\Models\Contact;
use App\Models\User;

it('lands DataWorkspace with the sketched props and a thin CrmListShell adapter', function () {
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $types = file_get_contents(resource_path('js/ds/workspace/types.ts'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));

    foreach ([
        'js/ds/workspace/DataWorkspace.tsx',
        'js/ds/workspace/SavedViews.tsx',
        'js/ds/workspace/FilterBar.tsx',
        'js/ds/workspace/AdvancedFilterDrawer.tsx',
        'js/ds/workspace/DataTable.tsx',
        'js/ds/workspace/BulkActionBar.tsx',
        'js/ds/workspace/WorkspaceEmpty.tsx',
        'js/ds/workspace/WorkspacePaginator.tsx',
        'js/ds/workspace/surface.ts',
    ] as $path) {
        expect(resource_path($path))->toBeFile();
    }

    expect($types)->toContain("object: DataWorkspaceEntity")
        ->and($types)->toContain('title: string')
        ->and($types)->toContain('views: SavedView[]')
        ->and($types)->toContain('filterFields: ListFieldDef[]')
        ->and($types)->toContain('columnDefs: ListColumnDef[]')
        ->and($types)->toContain("resultMode: 'shared-table'")
        ->and($types)->toContain("resultMode: 'domain'")
        ->and($types)->toContain('rowHref: (row: Row) => string')
        ->and($types)->toContain("mode?: 'list' | 'board'")
        ->and($types)->toContain('selection?: WorkspaceSelectionInput');

    expect($workspace)->toContain('SavedViews')
        ->and($workspace)->toContain('FilterBar')
        ->and($workspace)->toContain('AdvancedFilterDrawer')
        ->and($workspace)->toContain('data-crm="list-workspace"');

    expect($shell)->toContain("from '@/ds/workspace/DataWorkspace'")
        ->and($shell)->toContain('<DataWorkspace')
        ->and($shell)->toContain('activeFilters')
        ->and($shell)->toContain('savedFilters')
        ->and($shell)->toContain('listView')
        ->and($shell)->not->toContain('ListToolbar');
});

it('opens advanced filters in a right Drawer and keeps list-query plus /crm/filters', function () {
    $drawer = file_get_contents(resource_path('js/ds/workspace/AdvancedFilterDrawer.tsx'));
    $views = file_get_contents(resource_path('js/ds/workspace/SavedViews.tsx'));
    $bar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));

    expect($drawer)->toContain("from '@/components/ui/drawer'")
        ->and($drawer)->toContain('side="right"')
        ->and($drawer)->toContain('Advanced filters')
        ->and($drawer)->toContain('filter-builder')
        ->and($drawer)->not->toContain('border-t border-hairline pt-2');

    expect($views)->toContain("from '@/components/crm/list-query'")
        ->and($views)->toContain('action="/crm/filters"')
        ->and($bar)->toContain('navigateListQuery')
        ->and($workspace)->toContain('WorkspacePaginator');
});

it('locks row 48, page pad-x 32, and 36px controls without object-specific CSS', function () {
    $files = [
        'js/ds/workspace/DataWorkspace.tsx',
        'js/ds/workspace/SavedViews.tsx',
        'js/ds/workspace/FilterBar.tsx',
        'js/ds/workspace/AdvancedFilterDrawer.tsx',
        'js/ds/workspace/DataTable.tsx',
        'js/ds/workspace/BulkActionBar.tsx',
        'js/ds/workspace/WorkspaceEmpty.tsx',
        'js/ds/workspace/WorkspacePaginator.tsx',
        'js/ds/workspace/surface.ts',
        'js/ds/chrome/PageHeader.tsx',
    ];

    foreach ($files as $file) {
        $src = file_get_contents(resource_path($file));

        expect($src)->not->toContain('#00A4BD')
            ->and($src)->not->toContain('#0176D3')
            ->and($src)->not->toContain("object === 'contact' ? 'bg-")
            ->and($src)->not->toContain("object === 'deal' ? 'bg-")
            ->and($src)->not->toContain('--aurora-');
    }

    $table = file_get_contents(resource_path('js/ds/workspace/DataTable.tsx'));
    $listTable = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $header = file_get_contents(resource_path('js/ds/chrome/PageHeader.tsx'));
    $bar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $bulk = file_get_contents(resource_path('js/ds/workspace/BulkActionBar.tsx'));

    expect($table)->toContain('h-9')
        ->and($table)->toContain('rowHeight = 36')
        ->and($listTable)->toContain('h-9')
        ->and($header)->toContain('md:px-8')
        ->and($bar)->toContain('md:px-8')
        ->and($bar)->toContain('h-9')
        ->and($bulk)->toContain('h-9')
        ->and($bulk)->toContain('md:px-8');

    $paginator = file_get_contents(resource_path('js/ds/workspace/WorkspacePaginator.tsx'));
    $empty = file_get_contents(resource_path('js/ds/workspace/WorkspaceEmpty.tsx'));

    expect($paginator)->toContain('md:px-8')
        ->and($empty)->toContain('as="h2"');
});

it('keeps the contacts index Inertia contract through the CrmListShell adapter', function () {
    $index = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));

    expect($index)->toContain('CrmListShell')
        ->and($index)->toContain('savedFilters')
        ->and($index)->toContain('activeFilters')
        ->and($index)->toContain('listView')
        ->and($index)->toContain('resultMode="shared-table"');

    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'company_id' => $company->id,
        'owner_id' => $user->id,
        'first_name' => 'Amel',
        'last_name' => 'Hadj',
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
            ->has('cities')
            ->has('wilayas')
        );
});
