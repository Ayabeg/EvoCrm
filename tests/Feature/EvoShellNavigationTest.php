<?php

it('keeps one 212px cabinet with modes as tablist and cmdk as the only command surface', function () {
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $switch = file_get_contents(resource_path('js/evo/shell/mode-switch.tsx'));
    $palette = file_get_contents(resource_path('js/evo/patterns/command-palette/index.tsx'));
    $css = file_get_contents(resource_path('css/evo-shell.css'));
    $agents = file_get_contents(resource_path('js/components/desk/agents-sidebar.tsx'));

    expect($css)->toContain('width: 212px')
        ->and($css)->toContain('transform: translateX(16px)')
        ->and($css)->toContain('transform: translateX(-12px)')
        ->and($css)->toContain('var(--evo-duration-micro)')
        ->and($css)->not->toContain('150ms ease')
        ->and($switch)->toContain('role="tablist"')
        ->and($switch)->toContain('Recherche')
        ->and($rail)->toContain('ShellModeSwitch')
        ->and($rail)->not->toContain('@astryxdesign')
        ->and($rail)->not->toContain('lucide-react')
        ->and($shell)->toContain('CommandPalette')
        ->and($shell)->toContain('useCommandPaletteShortcut')
        ->and($palette)->toContain("from 'cmdk'")
        ->and($palette)->toContain('trapTabKey')
        ->and($palette)->toContain('Palette de commandes')
        ->and($palette)->not->toContain('@/components/aurora/command-palette')
        ->and($agents)->toContain('VOS AGENTS')
        ->and($agents)->toContain('+ Nouvelle conversation')
        ->and($agents)->toContain('outline-[var(--evo-focus)]')
        ->and($agents)->not->toContain('outline-shell-orange');
});
