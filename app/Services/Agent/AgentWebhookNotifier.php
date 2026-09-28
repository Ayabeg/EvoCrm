<?php

namespace App\Services\Agent;

use App\Models\Workspace;
use Illuminate\Support\Facades\Http;
use Throwable;

class AgentWebhookNotifier
{
    public function __construct(private AgentWorkspaceSettings $settings) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function notify(Workspace $workspace, string $event, array $payload = []): void
    {
        $connectors = collect($this->settings->connectors($workspace))->firstWhere('id', 'webhook');

        if (! ($connectors['connected'] ?? false)) {
            return;
        }

        $credentials = $this->settings->connectorCredentials($workspace, 'webhook');
        if ($credentials === null) {
            return;
        }

        try {
            $client = Http::acceptJson()
                ->asJson()
                ->timeout(2);

            if (filled($credentials['token'])) {
                $client = $client->withToken($credentials['token']);
            }

            $client->post($credentials['url'], [
                'event' => $event,
                'workspace_id' => $workspace->id,
                'session_id' => $payload['session_id'] ?? null,
                'status' => $payload['status'] ?? null,
            ]);
        } catch (Throwable) {
            // Lifecycle hooks must never fail a run.
        }
    }
}
