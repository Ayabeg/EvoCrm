<?php

it('gives Reports one room identity instead of a stacked page title', function () {
    $shell = file_get_contents(resource_path('js/components/crm/reports-shell.tsx'));

    expect($shell)->toContain('<RoomShell title="Reports"')
        ->and($shell)->not->toContain('text-page-title')
        ->and($shell)->toContain("innerTitle !== 'Reports'");
});

it('moves Warmup meters onto the shared KPI strip', function () {
    $warmup = file_get_contents(resource_path('js/pages/outbound/warmup.tsx'));

    expect($warmup)->toContain('CrmKpiStrip')
        ->and($warmup)->not->toContain('StatCard')
        ->and($warmup)->not->toContain('StatGrid')
        ->and($warmup)->not->toContain('border-brand px-2.5');
});

it('brings Lead show onto record grammar', function () {
    $show = file_get_contents(resource_path('js/pages/crm/leads/show.tsx'));

    expect($show)->toContain('RecordPageFrame')
        ->and($show)->toContain('RecordFactList')
        ->and($show)->toContain('AskEvoPanel')
        ->and($show)->not->toContain('PageHeader')
        ->and($show)->not->toContain("from '@/components/ui/card'")
        ->and($show)->not->toContain('className="text-brand"');
});

it('brings Segments and Capture inbox onto CRM list grammar', function () {
    $index = file_get_contents(resource_path('js/pages/crm/segments/index.tsx'));
    $history = file_get_contents(resource_path('js/pages/crm/segments/show.tsx'));
    $captures = file_get_contents(resource_path('js/pages/crm/leads/captures.tsx'));

    expect($index)->toContain('chrome="workspace"')
        ->and($index)->toContain('CrmObjectHeader')
        ->and($index)->not->toContain('PageHeader')
        ->and($index)->not->toContain("from '@/components/ui/card'")
        ->and($index)->not->toContain('bg-brand');

    expect($history)->toContain('chrome="workspace"')
        ->and($history)->toContain('CrmObjectHeader')
        ->and($history)->not->toContain('PageHeader')
        ->and($history)->not->toContain('text-brand');

    expect($captures)->toContain('chrome="workspace"')
        ->and($captures)->toContain('CrmObjectHeader')
        ->and($captures)->not->toContain('SurfaceHeader')
        ->and($captures)->not->toContain('text-brand');
});

it('keeps Enrichment as an outline control without a brand icon', function () {
    $panel = file_get_contents(resource_path('js/components/crm/enrichment-panel.tsx'));

    expect($panel)->toContain('variant="outline"')
        ->and($panel)->not->toContain('text-brand');
});

it('destacks shared hairline tables instead of framing them as cards', function () {
    $table = file_get_contents(resource_path('js/components/crm/hairline-table.tsx'));

    expect($table)->toContain('border-y border-hairline')
        ->and($table)->not->toContain('rounded-xl');
});
