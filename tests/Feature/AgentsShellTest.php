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
