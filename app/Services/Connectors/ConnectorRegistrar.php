<?php

namespace App\Services\Connectors;

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Exceptions\UnofficialWhatsAppRefused;
use App\Models\Connector;
use App\Models\GoogleSyncState;
use App\Models\Integration;
use App\Models\Workspace;
use App\Services\Evolution\EvolutionCloudService;
use App\Support\GoogleAuth;
use App\Support\MetaAuth;

class ConnectorRegistrar
{
    /**
     * Persist official-channel intent + status. Never invents unofficial
     * WhatsApp. Never calls live Meta / Gmail / Calendar APIs.
     *
     * @param  array<string, mixed>  $config
     */
    public function connect(Workspace $workspace, ConnectorProvider $provider, array $config = []): Connector
    {
        $this->refuseUnofficial($provider);

        $status = $this->resolveStatus($workspace, $provider);
        $existing = $this->existing($workspace, $provider);
        $mergedConfig = array_merge(
            $existing instanceof Connector ? ($existing->config ?? []) : [],
            $config,
            ['reason' => $this->reason($status, $provider)],
        );

        return Connector::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => $provider,
            ],
            [
                'intent' => $provider->intent(),
                'status' => $status,
                'config' => $mergedConfig,
                'connected_at' => $status === ConnectorStatus::Connected
                    ? ($existing instanceof Connector && $existing->connected_at !== null
                        ? $existing->connected_at
                        : now())
                    : null,
            ]
        );
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public function markGoogleConnected(Workspace $workspace, ConnectorProvider $provider, array $config = []): Connector
    {
        if (! $provider->isGoogle()) {
            throw new \InvalidArgumentException('Google connectors only.');
        }

        $this->persistGoogleTokens($workspace, $provider, $config);

        return Connector::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => $provider,
            ],
            [
                'intent' => $provider->intent(),
                'status' => ConnectorStatus::Connected,
                'config' => $config,
                'connected_at' => now(),
            ]
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function deskCatalog(Workspace $workspace): array
    {
        return $this->catalog($workspace, ConnectorProvider::desk());
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function googleCatalog(Workspace $workspace): array
    {
        return array_map(function (array $row) use ($workspace): array {
            $provider = ConnectorProvider::from((string) $row['provider']);
            $sync = GoogleSyncState::query()
                ->forWorkspace($workspace)
                ->where('provider', $provider->value)
                ->first();
            $integration = $workspace->integration($provider->value);

            return [
                ...$row,
                'scopes_on_client' => GoogleAuth::hasConnectorScope($provider),
                'reconnect_url' => GoogleAuth::enabled() && GoogleAuth::hasConnectorScope($provider)
                    ? '/settings/connectors/google/'.$provider->value
                    : null,
                'sync' => [
                    'status' => $sync?->status ?? 'idle',
                    'cursor' => $sync?->cursor,
                    'last_synced_at' => $sync?->last_synced_at?->toIso8601String(),
                    'last_error' => $sync?->last_error,
                    'has_token' => (bool) $integration?->isConnected(),
                ],
            ];
        }, $this->catalog($workspace, ConnectorProvider::google()));
    }

    /**
     * @param  list<ConnectorProvider>  $providers
     * @return list<array<string, mixed>>
     */
    private function catalog(Workspace $workspace, array $providers): array
    {
        $rows = Connector::query()
            ->forWorkspace($workspace)
            ->whereIn('provider', array_map(fn (ConnectorProvider $provider) => $provider->value, $providers))
            ->get()
            ->keyBy(fn (Connector $connector) => $connector->provider->value);

        return array_map(function (ConnectorProvider $provider) use ($rows): array {
            $row = $rows->get($provider->value);

            return [
                'provider' => $provider->value,
                'name' => $provider->label(),
                'tagline' => $provider->tagline(),
                'intent' => $provider->intent(),
                'status' => $row?->status->value ?? ConnectorStatus::NotConnected->value,
                'connected_at' => $row?->connected_at?->toIso8601String(),
                'reason' => $row?->config['reason'] ?? null,
            ];
        }, $providers);
    }

    private function existing(Workspace $workspace, ConnectorProvider $provider): ?Connector
    {
        return Connector::query()
            ->forWorkspace($workspace)
            ->where('provider', $provider)
            ->first();
    }

    private function resolveStatus(Workspace $workspace, ConnectorProvider $provider): ConnectorStatus
    {
        return match ($provider) {
            ConnectorProvider::WhatsAppCloud => $this->whatsAppStatus(),
            ConnectorProvider::Instagram => $this->metaChannelStatus($workspace, ['instagram_basic']),
            ConnectorProvider::FacebookMessenger => $this->metaChannelStatus($workspace, ['pages_show_list', 'pages_messaging']),
            ConnectorProvider::Gmail, ConnectorProvider::GoogleCalendar => $this->googleStatus($workspace, $provider),
        };
    }

    /**
     * Connected only when Evolution Cloud + WhatsApp Cloud credentials
     * already live in env. No live Evolution / Meta call.
     */
    private function whatsAppStatus(): ConnectorStatus
    {
        $evolution = app(EvolutionCloudService::class);

        if ($evolution->configured() && $evolution->cloudCredentialsPresent()) {
            return ConnectorStatus::Connected;
        }

        return ConnectorStatus::NeedsToken;
    }

    /**
     * Connected only from an already-stored Meta integration + granted
     * scopes. No Graph API call, no invented Embedded Signup.
     *
     * @param  list<string>  $scopes
     */
    private function metaChannelStatus(Workspace $workspace, array $scopes): ConnectorStatus
    {
        if (! MetaAuth::enabled()) {
            return ConnectorStatus::NeedsToken;
        }

        $meta = $workspace->integration(Integration::PROVIDER_META);

        if ($meta?->isConnected() && count(array_intersect($scopes, $meta->scopes ?? [])) > 0) {
            return ConnectorStatus::Connected;
        }

        return ConnectorStatus::NeedsToken;
    }

    private function googleStatus(Workspace $workspace, ConnectorProvider $provider): ConnectorStatus
    {
        $existing = $this->existing($workspace, $provider);

        if ($existing?->isConnected()) {
            return ConnectorStatus::Connected;
        }

        if (! GoogleAuth::enabled()) {
            return ConnectorStatus::NeedsToken;
        }

        return ConnectorStatus::NeedsReconnect;
    }

    private function reason(ConnectorStatus $status, ConnectorProvider $provider): string
    {
        return match ($status) {
            ConnectorStatus::Connected => $provider->label().' is connected on official credentials already present.',
            ConnectorStatus::NeedsReconnect => 'Reconnect Google with Calendar/Gmail. Add those scopes to the existing OAuth client — sign-in is unchanged.',
            ConnectorStatus::NeedsToken => match ($provider) {
                ConnectorProvider::WhatsAppCloud => 'Needs official token. Set Evolution Cloud + WA_BUSINESS_* — never Baileys or QR.',
                ConnectorProvider::Instagram, ConnectorProvider::FacebookMessenger => 'Needs official token. No live Meta Embedded Signup path is configured.',
                ConnectorProvider::Gmail, ConnectorProvider::GoogleCalendar => 'Needs the existing Google OAuth client before Gmail or Calendar can reconnect.',
            },
            ConnectorStatus::NotConnected => $provider->label().' is not connected.',
        };
    }

    public function refuseUnofficialWhatsApp(string $provider): void
    {
        $needle = strtolower($provider);

        if (
            str_contains($needle, 'baileys')
            || str_contains($needle, 'whatsapp_web')
            || str_contains($needle, 'whatsapp-web')
            || str_contains($needle, 'openwa')
            || str_contains($needle, 'linked-device')
            || str_contains($needle, 'linked_device')
            || $needle === 'qr'
            || str_contains($needle, 'whatsapp_qr')
        ) {
            throw UnofficialWhatsAppRefused::because($provider);
        }
    }

    private function refuseUnofficial(ConnectorProvider $provider): void
    {
        $this->refuseUnofficialWhatsApp($provider->value);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public function persistGoogleTokens(Workspace $workspace, ConnectorProvider $provider, array $config = []): Integration
    {
        $integrationProvider = $provider === ConnectorProvider::Gmail
            ? Integration::PROVIDER_GMAIL
            : Integration::PROVIDER_GOOGLE_CALENDAR;

        return Integration::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => $integrationProvider,
            ],
            [
                'status' => filled($config['access_token'] ?? null) ? 'connected' : 'not_connected',
                'access_token' => $config['access_token'] ?? null,
                'refresh_token' => $config['refresh_token'] ?? null,
                'expires_at' => $config['expires_at'] ?? null,
                'scopes' => $config['scopes'] ?? GoogleAuth::connectorScopes($provider),
                'meta' => [
                    'google_email' => $config['google_email'] ?? null,
                ],
                'connected_at' => filled($config['access_token'] ?? null) ? now() : null,
            ],
        );
    }
}
