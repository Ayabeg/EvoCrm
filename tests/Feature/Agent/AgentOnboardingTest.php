<?php

use App\Enums\WorkspaceRole;
use App\Models\Integration;
use App\Models\User;
use App\Services\Agent\AgentWorkspaceSettings;
use Illuminate\Support\Facades\Http;

test('agent status is disabled when openmanus is off', function () {
    config(['services.openmanus.enabled' => false]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/agent/status')
        ->assertOk()
        ->assertJsonPath('status', 'disabled')
        ->assertJsonPath('env_enabled', false)
        ->assertJsonMissingPath('token')
        ->assertJsonMissing(['secret']);
});

test('agent status forbids members', function () {
    $user = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($user)
        ->getJson('/api/agent/status')
        ->assertForbidden();
});

test('agent settings page is gated to workspace admins', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->get('/settings/agent')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/agent')
            ->where('onboarding.status', 'disabled')
            ->missing('onboarding.token')
            ->has('plugins')
            ->has('connectors'));

    $this->actingAs($member)
        ->get('/settings/agent')
        ->assertForbidden();
});

test('workspace admin can save onboarding without echoing the token', function () {
    config(['services.openmanus.enabled' => true]);

    Http::fake([
        'http://127.0.0.1:8001/health' => Http::response(['ok' => true]),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/settings/agent', [
            'workspace_enabled' => true,
            'url' => 'http://127.0.0.1:8001',
            'token' => 'workspace-shared-token',
        ])
        ->assertRedirect('/settings/agent');

    $integration = Integration::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('provider', AgentWorkspaceSettings::PROVIDER_RUNTIME)
        ->sole();

    expect($integration->access_token)->toBe('workspace-shared-token')
        ->and($integration->meta['workspace_enabled'])->toBeTrue()
        ->and($integration->meta['url'])->toBe('http://127.0.0.1:8001');

    $status = $this->actingAs($user)
        ->getJson('/api/agent/status')
        ->assertOk()
        ->assertJsonPath('workspace_enabled', true)
        ->assertJsonPath('token_set', true)
        ->json();

    expect(json_encode($status))->not->toContain('workspace-shared-token')
        ->and($status)->not->toHaveKey('token')
        ->and($status)->not->toHaveKey('access_token');
});

test('health endpoint stays safe when the runtime is down', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    Http::fake([
        'http://openmanus.test/health' => fn () => throw new \Illuminate\Http\Client\ConnectionException('down'),
    ]);

    $user = User::factory()->create();
    enableWorkspaceAgent($user);

    $this->actingAs($user)
        ->getJson('/api/agent/health')
        ->assertOk()
        ->assertJsonPath('ok', false)
        ->assertJsonPath('status', 'unhealthy');

    $this->actingAs($user)
        ->getJson('/api/agent/status')
        ->assertOk()
        ->assertJsonPath('status', 'unhealthy');
});

test('ready status after a successful health check', function () {
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);

    Http::fake([
        'http://openmanus.test/health' => Http::response(['ok' => true]),
    ]);

    $user = User::factory()->create();
    enableWorkspaceAgent($user);

    $this->actingAs($user)
        ->getJson('/api/agent/status')
        ->assertOk()
        ->assertJsonPath('status', 'ready')
        ->assertJsonPath('configured', true);
});
