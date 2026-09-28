<?php

namespace App\Services;

use App\Models\Workspace;
use App\Services\Agent\AgentWebhookNotifier;
use App\Services\Agent\AgentWorkspaceSettings;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

class OpenManusService
{
    public function __construct(
        private AgentWorkspaceSettings $settings,
        private AgentWebhookNotifier $webhooks,
    ) {}

    /**
     * @return array{ok: bool, status: string, message: string}
     */
    public function health(?Workspace $workspace = null): array
    {
        if ($workspace && ! $this->settings->envEnabled()) {
            return [
                'ok' => false,
                'status' => 'disabled',
                'message' => 'Agent is off. OPENMANUS_ENABLED is false on this host.',
            ];
        }

        if ($workspace && ! $this->settings->workspaceEnabled($workspace)) {
            return [
                'ok' => false,
                'status' => 'disabled',
                'message' => 'Agent is off for this workspace.',
            ];
        }

        $url = $workspace
            ? $this->settings->runtimeUrl($workspace)
            : rtrim((string) config('services.openmanus.url'), '/');

        if ($url === '') {
            return [
                'ok' => false,
                'status' => 'not_configured',
                'message' => 'Agent runtime URL is missing.',
            ];
        }

        try {
            $ok = $this->client($workspace)
                ->timeout((int) config('services.openmanus.health_timeout', 3))
                ->get("{$url}/health")
                ->successful();
        } catch (Throwable) {
            $ok = false;
        }

        return [
            'ok' => $ok,
            'status' => $ok ? 'ready' : 'unhealthy',
            'message' => $ok
                ? 'Agent runtime is reachable.'
                : 'Agent runtime did not respond. CRM stays available.',
        ];
    }

    /**
     * @param  array{prompt: string, session_id?: string|null, plugin_ids?: list<string>}  $payload
     * @return array{status: string, result: mixed, tools_used: list<mixed>, errors: list<string>}
     */
    public function run(string $prompt, ?Workspace $workspace = null, ?string $sessionId = null, array $pluginIds = []): array
    {
        $url = $workspace
            ? $this->settings->runtimeUrl($workspace)
            : rtrim((string) config('services.openmanus.url'), '/');

        $manifest = $workspace
            ? $this->settings->allowedManifest($workspace, $pluginIds)
            : [];
        $tools = $workspace
            ? $this->settings->allowedTools($workspace, $pluginIds)
            : [];
        $connectors = $workspace
            ? $this->settings->connectorContext($workspace)
            : [];

        if ($workspace) {
            $this->webhooks->notify($workspace, 'started', [
                'session_id' => $sessionId,
                'status' => 'started',
            ]);
        }

        try {
            $response = $this->client($workspace)
                ->post("{$url}/v1/run", [
                    'prompt' => $prompt,
                    'session_id' => $sessionId,
                    'plugin_ids' => array_column($manifest, 'id'),
                    'plugins' => $manifest,
                    'tools' => $tools,
                    'connectors' => $connectors,
                    'mcp' => $workspace ? $this->settings->mcpContext($workspace) : [],
                    'callback' => $workspace ? [
                        'url' => $this->settings->callbackUrl(),
                        'workspace_id' => $workspace->id,
                    ] : null,
                ]);
        } catch (Throwable $exception) {
            $failed = $this->failed($exception->getMessage());
            if ($workspace) {
                $this->webhooks->notify($workspace, 'failed', [
                    'session_id' => $sessionId,
                    'status' => 'error',
                ]);
            }

            return $failed;
        }

        if (! $response->successful()) {
            $failed = $this->failed('Agent runtime returned HTTP '.$response->status().'.');
            if ($workspace) {
                $this->webhooks->notify($workspace, 'failed', [
                    'session_id' => $sessionId,
                    'status' => 'error',
                ]);
            }

            return $failed;
        }

        $body = $response->json();
        if (! is_array($body)) {
            $failed = $this->failed('Agent runtime returned an invalid response.');
            if ($workspace) {
                $this->webhooks->notify($workspace, 'failed', [
                    'session_id' => $sessionId,
                    'status' => 'error',
                ]);
            }

            return $failed;
        }

        $result = [
            'status' => (string) ($body['status'] ?? 'ok'),
            'result' => $body['result'] ?? null,
            'tools_used' => $this->normalizeToolsUsed($body['tools_used'] ?? []),
            'errors' => array_values($body['errors'] ?? []),
        ];

        if ($workspace) {
            $this->webhooks->notify($workspace, $result['status'] === 'error' ? 'failed' : 'finished', [
                'session_id' => $sessionId,
                'status' => $result['status'],
            ]);
        }

        return $result;
    }

    /**
     * @param  list<mixed>  $tools
     * @return list<array{name: string, args: array<string, mixed>, status: string}|string>
     */
    private function normalizeToolsUsed(array $tools): array
    {
        return array_values(array_map(function (mixed $tool) {
            if (is_string($tool)) {
                return $tool;
            }

            if (! is_array($tool)) {
                return ['name' => 'unknown', 'args' => [], 'status' => 'ok'];
            }

            return [
                'name' => (string) ($tool['name'] ?? $tool['id'] ?? 'unknown'),
                'args' => is_array($tool['args'] ?? null) ? $tool['args'] : [],
                'status' => (string) ($tool['status'] ?? 'ok'),
            ];
        }, $tools));
    }

    private function client(?Workspace $workspace = null): PendingRequest
    {
        $client = Http::acceptJson()
            ->asJson()
            ->timeout((int) config('services.openmanus.timeout', 120));

        $token = $workspace
            ? $this->settings->runtimeToken($workspace)
            : config('services.openmanus.token');

        return filled($token)
            ? $client->withToken($token)
            : $client;
    }

    /**
     * @return array{status: string, result: null, tools_used: list<mixed>, errors: list<string>}
     */
    private function failed(string $message): array
    {
        return [
            'status' => 'error',
            'result' => null,
            'tools_used' => [],
            'errors' => [$this->safeError($message)],
        ];
    }

    private function safeError(string $message): string
    {
        $redacted = preg_replace('/Bearer\s+\S+/i', 'Bearer [redacted]', $message) ?? $message;

        return preg_replace('/(token|secret|password|api[_-]?key)\s*[:=]\s*\S+/i', '$1=[redacted]', $redacted) ?? $redacted;
    }
}
