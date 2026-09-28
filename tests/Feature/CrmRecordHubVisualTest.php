<?php

it('keeps CRM record hubs on Aurora adapters without HubSpot chrome or a ListViewTable swap', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $companies = file_get_contents(resource_path('js/pages/crm/companies/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));

    expect($contacts)->toContain('CrmListShell')
        ->and($contacts)->toContain('resultMode="shared-table"')
        ->and($contacts)->not->toContain('aurora/data-table')
        ->and($contacts)->not->toContain('HubSpot');

    expect($companies)->toContain('CrmListShell')
        ->and($companies)->toContain('resultMode="shared-table"')
        ->and($companies)->not->toContain('ListViewTable')
        ->and($companies)->not->toContain('aurora/data-table')
        ->and($companies)->not->toContain('HubSpot');

    expect($deals)->toContain('resultMode="shared-table"')
        ->and($deals)->toContain('CrmListShell')
        ->and($deals)->not->toContain('ListViewTable')
        ->and($deals)->not->toContain('aurora/data-table')
        ->and($deals)->not->toContain('HubSpot');

    $shows = [
        resource_path('js/pages/crm/contacts/show.tsx'),
        resource_path('js/pages/crm/companies/show.tsx'),
        resource_path('js/pages/crm/deals/show.tsx'),
    ];

    foreach ($shows as $path) {
        $src = file_get_contents($path);

        expect($src)->toContain('AskEvoPanel')
            ->and($src)->toContain('RecordShell')
            ->and($src)->not->toContain('HubSpot')
            ->and($src)->not->toContain('@/components/ui/aurora/avatar')
            ->and($src)->not->toContain('aurora/data-table');
    }

    $hub = file_get_contents(resource_path('js/components/crm/record-hub.tsx'));
    $chrome = file_get_contents(resource_path('js/components/crm/record-chrome.tsx'));
    $listTable = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $dealsShow = file_get_contents(resource_path('js/pages/crm/deals/show.tsx'));

    expect($hub)->toContain('@/components/ui/avatar')
        ->and($hub)->toContain('@/components/ui/card')
        ->and($hub)->toContain('RECORD_HUB_RADIUS = 12')
        ->and($hub)->toContain('variant="outline"')
        ->and($chrome)->toContain('AdaptiveWorkspaceShell')
        ->and($chrome)->toContain('@/ds/components/Tabs')
        ->and($chrome)->toContain('@/components/ui/card')
        ->and($chrome)->toContain('record-action-group')
        ->and($chrome)->toContain("label: 'Note'")
        ->and($chrome)->not->toContain('shape="pill"')
        ->and($chrome)->not->toContain('min-h-11')
        ->and($listTable)->toContain('export default function ListViewTable')
        ->and($dealsShow)->toContain('DealLineItems');
});
