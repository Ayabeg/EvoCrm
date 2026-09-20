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
    expect($bridge)->toMatch('/--aurora-nav-bg:\s*#f7f7f5/');
    expect($bridge)->toMatch('/--sidebar:\s*#f7f7f5/');
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
        'js/components/dashboard/guided-actions.tsx',
        'js/components/dashboard/home-kpi-strip.tsx',
        'js/components/crm/evo-kpi-card.tsx',
        'js/components/crm/crm-kpi-strip.tsx',
        'js/components/crm/crm-list-shell.tsx',
        'js/components/crm/crm-object-header.tsx',
        'js/components/crm/crm-active-filters.tsx',
        'js/components/crm/list-toolbar.tsx',
        'js/pages/crm/contacts/index.tsx',
        'js/pages/crm/companies/index.tsx',
        'js/pages/crm/deals/index.tsx',
        'js/pages/crm/leads/index.tsx',
        'js/pages/crm/contacts/show.tsx',
        'js/pages/crm/companies/show.tsx',
        'js/pages/crm/deals/show.tsx',
        'js/components/crm/record-hub.tsx',
        'js/components/crm/record-chrome.tsx',
        'js/components/crm/ask-evo-panel.tsx',
        'js/components/crm/record-activity-panel.tsx',
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
    expect($bridge)->toContain('--aurora-accent-primary: var(--color-accent)');
    expect($bridge)->toContain('--aurora-accent-primary-surface:');
    expect($bridge)->not->toMatch('/--aurora-accent-primary:\s*#29b6f6/');
    expect($bridge)->not->toMatch('/--aurora-accent-primary:\s*#0288d1/');
});

it('locks the P02 semantic tokens and retires Slate and antique orange', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($app)->toContain('--color-bg: #f7f7f5');
    expect($app)->toContain('--color-text: #161616');
    expect($app)->toContain('--color-accent: #e8530e');
    expect($app)->toContain('--color-accent-hover: #d74908');
    expect($app)->toContain('--color-accent-pressed: #b8410b');
    expect($app)->toContain('--evosales-canvas: var(--color-bg)');
    expect($app)->toContain('--evosales-canvas-soft: var(--color-bg)');
    expect($app)->toContain('--evosales-ink: var(--color-text)');
    expect($app)->toContain('--evosales-mark: var(--color-accent)');
    expect($app)->toContain('--evosales-mark-hover: var(--color-accent-hover)');
    expect($app)->toContain('--evosales-mark-pressed: var(--color-accent-pressed)');
    expect($app)->toContain('--primary: var(--color-accent)');
    expect($app)->not->toContain('#ec6025');
    expect($app)->not->toContain('#2e3a45');
    expect($app)->not->toContain('#2E3A45');
    expect($app)->not->toContain('#eaeaea');
    expect($app)->not->toContain('#d9500f');
    expect($bridge)->toContain('--aurora-accent-strong: var(--color-accent-hover)');
    expect($bridge)->toContain('--primary: var(--color-accent)');
    expect($bridge)->not->toContain('#ec6025');
    expect($bridge)->not->toContain('#2e3a45');
});

it('keeps the P04 rail at 240px expanded, 64px collapsed, and a 240px mobile Sheet', function () {
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));

    expect($sidebar)->toContain('const SIDEBAR_WIDTH = "240px"');
    expect($sidebar)->toContain('const SIDEBAR_WIDTH_MOBILE = "240px"');
    expect($sidebar)->toContain('const SIDEBAR_WIDTH_ICON = "64px"');
    expect($sidebar)->toContain('sidebar_state');
    expect($sidebar)->not->toContain('const SIDEBAR_WIDTH = "3.5rem"');
    expect($sidebar)->not->toContain('const SIDEBAR_WIDTH = "220px"');
    expect($sidebar)->toContain('<SheetContent');
    expect($sidebar)->toContain('background: "var(--sidebar)"');
    expect($sidebar)->toContain('width: SIDEBAR_WIDTH_MOBILE');
    expect($sidebar)->toContain('w-[min(var(--sidebar-width),92vw)]');
    expect($sidebar)->not->toContain('w-[min(396px,92vw)]');
});

it('keeps Home KPI values restrained at 20/26 and CRM cards on Brand Book text-kpi', function () {
    $card = file_get_contents(resource_path('js/components/crm/evo-kpi-card.tsx'));
    $strip = file_get_contents(resource_path('js/components/dashboard/home-kpi-strip.tsx'));
    $helpers = file_get_contents(resource_path('js/lib/dashboard-operating-home.ts'));

    expect($card)->toContain('text-kpi');
    expect($card)->toContain('break-words');
    expect($card)->not->toContain('text-[1.875rem]');
    expect($card)->not->toContain('min-h-[7.5rem]');
    expect($strip)->toContain('HOME_KPI_VALUE_CLASS');
    expect($strip)->toContain('formatCompactDzd');
    expect($strip)->not->toContain('whitespace-nowrap');
    expect($helpers)->toContain('text-[20px]');
    expect($helpers)->toContain('leading-[26px]');
    expect($helpers)->toContain('break-words');
    expect($helpers)->not->toContain('lg:text-kpi');
    expect($helpers)->not->toContain('whitespace-nowrap');
});

