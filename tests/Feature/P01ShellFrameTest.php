<?php

use App\Support\SimpleMode;

it('does not mount .app-topbar in the live layout', function () {
    $layout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));

    expect($layout)->not->toContain('AppSidebarHeader')
        ->and($layout)->not->toContain('app-topbar')
        ->and($shell)->not->toContain('app-topbar')
        ->and($rail)->not->toContain('app-topbar')
        ->and($shell)->toContain('evo-mobile-header');
});

it('locks one width system: 224 expanded / 56 icon rail', function () {
    $tokens = file_get_contents(resource_path('js/evo/tokens/evo.css'));
    $css = file_get_contents(resource_path('css/evo-shell.css'));
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));

    expect($tokens)->toContain('--evo-rail: 224px')
        ->and($tokens)->toContain('--evo-rail-collapsed: 56px')
        ->and($tokens)->toContain('--evo-sidebar: #f0f2ee')
        ->and($tokens)->toContain('--evo-nav-item: 32px')
        ->and($css)->toContain('width: var(--evo-rail)')
        ->and($css)->toContain('width: var(--evo-rail-collapsed)')
        ->and($css)->not->toContain('width: 212px')
        ->and($css)->not->toContain('width: 240px')
        ->and($css)->not->toContain('width: 248px')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH = "var(--evo-rail)"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_ICON = "var(--evo-rail-collapsed)"')
        ->and($sidebar)->toContain('const SIDEBAR_WIDTH_MOBILE = "var(--evo-rail)"');
});

it('persists collapse through the existing sidebar_state cookie', function () {
    $persist = file_get_contents(resource_path('js/components/shell/rail-state.ts'));
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));

    expect($persist)->toContain("SIDEBAR_COOKIE_NAME = 'sidebar_state'")
        ->and($persist)->toContain('writeSidebarCookie')
        ->and($persist)->toContain('readSidebarCookie')
        ->and($persist)->toContain('RAIL_EXPAND_MIN = 1280')
        ->and($shell)->toContain('writeSidebarCookie')
        ->and($shell)->toContain('!sidebarOpen')
        ->and($shell)->not->toContain('return 1440')
        ->and($sidebar)->toContain('sidebar_state')
        ->and($sidebar)->toContain('must not overwrite that cookie');
});

it('keeps SIMPLE_NAV membership exactly as the business contract', function () {
    expect(SimpleMode::SIMPLE_NAV)->toBe([
        ['id' => 'home', 'label' => 'Home', 'href' => '/dashboard'],
        ['id' => 'inbox', 'label' => 'Inbox', 'href' => '/inbox'],
        ['id' => 'leads', 'label' => 'Leads', 'href' => '/crm/leads'],
        ['id' => 'contacts', 'label' => 'Contacts', 'href' => '/crm/contacts'],
        ['id' => 'companies', 'label' => 'Companies', 'href' => '/crm/companies'],
        ['id' => 'deals', 'label' => 'Deals', 'href' => '/crm/deals'],
        ['id' => 'quotes', 'label' => 'Quotes', 'href' => '/crm/quotes'],
        ['id' => 'activities', 'label' => 'Activities', 'href' => '/crm/activities'],
    ]);
});

it('gates Ask Evo Cmd+J on Full Mode via features.ask_evo and simpleMode', function () {
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));

    expect($shell)->toContain("event.key === 'j' || event.key === 'J'")
        ->and($shell)->toContain('!features.ask_evo || simpleMode')
        ->and($shell)->toContain('openAskEvo()')
        ->and($shell)->toContain('features.ask_evo && !simpleMode');
});

it('centers overlays logically and lists the G-chord shortcuts on the live sheet', function () {
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $palette = file_get_contents(resource_path('js/evo/patterns/command-palette/index.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));

    expect($shell)->not->toContain('-translate-x-1/2')
        ->and($palette)->not->toContain('-translate-x-1/2')
        ->and($shell)->toContain('inset-inline-0')
        ->and($palette)->toContain('inset-inline-0')
        ->and($shell)->toContain('G then A')
        ->and($shell)->toContain('G then V')
        ->and($shell)->toContain('G then P')
        ->and($shell)->toContain('G then G')
        ->and($rail)->toContain("rowClass,\n                                'pe-2 ps-8'");
});

it('filters hierarchical nav by capability and publishes Agents only in Full Mode', function () {
    $nav = file_get_contents(resource_path('js/components/shell/product-nav.ts'));
    $test = file_get_contents(resource_path('js/components/shell/product-nav.test.ts'));

    expect($nav)->toContain("id: 'agents'")
        ->and($nav)->toContain("href: '/agents'")
        ->and($nav)->toContain('permissionOn')
        ->and($nav)->toContain('idAllowed')
        ->and($test)->toContain('filters restricted destinations by capability')
        ->and($test)->toContain('hides Agents from Simple Mode');
});
