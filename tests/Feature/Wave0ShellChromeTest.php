<?php

it('locks the P02 semantic palette: canvas, surface, accent primaries', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($app)->toContain('--color-bg: var(--evo-canvas)')
        ->and($app)->toContain('--color-surface: var(--evo-surface)')
        ->and($app)->toContain('--color-subtle: var(--evo-surface-subtle)')
        ->and($app)->toContain('--color-text: var(--evo-ink)')
        ->and($app)->toContain('--color-text-secondary: var(--evo-ink-secondary)')
        ->and($app)->toContain('--color-text-muted: var(--evo-ink-muted)')
        ->and($app)->toContain('--color-border: var(--evo-hairline)')
        ->and($app)->toContain('--color-accent: var(--evo-primary)')
        ->and($app)->toContain('--color-accent-hover: var(--evo-primary-hover)')
        ->and($app)->toContain('--color-accent-soft: var(--evo-primary-soft)')
        ->and($app)->toContain('--color-focus-ring: var(--evo-focus)')
        ->and($app)->toContain('--evosales-canvas: var(--color-bg)')
        ->and($app)->toContain('--evosales-ink: var(--color-text)')
        ->and($app)->toContain('--evosales-mark: var(--color-accent)')
        ->and($app)->toContain('--primary: var(--color-accent)')
        ->and($app)->toContain('--card: var(--color-surface)')
        ->and($app)->toContain('.home-widget')
        ->and($app)->not->toContain('#0176D3')
        ->and($app)->not->toContain('#00A4BD')
        ->and($app)->not->toContain('#eaeaea')
        ->and($app)->not->toContain('#d9500f')
        ->and($bridge)->toContain('--primary: var(--color-accent)')
        ->and($bridge)->toContain('--card: var(--color-surface)')
        ->and($bridge)->not->toContain('#eaeaea')
        ->and($bridge)->not->toContain('#d9500f');
});

it('ships an app-aware 64/240 paper rail in the EvoCrm triad', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain("from '@phosphor-icons/react'")
        ->and($rail)->toContain("label: 'Home'")
        ->and($rail)->toContain("label: 'Vendre'")
        ->and($rail)->toContain("label: 'Leads'")
        ->and($rail)->toContain("label: 'Contacts'")
        ->and($rail)->toContain("label: 'Companies'")
        ->and($rail)->toContain("label: 'Deals'")
        ->and($rail)->toContain("activePaths: ['/crm/deals/board']")
        ->and($rail)->toContain("label: 'Inbox'")
        ->and($rail)->toContain("label: 'Activities'")
        ->and($rail)->toContain("href: '/crm/activities'")
        ->and($rail)->toContain("label: 'Quotes'")
        ->and($rail)->toContain("label: 'Workflows'")
        ->and($rail)->toContain("href: '/crm/workflows'")
        ->and($rail)->toContain("label: 'Lead captures'")
        ->and($rail)->toContain("label: 'Settings'")
        ->and($rail)->toContain('useSimpleMode')
        ->and($rail)->toContain('bg-sidebar-accent')
        ->and($rail)->toContain('text-[13px]')
        ->and($rail)->toContain('h-9')
        ->and($rail)->not->toContain("label: 'Pipeline'")
        ->and($rail)->not->toContain('lucide-react')
        ->and($rail)->not->toContain('EvoSales')
        ->and($rail)->not->toContain('#0176D3')
        ->and($rail)->not->toContain('#00A4BD')
        ->and($rail)->not->toContain('#000000');
});

it('places Search EvoCRM on the shell with Ask Evo, Create, Tasks, and Profile', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));

    expect($header)->toContain('AppLogoIcon')
        ->and($rail)->toContain('Search EvoCRM')
        ->and($rail)->toContain('/crm/command/search')
        ->and(file_get_contents(resource_path('js/components/shell/evo-shell.tsx')))->toContain('useCommandPaletteShortcut')
        ->and($rail)->toContain('account menu')
        ->and($header)->toContain("t('Ask Evo')")
        ->and($header)->toContain("t('Tasks')")
        ->and($header)->toContain("t('Create')")
        ->and($header)->toContain('/crm/quotes?create=1')
        ->and($header)->toContain("from '@phosphor-icons/react'")
        ->and($header)->not->toContain('Find a record or page')
        ->and($header)->not->toContain('aria-label="Help"')
        ->and($header)->not->toContain('EvoSales')
        ->and($header)->not->toContain('lucide-react');
});

it('keeps auth chrome on paper with the EvoCrm lockup', function () {
    $screen = file_get_contents(resource_path('js/pages/auth/auth-screen.tsx'));
    $simple = file_get_contents(resource_path('js/layouts/auth/auth-simple-layout.tsx'));
    $card = file_get_contents(resource_path('js/layouts/auth/auth-card-layout.tsx'));
    $split = file_get_contents(resource_path('js/layouts/auth/auth-split-layout.tsx'));

    foreach ([$screen, $simple, $card, $split] as $src) {
        expect($src)->toContain('EvoCrm')
            ->and($src)->not->toContain('EvoSales');
    }

    expect($screen)->toContain("background: 'var(--evo-surface)'")
        ->and($screen)->toContain('bg-canvas-soft')
        ->and($screen)->toContain('auth-screen')
        ->and($screen)->toContain('text-ink')
        ->and($screen)->toContain('login-split-grid')
        ->and($screen)->toContain('/brand/evocrm/logo.svg')
        ->and($screen)->not->toContain('aurora-text-display-1')
        ->and($screen)->not->toContain('aurora-text-body-sm')
        ->and($screen)->not->toContain('Product Inc.')
        ->and($screen)->not->toContain('light-working-vertical-1');

    $app = file_get_contents(resource_path('css/app.css'));

    expect($app)->toContain('.auth-screen')
        ->and($app)->toContain('color-scheme: light')
        ->and($app)->toContain('--aurora-letter-ui: 0')
        ->and($app)->toContain('--aurora-text-primary: var(--evo-ink)')
        ->and($app)->toContain('--aurora-control-surface: var(--evo-surface)');
});

it('lands Home as a CRM widget workspace, not a blank stub', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));

    expect($home)->toContain('data-home="workspace"')
        ->and($home)->toContain('HomeKpiStrip')
        ->and($home)->toContain('Pipeline')
        ->and($home)->toContain('Recent deals')
        ->and($home)->toContain('Deal evolution')
        ->and($home)->not->toContain('EvoSales')
        ->and($home)->not->toContain('Breeze')
        ->and($home)->not->toContain('#0176D3');
});
