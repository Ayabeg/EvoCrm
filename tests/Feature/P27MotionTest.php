<?php

/**
 * P27 — Motion & micro-UX source locks.
 * One restrained language. P00–P26 frozen. No visual redesign.
 */
use Illuminate\Support\Facades\File;

it('locks P27 timing tokens without a new motion framework', function () {
    $tokens = File::get(resource_path('js/lib/motion.ts'));
    $css = File::get(resource_path('css/app.css'));
    $motion = File::get(resource_path('css/aurora-motion.css'));
    $js = File::get(base_path('tests/js/p27-motion.ts'));
    $audit = File::get(base_path('docs/motion/P27-AUDIT.md'));
    $contract = File::get(base_path('docs/motion/P27-CONTRACT.md'));

    expect($tokens)->toContain('export const P27_HOVER_MS = 120')
        ->and($tokens)->toContain('export const P27_DROPDOWN_MS = 150')
        ->and($tokens)->toContain('export const P27_PAGE_MS = 150')
        ->and($tokens)->toContain('export const P27_MODAL_MS = 180')
        ->and($tokens)->toContain('export const P27_DRAWER_MS = 200')
        ->and($tokens)->toContain("export const P27_EASE = 'cubic-bezier(.2,.8,.2,1)'")
        ->and($tokens)->toContain('MOTION_HOVER_CLASS')
        ->and($tokens)->toContain('MOTION_DRAWER_CLASS')
        ->and($tokens)->not->toContain('framer-motion')
        ->and($tokens)->not->toContain('lottie');

    expect($css)->toContain('--motion-duration-hover: 120ms')
        ->and($css)->toContain('--motion-duration-dropdown: 150ms')
        ->and($css)->toContain('--motion-duration-page: 150ms')
        ->and($css)->toContain('--motion-duration-modal: 180ms')
        ->and($css)->toContain('--motion-duration-drawer: 200ms')
        ->and($css)->toContain('--color-text-muted: var(--evo-ink-muted)')
        ->and($css)->toContain('--color-focus-ring: var(--evo-focus)');

    expect($motion)->toContain('--motion-duration-hover')
        ->and($motion)->toContain('--motion-duration-drawer')
        ->and($motion)->toContain('--motion-duration-modal')
        ->and($motion)->toContain('scale(0.98)')
        ->and($motion)->toContain('scale(0.97)')
        ->and($motion)->toContain("@media (prefers-reduced-motion: reduce)")
        ->and($motion)->toContain("[data-command='os']")
        ->and($motion)->toContain("[data-command='backdrop']")
        ->and($motion)->toContain('.animate-pulse')
        ->and($motion)->toContain('.aurora-shimmer')
        ->and($motion)->not->toContain('spring')
        ->and($motion)->not->toContain('framer')
        ->and($motion)->not->toContain('lottie')
        ->and($motion)->not->toContain('--motion-bounce');

    expect($js)->toContain('hover is ~120ms')
        ->and($js)->toContain('300ms is outside the contract');

    expect($audit)->toContain('KEEP')
        ->and($audit)->toContain('NORMALIZE')
        ->and($audit)->toContain('REMOVE')
        ->and($audit)->toContain('DEFER_TO_VISUAL')
        ->and($contract)->toContain('MERGE READY: NO')
        ->and($contract)->toContain('READY_FOR_CONTABO')
        ->and($contract)->toContain('cubic-bezier(.2,.8,.2,1)');
});

it('normalizes overlay open/close to the P27 contract and keeps P26 reduce strings', function () {
    $dialog = File::get(resource_path('js/components/ui/aurora/dialog.tsx'));
    $sheet = File::get(resource_path('js/components/ui/aurora/sheet.tsx'));
    $dropdown = File::get(resource_path('js/components/ui/aurora/dropdown-menu.tsx'));
    $popover = File::get(resource_path('js/components/ui/aurora/popover.tsx'));
    $qrd = File::get(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));
    $palette = File::get(resource_path('js/components/aurora/command-palette.tsx'));

    expect($dialog)->toContain('MOTION_MODAL_CLASS')
        ->and($dialog)->toContain('motion-reduce:animate-none')
        ->and($dialog)->toContain('max-w-[min(32rem,calc(100vw-2rem))]')
        ->and($dialog)->not->toContain('duration-500');

    expect($sheet)->toContain('MOTION_DRAWER_CLASS')
        ->and($sheet)->toContain('motion-reduce:animate-none')
        ->and($sheet)->not->toContain('data-[state=open]:duration-300')
        ->and($sheet)->not->toContain('duration-500');

    expect($dropdown)->toContain('MOTION_DROPDOWN_CLASS')
        ->and($dropdown)->toContain('max-w-[min(24rem,calc(100vw-1rem))]');

    expect($popover)->toContain('MOTION_DROPDOWN_CLASS')
        ->and($popover)->toContain('max-w-[calc(100vw-1rem)]');

    expect($qrd)->toContain('MOTION_DRAWER_CLASS')
        ->and($qrd)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($qrd)->toContain('sm:w-[min(92vw,520px)]')
        ->and($qrd)->toContain('--motion-duration-drawer');

    expect($palette)->toContain('var(--motion-duration-modal)')
        ->and($palette)->toContain('var(--motion-ease-out)')
        ->and($palette)->toContain('maxWidth: "calc(100vw - 32px)"')
        ->and($palette)->toContain('trapTabKey')
        ->and($palette)->not->toContain('cubic-bezier(0.16, 1, 0.3, 1)');
});

