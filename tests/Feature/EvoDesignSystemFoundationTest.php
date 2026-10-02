<?php

it('declares canonical Evo tokens in evo.css and aliases production names to them', function () {
    $evo = file_get_contents(resource_path('js/evo/tokens/evo.css'));
    $app = file_get_contents(resource_path('css/app.css'));
    $shell = file_get_contents(resource_path('css/evo-shell.css'));

    expect($evo)->toContain('--evo-canvas: #f7f8f5')
        ->and($evo)->toContain('--evo-surface: #ffffff')
        ->and($evo)->toContain('--evo-ink: #0d1b24')
        ->and($evo)->toContain('--evo-hairline: #e6e8e3')
        ->and($evo)->toContain('--evo-teal: #0f4c5c')
        ->and($evo)->toContain('--evo-primary: #ec6025')
        ->and($evo)->toContain('--evo-on-primary: #121212')
        ->and($evo)->toContain('--evo-logo: #d9500f')
        ->and($evo)->toContain('--evo-canvas: #0a0a0a')
        ->and($evo)->toContain('--evo-surface: #121212')
        ->and($evo)->toContain('--evo-surface-raised: #1c1c1c')
        ->and($evo)->toContain('--evo-duration-micro: 120ms')
        ->and($evo)->toContain('--evo-duration-normal: 200ms')
        ->and($evo)->toContain('--evo-duration-context: 240ms')
        ->and($evo)->toContain('cubic-bezier(0.2, 0.8, 0.2, 1)')
        ->and($evo)->toContain('--evo-z-modal:')
        ->and($evo)->toContain('@media (prefers-reduced-motion: reduce)');

    expect($app)->toContain("@import '../js/evo/tokens/evo.css'")
        ->and($app)->toContain('--color-bg: var(--evo-canvas)')
        ->and($app)->toContain('--color-text: var(--evo-ink)')
        ->and($app)->toContain('--color-accent: var(--evo-primary)')
        ->and($app)->toContain('--color-focus-ring: var(--evo-focus)')
        ->and($app)->toContain('--color-sidebar-active: var(--evo-teal-soft)')
        ->and($app)->toContain('--primary-foreground: var(--evo-on-primary)')
        ->and($app)->toContain('--destructive-foreground: var(--evo-on-danger)')
        ->and($app)->toContain('--chart-1: var(--evo-chart-1)')
        ->and($app)->toContain('--sidebar-online: var(--evo-success)')
        ->and($app)->not->toContain("@import '@fontsource/inter/400.css'")
        ->and($app)->not->toContain('--color-bg: #f7f7f5')
        ->and($app)->not->toContain('--color-accent: #e8530e');

    expect($shell)->not->toContain('--evo-surface: #fbfcf9')
        ->and($shell)->toContain('background: var(--evo-canvas)');
});

it('exposes fr-DZ formatters and Saturday week start', function () {
    $format = file_get_contents(resource_path('js/evo/lib/format.ts'));

    expect($format)->toContain("export const LOCALE = 'fr-DZ'")
        ->and($format)->toContain("export const TIMEZONE = 'Africa/Algiers'")
        ->and($format)->toContain('export const WEEK_STARTS_ON = 6')
        ->and($format)->toContain('hourCycle: \'h23\'')
        ->and($format)->toContain('formatMoney')
        ->and($format)->toContain('formatPhone')
        ->and($format)->toContain("from '@/lib/money'");
});

it('keeps the Design Lab token page behind the existing admin gate', function () {
    $routes = file_get_contents(resource_path('design-lab/lib/routes.ts'));
    $page = file_get_contents(resource_path('design-lab/pages/TokensPage.tsx'));

    expect($routes)->toContain("name: 'tokens'")
        ->and($page)->toContain('Jetons')
        ->and($page)->toContain('Créer une affaire');

    $this->get('/design-lab/tokens')->assertOk();
});

it('keeps the Design Lab settings family behind the existing admin gate', function () {
    $routes = file_get_contents(resource_path('design-lab/lib/routes.ts'));
    $page = file_get_contents(resource_path('design-lab/pages/SettingsLabPage.tsx'));

    expect($routes)->toContain("name: 'settings'")
        ->and($page)->toContain('Settings family')
        ->and($page)->toContain('SettingsSaveBar')
        ->and($page)->toContain('SettingsDangerZone')
        ->and($page)->toContain('PhoneInput')
        ->and($page)->toContain('MoneyInput')
        ->and($page)->toContain('TimePicker');

    $this->get('/design-lab/settings')->assertOk();
});

it('keeps the Design Lab shell page behind the existing admin gate', function () {
    $routes = file_get_contents(resource_path('design-lab/lib/routes.ts'));
    $page = file_get_contents(resource_path('design-lab/pages/ShellPage.tsx'));
    $package = file_get_contents(base_path('package.json'));

    expect($routes)->toContain("name: 'shell'")
        ->and($page)->toContain('VOS AGENTS')
        ->and($page)->toContain('ShellModeSwitch')
        ->and($package)->not->toContain('@astryxdesign')
        ->and($package)->not->toContain('@stylexjs/stylex');

    $this->get('/design-lab/shell')->assertOk();
});

it('keeps the Design Lab agents page behind the existing admin gate', function () {
    $routes = file_get_contents(resource_path('design-lab/lib/routes.ts'));
    $page = file_get_contents(resource_path('design-lab/pages/AgentsPage.tsx'));

    expect($routes)->toContain("name: 'agents'")
        ->and($page)->toContain('data-lab-page="agents"')
        ->and($page)->toContain('id="approval"')
        ->and($page)->toContain('StreamingState')
        ->and($page)->toContain('ApprovalCard');

    $this->get('/design-lab/agents')->assertOk();
});

it('ships provenance, token, catalog and icon docs', function () {
    $provenance = file_get_contents(base_path('docs/design-system/component-provenance.md'));
    $tokens = file_get_contents(base_path('docs/design-system/tokens.md'));
    $catalog = file_get_contents(base_path('docs/design-system/component-catalog.md'));
    $icons = file_get_contents(base_path('docs/design-system/icons.md'));

    expect($provenance)->toContain('AGPL-3.0-only')
        ->and($provenance)->toContain('reui.io/blocks/*')
        ->and($provenance)->toContain('Coss')
        ->and($provenance)->toContain('Formcn')
        ->and($provenance)->toContain('Shadcnblocks')
        ->and($provenance)->toContain('Cult UI Pro')
        ->and($provenance)->toContain('Tiptap Pro')
        ->and($provenance)->toContain('vaul')
        ->and($tokens)->toContain('--evo-on-primary')
        ->and($catalog)->toContain('Keyboard')
        ->and($icons)->toContain('lucide-react');
});