it('uses V01 page-header geometry on Home chrome', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $header = file_get_contents(resource_path('js/components/dashboard/dashboard-header.tsx'));
    $strip = file_get_contents(resource_path('js/components/dashboard/home-kpi-strip.tsx'));
    $helpers = file_get_contents(resource_path('js/lib/dashboard-operating-home.ts'));

    expect($home)->toContain('px-4 pt-5 md:px-8');
    expect($home)->toContain('data-home="workspace"');
    expect($home)->not->toContain('max-w-6xl');
    expect($header)->toContain('text-[28px] leading-[34px] font-[650]');
    expect($header)->toContain('flex flex-col gap-3');
    expect($header)->toContain('create=1');
    expect($header)->toContain('variant="secondary"');
    expect($strip)->toContain('HOME_KPI_STRIP_TRACK_CLASS');
    expect($strip)->not->toContain('overflow-x-auto');
    expect($strip)->not->toContain('min-w-[7.5rem]');
    expect($helpers)->toContain('grid-cols-2');
    expect($helpers)->toContain('lg:grid-cols-4');
    expect($helpers)->not->toContain('overflow-x-auto');
});

it('places Needs attention and Today above the KPI strip on Home', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));

    expect(strpos($home, "title={t('Needs attention')}"))->toBeLessThan(strpos($home, '<HomeKpiStrip'));
    expect(strpos($home, "title={t('Today')}"))->toBeLessThan(strpos($home, '<HomeKpiStrip'));
    expect(strpos($home, '<HomeKpiStrip'))->toBeLessThan(strpos($home, "title={t('Pipeline')}"));
    expect($home)->not->toContain('QuickActions');
    expect($home)->not->toContain('CrmKpiStrip');
});

it('uses the EvoCrm accent pill on the active rail', function () {
    $app = file_get_contents(resource_path('css/app.css'));
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($app)->not->toContain('--sidebar-accent: rgba(236, 96, 37, 0.22)');
    expect($bridge)->not->toContain('--sidebar-accent: rgba(236, 96, 37, 0.22)');
    expect($app)->not->toContain('--sidebar-accent: rgba(255, 255, 255, 0.1)');
    expect($bridge)->not->toContain('--sidebar-accent: rgba(255, 255, 255, 0.1)');
    expect($app)->toContain('--sidebar-accent: var(--color-accent-soft)');
    expect($bridge)->toContain('--sidebar-accent: var(--color-accent-soft)');
    expect($app)->toContain('--sidebar-ring: #e8530e');
    expect($rail)->toContain('app-rail-item');
    expect($rail)->not->toContain('inset_2px_0_0_0');
    expect($rail)->toContain("from '@inertiajs/react'");
});

it('keeps the page shell as a flat Brand canvas with no mesh radials', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));
    $shell = file_get_contents(resource_path('js/components/app-shell.tsx'));

    expect($bridge)->toContain('--aurora-shell-bg: var(--color-bg)');
    expect($bridge)->not->toMatch('/--aurora-shell-bg:[^;]*radial-gradient/');
    expect($shell)->toContain('bg-[var(--aurora-shell-bg)]');
});

it('paints the topbar as a solid hairline instead of an Aurora panel gradient', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $css = file_get_contents(resource_path('css/app.css'));

    expect($header)->toContain('app-topbar');
    expect($header)->not->toContain('linear-gradient(180deg, var(--aurora-panel-strong-top)');
    expect($css)->toContain('.app-topbar');
    expect($css)->toContain('background: var(--color-surface)');
    expect($css)->toContain('backdrop-filter: none');
    expect($css)->not->toContain('rgb(247 247 245 / 0.86)');
    expect($css)->not->toMatch('/\.app-topbar[^{]*\{[^}]*color-mix\([^)]*transparent/');
});

it('names topbar icon-only actions for assistive tech', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));

    expect($header)->toContain("t('Create')");
    expect($header)->toContain("t('Tasks')");
    expect($header)->toContain("t(':name account menu'");
});

it('keeps the top bar as one honest instrument without a second bell', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));
    $palette = file_get_contents(resource_path('js/components/crm/command-palette.tsx'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $css = file_get_contents(resource_path('css/app.css'));

    expect($header)->toContain("t('Search EvoCRM…')");
    expect($header)->not->toContain('Find or Ask');
    expect($header)->not->toContain('Find a record or page');
    expect($header)->not->toContain('unread');
    expect($palette)->toContain('placeholder="Search, navigate, create, or act"');
    expect($palette)->not->toContain('Search contacts, deals');
    expect($rail)->not->toContain('Bell');
    expect($header)->toContain('data-chrome="notify"');
    expect($header)->toContain('data-chrome="menu"');
    expect($header)->toContain('data-chrome="ai"');
    expect($header)->toContain('hidden min-[390px]:block');
    expect($header)->toContain('data-chrome="menu"');
    expect($css)->toContain('--app-chrome-height: 48px');
    expect($css)->toContain(".app-topbar [data-chrome='notify']");
    expect($css)->toContain('@media (max-width: 389px)');
});

it('names the More overflow for assistive tech', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain('aria-haspopup="menu"');
    expect($rail)->toContain('aria-expanded={moreOpen}');
    expect($rail)->toContain('sidebar-more-panel');
});

it('keeps remaining application chrome off raw Aurora radius and muted-text tokens', function () {
    $files = [
        'js/pages/auth/auth-screen.tsx',
        'js/pages/settings/connectors.tsx',
        'js/pages/leads/board.tsx',
        'js/pages/crm/deals/board.tsx',
        'js/components/crm/deal-forecast-bar.tsx',
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

    expect($rail)->toContain('border-hairline bg-surface text-ink')
        ->and($rail)->toContain('hover:bg-subtle');
    expect($rail)->not->toContain("borderColor: 'var(--aurora-border-default)'");
    expect($rail)->not->toContain("background: 'var(--aurora-control-surface)'");
    expect($rail)->not->toContain("background: 'var(--aurora-panel-strong)'");
    expect($rail)->not->toContain('--aurora-text-muted');
    expect($rail)->not->toContain('--aurora-text-primary');
    expect($rail)->not->toContain('--aurora-radius-');
});
