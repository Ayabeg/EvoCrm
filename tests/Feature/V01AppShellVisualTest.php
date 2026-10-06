<?php

it('locks V01 Visual Law tokens for chrome inheritance', function () {
    $app = file_get_contents(resource_path('css/app.css'));

    expect($app)->toContain('--color-accent-hover: var(--evo-primary-hover)')
        ->and($app)->toContain('--color-accent-soft: var(--evo-primary-soft)')
        ->and($app)->toContain('--color-success: var(--evo-success)')
        ->and($app)->toContain('--color-warning: var(--evo-warning)')
        ->and($app)->toContain('--color-danger: var(--evo-danger)')
        ->and($app)->toContain('--color-border-strong: var(--evo-hairline-strong)')
        ->and($app)->toContain('--text-section-label: 0.75rem')
        ->and($app)->toContain('--text-micro: 0.75rem')
        ->and($app)->toContain('--app-chrome-height: 48px')
        ->and($app)->toContain('.text-page')
        ->and($app)->toContain('.text-meta')
        ->and($app)->toContain('.app-search-trigger')
        ->and($app)->toContain('border-radius: 8px')
        ->and($app)->not->toContain('border-radius: 999px')
        ->and($app)->not->toContain('--color-accent-hover: #cf4a0c')
        ->and($app)->not->toContain('--color-accent-soft: rgba(232, 83, 14, 0.1)');
});

it('keeps Aurora radii on the V00 control / menu / modal steps', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toContain('--aurora-radius-1: 8px')
        ->and($bridge)->toContain('--aurora-radius-2: 10px')
        ->and($bridge)->toContain('--aurora-radius-3: 12px')
        ->and($bridge)->not->toContain('--aurora-radius-3: 20px');
});

it('paints the rail with restrained orange active state and 12px group labels', function () {
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($rail)->toContain('bg-sidebar-accent font-medium text-sidebar-ink')
        ->and($rail)->toContain('text-meta')
        ->and($rail)->toContain('h-9')
        ->and($rail)->toContain('Evotechly / EvoCRM')
        ->and($rail)->not->toContain('text-[11px] font-semibold tracking-wide uppercase')
        ->and($rail)->not->toContain('bg-[var(--evosales-mark)]')
        ->and($rail)->not->toContain('text-[var(--evosales-mark)]')
        ->and($rail)->not->toContain('>EvoCRM<')
        ->and($rail)->not->toContain('text-meta bg-subtle');
});

it('keeps the topbar as quiet utility chrome with a labeled Create control', function () {
    $header = file_get_contents(resource_path('js/components/app-sidebar-header.tsx'));

    expect($header)->toContain("t('Create')")
        ->and($header)->toContain("t('Ask Evo')")
        ->and($header)->toContain("t('Tasks')")
        ->and($header)->toContain('className="evo-create-btn h-9 gap-2 px-3"')
        ->and($header)->not->toContain('sm:max-w-md')
        ->and($header)->not->toContain('size="sm"')
        ->and($header)->not->toContain('className="rounded-full"');
});

it('restyles Command OS presentation without a second palette', function () {
    $product = file_get_contents(resource_path('js/evo/patterns/command-palette/index.tsx'));
    $compat = file_get_contents(resource_path('js/components/crm/command-palette.tsx'));

    expect(file_exists(resource_path('js/components/aurora/command-palette.tsx')))->toBeFalse();
    expect($product)->toContain('640px')
        ->and($product)->toContain('min(640px,calc(100vw-2rem))')
        ->and($product)->toContain('h-11')
        ->and($product)->toContain('rounded-[12px]')
        ->and($product)->toContain('data-[selected=true]:bg-[var(--evo-teal-soft)]')
        ->and($product)->not->toContain('fontSize: "10px"')
        ->and($product)->toContain('buildCommandCatalog')
        ->and($product)->toContain('composeCommandResults')
        ->and($compat)->toContain("from '@/evo/patterns/command-palette'");
});

it('maps shared Badge default away from Aurora cyan', function () {
    $bridge = file_get_contents(resource_path('js/lib/aurora/shadcn-bridge.ts'));

    expect($bridge)->toContain("tone: 'neutral'")
        ->and($bridge)->toContain("fill: 'soft'")
        ->and($bridge)->not->toContain("tone: 'cyan'");
});

it('paints elevated menus at radius 10', function () {
    $dropdown = file_get_contents(resource_path('js/evo/ui/dropdown-menu.tsx'));
    $select = file_get_contents(resource_path('js/evo/ui/select.tsx'));

    expect($dropdown)->toContain('rounded-[var(--evo-radius-standard)]')
        ->and($dropdown)->toContain('sideOffset = 8')
        ->and($select)->toContain('rounded-[var(--evo-radius-standard)]');
});

it('demotes RoomShell to contextual navigation without dropping tabs', function () {
    $room = file_get_contents(resource_path('js/components/crm/room-shell.tsx'));
    $crm = file_get_contents(resource_path('js/components/crm/crm-shell.tsx'));
    $desk = file_get_contents(resource_path('js/components/crm/desk-shell.tsx'));

    expect($room)->toContain('data-chrome="contextual"')
        ->and($room)->toContain('sr-only')
        ->and($room)->toContain('tabs.map')
        ->and($crm)->toContain('crmTabs')
        ->and($desk)->toContain('deskTabs')
        ->and($room)->not->toContain('text-page-title')
        ->and($room)->not->toContain('border-b-2')
        ->and($room)->not->toContain('border-[var(--evosales-mark)]');
});
