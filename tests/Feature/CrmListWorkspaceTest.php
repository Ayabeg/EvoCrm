<?php

it('gives CRM list pages one workspace shell without room tabs or a card stack', function () {
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    expect($companies)->toContain('data-crm="companies-workspace"')
        ->and($companies)->toContain('CrmListShell')
        ->and($companies)->toContain('resultMode="shared-table"')
        ->and($companies)->toContain('hasActiveListFilters')
        ->and($companies)->not->toContain('CrmShell')
        ->and($companies)->not->toContain('chrome="workspace"')
        ->and($companies)->not->toContain('RecordHubPanel')
        ->and($companies)->not->toContain('aurora/data-table');

    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    expect($contacts)->toContain('data-crm="contacts-workspace"')
        ->and($contacts)->toContain('CrmListShell')
        ->and($contacts)->toContain('resultMode="shared-table"')
        ->and($contacts)->toContain('hasActiveListFilters')
        ->and($contacts)->not->toContain('CrmShell')
        ->and($contacts)->not->toContain('RecordHubPanel')
        ->and($contacts)->not->toContain('aurora/data-table');

    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $toolbar = file_get_contents(resource_path('js/components/crm/list-toolbar.tsx'));
    $header = file_get_contents(resource_path('js/components/crm/crm-object-header.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $empty = file_get_contents(resource_path('js/components/crm/list-chrome.tsx'));
    $crmShell = file_get_contents(resource_path('js/components/crm/crm-shell.tsx'));

    expect($shell)->toContain('DataWorkspace')
        ->and($workspace)->toContain('data-crm="list-workspace"')
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
    expect($deals)->toContain('data-crm="deals-workspace"')
        ->and($deals)->toContain('CrmListShell')
        ->and($deals)->toContain('ListViewTable')
        ->and($deals)->toContain('hasActiveListFilters')
        ->and($deals)->toContain('Create deal')
        ->and($deals)->toContain('layoutToggle')
        ->and($deals)->toContain('DealLayoutToggle')
        ->and($deals)->not->toContain('CrmShell')
        ->and($deals)->not->toContain('chrome="workspace"')
        ->and($deals)->not->toContain('RecordHubPanel')
        ->and($deals)->not->toContain('aurora/data-table');

    expect($crmShell)->toContain("chrome = 'room'")
        ->and($crmShell)->toContain("chrome === 'workspace'");
});

it('exposes CRM objects on the icon rail without replacing AppSidebar', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain('CRM_RAIL_OBJECTS')
        ->and($rail)->toContain('data-nav="crm-objects"')
        ->and($rail)->toContain("label: 'Contacts'")
        ->and($rail)->toContain("label: 'Companies'")
        ->and($rail)->toContain("label: 'Deals'")
        ->and($rail)->toContain("label: 'Leads'")
        ->and($rail)->toContain("href: '/crm/leads'")
        ->and($rail)->not->toContain("href: '/leads'")
        ->and($rail)->not->toContain("label: 'Lead board'")
        ->and($rail)->not->toContain('@/components/ui/aurora/sidebar')
        ->and($rail)->toContain("from '@/components/ui/sidebar'")
        ->and($rail)->toContain("from '@phosphor-icons/react'");

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

    expect($leads)->toContain('data-crm="leads-workspace"')
        ->and($leads)->toContain('CrmListShell')
        ->and($leads)->toContain('resultMode="shared-table"')
        ->and($leads)->toContain('Create lead')
        ->and($leads)->toContain('hasActiveListFilters')
        ->and($leads)->not->toContain('CrmShell')
        ->and($leads)->not->toContain('chrome="workspace"')
        ->and($leads)->not->toContain('CrmEmptyState')
        ->and($leads)->not->toContain('name="q"');

    expect($routes)->toContain("Route::redirect('/leads', '/crm/deals/board')")
        ->and($routes)->not->toContain('LeadBoardController');
});
