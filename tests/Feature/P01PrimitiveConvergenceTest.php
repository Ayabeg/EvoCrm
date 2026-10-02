<?php

/**
 * P01 — Phosphor-only product chrome; overlays import canonical @/evo/ui drawers/dialogs.
 * Does not own Command OS, /home→/dashboard, or leftover app-header deletion.
 */

it('keeps listed product chrome off lucide-react', function () {
    $files = [
        'js/components/crm/command-palette.tsx',
        'js/components/crm/record-chrome.tsx',
        'js/components/crm/ask-evo-panel.tsx',
        'js/components/crm/activity-composer.tsx',
        'js/components/crm/list-chrome.tsx',
        'js/components/crm/record-action-row.tsx',
        'js/components/crm/record-layout-editor.tsx',
        'js/components/crm/inline-record-field.tsx',
        'js/components/crm/enrichment-panel.tsx',
        'js/components/crm/create-drawer.tsx',
        'js/components/crm/column-chooser.tsx',
        'js/components/crm/board-options-sheet.tsx',
        'js/components/app-sidebar.tsx',
        'js/components/app-sidebar-header.tsx',
        'js/components/user-menu-content.tsx',
        'js/components/appearance-tabs.tsx',
        'js/components/password-input.tsx',
        'js/components/alert-error.tsx',
        'js/components/manage-two-factor.tsx',
        'js/components/two-factor-recovery-codes.tsx',
        'js/components/two-factor-setup-modal.tsx',
        'js/components/ui/sidebar.tsx',
        'js/pages/settings/setup/wizard.tsx',
        'js/pages/crm/leads/captures.tsx',
        'js/pages/outbound/domains/index.tsx',
        'js/evo/patterns/command-palette/index.tsx',
    ];

    foreach ($files as $file) {
        $src = file_get_contents(resource_path($file));
        expect($src)->not->toContain("from 'lucide-react'")
            ->and($src)->not->toContain('from "lucide-react"');
    }

    expect(file_get_contents(resource_path('js/evo/patterns/command-palette/index.tsx')))
        ->toContain('@/evo/icons');
});

it('routes active product overlays through canonical drawer or dialog barrels', function () {
    $drawers = [
        'js/components/crm/create-drawer.tsx',
        'js/components/crm/ask-evo-panel.tsx',
        'js/components/crm/record-layout-editor.tsx',
        'js/components/crm/column-chooser.tsx',
        'js/components/crm/board-options-sheet.tsx',
    ];

    foreach ($drawers as $file) {
        $src = file_get_contents(resource_path($file));
        expect($src)->toContain("@/evo/ui/drawer")
            ->and($src)->not->toContain("@/components/ui/sheet")
            ->and($src)->not->toContain("@/evo/ui/sheet")
            ->and($src)->not->toContain('@/components/ui/aurora/');
    }

    $drawer = file_get_contents(resource_path('js/evo/ui/drawer.tsx'));
    expect($drawer)->toContain('DrawerContent')
        ->and($drawer)->toContain("from '@/evo/ui/sheet'")
        ->and($drawer)->toContain("side = 'right'");

    $dialog = file_get_contents(resource_path('js/evo/ui/dialog.tsx'));
    expect($dialog)->toContain('DialogContent')
        ->and($dialog)->toContain('data-slot="dialog-content"');

    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));
    expect($sidebar)->toContain('<SheetContent')
        ->and($sidebar)->toContain("@/evo/ui/sheet");
});

it('does not delete leftover header files or change Inertia contracts', function () {
    expect(resource_path('js/components/app-header.tsx'))->toBeFile();
    expect(resource_path('js/layouts/app/app-header-layout.tsx'))->toBeFile();

    $header = file_get_contents(resource_path('js/components/app-header.tsx'));
    expect($header)->not->toContain('lucide-react')
        ->and($header)->toContain('@/evo/icons');

    $palette = file_get_contents(resource_path('js/evo/patterns/command-palette/index.tsx'));
    expect($palette)->toContain("'navigate'")
        ->and($palette)->toContain("'search'")
        ->and($palette)->toContain("'create'")
        ->and($palette)->toContain("'ask'")
        ->and($palette)->not->toContain('lucide-react');
});
