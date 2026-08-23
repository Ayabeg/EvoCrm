<?php

namespace App\Services\Evolution;

use App\Exceptions\UnofficialWhatsAppRefused;
use App\Models\Workspace;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class EvolutionCloudService
{
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

    /**
     * @return array{connected: bool, reason: string|null, instance: string, last_webhook_at: mixed, last_event: mixed, mode: string}
     */
    public function health(?Workspace $workspace = null): array
    {
        if (! $this->configured()) {
            return [
                'connected' => false,
                'reason' => 'Evolution API is not connected. Set EVOLUTION_BASE_URL and EVOLUTION_API_KEY.',
                'instance' => (string) config('evolution.instance'),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => 'WHATSAPP-BUSINESS',
            ];
        }

        if (! $this->cloudCredentialsPresent()) {
            return [
                'connected' => false,
                'reason' => 'WhatsApp Cloud credentials are empty. Set WA_BUSINESS_TOKEN, WA_BUSINESS_PHONE_NUMBER_ID, and WA_BUSINESS_WABA_ID. Do not invent Meta app IDs.',
                'instance' => (string) config('evolution.instance'),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => 'WHATSAPP-BUSINESS',
            ];
        }

        try {
            $fetch = $this->fetchInstance();

            return [
                'connected' => (bool) ($fetch['ok'] ?? false),
                'reason' => $fetch['ok'] ?? false ? null : ($fetch['error'] ?? 'Instance fetch failed'),
                'instance' => (string) config('evolution.instance'),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => 'WHATSAPP-BUSINESS',
                'remote' => $fetch['body'] ?? null,
            ];
        } catch (\Throwable $e) {
            return [
                'connected' => false,
                'reason' => $e->getMessage(),
                'instance' => (string) config('evolution.instance'),
                'last_webhook_at' => $workspace?->evolution_last_webhook_at,
                'last_event' => $workspace?->evolution_last_event,
                'mode' => 'WHATSAPP-BUSINESS',
            ];
        }
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array{ok: bool, status: int, body: mixed, error: string|null}
     */
    public function createInstance(array $overrides = []): array
    {
        $this->assertCloudOnly($overrides);

        $payload = [
            'instanceName' => $overrides['instanceName'] ?? config('evolution.instance'),
            'token' => $overrides['token'] ?? config('evolution.meta.token'),
            'number' => $overrides['number'] ?? config('evolution.meta.phone_number_id'),
            'businessId' => $overrides['businessId'] ?? config('evolution.meta.waba_id'),
            'qrcode' => false,
            'integration' => 'WHATSAPP-BUSINESS',
        ];

        return $this->request('post', '/instance/create', $payload);
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
     * Guard used by tests and any future connector. There is no QR / Baileys path.
     */
    public function refuseUnofficial(string $attempt = 'QR / Baileys'): never
    {
        throw UnofficialWhatsAppRefused::because($attempt);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function assertCloudOnly(array $payload): void
    {
        $integration = strtoupper((string) ($payload['integration'] ?? 'WHATSAPP-BUSINESS'));

        if ($integration !== 'WHATSAPP-BUSINESS') {
            $this->refuseUnofficial($integration);
        }

        if (array_key_exists('qrcode', $payload) && $payload['qrcode'] === true) {
            $this->refuseUnofficial('qrcode=true');
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
                'error' => 'Evolution API is not connected.',
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
            'error' => $response->successful() ? null : ($response->json('message') ?? $response->body()),
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
