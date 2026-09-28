<?php

it('locks the app-aware rail IA, paper tokens, and simple-mode hook', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain("type AppId = 'vendre' | 'desk' | 'outbound' | 'ads' | 'reports'")
        ->and($rail)->toContain("label: 'Home'")
        ->and($rail)->toContain("href: '/dashboard'")
        ->and($rail)->toContain("label: 'Vendre'")
        ->and($rail)->toContain("href: '/crm/contacts'")
        ->and($rail)->toContain("href: '/crm/companies'")
        ->and($rail)->toContain("href: '/crm/deals'")
        ->and($rail)->toContain("activePaths: ['/crm/deals/board']")
        ->and($rail)->toContain("href: '/inbox'")
        ->and($rail)->toContain("href: '/crm/activities'")
        ->and($rail)->toContain("href: '/crm/quotes'")
        ->and($rail)->toContain("label: 'Lead captures'")
        ->and($rail)->toContain("href: '/crm/workflows'")
        ->and($rail)->toContain("href: '/crm/leads'")
        ->and($rail)->toContain("href: '/crm/tickets'")
        ->and($rail)->toContain("href: '/crm/segments'")
        ->and($rail)->toContain("href: '/ads'")
        ->and($rail)->toContain("href: '/reports'")
        ->and($rail)->toContain("href: '/outbound'")
        ->and($rail)->toContain("href: '/settings'")
        ->and($rail)->toContain("localStorage.getItem('evo:nav-app')")
        ->and($rail)->toContain("localStorage.setItem('evo:nav-app'")
        ->and($rail)->toContain('data-nav="crm-objects"')
        ->and($rail)->toContain('useSimpleMode')
        ->and($rail)->toContain('bg-sidebar-accent')
        ->and($rail)->toContain("from '@phosphor-icons/react'")
        ->and($rail)->not->toContain('lucide-react')
        ->and($rail)->not->toContain("label: 'Pipeline'")
        ->and($rail)->not->toContain("id: 'pipeline'")
        ->and($rail)->not->toContain('#0176D3')
        ->and($rail)->not->toContain('#00A4BD')
        ->and($rail)->not->toContain('#000000');
});

it('locks P04 desktop 64/240 widths and the 240px labeled mobile Sheet', function () {
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($sidebar)->toContain('const SIDEBAR_WIDTH = "240px"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_ICON = "64px"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_MOBILE = "240px"')
        ->and($sidebar)->toContain('sidebar_state')
        ->and($sidebar)->toContain('<SheetContent')
        ->and($rail)->toContain("const labeled = isMobile || state === 'expanded'")
        ->and($rail)->toContain('text-[13px]');
});

it('locks the P04 topbar search, command shortcut, and Ask Evo · Create · Tasks · Profile', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));

    expect($rail)->toContain('Search EvoCRM')
        ->and($rail)->toContain('/crm/command/search')
        ->and($rail)->toContain('useCommandPaletteShortcut')
        ->and($rail)->toContain('account menu')
        ->and($header)->toContain("t('Ask Evo')")
        ->and($header)->toContain("t('Create')")
        ->and($header)->toContain("t('Tasks')")
        ->and($header)->toContain('/crm/quotes?create=1')
        ->and($header)->not->toContain('Find a record or page')
        ->and($header)->not->toContain('aria-label="Help"');
});
