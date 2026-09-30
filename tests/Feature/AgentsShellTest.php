<?php

use App\Models\User;

it('serves the agents desk route family through one Inertia page', function () {
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

it('keeps directory and selected-agent views inside the same agents sidebar', function () {
    $shell = file_get_contents(resource_path('js/components/shell/evo-shell.tsx'));
    $rail = file_get_contents(resource_path('js/components/shell/evo-rail.tsx'));
    $navigation = file_get_contents(resource_path('js/components/shell/product-nav.ts'));
    $sidebar = file_get_contents(resource_path('js/components/desk/agents-sidebar.tsx'));
    $state = file_get_contents(resource_path('js/lib/desk/agents-workspace-state.ts'));
    $layout = file_get_contents(resource_path('js/layouts/app/app-sidebar-layout.tsx'));
    $styles = file_get_contents(resource_path('css/evo-shell.css'));

    expect($shell)
        ->toContain('agentsContent={renderAgentsContent()}')
        ->not->toContain('showLegacyAgentsRoom')
        ->and($rail)
        ->toContain("{ id: 'agents', label: 'Agents', icon: StarFour }")
        ->toContain('evo-nav-section-label')
        ->toContain('{agentsContent}')
        ->not->toContain('The desk is open in the workspace.')
        ->and($navigation)
        ->not->toContain("id: 'agents'")
        ->and($rail)
        ->toContain("path !== '/agents'")
        ->and($sidebar)
        ->toContain('data-agents-sidebar')
        ->toContain('AnimatePresence')
        ->toContain('evo-agents-sidebar')
        ->toContain('YOUR AGENTS')
        ->toContain('CONTEXT')
        ->toContain('StarFour')
        ->not->toContain('AgentsViewModeControl')
        ->not->toContain('Grid')
        ->not->toContain('Table')
        ->and($state)
        ->toContain('selectedChatByAgent')
        ->toContain('back-to-directory')
        ->and($layout)
        ->toContain('agents-route-page-shell')
        ->and($styles)
        ->toContain('.evo-workspace .agents-route-page-shell')
        ->toContain('--color-surface: #ffffff;')
        ->toContain('--color-text-primary: #0d1b24;');
});

it('renders CRM-grounded chats and record actions in the workspace', function () {
    $workspace = file_get_contents(resource_path('js/components/desk/agents-workspace.tsx'));
    $composer = file_get_contents(resource_path('js/components/desk/agents-composer.tsx'));
    $askAgent = file_get_contents(resource_path('js/lib/desk/ask-agent.ts'));

    expect($workspace)
        ->toContain('data-agent-workspace')
        ->toContain('AgentChatLayout')
        ->toContain('crmActions')
        ->toContain('StarFour')
        ->and($composer)
        ->toContain('/crm/command/search')
        ->toContain('selectedContext')
        ->and($askAgent)
        ->toContain("fetch('/ask-evo'")
        ->toContain('entity_type')
        ->toContain('entity_id');
});

it('uses the chat layout regions for the agent conversation surface', function () {
    $layout = file_get_contents(resource_path('js/components/desk/agent-chat-layout.tsx'));
    $workspace = file_get_contents(resource_path('js/components/desk/agents-workspace.tsx'));

    expect($layout)
        ->toContain('data-agent-chat-layout')
        ->toContain('data-agent-chat-thread')
        ->toContain('data-agent-chat-composer')
        ->and($workspace)
        ->toContain('AgentChatLayout')
        ->toContain('AgentsComposer')
        ->toContain('BloubAvatar')
        ->toContain('data-theme="light"')
        ->not->toContain('Stub replies only');
});

it('keeps StarFour on Agents and Robot on the Bots listing header', function () {
    $sidebar = file_get_contents(resource_path('js/components/desk/agents-sidebar.tsx'));
    $page = file_get_contents(resource_path('js/pages/agents/index.tsx'));
    $table = file_get_contents(resource_path('js/components/crm/list-view-table.tsx'));

    expect($sidebar)
        ->toContain('StarFour')
        ->toContain('pl-10')
        ->not->toContain('label="Bots"')
        ->and($page)
        ->toContain('data-theme="light"')
        ->toContain('className="evo-agents light')
        ->toContain('<Robot')
        ->toContain('Bots')
        ->and($table)
        ->toContain("column.id === 'close_date'")
        ->toContain('whitespace-nowrap');
});
