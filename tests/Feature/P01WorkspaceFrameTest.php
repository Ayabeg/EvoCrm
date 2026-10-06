<?php

/**
 * P0.1 Workspace frame (Agent 06).
 * Locks the slot contract, one orange primary, Accueil title, and
 * archetype scroll ownership. Does not invent business contracts.
 */

it('renders WorkspaceHeader with at most one primary action', function () {
    $header = file_get_contents(resource_path('js/evo/workspace/WorkspaceHeader.tsx'));
    $page = file_get_contents(resource_path('js/ds/chrome/PageHeader.tsx'));
    $object = file_get_contents(resource_path('js/components/crm/crm-object-header.tsx'));

    expect($header)->toContain('data-workspace-slot="h"')
        ->and($header)->toContain('data-workspace-primary="true"')
        ->and($header)->toContain('data-primary-count={primaryCount}')
        ->and(substr_count($header, 'data-workspace-slot="h"'))->toBe(1)
        ->and($page)->toContain('<WorkspaceHeader')
        ->and($object)->toContain('<WorkspaceHeader');
});

it('keeps the WorkspaceHeader slot contract', function () {
    $header = file_get_contents(resource_path('js/evo/workspace/WorkspaceHeader.tsx'));
    $types = file_get_contents(resource_path('js/evo/workspace/types.ts'));

    foreach (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'l', 'm', 'n', 'q'] as $slot) {
        expect($header)->toContain('data-workspace-slot="'.$slot.'"');
    }

    expect($types)->toContain('primaryAction?: ReactNode')
        ->and($types)->toContain('Never a greeting')
        ->and($header)->toContain('isGreetingTitle');
});

it('owns scroll per archetype and keeps the document scroller on unmigrated routes', function () {
    $routes = file_get_contents(resource_path('js/evo/workspace/routes.ts'));
    $frame = file_get_contents(resource_path('js/evo/workspace/WorkspaceFrame.tsx'));
    $css = file_get_contents(resource_path('js/evo/workspace/workspace-frame.css'));
    $layout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));

    expect($layout)->toContain('<WorkspaceFrame>{children}</WorkspaceFrame>')
        ->and($layout)->not->toContain('overflow-y-auto')
        ->and($frame)->toContain("data-shell-scroll={ownsScroll ? 'frame' : 'document'}")
        ->and($routes)->toContain("scrollOwner: 'surface'")
        ->and($routes)->toContain("scrollOwner: 'pipeline'")
        ->and($routes)->toContain("scrollOwner: 'columns'")
        ->and($routes)->toContain("scrollOwner: 'conversation'")
        ->and($routes)->toContain("shellScroll: 'document'")
        ->and($css)->toContain(".workspace-frame[data-shell-scroll='frame']:not([data-scroll-owner='document'])")
        ->and($css)->toContain('overflow-y: hidden')
        ->and($css)->toContain(".workspace-frame[data-shell-scroll='document']");
});

it('titles Accueil Home instead of a greeting and keeps no page primary', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));

    expect($home)->toContain("title={t('Home')}")
        ->and($home)->toContain('<WorkspaceHeader')
        ->and($home)->not->toContain("t('Hello :name'")
        ->and($home)->not->toContain('primaryAction=')
        ->and($home)->not->toContain('bg-[var(--home-accent)] px-[18px]')
        ->and($home)->not->toContain('bg-[var(--evo-primary)]')
        ->and($home)->toContain('border-[var(--evo-hairline)] px-3 text-[12px] font-medium text-[var(--evo-ink)]');
});

it('locks the Contacts primary slot to the orange primary fill', function () {
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $object = file_get_contents(resource_path('js/components/crm/crm-object-header.tsx'));
    $header = file_get_contents(resource_path('js/evo/workspace/WorkspaceHeader.tsx'));
    $button = file_get_contents(resource_path('js/evo/ui/button.tsx'));
    $morph = file_get_contents(resource_path('js/components/crm/morphing-form.tsx'));

    expect($contacts)->toContain('primaryLabel="Create contact"')
        ->and($contacts)->toContain('primarySlot=')
        ->and($object)->toContain('primaryAction={primary}')
        ->and($header)->toContain('data-workspace-slot="h"')
        ->and($header)->toContain('data-workspace-primary="true"')
        ->and($morph)->toContain("buttonVariants({ size: 'sm' })")
        ->and($button)->toContain('bg-[var(--evo-primary)]')
        ->and($button)->toContain('text-[var(--evo-on-primary)]');
});

it('does not hide Deals forecast or attention behind a disclosure', function () {
    $list = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));

    expect($list)->not->toContain('<details')
        ->and($board)->not->toContain('<details')
        ->and($list)->toContain('<DealAttentionQueue')
        ->and($board)->toContain('<DealForecastBar')
        ->and($board)->toContain('<DealAttentionQueue');
});

it('renders the conversation header without a visible title row', function () {
    $header = file_get_contents(resource_path('js/evo/workspace/WorkspaceHeader.tsx'));
    $inbox = file_get_contents(resource_path('js/pages/desk/inbox.tsx'));

    expect($header)->toContain("archetype === 'conversation'")
        ->and($header)->toContain("data-chrome={conversationQuiet ? 'quiet' : undefined}")
        ->and($header)->toContain('conversationQuiet && \'sr-only\'')
        ->and($inbox)->toContain('archetype="conversation"');
});
