<?php

/**
 * W02 — Deals composition (C-18).
 * Forecast is a header one-liner. Attention is a Follow-up saved view.
 * StagePills stay on Tickets. Contacts / Quotes keep default chrome.
 */
it('compacts Deals chrome without inventing a second filter bag or forecast route', function () {
    $list = file_get_contents(resource_path('js/pages/crm/deals/index.tsx'));
    $board = file_get_contents(resource_path('js/pages/crm/deals/board.tsx'));
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $views = file_get_contents(resource_path('js/ds/workspace/SavedViews.tsx'));
    $layout = file_get_contents(resource_path('js/lib/list-query/deal-layout.ts'));
    $tickets = file_get_contents(resource_path('js/pages/crm/tickets/index.tsx'));
    $contacts = file_get_contents(resource_path('js/pages/crm/contacts/index.tsx'));
    $quotes = file_get_contents(resource_path('js/pages/crm/quotes/index.tsx'));

    expect($workspace)->toContain("chromeDensity = 'default'")
        ->and($workspace)->toContain("compactChrome = chromeDensity === 'compact'")
        ->and($workspace)->toContain('headerSummary')
        ->and($shell)->toContain("entity === 'deal' ? 'compact' : 'default'")
        ->and($shell)->toContain('headerSummary')
        ->and($shell)->toContain('<StagePills')
        ->and($board)->toContain('DealForecastSummary')
        ->and($board)->toContain('DealLayoutToggle')
        ->and($list)->toContain('DealLayoutToggle')
        ->and($list)->toContain("t('Amount (DA)')")
        ->and($board)->toContain("t('Amount (DA)')")
        ->and($views)->toContain("object === 'deal'")
        ->and($views)->toContain("t('Follow-up view')")
        ->and($layout)->toContain("DEAL_LIST_PATH = '/crm/deals'")
        ->and($layout)->toContain("DEAL_BOARD_PATH = '/crm/deals/board'")
        ->and($tickets)->toContain('entity="ticket"')
        ->and($tickets)->toContain('stagePills={stagePills}')
        ->and($contacts)->not->toContain("chromeDensity=")
        ->and($quotes)->not->toContain("chromeDensity=")
        ->and($list)->not->toContain('view=open')
        ->and($board)->not->toContain('/crm/deals/forecast')
        ->and($board)->not->toContain('/crm/deals/attention');
});

it('keeps Tickets StagePills and leaves Contacts on the default stacked chrome', function () {
    $shell = file_get_contents(resource_path('js/components/crm/crm-list-shell.tsx'));
    $workspace = file_get_contents(resource_path('js/ds/workspace/DataWorkspace.tsx'));
    $views = file_get_contents(resource_path('js/ds/workspace/SavedViews.tsx'));

    expect($shell)->toContain("entity === 'ticket' &&")
        ->and($shell)->toContain('<StagePills')
        ->and($shell)->not->toContain("(entity === 'deal' || entity === 'ticket') &&")
        ->and($workspace)->toContain('{compactChrome ? null : toolbarExtra}')
        ->and($workspace)->toContain('{compactChrome ? null : banner}')
        ->and($views)->toContain("object === 'ticket'")
        ->and($views)->toContain("t('All open')")
        ->and($views)->not->toContain("object === 'contact' &&")
        ->and($views)->toContain('border-brand bg-sidebar-accent font-medium text-ink');
});
