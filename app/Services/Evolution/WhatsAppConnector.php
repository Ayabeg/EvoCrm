<?php

namespace App\Services\Evolution;

use App\Enums\ChannelType;
use App\Enums\ConnectorProvider;
use App\Models\Channel;
use App\Models\Integration;
use App\Models\Workspace;
use App\Services\Connectors\ConnectorRegistrar;
use App\Services\Webhooks\WebhookEndpointManager;
use App\Support\WhatsAppBusinessGraph;

class WhatsAppConnector
{
    public function __construct(
        private EvolutionCloudService $evolution,
        private WhatsAppBusinessGraph $graph,
        private WebhookEndpointManager $endpoints,
        private ConnectorRegistrar $connectors,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function phoneStatus(Workspace $workspace, bool $refreshQr = false): array
    {
        $integration = $workspace->integration(Integration::PROVIDER_WHATSAPP);
        $instance = $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP);

        if (! $this->evolution->configured()) {
            return $this->unavailable($instance, 'whatsapp');
        }

        $qr = $this->storedQr($integration);
        $state = $integration?->meta['state'] ?? null;

        if ($refreshQr && $integration && ! $integration->isConnected()) {
            $connect = $this->evolution->connectInstance($instance);
            $qr = $this->evolution->qrFrom($connect) ?? $qr;
            $state = $this->evolution->stateFrom($connect)
                ?? $this->evolution->stateFrom($this->evolution->connectionState($instance))
                ?? $state;

            $meta = $integration->meta ?? [];
            $meta['state'] = $state;
            $meta['qr'] = $qr;
            $integration->forceFill(['meta' => $meta])->save();
        }

        $connected = $state === 'open' || ($integration?->isConnected() ?? false);

        if ($connected && $integration && ! $integration->isConnected()) {
            $this->markConnected($integration, $state ?? 'open');
            $this->ensureChannel($workspace, ChannelType::WhatsApp, 'WhatsApp');
            $this->connectors->connect($workspace, ConnectorProvider::WhatsApp);
        }

        return [
            'available' => true,
            'connected' => $connected,
            'state' => $connected ? 'open' : ($state ?? $integration?->status ?? 'not_connected'),
            'instance' => $instance,
            'qr' => $connected ? null : $qr,
            'display_phone' => $integration?->meta['display_phone'] ?? null,
            'message' => $connected
                ? 'WhatsApp is connected.'
                : 'Open WhatsApp on your phone → Settings → Linked devices → Link a device.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function businessStatus(Workspace $workspace): array
    {
        $integration = $workspace->integration(Integration::PROVIDER_WHATSAPP_BUSINESS);
        $meta = $workspace->integration(Integration::PROVIDER_META);
        $instance = $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP_BUSINESS);

        if (! $this->evolution->configured()) {
            return $this->unavailable($instance, 'whatsapp_business');
        }

        return [
            'available' => true,
            'connected' => $integration?->isConnected() ?? false,
            'needs_facebook' => ! ($meta?->isConnected() ?? false),
            'instance' => $instance,
            'display_phone' => $integration?->meta['display_phone'] ?? $integration?->meta['display_phone_number'] ?? null,
            'verified_name' => $integration?->meta['verified_name'] ?? null,
            'message' => $integration?->isConnected()
                ? 'WhatsApp Business is connected.'
                : (($meta?->isConnected() ?? false)
                    ? 'Connect WhatsApp Business to finish setup.'
                    : 'Log in with Facebook to connect WhatsApp Business.'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function connectPhone(Workspace $workspace): array
    {
        if (! $this->evolution->configured()) {
            return $this->unavailable(
                $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP),
                'whatsapp',
            );
        }

        $instance = $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP);
        $created = $this->evolution->createWhatsAppInstance($workspace);
        $qr = $this->evolution->qrFrom($created);

        if ($qr === null) {
            $qr = $this->evolution->qrFrom($this->evolution->connectInstance($instance));
        }

        $this->setWebhook($workspace, $instance);
        $this->store($workspace, Integration::PROVIDER_WHATSAPP, [
            'status' => 'connecting',
            'access_token' => is_array($created['body'] ?? null) ? ($created['body']['hash'] ?? 'evolution') : 'evolution',
            'meta' => [
                'instance' => $instance,
                'integration' => EvolutionCloudService::INTEGRATION_BAILEYS,
                'state' => $this->evolution->stateFrom($created) ?? 'connecting',
                'qr' => $qr,
            ],
        ]);
        $this->ensureChannel($workspace, ChannelType::WhatsApp, 'WhatsApp');
        $this->connectors->connect($workspace, ConnectorProvider::WhatsApp);

        return [
            'available' => true,
            'connected' => false,
            'state' => 'connecting',
            'instance' => $instance,
            'qr' => $qr,
            'display_phone' => null,
            'message' => $created['ok']
                ? 'Open WhatsApp on your phone → Settings → Linked devices → Link a device.'
                : ($created['error'] ?? 'WhatsApp could not start. Try again.'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function connectBusiness(Workspace $workspace): array
    {
        $instance = $this->evolution->instanceName($workspace, EvolutionCloudService::KIND_WHATSAPP_BUSINESS);

        if (! $this->evolution->configured()) {
            return $this->unavailable($instance, 'whatsapp_business');
        }

        $meta = $workspace->integration(Integration::PROVIDER_META);

        if (! $meta?->isConnected()) {
            return [
                'available' => true,
                'connected' => false,
                'needs_facebook' => true,
                'instance' => $instance,
                'display_phone' => null,
                'verified_name' => null,
                'message' => 'Log in with Facebook to connect WhatsApp Business.',
            ];
        }

        $found = $this->graph->discover((string) $meta->access_token);

        if ($found === null) {
            return [
                'available' => true,
                'connected' => false,
                'needs_facebook' => false,
                'instance' => $instance,
                'display_phone' => null,
                'verified_name' => null,
                'message' => 'No WhatsApp Business account was found on this Facebook login. Add WhatsApp in Meta Business Suite, then try again.',
            ];
        }

        $created = $this->evolution->createBusinessInstance($workspace, [
            'token' => $meta->access_token,
            'number' => $found['phone_number_id'],
            'businessId' => $found['waba_id'],
        ]);

        if (! $created['ok']) {
            return [
                'available' => true,
                'connected' => false,
                'needs_facebook' => false,
                'instance' => $instance,
                'display_phone' => $found['display_phone_number'],
                'verified_name' => $found['verified_name'],
                'message' => $created['error'] ?? 'WhatsApp Business could not start. Try again.',
            ];
        }

        $this->setWebhook($workspace, $instance);
        $this->store($workspace, Integration::PROVIDER_WHATSAPP_BUSINESS, [
            'status' => 'connected',
            'access_token' => is_array($created['body'] ?? null) ? ($created['body']['hash'] ?? 'evolution') : 'evolution',
            'meta' => [
                'instance' => $instance,
                'integration' => EvolutionCloudService::INTEGRATION_BUSINESS,
                'waba_id' => $found['waba_id'],
                'phone_number_id' => $found['phone_number_id'],
                'display_phone' => $found['display_phone_number'],
                'verified_name' => $found['verified_name'],
                'business_id' => $found['business_id'],
            ],
        ]);
        $this->ensureChannel($workspace, ChannelType::WhatsAppCloud, 'WhatsApp Business');
        $this->connectors->connect($workspace, ConnectorProvider::WhatsAppCloud);

        return [
            'available' => true,
            'connected' => true,
            'needs_facebook' => false,
            'instance' => $instance,
            'display_phone' => $found['display_phone_number'],
            'verified_name' => $found['verified_name'],
            'message' => 'WhatsApp Business is connected.',
        ];
    }

    /**
     * After Facebook Login, create the Evolution Cloud instance when we
     * already have a token and a WABA. Never throws — OAuth must still finish.
     *
     * @return array<string, mixed>
     */
    public function provisionBusinessIfReady(Workspace $workspace): array
    {
        $workspace->unsetRelation('integrations');

        $status = $this->businessStatus($workspace);

        if (($status['connected'] ?? false)
            || ($status['needs_facebook'] ?? true)
            || ! ($status['available'] ?? false)) {
            return $status;
        }

        return $this->connectBusiness($workspace);
    }

    public function disconnectPhone(Workspace $workspace): void
    {
        $this->teardown($workspace, Integration::PROVIDER_WHATSAPP, EvolutionCloudService::KIND_WHATSAPP);
    }

    public function disconnectBusiness(Workspace $workspace): void
    {
        $this->teardown($workspace, Integration::PROVIDER_WHATSAPP_BUSINESS, EvolutionCloudService::KIND_WHATSAPP_BUSINESS);
    }

    /**
     * @return array<string, mixed>
     */
    protected function unavailable(string $instance, string $kind): array
    {
        return [
            'available' => false,
            'connected' => false,
            'needs_facebook' => $kind === 'whatsapp_business',
            'instance' => $instance,
            'qr' => null,
            'display_phone' => null,
            'verified_name' => null,
            'state' => 'unavailable',
            'message' => 'WhatsApp is temporarily unavailable. Evotechly is enabling it — you do not need an API key.',
        ];
    }

    protected function setWebhook(Workspace $workspace, string $instance): void
    {
        $this->evolution->setWebhook(
            $this->endpoints->urlFor($workspace, WebhookEndpointManager::PROVIDER_EVOLUTION),
            $instance,
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    protected function store(Workspace $workspace, string $provider, array $attributes): Integration
    {
        return Integration::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'provider' => $provider,
            ],
            [
                'status' => $attributes['status'],
                'access_token' => $attributes['access_token'] ?? null,
                'scopes' => $attributes['scopes'] ?? [],
                'meta' => $attributes['meta'] ?? [],
                'connected_at' => ($attributes['status'] ?? null) === 'connected' ? now() : null,
            ],
        );
    }

    protected function markConnected(Integration $integration, string $state): void
    {
        $meta = $integration->meta ?? [];
        $meta['state'] = $state;
        unset($meta['qr']);

        $integration->forceFill([
            'status' => 'connected',
            'access_token' => $integration->access_token ?: 'evolution',
            'meta' => $meta,
            'connected_at' => $integration->connected_at ?? now(),
        ])->save();
    }

    protected function ensureChannel(Workspace $workspace, ChannelType $type, string $name): Channel
    {
        return Channel::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'type' => $type,
            ],
            [
                'name' => $name,
                'status' => 'connected',
            ],
        );
    }

    protected function teardown(Workspace $workspace, string $provider, string $kind): void
    {
        $instance = $this->evolution->instanceName($workspace, $kind);

        if ($this->evolution->configured()) {
            $this->evolution->logoutInstance($instance);
            $this->evolution->deleteInstance($instance);
        }

        $workspace->integration($provider)?->delete();
    }

    /**
     * @return array{base64: string, pairingCode: string|null, code: string|null}|null
     */
    protected function storedQr(?Integration $integration): ?array
    {
        $qr = $integration?->meta['qr'] ?? null;

        return is_array($qr) && filled($qr['base64'] ?? null) ? $qr : null;
    }
}
