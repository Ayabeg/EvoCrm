<?php

/**
 * P02 — Active shell normalization, updated for P0.1.
 * Home stays /dashboard. Live chrome lives on the rail, not the leftover header.
 * Leftover app-sidebar.tsx / app-sidebar-header.tsx keep their Home hrefs
 * so a remount cannot revive /home.
 */
it('resolves command and rail Home hrefs to /dashboard not /home', function () {
    $palette = file_get_contents(resource_path('js/components/crm/command-palette.tsx'));
    $catalog = file_get_contents(resource_path('js/lib/command-os.ts'));
    $nav = file_get_contents(resource_path('js/components/shell/product-nav.ts'));
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $deadRail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($catalog)->toContain("label: 'Home'")
        ->and($catalog)->toContain("href: '/dashboard'")
        ->and($catalog)->not->toContain("href: '/home'")
        ->and($palette)->not->toContain("href: '/home'")
        ->and($nav)->toContain("id: 'home'")
        ->and($nav)->toContain("href: '/dashboard'")
        ->and($nav)->not->toContain("href: '/home'")
        ->and($header)->toContain('href="/dashboard"')
        ->and($header)->not->toContain('href="/home"')
        ->and($deadRail)->toContain("href: '/dashboard'")
        ->and($deadRail)->not->toContain("href: '/home'");
});

it('keeps AppLayout on the live 224/56 shell and does not remount the leftover header', function () {
    $appLayout = file_get_contents(resource_path('js/layouts/app-layout.tsx'));
    $sidebarLayout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $headerLayout = file_get_contents(resource_path('js/layouts/app/app-header-layout.tsx'));
    $legacyHeader = file_get_contents(resource_path('js/components/app-header.tsx'));
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));
    $tokens = file_get_contents(resource_path('js/evo/tokens/evo.css'));

    expect($appLayout)->toContain("from '@/layouts/app/app-sidebar-layout'")
        ->and($appLayout)->not->toContain("from '@/layouts/app/app-header-layout'")
        ->and($appLayout)->not->toContain("from '@/components/app-header'")
        ->and($sidebarLayout)->not->toContain('AppSidebarHeader')
        ->and($sidebarLayout)->toContain('EvoShell')
        ->and($sidebarLayout)->not->toContain('<AppSidebar />')
        ->and($sidebarLayout)->not->toContain('<AppSidebar>')
        ->and($shell)->toContain('evo-rail-slot')
        ->and($headerLayout)->toContain('@deprecated')
        ->and($legacyHeader)->toContain('@deprecated')
        ->and($tokens)->toContain('--evo-rail: 224px')
        ->and($tokens)->toContain('--evo-rail-collapsed: 56px')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH = "var(--evo-rail)"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_ICON = "var(--evo-rail-collapsed)"')
        ->and($sidebar)->toContain('<SheetContent');
});

it('documents one search, one Ask Evo, one create, and one tasks overlay entry on the live rail', function () {
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));

    expect($rail)->toContain('data-chrome="search"')
        ->and($rail)->toContain('Search EvoCRM')
        ->and($shell)->toContain('useCommandPaletteShortcut')
        ->and($shell)->toContain('openAskEvo()')
        ->and($shell)->toContain('features.ask_evo')
        ->and($shell)->toContain('simpleMode')
        ->and($rail)->toContain("t('Create')")
        ->and($rail)->toContain('/crm/contacts?create=1')
        ->and($rail)->toContain('/crm/companies?create=1')
        ->and($rail)->toContain('/crm/deals?create=1')
        ->and($rail)->toContain('/crm/quotes?create=1')
        ->and($rail)->toContain('data-chrome="notify"')
        ->and($rail)->toContain("t('Tasks')")
        ->and($rail)->toContain('setTasksOpen(true)')
        ->and($rail)->toContain('<TasksOverlay')
        ->and($rail)->not->toContain("t('Notifications')")
        ->and($rail)->not->toContain("t('AI')")
        ->and($rail)->not->toContain('href="/crm/activities"')
        ->and($header)->toContain('UNMOUNTED');
});
