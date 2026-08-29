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
    $glass = file_get_contents(resource_path('js/components/desk/desk-glass.tsx'));
    $catchUp = file_get_contents(resource_path('js/components/crm/catch-up-block.tsx'));

    expect($workspace)->toContain('px-4 py-3')
        ->and($workspace)->not->toContain('sm:py-6')
        ->and($identity)->toContain('mt-1 flex flex-col gap-2')
        ->and($desk)->toContain('DeskShell')
        ->and($desk)->toContain('AdaptiveWorkspaceShell')
        ->and($desk)->toContain('Select a conversation')
        ->and($desk)->not->toContain('bg-brand/12')
        ->and($desk)->not->toContain('bg-brand/8')
        ->and($glass)->toContain('bg-canvas')
        ->and($glass)->not->toContain('aurora-panel-strong')
        ->and($catchUp)->not->toContain('rounded-xl');
});

it('destacks Outbound and Reports chrome without inventing a second system', function () {
    $reports = file_get_contents(resource_path('js/components/crm/reports-shell.tsx'));
    $outbound = file_get_contents(resource_path('js/components/crm/outbound-shell.tsx'));
    $index = file_get_contents(resource_path('js/pages/outbound/index.tsx'));
    $page = file_get_contents(resource_path('js/pages/crm/reports.tsx'));
    $list = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));

    expect($reports)->toContain('title="Reports"')
        ->and($reports)->not->toContain('text-page-title')
        ->and($reports)->toContain('px-4 py-3 md:px-5 md:py-4')
        ->and($reports)->not->toContain('max-w-7xl')
        ->and($reports)->not->toContain('text-[1.75rem]')
        ->and($outbound)->toContain('space-y-4 px-4 py-3')
        ->and($outbound)->not->toContain('max-w-7xl')
        ->and($index)->not->toContain('from \'@/components/ui/card\'')
        ->and($index)->not->toContain('text-brand')
        ->and($page)->not->toContain('rounded-2xl')
        ->and($page)->not->toContain('mb-8')
        ->and($page)->toContain('Add widget')
        ->and($list)->toContain('py-1.5')
        ->and($board)->toContain("toLocaleDateString('en-GB'");
});

it('keeps Reports room identity singular and destacks leftover rooms', function () {
    $shell = file_get_contents(resource_path('js/components/crm/reports-shell.tsx'));

    expect($shell)->toContain('title="Reports"')
        ->and($shell)->not->toContain('text-page-title')
        ->and($shell)->toContain("innerTitle !== 'Reports'");
});

it('destacks leftover Reports charts, Outbound rooms, and extra orange primaries', function () {
    $chart = file_get_contents(resource_path('js/evoviz/evo-viz-chart.tsx'));
    $reports = file_get_contents(resource_path('js/pages/crm/reports.tsx'));
    $campaigns = file_get_contents(resource_path('js/pages/outbound/campaigns/index.tsx'));
    $templates = file_get_contents(resource_path('js/pages/outbound/templates/index.tsx'));
    $outbox = file_get_contents(resource_path('js/pages/outbound/outbox.tsx'));
    $domains = file_get_contents(resource_path('js/pages/outbound/domains/index.tsx'));

    expect($chart)->not->toContain('rounded-2xl')
        ->and($chart)->toContain('border border-hairline px-4 py-3')
        ->and($campaigns)->toContain('OutboundPage')
        ->and($campaigns)->not->toContain('PageHeader')
        ->and($campaigns)->not->toContain("from '@/components/ui/card'")
        ->and($templates)->toContain('OutboundPage')
        ->and($templates)->not->toContain('PageHeader')
        ->and($outbox)->toContain('OutboundPage')
        ->and($outbox)->not->toContain('PageHeader')
        ->and($domains)->toContain('OutboundPage')
        ->and($domains)->not->toContain('PageHeader');

    expect(substr_count($reports, 'bg-brand'))->toBe(1)
        ->and($reports)->toContain('Add widget');
});
