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
    $files = [
        'js/pages/home.tsx',
        'js/components/dashboard/dashboard-header.tsx',
        'js/components/dashboard/dashboard-section.tsx',
        'js/components/dashboard/attention-list.tsx',
        'js/components/dashboard/activity-feed.tsx',
        'js/components/dashboard/quick-actions.tsx',
        'js/components/crm/evo-kpi-card.tsx',
        'js/components/crm/crm-kpi-strip.tsx',
    ];

    foreach ($files as $file) {
        expect(file_get_contents(resource_path($file)))->not->toContain('--aurora-');
    }
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
    expect($sidebar)->toContain('width: SIDEBAR_WIDTH_MOBILE');
    expect($sidebar)->toContain('w-[min(var(--sidebar-width),92vw)]');
    expect($sidebar)->not->toContain('w-[min(396px,92vw)]');
});

it('keeps Home KPI values on the Brand Book --text-kpi scale', function () {
    $card = file_get_contents(resource_path('js/components/crm/evo-kpi-card.tsx'));

    expect($card)->toContain('text-kpi');
    expect($card)->toContain('break-words');
    expect($card)->not->toContain('text-[1.875rem]');
    expect($card)->not->toContain('min-h-[7.5rem]');
});

it('uses compact mobile spacing tokens on Home chrome', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $header = file_get_contents(resource_path('js/components/dashboard/dashboard-header.tsx'));
    $strip = file_get_contents(resource_path('js/components/crm/crm-kpi-strip.tsx'));

    expect($home)->toContain('px-4 py-5 md:px-8 md:py-8');
    expect($home)->toContain('gap-4 md:gap-6');
    expect($header)->toContain('text-page-title');
    expect($header)->toContain('mb-5 flex flex-col gap-3 md:mb-8 md:gap-5');
    expect($strip)->toContain('grid-cols-2');
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
    expect($css)->toContain('rgb(255 255 255 / 0.78)');
    expect($css)->not->toMatch('/\.app-topbar[^{]*\{[^}]*color-mix\([^)]*transparent/');
});

it('names topbar icon-only actions for assistive tech', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));

    expect($header)->toContain('aria-label="Create"');
    expect($header)->toContain('aria-label="Notifications"');
    expect($header)->toContain('aria-label={`${user.name} account menu`}');
});

it('keeps the top bar as one honest instrument without a second bell', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $palette = file_get_contents(resource_path('js/components/crm/command-palette.tsx'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $css = file_get_contents(resource_path('css/app.css'));

    expect($header)->toContain('placeholder="Find a page"');
    expect($header)->toContain('aria-label="Find a page"');
    expect($header)->not->toContain('Find or Ask');
    expect($header)->not->toContain('unread');
    expect($palette)->toContain('placeholder="Find a page"');
    expect($palette)->not->toContain('Search contacts, deals');
    expect($rail)->not->toContain('Bell');
    expect($header)->toContain('min-[390px]:inline-flex');
    expect($css)->toContain('--app-chrome-height: 44px');
    expect($css)->toContain('--app-chrome-height: 52px');
});

it('names More-panel pin controls for assistive tech', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain("aria-label={pinned ? 'Unpin from sidebar' : 'Pin to sidebar'}");
});

it('keeps remaining application chrome off raw Aurora radius and muted-text tokens', function () {
    $files = [
        'js/pages/auth/auth-screen.tsx',
        'js/pages/settings/connectors.tsx',
        'js/pages/leads/board.tsx',
        'js/components/desk/official-connect-panel.tsx',
        'js/components/crm/pipeline-kanban.tsx',
    ];

    foreach ($files as $file) {
        $src = file_get_contents(resource_path($file));
        expect($src)->not->toContain('--aurora-radius-');
        expect($src)->not->toContain('--aurora-text-muted');
    }
});

it('paints the More panel with Brand Book surfaces instead of raw Aurora identity tokens', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain("borderColor: 'var(--evosales-hairline)'");
    expect($rail)->toContain("background: 'var(--evosales-canvas-soft)'");
    expect($rail)->toContain("background: 'var(--evosales-canvas)'");
    expect($rail)->toContain("color: 'var(--evosales-ink)'");
    expect($rail)->toContain('text-[var(--evosales-mute)]');
    expect($rail)->not->toContain("borderColor: 'var(--aurora-border-default)'");
    expect($rail)->not->toContain("background: 'var(--aurora-control-surface)'");
    expect($rail)->not->toContain("background: 'var(--aurora-panel-strong)'");
    expect($rail)->not->toContain('--aurora-text-muted');
    expect($rail)->not->toContain('--aurora-text-primary');
    expect($rail)->not->toContain('--aurora-radius-');
});
