<?php

it('locks the P04 grouped rail IA, paper tokens, and simple-mode hook', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain("label: 'Home'")
        ->and($rail)->toContain("href: '/dashboard'")
        ->and($rail)->toContain("label: 'CRM'")
        ->and($rail)->toContain("href: '/crm/contacts'")
        ->and($rail)->toContain("href: '/crm/companies'")
        ->and($rail)->toContain("href: '/crm/deals'")
        ->and($rail)->toContain("href: '/crm/deals/board'")
        ->and($rail)->toContain("label: 'Communication'")
        ->and($rail)->toContain("href: '/inbox'")
        ->and($rail)->toContain("href: '/crm/activities'")
        ->and($rail)->toContain("label: 'Sales'")
        ->and($rail)->toContain("href: '/crm/quotes'")
        ->and($rail)->toContain("label: 'Automation'")
        ->and($rail)->toContain("href: '/crm/workflows'")
        ->and($rail)->toContain("href: '/crm/leads'")
        ->and($rail)->toContain("href: '/crm/tickets'")
        ->and($rail)->toContain("href: '/crm/segments'")
        ->and($rail)->toContain("href: '/ads'")
        ->and($rail)->toContain("href: '/reports'")
        ->and($rail)->toContain("href: '/outbound'")
        ->and($rail)->toContain("href: '/settings'")
        ->and($rail)->toContain('useSimpleMode')
        ->and($rail)->toContain('group.items.length > 0')
        ->and($rail)->toContain('bg-sidebar-accent')
        ->and($rail)->toContain("from '@phosphor-icons/react'")
        ->and($rail)->not->toContain('lucide-react')
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
        ->and($rail)->toContain('isMobile || state === \'expanded\'')
        ->and($rail)->toContain('text-[13px]');
});

it('locks the P04 topbar search, command shortcut, and AI · Create · Notifications · Profile', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));

    expect($header)->toContain("t('Search EvoCRM…')")
        ->and($header)->toContain('⌘K')
        ->and($header)->toContain('useCommandPaletteShortcut')
        ->and($header)->toContain("t('AI')")
        ->and($header)->toContain("t('Create')")
        ->and($header)->toContain("t('Notifications')")
        ->and($header)->toContain('account menu')
        ->and($header)->toContain('/crm/quotes?create=1')
        ->and($header)->not->toContain('Find a record or page')
        ->and($header)->not->toContain('aria-label="Help"');
});
