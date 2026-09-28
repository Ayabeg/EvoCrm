<?php

use App\Models\User;

it('serves the agents desk route family through one minimal Inertia page', function () {
    $user = User::factory()->create();

    foreach ([
        '/agents',
        '/agents/chats',
        '/agents/chats/first-chat',
        '/agents/bots',
        '/agents/bots/new',
        '/agents/bots/closer',
    ] as $path) {
        $this->actingAs($user)
            ->get($path)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('agents/index'));
    }
});

it('keeps the agents shell slice route-driven and scoped to its sidebar contract', function () {
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $nav = file_get_contents(resource_path('js/components/shell/product-nav.ts'));
    $sidebar = file_get_contents(resource_path('js/components/desk/agents-sidebar.tsx'));

    expect($shell)
        ->toContain('AgentsSidebar')
        ->toContain('/agents')
        ->and($nav)
        ->toContain("id: 'agents'")
        ->toContain("activePaths: ['/agents']")
        ->and($sidebar)
        ->toContain('No chats yet.')
        ->toContain('Create a new Bot')
        ->toContain('The desk is open in the workspace.')
        ->toContain('Desk')
        ->toContain('Chats')
        ->toContain('Bots');
});

it('adapts Astryx ChatLayout regions on the agents chat surface', function () {
    $layout = file_get_contents(resource_path('js/components/desk/agent-chat-layout.tsx'));
    $page = file_get_contents(resource_path('js/pages/agents/index.tsx'));

    expect($layout)
        ->toContain('data-agent-chat-layout')
        ->toContain('data-agent-chat-header')
        ->toContain('data-agent-chat-thread')
        ->toContain('data-agent-chat-composer')
        ->toContain('@astryxdesign/core')
        ->and($page)
        ->toContain('AgentChatLayout')
        ->toContain('AgentChatHeader')
        ->toContain('AgentsComposer')
        ->toContain('BloubAvatar')
        ->not->toContain('SegmentedControl');
});

it('switches agents nav bot rows with a local icon+text view-mode control', function () {
    $sidebar = file_get_contents(resource_path('js/components/desk/agents-sidebar.tsx'));
    $roster = file_get_contents(resource_path('js/components/desk/agents-roster.tsx'));
    $control = file_get_contents(resource_path('js/components/desk/agents-view-mode-control.tsx'));
    $segmented = file_get_contents(resource_path('js/components/ui/segmented-control.tsx'));
    $package = file_get_contents(base_path('package.json'));

    expect($package)
        ->not->toContain('@astryxdesign/core')
        ->and($sidebar)
        ->toContain('AgentsViewModeControl')
        ->toContain('AgentsViewModePanel')
        ->toContain('viewMode === \'grid\'')
        ->toContain('viewMode === \'table\'')
        ->not->toContain('@astryxdesign/core')
        ->and($roster)
        ->toContain('AgentsViewModeControl')
        ->toContain('data-agents-roster')
        ->toContain('viewMode === \'grid\'')
        ->toContain('viewMode === \'table\'')
        ->and($control)
        ->toContain('label="View mode"')
        ->toContain('label="Grid"')
        ->toContain('label="List"')
        ->toContain('label="Table"')
        ->toContain('icon={<GridIcon />}')
        ->toContain('icon={<ListIcon />}')
        ->toContain('icon={<TableIcon />}')
        ->toContain('@/components/ui/segmented-control')
        ->not->toContain('@astryxdesign/core')
        ->and($segmented)
        ->toContain('role="radiogroup"')
        ->toContain('role="radio"')
        ->toContain('layoutId')
        ->toContain('useReducedMotion')
        ->toContain('motion-reduce:transition-none')
        ->toContain('Local Astryx SegmentedControl fallback');
});

it('keeps agents view-mode parsing on the list/grid/table contract', function () {
    $js = file_get_contents(base_path('tests/js/agents-view-mode.ts'));

    expect($js)
        ->toContain("DEFAULT_AGENTS_VIEW_MODE")
        ->toContain("'list'")
        ->toContain("isAgentsViewMode('grid')")
        ->toContain("isAgentsViewMode('list')")
        ->toContain("isAgentsViewMode('table')")
        ->toContain("parseAgentsViewMode('nope')");
});
