<?php

namespace App\Services\Agent;

use App\Models\Integration;
use App\Models\Workspace;

class AgentWorkspaceSettings
{
    public const PROVIDER_RUNTIME = 'openmanus';

    /**
     * @var array<string, string>
     */
    private const CONNECTOR_PROVIDERS = [
        'openmanus.runtime' => self::PROVIDER_RUNTIME,
        'browser-use' => 'agent_browser_use',
        'webhook' => 'agent_webhook',
        'mcp.custom' => 'agent_mcp',
    ];

    public function __construct(private AgentCatalog $catalog) {}

    public function envEnabled(): bool
    {
        return (bool) config('services.openmanus.enabled');
    }

    public function workspaceEnabled(Workspace $workspace): bool
    {
        $meta = $this->runtime($workspace)?->meta ?? [];

        return (bool) ($meta['workspace_enabled'] ?? false);
    }

    public function isEffectivelyEnabled(Workspace $workspace): bool
    {
        return $this->envEnabled() && $this->workspaceEnabled($workspace);
    }

    public function runtimeUrl(Workspace $workspace): string
    {
        $stored = $this->runtime($workspace)?->meta['url'] ?? null;

        if (filled($stored)) {
            return rtrim((string) $stored, '/');
        }

        return rtrim((string) config('services.openmanus.url', ''), '/');
    }

    public function runtimeToken(Workspace $workspace): ?string
    {
        $stored = $this->runtime($workspace)?->access_token;

        return filled($stored) ? $stored : (config('services.openmanus.token') ?: null);
    }

    public function tokenSet(Workspace $workspace): bool
    {
        return filled($this->runtimeToken($workspace));
    }

    /**
     * @return array{status: string, env_enabled: bool, workspace_enabled: bool, configured: bool, url: string, token_set: bool, health: array<string, mixed>|null, llm_note: string}
     */
    public function onboarding(Workspace $workspace, ?array $health = null): array
    {
        $url = $this->runtimeUrl($workspace);
        $configured = $url !== '' && $this->tokenSet($workspace);
        $status = $this->status($workspace, $configured, $health);

        return [
            'status' => $status,
            'env_enabled' => $this->envEnabled(),
            'workspace_enabled' => $this->workspaceEnabled($workspace),
            'configured' => $configured,
            'url' => $url,
            'token_set' => $this->tokenSet($workspace),
            'health' => $health,
            'llm_note' => 'LLM provider keys stay in the OpenManus config.toml on the Python service. EvoCRM does not store model credentials.',
        ];
    }

