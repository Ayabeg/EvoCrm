<?php

/**
 * P25 — Responsive hardening source locks.
 * Page H-overflow is a defect. Table/board local scroll is OK.
 * P17 KPI 2×2 and P22 secret-reveal stay frozen.
 */
it('locks the shared overflow contract and required viewports', function () {
    $responsive = file_get_contents(resource_path('js/lib/responsive.ts'));
    $css = file_get_contents(resource_path('css/app.css'));

    expect($responsive)->toContain('export const P25_VIEWPORTS = [1440, 1280, 1024, 768]')
        ->and($responsive)->toContain("export const PAGE_OVERFLOW_CLASS = 'min-w-0 overflow-x-hidden'")
        ->and($responsive)->toContain("export const LOCAL_SCROLL_X_CLASS = 'min-w-0 overflow-x-auto'")
        ->and($responsive)->toContain("export const MONEY_NEVER_CLIP_CLASS =")
        ->and($responsive)->toContain('break-words')
        ->and($responsive)->not->toContain('text-[10px]')
        ->and($css)->toContain('.overflow-page')
        ->and($css)->toContain('.overflow-local-x');
});

it('contains DataWorkspace, FilterBar, and list money so wide tables cannot H-overflow the page', function () {
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $filterBar = file_get_contents(resource_path('js/ds/workspace/FilterBar.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/quote-columns.tsx'));

    expect($workspace)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($workspace)->toContain('flex min-h-0 min-w-0 flex-1 flex-col')
        ->and($filterBar)->toContain('FILTER_SEARCH_CLASS')
        ->and($filterBar)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($filterBar)->toContain('flex min-w-0 flex-wrap items-center gap-2')
        ->and($filterBar)->not->toContain('min-w-[12rem]')
        ->and($table)->toContain("column.id !== 'amount'")
        ->and($table)->toContain('LOCAL_SCROLL_X_CLASS')
        ->and($table)->toContain("'table-fixed min-w-[52rem]'")
        ->and($quotes)->toContain('break-words tabular-nums')
        ->and($quotes)->not->toContain('money block truncate');
});

it('caps overlays to the viewport without rewriting Dialog/Drawer semantics', function () {
    $dialog = file_get_contents(resource_path('js/components/ui/aurora/dialog.tsx'));
    $dropdown = file_get_contents(resource_path('js/components/ui/aurora/dropdown-menu.tsx'));
    $popover = file_get_contents(resource_path('js/components/ui/aurora/popover.tsx'));
    $qrd = file_get_contents(resource_path('js/ds/workspace/QuickRecordDrawer.tsx'));
    $command = file_get_contents(resource_path('js/components/aurora/command-palette.tsx'));

    expect($dialog)->toContain('max-w-[min(32rem,calc(100vw-2rem))]')
        ->and($dialog)->toContain('max-w-[min(56rem,calc(100vw-2rem))]')
        ->and($dropdown)->toContain('max-w-[min(24rem,calc(100vw-1rem))]')
        ->and($popover)->toContain('max-w-[calc(100vw-1rem)]')
        ->and($qrd)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($qrd)->toContain('sm:w-[min(92vw,520px)]')
        ->and($command)->toContain('maxWidth: "calc(100vw - 32px)"');
});

it('keeps P17 KPI 2×2, inbox native/embed, and quote money unclipped', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $lib = file_get_contents(resource_path('js/lib/dashboard-operating-home.ts'));
    $inbox = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));
    $builder = file_get_contents(resource_path('js/lib/quote-builder.ts'));
    $split = file_get_contents(resource_path('js/pages/crm/quotes/quote-split-builder.tsx'));
    $fact = file_get_contents(resource_path('js/components/crm/record-hub.tsx'));

    expect($home)->toContain('overflow-x-hidden')
        ->and($lib)->toContain('grid-cols-2')
        ->and($lib)->toContain('md:grid-cols-4')
        ->and($lib)->not->toContain('whitespace-nowrap')
        ->and($inbox)->toContain('data-inbox="embed"')
        ->and($inbox)->toContain('data-inbox="native"')
        ->and($inbox)->toContain('onUseNative')
        ->and(substr_count($inbox, 'overflow-x-hidden'))->toBeGreaterThanOrEqual(3)
        ->and($builder)->toContain('QUOTE_MONEY_CLASS')
        ->and($builder)->toContain('break-words')
        ->and($split)->toContain('QUOTE_MONEY_CLASS')
        ->and($split)->toContain('LOCAL_SCROLL_X_CLASS')
        ->and($split)->not->toContain('min-w-[12rem]')
        ->and($fact)->toContain('MONEY_NEVER_CLIP_CLASS')
        ->and($fact)->toContain('PAGE_OVERFLOW_CLASS');
});

it('does not leak integration secrets through Settings DOM strings', function () {
    $secret = file_get_contents(resource_path('js/components/settings/secret-callback-field.tsx'));
    $sms = file_get_contents(resource_path('js/pages/settings/sms.tsx'));
    $meta = file_get_contents(resource_path('js/pages/settings/meta.tsx'));
    $settings = file_get_contents(resource_path('js/layouts/settings/layout.tsx'));

    expect($secret)->toContain('masked_url')
        ->and($secret)->toContain('can_reveal')
        ->and($secret)->toContain('break-all')
        ->and($secret)->not->toContain('access_token')
        ->and($secret)->not->toContain('defaultValue={callback')
        ->and($sms)->toContain("type=\"password\"")
        ->and($sms)->not->toContain('defaultValue={api_key')
        ->and($meta)->toContain('SecretCallbackField')
        ->and($meta)->not->toContain('access_token')
        ->and($settings)->toContain('PAGE_OVERFLOW_CLASS');
});

it('keeps activation, Ask Evo, and shell overflow without a visual redesign', function () {
    $activation = file_get_contents(resource_path('js/components/dashboard/activation-checklist.tsx'));
    $ask = file_get_contents(resource_path('js/components/crm/ask-evo-panel.tsx'));
    $drawer = file_get_contents(resource_path('js/components/crm/ask-evo-drawer.tsx'));
    $shell = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $header = file_get_contents(resource_path('js/ds/chrome/PageHeader.tsx'));
    $room = file_get_contents(resource_path('js/components/crm/room-shell.tsx'));
    $queue = file_get_contents(resource_path('js/components/crm/activity-work-queue.tsx'));
    $workflows = file_get_contents(resource_path('js/pages/crm/workflows/index.tsx'));

    expect($activation)->toContain('min-w-0 break-words')
        ->and($ask)->toContain('overflow-x-hidden')
        ->and($ask)->toContain('data-testid="ask-evo-context"')
        ->and($drawer)->toContain('overflow-x-hidden')
        ->and($shell)->toContain('min-w-0 overflow-x-clip')
        ->and($header)->toContain('LONG_TEXT_CLASS')
        ->and($room)->toContain('PAGE_OVERFLOW_CLASS')
        ->and($room)->toContain('LONG_TEXT_CLASS')
        ->and($queue)->toContain('overflow-x-hidden')
        ->and($workflows)->toContain('overflow-x-hidden');
});
