<?php

it('composes Home as a full workspace without a card stack or max-width stage', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $header = file_get_contents(resource_path('js/components/dashboard/dashboard-header.tsx'));
    $section = file_get_contents(resource_path('js/components/dashboard/dashboard-section.tsx'));

    expect($home)->toContain('data-home="workspace"')
        ->and($home)->toContain('Needs attention')
        ->and($home)->toContain('HomeKpiStrip')
        ->and($home)->not->toContain('max-w-6xl')
        ->and($home)->not->toContain('surface="panel"')
        ->and($home)->not->toContain('CrmKpiStrip')
        ->and($home)->not->toContain('QuickActions')
        ->and($header)->toContain('/crm/deals?create=1')
        ->and($section)->not->toContain('rounded-xl');

    expect(strpos($home, 'Needs attention'))->toBeLessThan(strpos($home, 'title="Performance"'));
});

it('keeps shared KPI and page chrome on hairlines instead of dashboard cards', function () {
    $strip = file_get_contents(resource_path('js/components/crm/crm-kpi-strip.tsx'));
    $page = file_get_contents(resource_path('js/components/page-header.tsx'));
    $object = file_get_contents(resource_path('js/components/crm/crm-object-header.tsx'));
    $room = file_get_contents(resource_path('js/components/crm/room-shell.tsx'));

    expect($strip)->toContain('border-y border-hairline')
        ->and($strip)->toContain('formatCompactDzd')
        ->and($strip)->not->toContain('rounded-2xl')
        ->and($strip)->not->toContain('EvoKpiCard')
        ->and($page)->toContain('mb-4')
        ->and($page)->toContain('text-page-title')
        ->and($object)->toContain('py-2.5')
        ->and($room)->toContain('text-page-title')
        ->and($room)->toContain('pt-3');
});

it('tightens record and Desk work surfaces without changing IA', function () {
    $workspace = file_get_contents(resource_path('js/components/crm/adaptive-workspace-shell.tsx'));
    $identity = file_get_contents(resource_path('js/components/crm/record-hub.tsx'));
    $desk = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));
    $catchUp = file_get_contents(resource_path('js/components/crm/catch-up-block.tsx'));

    expect($workspace)->toContain('px-4 py-3')
        ->and($workspace)->not->toContain('sm:py-6')
        ->and($identity)->toContain('mt-1 flex flex-col gap-2')
        ->and($desk)->toContain('DeskShell')
        ->and($desk)->toContain('AdaptiveWorkspaceShell')
        ->and($desk)->not->toContain('bg-brand/12')
        ->and($desk)->not->toContain('bg-brand/8')
        ->and($catchUp)->not->toContain('rounded-xl');
});
