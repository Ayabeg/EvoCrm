<?php

it('composes shared empty states with an illustration slot and line-art kinds', function () {
    $empty = file_get_contents(resource_path('js/components/ui/aurora/empty-state.tsx'));
    $art = file_get_contents(resource_path('js/components/ui/empty-illustration.tsx'));
    $lists = file_get_contents(resource_path('js/components/crm/list-chrome.tsx'));
    $home = file_get_contents(resource_path('js/components/dashboard/home-widget.tsx'));
    $room = file_get_contents(resource_path('js/components/crm/empty-room.tsx'));

    expect($empty)->toContain('illustration')
        ->and($empty)->toContain('density')
        ->and($empty)->toContain('EmptyIllustration')
        ->and($empty)->toContain('data-empty-state')
        ->and($empty)->toContain('role="status"')
        ->and($empty)->not->toContain('framer-motion');

    expect($art)->toContain("from '@phosphor-icons/react'")
        ->and($art)->toContain('data-empty-illustration')
        ->and($art)->toContain("'contacts'")
        ->and($art)->toContain("'deals'")
        ->and($art)->toContain("'pipeline'")
        ->and($art)->toContain('inferEmptyKind')
        ->and($art)->not->toContain('picsum')
        ->and($art)->not->toContain('screenshot');

    expect($lists)->toContain('EmptyState')
        ->and($lists)->toContain('density="page"')
        ->and($lists)->toContain('kind={kind}')
        ->and($lists)->not->toContain('size-10 rounded-xl');

    expect($home)->toContain('EmptyState')
        ->and($home)->toContain('density="panel"');

    expect($room)->toContain('EmptyState')
        ->and($room)->toContain('density="page"');
});

it('wires Home, Contacts, and Deals empties through the shared components', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $deals = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));

    expect($home)->toContain('HomeWidgetEmpty')
        ->and($contacts)->toContain('contactEmptyState')
        ->and($deals)->toContain('dealEmptyState')
        ->and($board)->toContain('EmptyState')
        ->and($board)->toContain('density="banner"')
        ->and($board)->toContain('No deals in this pipeline');
});

it('applies MOTION 3 press, rail, drawer, and toast without page hijacks', function () {
    $motion = file_get_contents(resource_path('css/aurora-motion.css'));
    $app = file_get_contents(resource_path('css/app.css'));
    $sheet = file_get_contents(resource_path('js/components/ui/aurora/sheet.tsx'));
    $drawer = file_get_contents(resource_path('js/components/crm/create-drawer.tsx'));
    $toast = file_get_contents(resource_path('js/components/ui/sonner.tsx'));
    $rail = file_get_contents(resource_path('js/components/app-sidebar.tsx'));
    $docs = file_get_contents(base_path('docs/visual-system/aurora-motion.md'));

    expect($app)->toContain('aurora-motion.css');

    expect($motion)->toContain('scale(0.98)')
        ->and($motion)->toContain('scale(0.97)')
        ->and($motion)->toContain('prefers-reduced-motion')
        ->and($motion)->toContain('.app-rail-item')
        ->and($motion)->toContain('[data-aurora=\'drawer\']')
        ->and($motion)->toContain('evocrm-toast-in')
        ->and($motion)->not->toContain('spring')
        ->and($motion)->not->toContain('framer');

    expect($sheet)->toContain('MOTION_DRAWER_CLASS')
        ->and($sheet)->toContain('motion-reduce:animate-none')
        ->and($sheet)->not->toContain('data-[state=open]:duration-300')
        ->and($sheet)->not->toContain('data-[state=open]:duration-500');

    expect($drawer)->toContain('data-aurora="drawer"');
    expect($toast)->toContain('aurora-toast-enter');
    expect($rail)->toContain('data-active={active || undefined}');

    expect($docs)->toContain('MOTION 3')
        ->and($docs)->toContain('scale(0.98)')
        ->and($docs)->toContain('prefers-reduced-motion');
});

it('leaves Quotes, Inbox, and Settings page files to Waves 3–5', function () {
    $quotes = resource_path('js/pages/crm/quotes/index.tsx');
    $inbox = resource_path('js/pages/desk/inbox.tsx');
    $settings = resource_path('js/pages/settings/workspace.tsx');

    expect(file_exists($quotes))->toBeTrue()
        ->and(file_exists($inbox))->toBeTrue()
        ->and(file_exists($settings))->toBeTrue();
});
