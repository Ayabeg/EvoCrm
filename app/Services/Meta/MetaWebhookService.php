<?php

namespace App\Services\Meta;

use App\Jobs\ProcessMetaWebhookEvent;
use App\Models\MetaWebhookEvent;
use App\Models\WebhookEndpoint;
use App\Models\Workspace;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class MetaWebhookService
{
    public function verifyToken(?string $provided, WebhookEndpoint $endpoint): bool
    {
        $configured = (string) config('meta.webhook_verify_token');

        if ($configured !== '' && hash_equals($configured, (string) $provided)) {
            return true;
        }

        return filled($provided) && hash_equals((string) $endpoint->key, (string) $provided);
    }

    public function signatureValid(string $rawBody, ?string $header): bool
    {
        $secret = (string) config('meta.app_secret');

        if ($secret === '') {
            return false;
        }

        $expected = 'sha256='.hash_hmac('sha256', $rawBody, $secret);

        return filled($header) && hash_equals($expected, $header);
    }

    /**
     * Persist each leadgen delivery and queue processing. Returns quickly.
     *
     * @param  array<string, mixed>  $payload
     * @return list<MetaWebhookEvent>
     */
    public function accept(Workspace $workspace, WebhookEndpoint $endpoint, array $payload): array
    {
        $events = [];

        foreach ($this->extractDeliveries($payload) as $delivery) {
            $providerId = $this->providerEventId($delivery);
            $existing = MetaWebhookEvent::query()
                ->forWorkspace($workspace)
                ->where('provider_event_id', $providerId)
                ->first();

            if ($existing) {
                Log::info('meta.webhook.duplicate', [
                    'workspace_id' => $workspace->id,
                    'provider_event_id' => $providerId,
                ]);

                if (! $existing->isProcessed()) {
                    try {
                        ProcessMetaWebhookEvent::dispatch($existing->id);
                    } catch (Throwable) {
                    }
                }

                $events[] = $existing;

                continue;
            }

            $event = MetaWebhookEvent::query()->create([
                'workspace_id' => $workspace->id,
                'webhook_endpoint_id' => $endpoint->id,
                'provider_event_id' => $providerId,
                'event_type' => (string) ($delivery['event_type'] ?? 'leadgen'),
                'payload' => $delivery,
                'status' => MetaWebhookEvent::STATUS_PENDING,
            ]);

            try {
                ProcessMetaWebhookEvent::dispatch($event->id);
            } catch (Throwable) {
                // Sync queue surfaces job exceptions immediately. Database
                // workers retry from the job; the HTTP response must stay 200.
            }

            $events[] = $event;
        }

        return $events;
    }

    /**
     * Official Meta leadgen envelope plus the flattened payload used by tests
     * and historical imports.
     *
     * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started
     *
     * @param  array<string, mixed>  $payload
     * @return list<array<string, mixed>>
     */
    public function extractDeliveries(array $payload): array
    {
        if (isset($payload['entry']) && is_array($payload['entry'])) {
            $deliveries = [];

            foreach ($payload['entry'] as $entry) {
                if (! is_array($entry)) {
                    continue;
                }

                foreach ($entry['changes'] ?? [] as $change) {
                    if (! is_array($change) || ($change['field'] ?? '') !== 'leadgen') {
                        continue;
                    }

                    $value = is_array($change['value'] ?? null) ? $change['value'] : [];
                    $deliveries[] = [
                        'event_type' => 'leadgen',
                        'leadgen_id' => $value['leadgen_id'] ?? null,
                        'form_id' => $value['form_id'] ?? null,
                        'page_id' => $value['page_id'] ?? $entry['id'] ?? null,
                        'ad_id' => $value['ad_id'] ?? null,
                        'adgroup_id' => $value['adgroup_id'] ?? $value['adset_id'] ?? null,
                        'created_time' => $value['created_time'] ?? $entry['time'] ?? null,
                    ];
                }
            }

            return $deliveries;
        }

        if (isset($payload['leadgen_id']) || isset($payload['external_id']) || isset($payload['fields']) || isset($payload['field_data'])) {
            return [array_merge(['event_type' => 'leadgen'], $payload)];
        }

        return [];
    }

    /**
     * @param  array<string, mixed>  $delivery
     */
    protected function providerEventId(array $delivery): string
    {
        $leadgen = $delivery['leadgen_id'] ?? $delivery['external_id'] ?? null;

        if (filled($leadgen)) {
            return (string) $leadgen;
        }

        return 'hash:'.hash('sha256', json_encode($delivery) ?: Str::uuid()->toString());
    }
}
