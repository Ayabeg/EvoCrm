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

it('ships the live 224/56 rail from product-nav, not the dead app-sidebar leftover', function () {
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $nav = file_get_contents(resource_path('js/components/shell/product-nav.ts'));
    $tokens = file_get_contents(resource_path('js/evo/tokens/evo.css'));

    expect($nav)->toContain("id: 'home'")
        ->and($nav)->toContain("href: '/dashboard'")
        ->and($nav)->toContain("href: '/crm/contacts'")
        ->and($nav)->toContain("href: '/crm/companies'")
        ->and($nav)->toContain("href: '/crm/leads'")
        ->and($nav)->toContain("href: '/crm/deals'")
        ->and($nav)->toContain("href: '/crm/deals/board'")
        ->and($nav)->toContain("href: '/inbox'")
        ->and($nav)->toContain("href: '/crm/activities'")
        ->and($nav)->toContain("href: '/crm/quotes'")
        ->and($nav)->toContain("href: '/crm/workflows'")
        ->and($rail)->toContain('useSimpleMode')
        ->and($rail)->toContain('visibleSections')
        ->and($rail)->toContain('text-[13px]')
        ->and($tokens)->toContain('--evo-rail: 224px')
        ->and($tokens)->toContain('--evo-rail-collapsed: 56px')
        ->and($rail)->not->toContain('lucide-react')
        ->and($rail)->not->toContain('EvoSales')
        ->and($rail)->not->toContain('#0176D3')
        ->and($rail)->not->toContain('#00A4BD');
});

it('places Search, Create, Tasks, and Profile on the live rail — no global top bar', function () {
    $layout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));

    expect($layout)->not->toContain('AppSidebarHeader')
        ->and($layout)->not->toContain('app-topbar')
        ->and($rail)->toContain('Search EvoCRM')
        ->and($rail)->toContain('data-chrome="search"')
        ->and($rail)->toContain("t('Create')")
        ->and($rail)->toContain('/crm/quotes?create=1')
        ->and($rail)->toContain("t('Tasks')")
        ->and($rail)->toContain('account menu')
        ->and($rail)->not->toContain('evo-create-btn')
        ->and($shell)->toContain('useCommandPaletteShortcut')
        ->and($shell)->toContain('features.ask_evo')
        ->and($rail)->not->toContain('Find a record or page')
        ->and($rail)->not->toContain('EvoSales')
        ->and($rail)->not->toContain('lucide-react');
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
