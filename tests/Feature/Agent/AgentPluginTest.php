<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use Illuminate\Support\Facades\Http;

test('plugins list is available to workspace admins', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/agent/plugins')
        ->assertOk()
        ->assertJsonFragment(['id' => 'crm.read', 'permission' => 'read'])
        ->assertJsonFragment(['id' => 'crm.draft'])
        ->assertJsonFragment(['id' => 'desk.inbox'])
        ->assertJsonFragment(['id' => 'browser.research'])
        ->assertJsonFragment(['id' => 'crm.read', 'enabled' => false]);
});

test('members cannot list or enable plugins', function () {
    $user = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($user)
        ->getJson('/api/agent/plugins')
        ->assertForbidden();

    $this->actingAs($user)
        ->putJson('/api/agent/plugins/crm.read', ['enabled' => true])
        ->assertForbidden();
});

test('workspace admin can enable a plugin', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/agent/plugins/crm.read', ['enabled' => true])
        ->assertOk()
        ->assertJsonFragment(['id' => 'crm.read', 'enabled' => true]);

    $this->actingAs($user)
        ->getJson('/api/agent/plugins')
        ->assertOk()
        ->assertJsonFragment(['id' => 'crm.read', 'enabled' => true]);
});

test('unknown plugins are rejected', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/agent/plugins/shell.exec', ['enabled' => true])
        ->assertNotFound();
});

test('run only forwards enabled available plugins', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    Http::fake([
        'http://openmanus.test/v1/run' => Http::response([
            'status' => 'ok',
            'result' => 'ok',
            'tools_used' => [],
            'errors' => [],
        ]),
    ]);

    $user = User::factory()->create();
    enableWorkspaceAgent($user);

    $this->actingAs($user)
        ->putJson('/api/agent/plugins/crm.read', ['enabled' => true])
        ->assertOk();

    $this->actingAs($user)
        ->putJson('/api/agent/plugins/browser.research', ['enabled' => true])
        ->assertOk();

    $this->actingAs($user)
        ->postJson('/api/agent/run', [
            'prompt' => 'Research this account',
            'plugin_ids' => ['crm.read', 'browser.research'],
        ])
        ->assertOk();

    Http::assertSent(function ($request) {
        $ids = array_column($request['plugins'] ?? [], 'id');
        $toolIds = array_column($request['tools'] ?? [], 'id');

        return $request->url() === 'http://openmanus.test/v1/run'
            && $ids === ['crm.read']
            && ! in_array('browser.research', $ids, true)
            && in_array('crm.search', $toolIds, true)
            && ! in_array('browser.research', $toolIds, true);
    });
});

test('connected browser-use unlocks browser.research tools on a run', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    Http::fake([
        'http://openmanus.test/v1/run' => Http::response([
            'status' => 'ok',
            'result' => 'ok',
            'tools_used' => [],
            'errors' => [],
        ]),
    ]);

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => ['browser.research' => true]]);
    connectAgentConnector($user, 'browser-use', [
        'url' => 'http://browser-use.test',
        'token' => 'bu-secret',
    ]);

    $this->actingAs($user)
        ->getJson('/api/agent/plugins')
        ->assertOk()
        ->assertJsonFragment(['id' => 'browser.research', 'enabled' => true, 'available' => true]);

    $this->actingAs($user)
        ->postJson('/api/agent/run', [
            'prompt' => 'Research this account',
            'plugin_ids' => ['browser.research'],
        ])
        ->assertOk();

    Http::assertSent(function ($request) {
        $ids = array_column($request['plugins'] ?? [], 'id');
        $toolIds = array_column($request['tools'] ?? [], 'id');

        return $request->url() === 'http://openmanus.test/v1/run'
            && $ids === ['browser.research']
            && in_array('browser.research', $toolIds, true)
            && ($request['mcp']['browser-use']['connected'] ?? false) === true
            && ! str_contains(json_encode($request->data()), 'bu-secret');
    });
});
