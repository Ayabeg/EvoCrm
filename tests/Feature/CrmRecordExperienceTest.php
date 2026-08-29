<?php

it('keeps Contact, Company, and Deal records on a shared operable shell', function () {
    $shows = [
        resource_path('js/pages/crm/contacts/show.tsx'),
        resource_path('js/pages/crm/companies/show.tsx'),
        resource_path('js/pages/crm/deals/show.tsx'),
    ];

    foreach ($shows as $path) {
        $src = file_get_contents($path);

        expect($src)->toContain('RecordPageFrame')
            ->and($src)->toContain('RecordIdentity')
            ->and($src)->toContain('RecordActions')
            ->and($src)->toContain('RecordShell')
            ->and($src)->toContain('RecordActivityPanel')
            ->and($src)->toContain('AskEvoPanel')
            ->and($src)->toContain('AskEvoTrigger')
            ->and($src)->not->toContain('HubSpot')
            ->and($src)->not->toContain('key: \'catchup\'')
            ->and($src)->not->toContain('aurora/data-table');
    }
});

it('demotes Ask Evo and keeps a single primary record action', function () {
    $ask = file_get_contents(resource_path('js/components/crm/ask-evo-panel.tsx'));
    $chrome = file_get_contents(resource_path('js/components/crm/record-chrome.tsx'));
    $activity = file_get_contents(resource_path('js/components/crm/record-activity.ts'));

    expect($ask)->not->toContain('fixed end-4 bottom-20')
        ->and($ask)->not->toContain('radial-gradient')
        ->and($ask)->toContain('variant="outline"')
        ->and($ask)->toContain('variant="ghost"')
        ->and($chrome)->toContain('record-action-group')
        ->and($chrome)->toContain("label: 'Note'")
        ->and($chrome)->toContain("label: 'Email'")
        ->and($chrome)->toContain("label: 'Call'")
        ->and($chrome)->toContain("label: 'Task'")
        ->and($chrome)->toContain("label: 'Meeting'")
        ->and($chrome)->toContain('More')
        ->and($chrome)->toContain('defaultPanel="center"')
        ->and($activity)->toContain("key: 'activity'")
        ->and($activity)->toContain("key: 'tasks'")
        ->and($activity)->toContain("key: 'notes'")
        ->and($activity)->toContain('taskId');
});

it('hides empty record facts and keeps status badges off Aurora cyan', function () {
    $hub = file_get_contents(resource_path('js/components/crm/record-hub.tsx'));

    expect($hub)->toContain('hideEmpty')
        ->and($hub)->toContain('RecordNextAction')
        ->and($hub)->toContain('Badge variant="outline"')
        ->and($hub)->not->toContain('Badge variant="default"');
});
