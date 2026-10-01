<?php

it('keeps Aurora Button as the only product button primitive', function () {
    $ds = file_get_contents(resource_path('js/ds/components/Button.tsx'));
    $adapter = file_get_contents(resource_path('js/components/ui/button.tsx'));
    $bridge = file_get_contents(resource_path('js/lib/aurora/shadcn-bridge.ts'));
    $aurora = file_get_contents(resource_path('js/components/ui/aurora/button.tsx'));

    expect($ds)->toContain("from '@/components/ui/aurora/button'")
        ->and($ds)->toContain('aurora-btn--aurora aurora-btn--filled')
        ->and($ds)->not->toContain('EvoButton')
        ->and($ds)->not->toContain('PremiumButton')
        ->and($ds)->not->toContain('GlassButton')
        ->and($adapter)->toContain("from '@/ds/components/Button'")
        ->and($adapter)->not->toContain('EvoButton')
        ->and($adapter)->not->toContain('PremiumButton')
        ->and($adapter)->not->toContain('GlassButton')
        ->and($bridge)->toContain("return { variant: 'aurora', filled: true }")
        ->and($aurora)->toContain('export type ButtonVariant')
        ->and($aurora)->toContain('asChild');
});

it('restyles Aurora buttons at the EvoCrm layer without rewriting Aurora CSS', function () {
    $product = file_get_contents(resource_path('css/app.css'));
    $aurora = file_get_contents(resource_path('js/components/aurora-components.css'));

    expect($aurora)->toContain('box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.34), 0 2px 6px rgba(0,0,0,0.16)')
        ->and($product)->toContain('EvoCrm button composition')
        ->and($product)->toContain('Unlayered so it wins over @layer aurora-components')
        ->and($product)->toContain('.aurora-btn {')
        ->and($product)->toContain('box-shadow: none')
        ->and($product)->toContain('.aurora-btn--filled.aurora-btn--aurora')
        ->and($product)->toContain('color: var(--evo-on-primary)')
        ->and($product)->toContain('background: var(--primary)')
        ->and($product)->toContain('.record-action-group');

    $beforeComposition = strstr($product, 'Unlayered so it wins over @layer aurora-components', true);
    expect($beforeComposition)->toBeString()
        ->and($beforeComposition)->toContain('@layer utilities')
        ->and($beforeComposition)->not->toContain('.aurora-btn {');
});

it('keeps record actions as a quiet grouped toolbar instead of floating cards', function () {
    $chrome = file_get_contents(resource_path('js/components/crm/record-chrome.tsx'));
    $row = file_get_contents(resource_path('js/components/crm/record-action-row.tsx'));

    foreach ([$chrome, $row] as $src) {
        expect($src)->toContain('record-action-group')
            ->and($src)->toContain('aria-pressed')
            ->and($src)->toContain("label: 'Note'")
            ->and($src)->toContain("label: 'Email'")
            ->and($src)->toContain("label: 'Call'")
            ->and($src)->toContain("label: 'Task'")
            ->and($src)->not->toContain('shape="pill"')
            ->and($src)->not->toContain('min-h-11')
            ->and($src)->not->toContain('grid-cols-3');
    }

    expect($chrome)->toContain("label: 'Meet'")
        ->and($chrome)->toContain('WhatsApp')
        ->and($row)->toContain("label: 'Meeting'");

    expect($chrome)->toContain('More actions for record');
});

it('keeps launch tiles as hairline surfaces without hover elevation', function () {
    $grid = file_get_contents(resource_path('js/components/crm/quick-launch-grid.tsx'));

    expect($grid)->toContain('border-hairline')
        ->and($grid)->not->toContain('hover:shadow-sm')
        ->and($grid)->not->toContain('shadow-md')
        ->and($grid)->not->toContain('shadow-lg');
});

it('keeps leftover row and workspace actions off floating pill chrome', function () {
    $attention = file_get_contents(resource_path('js/components/dashboard/attention-list.tsx'));
    $activity = file_get_contents(resource_path('js/components/crm/record-activity-panel.tsx'));
    $workspace = file_get_contents(resource_path('js/components/crm/adaptive-workspace-shell.tsx'));

    expect($attention)->toContain('variant="ghost"')
        ->and($attention)->not->toContain('variant="outline"')
        ->and($activity)->toContain('Mark done')
        ->and($activity)->toContain('variant="ghost"')
        ->and($activity)->not->toContain('variant="outline"')
        ->and($workspace)->toContain('TabsTrigger')
        ->and($workspace)->not->toContain('PillGroup')
        ->and($workspace)->not->toContain('PillTrigger')
        ->and($workspace)->not->toContain('min-h-11');
});
