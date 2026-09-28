<?php

use App\Enums\WorkspaceRole;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Support\Facades\Http;

test('connectors list never includes secrets', function () {
    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['token' => 'super-secret-runtime']);

    $this->actingAs($user)
        ->getJson('/api/agent/connectors')
        ->assertOk()
        ->assertJsonFragment(['id' => 'openmanus.runtime'])
        ->assertJsonFragment(['id' => 'browser-use'])
        ->assertJsonFragment(['id' => 'webhook'])
        ->assertJsonFragment(['id' => 'mcp.custom'])
        ->assertJsonPath('connectors.0.token_set', true)
        ->assertJsonMissing(['super-secret-runtime'])
        ->assertJsonMissingPath('connectors.0.token')
        ->assertJsonMissingPath('connectors.0.access_token');
});

test('members cannot mutate connectors', function () {
    $user = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($user)
        ->getJson('/api/agent/connectors')
        ->assertForbidden();

    $this->actingAs($user)
        ->putJson('/api/agent/connectors/webhook', [
            'enabled' => true,
            'url' => 'https://hooks.example.test',
            'token' => 'hook-secret',
        ])
        ->assertForbidden();
});

test('workspace admin can connect a stub without leaking the token', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/agent/connectors/webhook', [
            'enabled' => true,
            'url' => 'https://hooks.example.test/agent',
            'token' => 'hook-secret',
        ])
        ->assertOk()
        ->assertJsonFragment([
            'id' => 'webhook',
            'enabled' => true,
            'token_set' => true,
            'url' => 'https://hooks.example.test/agent',
        ])
        ->assertJsonMissing(['hook-secret']);

    $row = Integration::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_AGENT_WEBHOOK)
        ->sole();

    expect($row->access_token)->toBe('hook-secret');

    $this->actingAs($user)
        ->getJson('/api/agent/connectors')
        ->assertOk()
        ->assertJsonMissing(['hook-secret']);
});

test('connected webhook receives run lifecycle events without secrets', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    $user = User::factory()->create();
    enableWorkspaceAgent($user);
    connectAgentConnector($user, 'webhook', [
        'url' => 'https://hooks.example.test/agent',
        'token' => 'hook-secret',
    ]);

    Http::fake([
        'http://openmanus.test/v1/run' => Http::response([
            'status' => 'ok',
            'result' => 'Done',
            'tools_used' => [],
            'errors' => [],
        ]),
        'https://hooks.example.test/agent' => Http::response(['ok' => true]),
    ]);

    $this->actingAs($user)
        ->postJson('/api/agent/run', ['prompt' => 'Ping'])
        ->assertOk();

    Http::assertSent(function ($request) {
        return $request->url() === 'https://hooks.example.test/agent'
            && $request->hasHeader('Authorization', 'Bearer hook-secret')
            && in_array($request['event'] ?? null, ['started', 'finished'], true)
            && ! str_contains(json_encode($request->data()), 'hook-secret')
            && ! str_contains(json_encode($request->data()), 'secret');
    });
});

test('workspace admin can disconnect a connector and drop the secret', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/agent/connectors/mcp.custom', [
            'enabled' => true,
            'url' => 'http://mcp.internal:3100',
            'token' => 'mcp-secret',
        ])
        ->assertOk();

    $this->actingAs($user)
        ->deleteJson('/api/agent/connectors/mcp.custom')
        ->assertOk()
        ->assertJsonFragment(['id' => 'mcp.custom', 'token_set' => false])
        ->assertJsonMissing(['mcp-secret']);

    expect(Integration::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', Integration::PROVIDER_AGENT_MCP)
        ->exists())->toBeFalse();
});
