<?php

it('gives the deals board a workspace shell without KPI cards or a second dashboard', function () {
    $src = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));

    expect($src)->toContain('data-crm="deals-board"')
        ->and($src)->toContain('CrmListShell')
        ->and($src)->toContain('Create deal')
        ->and($src)->toContain('Board options')
        ->and($src)->toContain('DealPipelineBoard')
        ->and($src)->toContain('action="/crm/deals"')
        ->and($src)->toContain('DealForecastSummary')
        ->and($src)->not->toContain('CrmShell')
        ->and($src)->not->toContain('chrome="workspace"')
        ->and($src)->toContain('DealLayoutToggle')
        ->and($src)->toContain('PipelineSwitcher')
        ->and($src)->not->toContain('data-crm="pipeline-workspace"')
        ->and($src)->not->toContain('CrmObjectHeader')
        ->and($src)->not->toContain('CrmKpiStrip')
        ->and($src)->not->toContain('aurora/data-table')
        ->and($src)->not->toContain('HubSpot')
        ->and($src)->not->toContain('name="q"');
});

it('keeps one forecast strip on real board data and leaves weighted unbranded', function () {
    $strip = file_get_contents(resource_path('js/components/crm/deal-forecast-bar.tsx'));

    expect($strip)->toContain('data-testid="forecast-totals"')
        ->and($strip)->toContain('Pipeline')
        ->and($strip)->toContain('Open deals')
        ->and($strip)->toContain('Weighted')
        ->and($strip)->toContain('formatDzd')
        ->and($strip)->not->toContain('text-brand')
        ->and($strip)->not->toContain('CrmKpiStrip');
});

it('keeps the shared kanban operable for deals without a second leads board product', function () {
    $kanban = file_get_contents(resource_path('js/components/crm/pipeline-kanban.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));

    expect($kanban)->toContain('cursor-grab')
        ->and($kanban)->toContain('aria-grabbed')
        ->and($kanban)->toContain('No deals')
        ->and($kanban)->toContain('data-testid="pipeline-kanban"')
        ->and($kanban)->toContain('PipelineKanbanFooter')
        ->and($kanban)->toContain("t('Total')")
        ->and($kanban)->not->toContain('dnd-kit')
        ->and($kanban)->not->toContain('@hello-pangea/dnd')
        ->and($board)->toContain('DealPipelineBoard')
        ->and($board)->toContain('CrmListShell')
        ->and($board)->not->toContain('CrmObjectHeader');
});
