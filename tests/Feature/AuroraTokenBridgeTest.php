<?php

/**
 * Guards the EvoDesk rail against a cyclic custom-property pair that
 * made `background: var(--sidebar)` invalid (transparent) in light mode.
 *
 * aurora.css sets `--sidebar: var(--aurora-nav-bg)`.
 * The bridge must re-assert both as literals so they cannot point at each other.
 */
it('re-asserts the EvoDesk rail as a literal after Aurora remaps --sidebar', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toBeString();
    expect($bridge)->toMatch('/--aurora-nav-bg:\s*#000000/');
    expect($bridge)->toMatch('/--sidebar:\s*#000000/');
    expect($bridge)->not->toMatch('/--aurora-nav-bg:\s*var\(--sidebar\)/');
});

it('places the mobile sidebar dialog title inside SheetContent', function () {
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));

    $contentPos = strpos($sidebar, '<SheetContent');
    $headerPos = strpos($sidebar, '<SheetHeader');

    expect($contentPos)->not->toBeFalse();
    expect($headerPos)->not->toBeFalse();
    expect($headerPos)->toBeGreaterThan($contentPos);
});

it('re-asserts Geist faces as literals so --font-sans cannot cycle with --aurora-font-sans', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toMatch("/--aurora-font-sans:\s*'Geist Sans'/");
    expect($bridge)->toMatch("/--font-sans:\s*'Geist Sans'/");
    expect($bridge)->not->toMatch('/--aurora-font-sans:\s*var\(--font-sans\)/');
});

it('maps overlapping Aurora type tokens to the Brand Book --text-* scale', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toContain('--aurora-type-body: var(--text-ui-relaxed)');
    expect($bridge)->toContain('--aurora-type-body-sm: var(--text-ui)');
    expect($bridge)->toContain('--aurora-type-control: var(--text-ui)');
    expect($bridge)->toContain('--aurora-type-table: var(--text-ui)');
    expect($bridge)->toContain('--aurora-type-caption: var(--text-section-label)');
});

it('keeps Home application chrome on Brand Book tokens rather than raw --aurora-*', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $header = file_get_contents(resource_path('js/components/dashboard/dashboard-header.tsx'));
    $attention = file_get_contents(resource_path('js/components/dashboard/attention-list.tsx'));
    $activity = file_get_contents(resource_path('js/components/dashboard/activity-feed.tsx'));

    expect($home)->not->toContain('--aurora-');
    expect($header)->not->toContain('--aurora-');
    expect($attention)->not->toContain('--aurora-');
    expect($activity)->not->toContain('--aurora-');
});

it('pins the vendored Aurora source revision next to the primitives', function () {
    $pin = file_get_contents(resource_path('js/components/ui/aurora/SOURCE.json'));

    expect($pin)->toBeString();

    $data = json_decode($pin, true);

    expect($data)->toBeArray();
    expect($data['repository'])->toBe('https://github.com/dinglebear-ai/aurora');
    expect($data['revision'])->toMatch('/^[0-9a-f]{40}$/');
    expect($data['vendoredPaths'])->toContain('resources/js/components/aurora.css');
    expect($data['vendoredPaths'])->toContain('resources/js/components/ui/aurora/');
});

it('re-asserts Brand identity after Aurora defaults, including the unused .light selector', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toMatch('/:root,\s*\.light\s*\{/');
    expect($bridge)->toContain('--aurora-accent-primary: var(--evosales-mark)');
    expect($bridge)->toContain('--aurora-accent-primary-surface:');
    expect($bridge)->not->toMatch('/--aurora-accent-primary:\s*#29b6f6/');
    expect($bridge)->not->toMatch('/--aurora-accent-primary:\s*#0288d1/');
});

it('keeps the Apple cabinet rail at 240px on desktop and the existing mobile Sheet', function () {
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));

    expect($sidebar)->toContain('const SIDEBAR_WIDTH = "240px"');
    expect($sidebar)->toContain('const SIDEBAR_WIDTH_MOBILE = "240px"');
    expect($sidebar)->not->toContain('const SIDEBAR_WIDTH = "220px"');
    expect($sidebar)->toContain('<SheetContent');
    expect($sidebar)->toContain('background: "var(--sidebar)"');
});

it('uses a soft rail pill instead of an orange active bar', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($app)->not->toContain('--sidebar-accent: rgba(236, 96, 37, 0.22)');
    expect($bridge)->not->toContain('--sidebar-accent: rgba(236, 96, 37, 0.22)');
    expect($app)->toContain('--sidebar-accent: rgba(255, 255, 255, 0.1)');
    expect($bridge)->toContain('--sidebar-accent: rgba(255, 255, 255, 0.1)');
    expect($rail)->toContain('app-rail-item');
    expect($rail)->not->toContain('inset_2px_0_0_0');
    expect($rail)->toContain("from '@inertiajs/react'");
});

it('keeps the page shell as a flat Brand canvas with no mesh radials', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));
    $shell = file_get_contents(resource_path('js/components/app-shell.tsx'));

    expect($bridge)->toContain('--aurora-shell-bg: var(--evosales-canvas-soft)');
    expect($bridge)->not->toMatch('/--aurora-shell-bg:[^;]*radial-gradient/');
    expect($shell)->toContain('bg-[var(--aurora-shell-bg)]');
});

it('paints the topbar as a frosted hairline instead of an Aurora panel gradient', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $css = file_get_contents(resource_path('css/app.css'));

    expect($header)->toContain('app-topbar');
    expect($header)->not->toContain('linear-gradient(180deg, var(--aurora-panel-strong-top)');
    expect($css)->toContain('.app-topbar');
    expect($css)->toContain('backdrop-filter: blur(20px)');
});
