<?php

it('keeps Aurora Button as the only product button primitive', function () {
    $adapter = file_get_contents(resource_path('js/components/ui/button.tsx'));
    $bridge = file_get_contents(resource_path('js/lib/aurora/shadcn-bridge.ts'));
    $aurora = file_get_contents(resource_path('js/components/ui/aurora/button.tsx'));

    expect($adapter)->toContain("from '@/components/ui/aurora/button'")
        ->and($adapter)->toContain('aurora-btn--aurora aurora-btn--filled')
        ->and($adapter)->not->toContain('EvoButton')
        ->and($adapter)->not->toContain('PremiumButton')
        ->and($adapter)->not->toContain('GlassButton')
        ->and($bridge)->toContain("return { variant: 'aurora', filled: true }")
        ->and($aurora)->toContain('export type ButtonVariant')
        ->and($aurora)->toContain('asChild');
});

it('restyles Aurora buttons at the EvoSales layer without rewriting Aurora CSS', function () {
    $product = file_get_contents(resource_path('css/app.css'));
    $aurora = file_get_contents(resource_path('js/components/aurora-components.css'));

    expect($aurora)->toContain('box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.34), 0 2px 6px rgba(0,0,0,0.16)')
        ->and($product)->toContain('EvoSales button composition')
        ->and($product)->toContain('Unlayered so it wins over @layer aurora-components')
        ->and($product)->toContain('.aurora-btn {')
        ->and($product)->toContain('box-shadow: none')
        ->and($product)->toContain('.aurora-btn--filled.aurora-btn--aurora')
        ->and($product)->toContain('color: #ffffff')
        ->and($product)->toContain('background: var(--evosales-mark)')
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
            ->and($src)->toContain("label: 'Meeting'")
            ->and($src)->not->toContain('shape="pill"')
            ->and($src)->not->toContain('min-h-11')
            ->and($src)->not->toContain('grid-cols-3');
    }

    expect($chrome)->toContain('More actions for record');
});

it('keeps launch tiles as hairline surfaces without hover elevation', function () {
    $grid = file_get_contents(resource_path('js/components/crm/quick-launch-grid.tsx'));

    expect($grid)->toContain('border-hairline')
        ->and($grid)->not->toContain('hover:shadow-sm')
        ->and($grid)->not->toContain('shadow-md')
        ->and($grid)->not->toContain('shadow-lg');
});
