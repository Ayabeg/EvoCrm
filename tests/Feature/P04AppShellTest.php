<?php

it('locks the live rail IA, paper tokens, and simple-mode hook', function () {
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $nav = file_get_contents(resource_path('js/components/shell/product-nav.ts'));

    expect($nav)->toContain("id: 'home'")
        ->and($nav)->toContain("href: '/dashboard'")
        ->and($nav)->toContain("href: '/crm/contacts'")
        ->and($nav)->toContain("href: '/crm/companies'")
        ->and($nav)->toContain("href: '/crm/deals'")
        ->and($nav)->toContain("href: '/crm/deals/board'")
        ->and($nav)->toContain("href: '/inbox'")
        ->and($nav)->toContain("href: '/crm/activities'")
        ->and($nav)->toContain("href: '/crm/quotes'")
        ->and($nav)->toContain("href: '/crm/leads'")
        ->and($nav)->toContain("href: '/crm/tickets'")
        ->and($nav)->toContain("href: '/crm/segments'")
        ->and($nav)->toContain("href: '/ads'")
        ->and($nav)->toContain("href: '/reports'")
        ->and($nav)->toContain("href: '/outbound'")
        ->and($nav)->toContain("href: '/settings'")
        ->and($nav)->toContain("id: 'agents'")
        ->and($nav)->toContain("href: '/agents'")
        ->and($rail)->toContain('useSimpleMode')
        ->and($rail)->toContain('visibleSections')
        ->and($rail)->not->toContain('lucide-react')
        ->and($rail)->not->toContain('#0176D3')
        ->and($rail)->not->toContain('#00A4BD');
});

it('locks P0.1 desktop 224/56 widths and a 224px mobile overlay Sheet', function () {
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));
    $tokens = file_get_contents(resource_path('js/evo/tokens/evo.css'));
    $css = file_get_contents(resource_path('css/evo-shell.css'));
    $persist = file_get_contents(resource_path('js/components/shell/rail-state.ts'));

    expect($tokens)->toContain('--evo-rail: 224px')
        ->and($tokens)->toContain('--evo-rail-collapsed: 56px')
        ->and($css)->toContain('width: var(--evo-rail)')
        ->and($css)->toContain('width: var(--evo-rail-collapsed)')
        ->and($css)->not->toContain('width: 212px')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH = "224px"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_ICON = "56px"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_MOBILE = "224px"')
        ->and($sidebar)->toContain('sidebar_state')
        ->and($sidebar)->toContain('<SheetContent')
        ->and($persist)->toContain('sidebar_state')
        ->and($persist)->toContain('writeSidebarCookie');
});

it('locks rail search, command shortcut, and Create · Tasks · Profile — no top bar', function () {
    $layout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));

    expect($layout)->not->toContain('AppSidebarHeader')
        ->and($layout)->not->toContain('app-topbar')
        ->and($rail)->toContain('Search EvoCRM')
        ->and($rail)->toContain('data-chrome="search"')
        ->and($shell)->toContain('useCommandPaletteShortcut')
        ->and($rail)->toContain('account menu')
        ->and($rail)->toContain("t('Create')")
        ->and($rail)->toContain("t('Tasks')")
        ->and($rail)->toContain('/crm/quotes?create=1')
        ->and($rail)->not->toContain('Find a record or page')
        ->and($rail)->not->toContain('aria-label="Help"');
});
