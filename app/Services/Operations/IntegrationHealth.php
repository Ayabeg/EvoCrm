<?php

namespace App\Services\Operations;

use App\Enums\ConnectorProvider;
use App\Models\Connector;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\Workspace;
use App\Support\GoogleAuth;
use App\Support\MetaAuth;

class IntegrationHealth
{
    /**
     * @return list<array{
     *     key: string,
     *     label: string,
     *     state: string,
     *     detail: string,
     *     last_activity_at: string|null
     * }>
     */
    public function summary(Workspace $workspace): array
    {
        $meta = $workspace->integration(Integration::PROVIDER_META);

        return [
            [
                'key' => 'meta',
                'label' => 'Meta',
                'state' => $this->metaState($meta),
                'detail' => $meta?->isConnected()
                    ? count($meta->scopes ?? []).' permission(s) granted'
                    : (MetaAuth::enabled() ? 'OAuth is configured but not connected' : 'OAuth is not configured'),
                'last_activity_at' => $meta?->connected_at?->toIso8601String(),
            ],
            $this->googleConnector($workspace, ConnectorProvider::Gmail),
            $this->googleConnector($workspace, ConnectorProvider::GoogleCalendar),
            [
                'key' => 'evolution',
                'label' => 'Evolution / WhatsApp',
                'state' => filled(config('evolution.base_url')) && filled(config('evolution.api_key'))
                    ? 'connected'
                    : 'not_configured',
                'detail' => $workspace->evolution_last_event
                    ? 'Last event: '.$workspace->evolution_last_event
                    : 'No webhook event recorded',
                'last_activity_at' => $workspace->evolution_last_webhook_at?->toIso8601String(),
            ],
            [
                'key' => 'smtp',
                'label' => 'EvoOutreach mail stack',
                'state' => filled(config('evosales.mail_stack.api_token'))
                    ? 'connected'
                    : 'not_configured',
                'detail' => Mailbox::query()->forWorkspace($workspace)->count().' mailbox(es) available',
                'last_activity_at' => null,
            ],
        ];
    }

    private function metaState(?Integration $integration): string
    {
        if (! $integration?->isConnected()) {
            return 'not_configured';
        }

        if ($integration->expires_at?->isPast()) {
            return 'failed';
        }

        if ($integration->expires_at?->lt(now()->addDays(7))) {
            return 'needs_attention';
        }

        return 'connected';
    }

    /**
     * @return array{
     *     key: string,
     *     label: string,
     *     state: string,
     *     detail: string,
     *     last_activity_at: string|null
     * }
     */
    private function googleConnector(Workspace $workspace, ConnectorProvider $provider): array
    {
        $connector = Connector::query()
            ->forWorkspace($workspace)
            ->where('provider', $provider->value)
            ->first();

        return [
            'key' => $provider->value,
            'label' => $provider->label(),
            'state' => $connector?->status->value ?? (GoogleAuth::enabled() ? 'not_connected' : 'not_configured'),
            'detail' => $connector?->config['reason'] ?? 'No connector activity recorded',
            'last_activity_at' => $connector?->connected_at?->toIso8601String(),
        ];
    }
}
