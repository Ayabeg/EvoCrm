<?php

it('gives CRM list pages one workspace shell without room tabs or a card stack', function () {
    $hubs = [
        resource_path('js/pages/crm/contacts/index.tsx'),
        resource_path('js/pages/crm/companies/index.tsx'),
        resource_path('js/pages/crm/deals/index.tsx'),
    ];

    foreach ($hubs as $path) {
        $src = file_get_contents($path);

        expect($src)->toContain('chrome="workspace"')
            ->and($src)->toContain('CrmListShell')
            ->and($src)->toContain('ListViewTable')
            ->and($src)->toContain('hasActiveListFilters')
            ->and($src)->not->toContain('RecordHubPanel')
            ->and($src)->not->toContain('aurora/data-table');
    }

    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $toolbar = file_get_contents(resource_path('js/components/crm/list-toolbar.tsx'));
    $header = file_get_contents(resource_path('js/components/crm/crm-object-header.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $empty = file_get_contents(resource_path('js/components/crm/list-chrome.tsx'));
    $crmShell = file_get_contents(resource_path('js/components/crm/crm-shell.tsx'));

    expect($shell)->toContain('CrmObjectHeader')
        ->and($shell)->toContain('data-crm="list-workspace"')
        ->and($shell)->not->toContain('RecordHubPanel')
        ->and($shell)->not->toContain('RecordHubHeader');

    expect($toolbar)->toContain('SavedViewTabs')
        ->and($toolbar)->toContain('Advanced filters')
        ->and($toolbar)->toContain('CrmActiveFilters')
        ->and($toolbar)->toContain('Sheet')
        ->and($toolbar)->toContain('layoutToggle')
        ->and($toolbar)->toContain('name="q"')
        ->and($toolbar)->not->toContain('Create');

    expect($header)->toContain('text-page-title')
        ->and($header)->toContain('data-crm="object-header"');

    expect($table)->toContain('font-medium text-ink hover:underline')
        ->and($table)->not->toContain('font-medium text-brand hover:underline');

    expect($empty)->toContain('Showing')
        ->and($empty)->toContain('25 per page')
        ->and($empty)->not->toContain('size-10 rounded-xl');

    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    expect($deals)->toContain('Create deal')
        ->and($deals)->toContain('layoutToggle')
        ->and($deals)->toContain('DealLayoutToggle');

    expect($crmShell)->toContain("chrome = 'room'")
        ->and($crmShell)->toContain("chrome === 'workspace'");
});

it('exposes CRM objects on the expanded rail without replacing AppSidebar', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain('CRM_RAIL_OBJECTS')
        ->and($rail)->toContain("data-nav=\"crm-objects\"")
        ->and($rail)->toContain("label: 'Contacts'")
        ->and($rail)->toContain("label: 'Companies'")
        ->and($rail)->toContain("label: 'Deals'")
        ->and($rail)->toContain("label: 'Leads'")
        ->and($rail)->toContain("href: '/crm/leads'")
        ->and($rail)->not->toContain("href: '/leads'")
        ->and($rail)->not->toContain("label: 'Lead board'")
        ->and($rail)->not->toContain('@/components/ui/aurora/sidebar')
        ->and($rail)->toContain("from '@/components/ui/sidebar'");

    expect(strpos($rail, "label: 'Contacts'"))
        ->toBeLessThan(strpos($rail, "label: 'Companies'"))
        ->and(strpos($rail, "label: 'Companies'"))
        ->toBeLessThan(strpos($rail, "label: 'Deals'"))
        ->and(strpos($rail, "label: 'Deals'"))
        ->toBeLessThan(strpos($rail, "label: 'Leads'"));
});

it('keeps the leads list on workspace chrome and retires the duplicate board product', function () {
    $leads = file_get_contents(resource_path('js/pages/crm/leads/index.tsx'));
    $routes = file_get_contents(base_path('routes/web.php'));

    expect($leads)->toContain('chrome="workspace"')
        ->and($leads)->toContain('CrmObjectHeader')
        ->and($leads)->toContain('Create lead')
        ->and($leads)->toContain('CrmEmptyState')
        ->and($leads)->not->toContain('PageHeader')
        ->and($leads)->not->toContain('name="q"');

    expect($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')")
        ->and($routes)->not->toContain('LeadBoardController');
});
