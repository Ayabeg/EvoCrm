<?php

namespace App\Services\Desk;

use App\Models\Integration;
use App\Models\Workspace;
use App\Services\Outbound\SuppressionService;
use App\Support\AlgerianPhone;

class AlgerianSms
{
    public function __construct(
        private SmsClient $client,
        private SuppressionService $suppressions,
    ) {}

    /**
     * @return array{ok: bool, id: string|null, error: string|null, body: array<string, mixed>|null, stub: bool, provider: string, e164: string|null}
     */
    public function send(Workspace $workspace, ?string $rawPhone, string $body, bool $allowStub = false): array
    {
        $e164 = AlgerianPhone::normalize($rawPhone);

        if (! AlgerianPhone::isMobile($e164)) {
            return $this->result(false, error: 'SMS is Algeria-only: use a +213 mobile (Ooredoo 05, Mobilis 06, Djezzy 07).', e164: $e164);
        }

        if ($this->suppressions->isSuppressed($workspace, null, $e164)) {
            return $this->result(false, error: 'Recipient is on the suppression list.', e164: $e164);
        }

        $this->applyWorkspaceOverlay($workspace);
        $client = $this->resolveClient($workspace);

        if (! $client->configured()) {
            if ($allowStub) {
                return $this->result(true, body: ['stub' => true, 'to' => $e164], stub: true, provider: 'sms', e164: $e164);
            }

            return $this->result(false, error: 'SMS gateway is not connected. Add a DZ aggregator in Settings → SMS.', e164: $e164);
        }

        $result = $client->sendText((string) $e164, $body);

        return $this->result(
            (bool) $result['ok'],
            id: $result['id'] ?? null,
            error: $result['ok'] ? null : ($result['error'] ?? 'Send failed'),
            body: is_array($result['body'] ?? null) ? $result['body'] : null,
            provider: $this->providerName($workspace),
            e164: $e164,
        );
    }

    public function providerName(?Workspace $workspace = null): string
    {
        $integration = $workspace?->integration(Integration::PROVIDER_SMS);
        $driver = $integration?->meta['driver'] ?? config('sms.driver', 'http');

        return $driver === 'twilio' ? 'twilio' : 'http';
    }

    protected function applyWorkspaceOverlay(Workspace $workspace): void
    {
        $integration = $workspace->integration(Integration::PROVIDER_SMS);

        if (! $integration?->isConnected()) {
            return;
        }

        $meta = $integration->meta ?? [];

        config([
            'sms.driver' => $meta['driver'] ?? 'http',
            'sms.sender' => $meta['sender'] ?? config('sms.sender'),
            'sms.http.url' => $meta['url'] ?? config('sms.http.url'),
            'sms.http.method' => $meta['method'] ?? config('sms.http.method'),
            'sms.http.key' => $integration->access_token,
            'sms.http.auth' => $meta['auth'] ?? config('sms.http.auth'),
            'sms.http.fields' => $meta['fields'] ?? config('sms.http.fields'),
        ]);
    }

    protected function resolveClient(Workspace $workspace): SmsClient
    {
        if (app()->environment('testing')) {
            return $this->client;
        }

        $integration = $workspace->integration(Integration::PROVIDER_SMS);

        if ($integration?->isConnected()) {
            $driver = $integration->meta['driver'] ?? 'http';

            if ($driver === 'twilio') {
                return app(TwilioSmsClient::class);
            }

            return new HttpSmsGatewayClient($this->configFromIntegration($integration));
        }

        return $this->client;
    }

    /**
     * @return array<string, mixed>
     */
    protected function configFromIntegration(Integration $integration): array
    {
        $meta = $integration->meta ?? [];

        return [
            'url' => $meta['url'] ?? null,
            'method' => $meta['method'] ?? 'POST',
            'key' => $integration->access_token,
            'auth' => $meta['auth'] ?? 'form',
            'sender' => $meta['sender'] ?? config('sms.sender', 'EVOTECHLY'),
            'fields' => $meta['fields'] ?? config('sms.http.fields', []),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $body
     * @return array{ok: bool, id: string|null, error: string|null, body: array<string, mixed>|null, stub: bool, provider: string, e164: string|null}
     */
    protected function result(
        bool $ok,
        ?string $id = null,
        ?string $error = null,
        ?array $body = null,
        bool $stub = false,
        string $provider = 'sms',
        ?string $e164 = null,
    ): array {
        return [
            'ok' => $ok,
            'id' => $id,
            'error' => $error,
            'body' => $body,
            'stub' => $stub,
            'provider' => $provider,
            'e164' => $e164,
        ];
    }
}