it('normalizes listed surfaces without KPI counting, money tween, confetti, or fake Ask Evo latency', function () {
    $kpi = File::get(resource_path('js/components/dashboard/home-kpi-strip.tsx'));
    $inbox = File::get(resource_path('js/components/crm/inbox-chrome.tsx'));
    $list = File::get(resource_path('js/components/crm/list-view-table.tsx'));
    $table = File::get(resource_path('js/ds/workspace/DataTable.tsx'));
    $workspace = File::get(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $kanban = File::get(resource_path('js/components/crm/pipeline-kanban.tsx'));
    $ask = File::get(resource_path('js/components/crm/ask-evo-panel.tsx'));
    $askDrawer = File::get(resource_path('js/components/crm/ask-evo-drawer.tsx'));
    $activation = File::get(resource_path('js/components/dashboard/activation-checklist.tsx'));
    $settings = File::get(resource_path('js/layouts/settings/layout.tsx'));
    $secret = File::get(resource_path('js/components/settings/secret-callback-field.tsx'));
    $quotes = File::get(resource_path('js/pages/crm/quotes/quote-columns.tsx'));
    $builder = File::get(resource_path('js/lib/quote-builder.ts'));
    $workflows = File::get(resource_path('js/pages/crm/workflows/index.tsx'));
    $home = File::get(resource_path('js/lib/dashboard-operating-home.ts'));
    $feed = File::get(resource_path('js/components/dashboard/activity-feed.tsx'));

    expect($kpi)->toContain('MOTION_HOVER_CLASS')
        ->and($kpi)->toContain('formatCompactDzd')
        ->and($kpi)->not->toContain('countUp')
        ->and($kpi)->not->toContain('requestAnimationFrame');

    expect($inbox)->toContain('MOTION_HOVER_CLASS')
        ->and($inbox)->toContain('conversationA11yName');

    expect($list)->toContain('MOTION_HOVER_CLASS')
        ->and($list)->toContain('LOCAL_SCROLL_X_CLASS')
        ->and($table)->toContain('MOTION_HOVER_CLASS')
        ->and($workspace)->toContain("data-p27=\"loading\"")
        ->and($workspace)->toContain('aria-busy="true"')
        ->and($workspace)->not->toContain('setTimeout');

    expect($kanban)->toContain('--motion-duration-hover')
        ->and($kanban)->toContain('motion-reduce:transition-none')
        ->and($kanban)->toContain('aria-busy={busy || undefined}')
        ->and($kanban)->not->toContain('aria-hidden={busy');

    expect($ask)->toContain('MOTION_HOVER_CLASS')
        ->and($ask)->toContain('processing')
        ->and($ask)->not->toContain('typewriter')
        ->and($ask)->not->toContain('fakeTyping')
        ->and($askDrawer)->toContain('MOTION_HOVER_CLASS')
        ->and($askDrawer)->not->toContain('typewriter');

    expect($activation)->toContain('motion-reduce:transition-none')
        ->and($activation)->toContain('--motion-duration-hover')
        ->and($activation)->not->toContain('confetti');

    expect($settings)->toContain('MOTION_HOVER_CLASS')
        ->and($settings)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($secret)->toContain('masked_url')
        ->and($secret)->not->toContain('access_token');

    expect($quotes)->toContain('formatDzd')
        ->and($quotes)->not->toContain('countUp')
        ->and($builder)->toContain('QUOTE_MONEY_CLASS');

    expect($workflows)->toContain('overflow-x-hidden')
        ->and($home)->toContain('grid-cols-2')
        ->and($home)->toContain('lg:grid-cols-4')
        ->and($feed)->toContain('MOTION_HOVER_CLASS');
});

it('keeps P25 viewports and page overflow as the H-overflow law', function () {
    $responsive = File::get(resource_path('js/lib/responsive.ts'));

    expect($responsive)->toContain('export const P25_VIEWPORTS = [1440, 1280, 1024, 768]')
        ->and($responsive)->toContain("export const PAGE_OVERFLOW_CLASS = 'min-w-0 overflow-x-hidden'")
        ->and($responsive)->toContain('MONEY_NEVER_CLIP_CLASS');
});

it('source-locks the P27 JS proofs and P25/P26 regression files', function () {
    $js = File::get(base_path('tests/js/p27-motion.ts'));
    $p25 = File::get(base_path('tests/js/p25-responsive-hardening.ts'));
    $p26 = File::get(base_path('tests/js/p26-accessibility.ts'));

    expect($js)->toContain('from \'../../resources/js/lib/motion\'')
        ->and($js)->toContain('P27 motion JS proofs passed')
        ->and($p25)->toContain('required viewports')
        ->and($p26)->toContain('unread is named, not color-only');
});
