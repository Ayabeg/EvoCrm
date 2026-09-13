<?php

it('locks the Wave 0 triad: paper canvas, white cards, accent primaries', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($app)->toContain('--evosales-canvas: #eaeaea')
        ->and($app)->toContain('--evosales-ink: #000000')
        ->and($app)->toContain('--evosales-mark: #d9500f')
        ->and($app)->toContain('--primary: var(--evosales-mark)')
        ->and($app)->toContain('--card: #ffffff')
        ->and($app)->toContain('.home-widget')
        ->and($app)->not->toContain('#0176D3')
        ->and($app)->not->toContain('#00A4BD')
        ->and($bridge)->toContain('--primary: #d9500f')
        ->and($bridge)->toContain('--card: #ffffff');
});

it('ships a Salesforce-density icon rail in the EvoCrm triad', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain("from '@phosphor-icons/react'")
        ->and($rail)->toContain("label: 'Home'")
        ->and($rail)->toContain("label: 'Contacts'")
        ->and($rail)->toContain("label: 'Companies'")
        ->and($rail)->toContain("label: 'Deals'")
        ->and($rail)->toContain("label: 'Inbox'")
        ->and($rail)->toContain("label: 'Quotes'")
        ->and($rail)->toContain("label: 'Settings'")
        ->and($rail)->toContain('useSimpleMode')
        ->and($rail)->toContain('bg-sidebar-accent')
        ->and($rail)->not->toContain('lucide-react')
        ->and($rail)->not->toContain('EvoSales')
        ->and($rail)->not->toContain('#0176D3')
        ->and($rail)->not->toContain('#00A4BD');
});

it('places the EvoCrm mark on the top bar with global search', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));

    expect($header)->toContain('AppLogoIcon')
        ->and($header)->toContain('placeholder="Find a record or page"')
        ->and($header)->toContain('aria-label="Notifications"')
        ->and($header)->toContain('aria-label="Create"')
        ->and($header)->toContain("from '@phosphor-icons/react'")
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

    expect($screen)->toContain("background: '#ffffff'")
        ->and($screen)->toContain('bg-canvas-soft');
});

it('lands Home as a CRM widget workspace, not a blank stub', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));

    expect($home)->toContain('data-home="workspace"')
        ->and($home)->toContain('HomeWidget')
        ->and($home)->toContain('Pipeline')
        ->and($home)->toContain('Needs attention')
        ->and($home)->toContain('Recent records')
        ->and($home)->toContain('HomeWidgetEmpty')
        ->and($home)->not->toContain('EvoSales')
        ->and($home)->not->toContain('Breeze')
        ->and($home)->not->toContain('#0176D3');
});
