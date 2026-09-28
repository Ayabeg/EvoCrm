<?php

use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

test('openmanus endpoint is disabled by default', function () {
    config(['services.openmanus.enabled' => false]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/agent/run', ['prompt' => 'Summarize my pipeline'])
        ->assertNotFound();
});

test('openmanus endpoint stays 404 when env is on but workspace is off', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/agent/run', ['prompt' => 'Summarize my pipeline'])
        ->assertNotFound();
});

test('openmanus endpoint proxies an authenticated prompt', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    Http::fake([
        'http://openmanus.test/v1/run' => Http::response([
            'status' => 'ok',
            'result' => 'Done',
            'tools_used' => ['crm.read'],
            'errors' => [],
        ]),
    ]);

    $user = User::factory()->create();
    enableWorkspaceAgent($user);

    $this->actingAs($user)
        ->postJson('/api/agent/run', [
            'prompt' => 'Summarize my pipeline',
            'session_id' => 'desk-1',
            'plugin_ids' => ['crm.read'],
        ])
        ->assertOk()
        ->assertJson([
            'status' => 'ok',
            'result' => 'Done',
            'tools_used' => ['crm.read'],
            'errors' => [],
        ]);

    Http::assertSent(fn ($request) => $request->url() === 'http://openmanus.test/v1/run'
        && $request->hasHeader('Authorization', 'Bearer secret')
        && $request['prompt'] === 'Summarize my pipeline'
        && $request['session_id'] === 'desk-1'
        && is_array($request['plugins'])
        && is_array($request['tools'])
        && is_array($request['connectors'])
        && is_array($request['mcp'])
        && ($request['callback']['workspace_id'] ?? null) === $user->workspace_id
        && str_ends_with((string) ($request['callback']['url'] ?? ''), '/api/agent/tools')
        && ! str_contains(json_encode($request->data()), 'secret')
    );
});

test('unhealthy openmanus run does not 500 the app', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    Http::fake([
        'http://openmanus.test/v1/run' => fn () => throw new ConnectionException('down'),
    ]);

    $user = User::factory()->create();
    enableWorkspaceAgent($user);

    $this->actingAs($user)
        ->postJson('/api/agent/run', ['prompt' => 'Summarize my pipeline'])
        ->assertOk()
        ->assertJsonPath('status', 'error')
        ->assertJsonPath('result', null)
        ->assertJsonMissing(['secret']);
});
