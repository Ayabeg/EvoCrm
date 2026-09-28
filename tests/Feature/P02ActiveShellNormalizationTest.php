<?php

/**
 * P02 — Active shell normalization.
 * Locks the leftover header out of AppLayout, one topbar entry per job,
 * and command/nav Home → /dashboard (deferred from P01).
 */
it('resolves command and rail Home hrefs to /dashboard not /home', function () {
    $palette = file_get_contents(resource_path('js/components/crm/command-palette.tsx'));
    $catalog = file_get_contents(resource_path('js/lib/command-os.ts'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));

    expect($catalog)->toContain("label: 'Home'")
        ->and($catalog)->toContain("href: '/dashboard'")
        ->and($catalog)->not->toContain("href: '/home'")
        ->and($palette)->not->toContain("href: '/home'")
        ->and($rail)->toContain("label: 'Home'")
        ->and($rail)->toContain("href: '/dashboard'")
        ->and($header)->toContain('href="/dashboard"')
        ->and($header)->not->toContain('href="/home"');
});

it('keeps AppLayout on the approved 288px shell and does not wire the leftover header', function () {
    $appLayout = file_get_contents(resource_path('js/layouts/app-layout.tsx'));
    $sidebarLayout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $headerLayout = file_get_contents(resource_path('js/layouts/app/app-header-layout.tsx'));
    $legacyHeader = file_get_contents(resource_path('js/components/app-header.tsx'));
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));

    expect($appLayout)->toContain("from '@/layouts/app/app-sidebar-layout'")
        ->and($appLayout)->not->toContain("from '@/layouts/app/app-header-layout'")
        ->and($appLayout)->not->toContain("from '@/components/app-header'")
        ->and($sidebarLayout)->toContain('AppSidebarHeader')
        ->and($sidebarLayout)->toContain('EvoShell')
        ->and($sidebarLayout)->not->toContain('<AppSidebar />')
        ->and($sidebarLayout)->not->toContain('<AppSidebar>')
        ->and($shell)->toContain('evo-rail-slot')
        ->and($headerLayout)->toContain('@deprecated')
        ->and($legacyHeader)->toContain('@deprecated')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH = "240px"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_ICON = "64px"')
        ->and($sidebar)->toContain('<SheetContent');
});

it('documents one search, one Ask Evo, one create, and one tasks overlay entry', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));

    expect($rail)->toContain('data-chrome="search"')
        ->and($rail)->toContain('Search EvoCRM')
        ->and($rail)->toContain('useCommandPaletteShortcut')
        ->and($rail)->toContain('/crm/command/search')
        ->and($header)->toContain('data-chrome="ai"')
        ->and($header)->toContain("t('Ask Evo')")
        ->and($header)->toContain('openAskEvo()')
        ->and($header)->not->toContain('AskEvoPanel')
        ->and($header)->not->toContain('data-chrome="search"')
        ->and($header)->toContain("t('Create')")
        ->and($header)->toContain('/crm/contacts?create=1')
        ->and($header)->toContain('/crm/companies?create=1')
        ->and($header)->toContain('/crm/deals?create=1')
        ->and($header)->toContain('/crm/quotes?create=1')
        ->and($header)->toContain('data-chrome="notify"')
        ->and($header)->toContain("t('Tasks')")
        ->and($header)->toContain('setTasksOpen(true)')
        ->and($header)->toContain('<TasksOverlay')
        ->and($header)->not->toContain("t('Notifications')")
        ->and($header)->not->toContain("t('AI')")
        ->and($header)->not->toContain('href="/crm/activities"');
});
