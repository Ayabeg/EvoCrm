<?php

use App\Models\Integration;
use App\Models\User;
use App\Services\Agent\AgentWorkspaceSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

function apiToken(User $user, string $device = 'test'): string
{
    return $user->createToken($device, [$user->workspaceAbility()])->plainTextToken;
}

/**
 * @param  array{url?: string, token?: string, plugins?: array<string, bool>}  $overrides
 */
function enableWorkspaceAgent(User $user, array $overrides = []): void
{
    Integration::query()->updateOrCreate(
        [
            'workspace_id' => $user->workspace_id,
            'provider' => AgentWorkspaceSettings::PROVIDER_RUNTIME,
        ],
        [
            'status' => 'connected',
            'access_token' => $overrides['token'] ?? 'secret',
            'connected_at' => now(),
            'meta' => [
                'workspace_enabled' => true,
                'url' => $overrides['url'] ?? 'http://openmanus.test',
                'plugins' => $overrides['plugins'] ?? [],
            ],
        ],
    );
}

/**
 * @param  array{url?: string, token?: string}  $overrides
 */
function connectAgentConnector(User $user, string $id, array $overrides = []): void
{
    app(AgentWorkspaceSettings::class)->updateConnector($user->workspace, $id, [
        'enabled' => true,
        'url' => $overrides['url'] ?? 'http://mcp.test',
        'token' => $overrides['token'] ?? 'mcp-token',
    ]);
}
