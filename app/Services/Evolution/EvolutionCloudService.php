<?php

namespace App\Services\Evolution;

use App\Exceptions\UnofficialWhatsAppRefused;
use App\Models\Workspace;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class EvolutionCloudService
{
    public const KIND_WHATSAPP = 'whatsapp';

    public const KIND_WHATSAPP_BUSINESS = 'whatsapp_business';

    public const INTEGRATION_BAILEYS = 'WHATSAPP-BAILEYS';

    public const INTEGRATION_BUSINESS = 'WHATSAPP-BUSINESS';

    public function configured(): bool
    {
        return filled(config('evolution.base_url')) && filled(config('evolution.api_key'));
    }

    public function cloudCredentialsPresent(): bool
    {
        return filled(config('evolution.meta.token'))
            && filled(config('evolution.meta.phone_number_id'))
            && filled(config('evolution.meta.waba_id'));
    }

    public function instanceName(?Workspace $workspace, string $kind = self::KIND_WHATSAPP_BUSINESS): string
    {
        if ($workspace) {
            $stored = $workspace->integration($kind)?->meta['instance'] ?? null;

            if (filled($stored)) {
                return (string) $stored;
            }

            return match ($kind) {
                self::KIND_WHATSAPP => 'evo-ws'.$workspace->id.'-wa',
                default => 'evo-ws'.$workspace->id.'-waba',
            };
        }

        return (string) config('evolution.instance');
    }

    /**
     * @return array{connected: bool, reason: string|null, instance: string, last_webhook_at: mixed, last_event: mixed, mode: string}
     */
    public function health(?Workspace $workspace = null): array
    {
        if (! $this->configured()) {
            return [
                'connected' => false,
                'reason' => 'WhatsApp is temporarily unavailable. Evotechly is enabling it — you do not need an API key.',
                'instance' => $this->instanceName($workspace),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => self::INTEGRATION_BUSINESS,
            ];
        }

        $business = $workspace?->integration(self::KIND_WHATSAPP_BUSINESS);
        $hasWorkspaceCloud = $business?->isConnected() ?? false;

        if (! $hasWorkspaceCloud && ! $this->cloudCredentialsPresent()) {
            return [
                'connected' => false,
                'reason' => 'Log in with Facebook to connect WhatsApp Business.',
                'instance' => $this->instanceName($workspace, self::KIND_WHATSAPP_BUSINESS),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => self::INTEGRATION_BUSINESS,
            ];
        }

        try {
            $fetch = $this->fetchInstance($this->instanceName($workspace, self::KIND_WHATSAPP_BUSINESS));

            return [
                'connected' => (bool) ($fetch['ok'] ?? false),
                'reason' => $fetch['ok'] ?? false ? null : ($fetch['error'] ?? 'Instance fetch failed'),
                'instance' => $this->instanceName($workspace, self::KIND_WHATSAPP_BUSINESS),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => self::INTEGRATION_BUSINESS,
                'remote' => $fetch['body'] ?? null,
            ];
        } catch (\Throwable $e) {
            return [
                'connected' => false,
                'reason' => $e->getMessage(),
                'instance' => $this->instanceName($workspace, self::KIND_WHATSAPP_BUSINESS),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => self::INTEGRATION_BUSINESS,
            ];
        }
    }

    /**
     * Native Evolution WhatsApp (phone) — WHATSAPP-BAILEYS + QR.
     *
     * @param  array<string, mixed>  $overrides
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function createWhatsAppInstance(Workspace $workspace, array $overrides = []): array
    {
        $payload = [
            'instanceName' => $overrides['instanceName'] ?? $this->instanceName($workspace, self::KIND_WHATSAPP),
            'qrcode' => true,
            'integration' => self::INTEGRATION_BAILEYS,
        ];

        $this->assertAllowed($payload);

        return $this->request('post', '/instance/create', $payload);
    }

    /**
     * Native Evolution WhatsApp Business — WHATSAPP-BUSINESS, no QR.
     *
     * @param  array<string, mixed>  $credentials
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function createBusinessInstance(?Workspace $workspace = null, array $credentials = []): array
    {
        $payload = [
            'instanceName' => $credentials['instanceName'] ?? $this->instanceName($workspace, self::KIND_WHATSAPP_BUSINESS),
            'token' => $credentials['token'] ?? config('evolution.meta.token'),
            'number' => $credentials['number'] ?? config('evolution.meta.phone_number_id'),
            'businessId' => $credentials['businessId'] ?? config('evolution.meta.waba_id'),
            'qrcode' => false,
            'integration' => self::INTEGRATION_BUSINESS,
        ];

        $this->assertAllowed($payload);

        return $this->request('post', '/instance/create', $payload);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function createInstance(array $overrides = []): array
    {
        $integration = strtoupper((string) ($overrides['integration'] ?? self::INTEGRATION_BUSINESS));
        $this->assertAllowed([
            'integration' => $integration,
            'qrcode' => $overrides['qrcode'] ?? ($integration === self::INTEGRATION_BAILEYS),
        ]);

        if ($integration === self::INTEGRATION_BAILEYS) {
            $workspace = $overrides['workspace'] ?? null;

            if (! $workspace instanceof Workspace) {
                $this->assertAllowed([
                    'integration' => $integration,
                    'qrcode' => $overrides['qrcode'] ?? true,
                ]);

                return $this->request('post', '/instance/create', [
                    'instanceName' => $overrides['instanceName'] ?? config('evolution.instance'),
                    'qrcode' => true,
                    'integration' => self::INTEGRATION_BAILEYS,
                ]);
            }

            return $this->createWhatsAppInstance($workspace, $overrides);
        }

        return $this->createBusinessInstance(
            $overrides['workspace'] ?? null,
            $overrides,
        );
    }

    /**
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function fetchInstance(?string $name = null): array
    {
        $instance = $name ?? (string) config('evolution.instance');

        return $this->request('get', '/instance/fetchInstances', [
            'instanceName' => $instance,
        ]);
    }

    /**
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function connectInstance(string $name): array
    {
        return $this->request('get', '/instance/connect/'.$name);
    }

    /**
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function connectionState(string $name): array
    {
        return $this->request('get', '/instance/connectionState/'.$name);
    }

    /**
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function logoutInstance(string $name): array
    {
        return $this->request('delete', '/instance/logout/'.$name);
    }

    /**
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function deleteInstance(string $name): array
    {
        return $this->request('delete', '/instance/delete/'.$name);
    }

    /**
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function setWebhook(?string $url = null, ?string $instance = null): array
    {
        $name = $instance ?? (string) config('evolution.instance');
        $webhookUrl = $url ?? (string) config('evolution.webhook_url');

        return $this->request('post', '/webhook/set/'.$name, [
            'webhook' => [
                'enabled' => filled($webhookUrl),
                'url' => $webhookUrl,
                'webhookByEvents' => false,
                'events' => [
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE',
                    'CONNECTION_UPDATE',
                    'SEND_MESSAGE',
                ],
            ],
        ]);
    }

    /**
     * Session-window text reply (24h customer service window).
     *
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function sendText(string $number, string $text, ?string $instance = null): array
    {
        $name = $instance ?? (string) config('evolution.instance');

        return $this->request('post', '/message/sendText/'.$name, [
            'number' => $this->digits($number),
            'text' => $text,
        ]);
    }

    /**
     * Official template send for outbound / outside the session window.
     *
     * @param  array<int, array<string, mixed>>  $components
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function sendTemplate(string $number, string $name, string $language = 'fr', array $components = [], ?string $instance = null): array
    {
        $instanceName = $instance ?? (string) config('evolution.instance');

        return $this->request('post', '/message/sendTemplate/'.$instanceName, [
            'number' => $this->digits($number),
            'name' => $name,
            'language' => $language,
            'components' => $components,
        ]);
    }

    /**
     * @param  array{ok: bool, status: int, body: mixed, error: string|null}  $response
     * @return array{base64: string, pairingCode: string|null, code: string|null}|null
     */
    public function qrFrom(array $response): ?array
    {
        $body = is_array($response['body'] ?? null) ? $response['body'] : [];
        $qr = is_array($body['qrcode'] ?? null) ? $body['qrcode'] : $body;
        $base64 = (string) ($qr['base64'] ?? $body['base64'] ?? '');

        if ($base64 === '') {
            return null;
        }

        return [
            'base64' => $base64,
            'pairingCode' => $qr['pairingCode'] ?? $body['pairingCode'] ?? null,
            'code' => $qr['code'] ?? $body['code'] ?? null,
        ];
    }

    public function stateFrom(array $response): ?string
    {
        $body = is_array($response['body'] ?? null) ? $response['body'] : [];

        return $body['instance']['state']
            ?? $body['instance']['connectionStatus']
            ?? $body['state']
            ?? $body['connectionStatus']
            ?? null;
    }

    /**
     * Guard used by tests and any future connector. OpenWA / linked-device only.
     */
    public function refuseUnofficial(string $attempt = 'OpenWA / linked-device'): never
    {
        throw UnofficialWhatsAppRefused::because($attempt);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function assertAllowed(array $payload): void
    {
        $integration = strtoupper((string) ($payload['integration'] ?? self::INTEGRATION_BUSINESS));

        if (! in_array($integration, [self::INTEGRATION_BAILEYS, self::INTEGRATION_BUSINESS], true)) {
            $this->refuseUnofficial($integration);
        }

        if ($integration === self::INTEGRATION_BUSINESS && array_key_exists('qrcode', $payload) && $payload['qrcode'] === true) {
            $this->refuseUnofficial('qrcode=true on WHATSAPP-BUSINESS');
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    protected function request(string $method, string $path, array $payload = []): array
    {
        if (! $this->configured()) {
            return [
                'ok' => false,
                'status' => 0,
                'body' => null,
                'error' => 'WhatsApp is temporarily unavailable. Evotechly is enabling it — you do not need an API key.',
            ];
        }

        $http = $this->client();
        $url = rtrim((string) config('evolution.base_url'), '/').'/'.ltrim($path, '/');

        $response = $method === 'get'
            ? $http->get($url, $payload)
            : $http->{$method}($url, $payload);

        return [
            'ok' => $response->successful(),
            'status' => $response->status(),
            'body' => $response->json() ?? $response->body(),
            'error' => $response->successful() ? null : ($response->json('message') ?? $response->json('error.message') ?? $response->body()),
        ];
    }

    protected function client(): PendingRequest
    {
        return Http::timeout((int) config('evolution.timeout', 15))
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'apikey' => (string) config('evolution.api_key'),
            ]);
    }

    protected function digits(string $number): string
    {
        return Str::of($number)->replaceMatches('/\D+/', '')->toString();
    }
}