    /**
     * @param  array{workspace_enabled?: bool, url?: string|null, token?: string|null}  $data
     */
    public function updateOnboarding(Workspace $workspace, array $data): Integration
    {
        $existing = $this->runtime($workspace);
        $meta = $existing?->meta ?? [];

        if (array_key_exists('workspace_enabled', $data)) {
            $meta['workspace_enabled'] = (bool) $data['workspace_enabled'];
        }

        if (array_key_exists('url', $data) && filled($data['url'])) {
            $meta['url'] = rtrim((string) $data['url'], '/');
        }

        $token = $existing?->access_token;
        if (array_key_exists('token', $data) && filled($data['token'])) {
            $token = $data['token'];
        }

        return Integration::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => self::PROVIDER_RUNTIME,
            ],
            [
                'status' => ($meta['workspace_enabled'] ?? false) ? 'connected' : 'not_connected',
                'access_token' => $token,
                'connected_at' => $existing?->connected_at ?? now(),
                'meta' => $meta,
            ],
        );
    }

    /**
     * @return list<array{id: string, name: string, description: string, permission: string, requires: list<string>, enabled: bool, available: bool}>
     */
    public function plugins(Workspace $workspace): array
    {
        $enabled = $this->enabledPluginMap($workspace);
        $connectorStatus = collect($this->connectors($workspace))->keyBy('id');

        return array_values(array_map(function (array $plugin) use ($enabled, $connectorStatus) {
            $available = collect($plugin['requires'])->every(
                fn (string $connectorId) => (bool) ($connectorStatus[$connectorId]['connected'] ?? false),
            );

            return [
                ...$plugin,
                'enabled' => (bool) ($enabled[$plugin['id']] ?? false),
                'available' => $available,
            ];
        }, $this->catalog->plugins()));
    }

    public function setPlugin(Workspace $workspace, string $id, bool $enabled): void
    {
        abort_unless($this->catalog->plugin($id) !== null, 404);

        $existing = $this->runtime($workspace);
        $meta = $existing?->meta ?? [];
        $plugins = is_array($meta['plugins'] ?? null) ? $meta['plugins'] : [];
        $plugins[$id] = $enabled;
        $meta['plugins'] = $plugins;

        Integration::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => self::PROVIDER_RUNTIME,
            ],
            [
                'status' => $existing?->status ?? 'not_connected',
                'access_token' => $existing?->access_token,
                'connected_at' => $existing?->connected_at,
                'meta' => $meta,
            ],
        );
    }

    /**
     * @param  list<string>  $requested
     * @return list<array{id: string, name: string, description: string, permission: string, requires: list<string>}>
     */
    public function allowedManifest(Workspace $workspace, array $requested = []): array
    {
        $plugins = $this->plugins($workspace);

        return array_values(array_map(
            fn (array $plugin) => [
                'id' => $plugin['id'],
                'name' => $plugin['name'],
                'description' => $plugin['description'],
                'permission' => $plugin['permission'],
                'requires' => $plugin['requires'],
            ],
            array_filter($plugins, function (array $plugin) use ($requested) {
                if (! $plugin['enabled'] || ! $plugin['available']) {
                    return false;
                }

                return $requested === [] || in_array($plugin['id'], $requested, true);
            }),
        ));
    }

    /**
     * @return list<array{id: string, name: string, description: string, wired: bool, enabled: bool, connected: bool, status: string, url: string|null, token_set: bool}>
     */
    public function connectors(Workspace $workspace): array
    {
        return array_values(array_map(function (array $connector) use ($workspace) {
            $row = $this->connectorRow($workspace, $connector['id']);
            $url = $connector['id'] === 'openmanus.runtime'
                ? ($this->runtimeUrl($workspace) ?: null)
                : ($row?->meta['url'] ?? null);
            $tokenSet = $connector['id'] === 'openmanus.runtime'
                ? $this->tokenSet($workspace)
                : filled($row?->access_token);
            $enabled = $connector['id'] === 'openmanus.runtime'
                ? $this->workspaceEnabled($workspace)
                : (bool) ($row?->meta['enabled'] ?? false);
            $tokenRequired = in_array($connector['id'], ['openmanus.runtime', 'browser-use'], true);
            $configured = filled($url) && (! $tokenRequired || $tokenSet);
            $connected = $enabled && $configured;

            return [
                ...$connector,
                'enabled' => $enabled,
                'connected' => $connected,
                'status' => $this->connectorStatus($enabled, filled($url) && $tokenSet),
                'url' => $url ?: null,
                'token_set' => $tokenSet,
            ];
        }, $this->catalog->connectors()));
    }

    /**
     * @param  list<string>  $requested
     * @return list<array{id: string, name: string, description: string, plugin: string|null, connector: string|null}>
     */
    public function allowedTools(Workspace $workspace, array $requested = []): array
    {
        $allowedPluginIds = array_column($this->allowedManifest($workspace, $requested), 'id');
        $connectors = collect($this->connectors($workspace))->keyBy('id');

        return array_values(array_filter(
            array_map(function (array $tool) use ($allowedPluginIds, $connectors) {
                if (filled($tool['plugin']) && ! in_array($tool['plugin'], $allowedPluginIds, true)) {
                    return null;
                }

                if (filled($tool['connector']) && ! ($connectors[$tool['connector']]['connected'] ?? false)) {
                    return null;
                }

                return $tool;
            }, array_values($this->catalog->tools())),
        ));
    }

    public function toolAllowed(Workspace $workspace, string $toolId): bool
    {
        return collect($this->allowedTools($workspace))->contains(
            fn (array $tool) => $tool['id'] === $toolId,
        );
    }

    /**
     * @return array{url: string, token: string|null}|null
     */
    public function connectorCredentials(Workspace $workspace, string $id): ?array
    {
        $url = $id === 'openmanus.runtime'
            ? $this->runtimeUrl($workspace)
            : ($this->connectorRow($workspace, $id)?->meta['url'] ?? null);

        if (! filled($url)) {
            return null;
        }

        $token = $id === 'openmanus.runtime'
            ? $this->runtimeToken($workspace)
            : $this->connectorRow($workspace, $id)?->access_token;

        return [
            'url' => rtrim((string) $url, '/'),
            'token' => filled($token) ? $token : null,
        ];
    }

    /**
     * @return array<string, array{connected: bool}>
     */
    public function mcpContext(Workspace $workspace): array
    {
        $connectors = collect($this->connectors($workspace))->keyBy('id');

        return [
            'browser-use' => [
                'connected' => (bool) ($connectors['browser-use']['connected'] ?? false),
            ],
            'mcp.custom' => [
                'connected' => (bool) ($connectors['mcp.custom']['connected'] ?? false),
            ],
        ];
    }

    public function callbackUrl(): string
    {
        return rtrim((string) config('app.url'), '/').'/api/agent/tools';
    }

    /**
     * @return list<array{id: string, name: string, status: string, wired: bool}>
     */
    public function connectorContext(Workspace $workspace): array
    {
        return array_values(array_map(
            fn (array $connector) => [
                'id' => $connector['id'],
                'name' => $connector['name'],
                'status' => $connector['status'],
                'wired' => $connector['wired'],
            ],
            $this->connectors($workspace),
        ));
    }

    /**
     * @param  array{enabled?: bool, url?: string|null, token?: string|null}  $data
     */
    public function updateConnector(Workspace $workspace, string $id, array $data): void
    {
        abort_unless($this->catalog->connector($id) !== null, 404);

        if ($id === 'openmanus.runtime') {
            $this->updateOnboarding($workspace, [
                'workspace_enabled' => $data['enabled'] ?? $this->workspaceEnabled($workspace),
                'url' => $data['url'] ?? null,
                'token' => $data['token'] ?? null,
            ]);

            return;
        }

        $existing = $this->connectorRow($workspace, $id);
        $meta = $existing?->meta ?? [];

        if (array_key_exists('enabled', $data)) {
            $meta['enabled'] = (bool) $data['enabled'];
        }

        if (array_key_exists('url', $data) && filled($data['url'])) {
            $meta['url'] = rtrim((string) $data['url'], '/');
        }

        $token = $existing?->access_token;
        if (array_key_exists('token', $data) && filled($data['token'])) {
            $token = $data['token'];
        }

        $enabled = (bool) ($meta['enabled'] ?? false);
        $tokenRequired = $id === 'browser-use';
        $configured = filled($meta['url'] ?? null) && (! $tokenRequired || filled($token));

        Integration::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => self::CONNECTOR_PROVIDERS[$id],
            ],
            [
                'status' => $enabled && $configured ? 'connected' : 'not_connected',
                'access_token' => $token,
                'connected_at' => $existing?->connected_at ?? now(),
                'meta' => $meta,
            ],
        );
    }

    public function disconnectConnector(Workspace $workspace, string $id): void
    {
        abort_unless($this->catalog->connector($id) !== null, 404);

        if ($id === 'openmanus.runtime') {
            $existing = $this->runtime($workspace);
            $meta = $existing?->meta ?? [];
            $meta['workspace_enabled'] = false;
            unset($meta['url']);

            if ($existing) {
                $existing->forceFill([
                    'status' => 'not_connected',
                    'access_token' => null,
                    'meta' => $meta,
                ])->save();
            }

            return;
        }

        $this->connectorRow($workspace, $id)?->delete();
    }

    public function runtime(Workspace $workspace): ?Integration
    {
        return $workspace->integration(self::PROVIDER_RUNTIME);
    }

    /**
     * @return array<string, bool>
     */
    private function enabledPluginMap(Workspace $workspace): array
    {
        $stored = $this->runtime($workspace)?->meta['plugins'] ?? [];

        return is_array($stored) ? $stored : [];
    }

    private function connectorRow(Workspace $workspace, string $id): ?Integration
    {
        $provider = self::CONNECTOR_PROVIDERS[$id] ?? null;

        return $provider ? $workspace->integration($provider) : null;
    }

    private function connectorStatus(bool $enabled, bool $configured): string
    {
        if (! $enabled) {
            return 'disabled';
        }

        return $configured ? 'connected' : 'not_configured';
    }

    /**
     * @param  array<string, mixed>|null  $health
     */
    private function status(Workspace $workspace, bool $configured, ?array $health): string
    {
        if (! $this->envEnabled() || ! $this->workspaceEnabled($workspace)) {
            return 'disabled';
        }

        if (! $configured) {
            return 'not_configured';
        }

        if ($health !== null && ! ($health['ok'] ?? false)) {
            return 'unhealthy';
        }

        if ($health !== null && ($health['ok'] ?? false)) {
            return 'ready';
        }

        return 'not_configured';
    }
}
