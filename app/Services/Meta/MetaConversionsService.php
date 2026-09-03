<?php

namespace App\Services\Meta;

use App\Jobs\SendMetaConversionEvent;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\MetaConversionConfig;
use App\Models\MetaConversionEvent;
use App\Models\Workspace;
use App\Support\AlgerianPhone;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Outbound Meta Conversions API (CAPI).
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event
 */
class MetaConversionsService
{
    public function __construct(
        private WorkspaceMetaCredentials $credentials,
        private MetaGraphClient $graph,
    ) {}

    /**
     * @return list<MetaConversionConfig>
     */
    public function configs(Workspace $workspace): array
    {
        $existing = MetaConversionConfig::query()->forWorkspace($workspace)->get()->keyBy('crm_event');
        $configs = [];

        foreach (MetaConversionConfig::defaults() as $crmEvent => $metaEvent) {
            $configs[] = $existing[$crmEvent] ?? MetaConversionConfig::query()->create([
                'workspace_id' => $workspace->id,
                'crm_event' => $crmEvent,
                'meta_event' => $metaEvent,
                'enabled' => false,
            ]);
        }

        return $configs;
    }

    /**
     * @param  array<int, array{crm_event: string, meta_event: string, enabled: bool, pixel_id?: string|null}>  $rows
     */
    public function saveConfigs(Workspace $workspace, array $rows, ?string $defaultPixelId = null): void
    {
        foreach ($this->configs($workspace) as $config) {
            $row = collect($rows)->firstWhere('crm_event', $config->crm_event);

            if (! is_array($row)) {
                continue;
            }

            $metaEvent = (string) ($row['meta_event'] ?? $config->meta_event);
            if (! in_array($metaEvent, MetaConversionConfig::metaEvents(), true)) {
                $metaEvent = $config->meta_event;
            }

            $config->forceFill([
                'meta_event' => $metaEvent,
                'enabled' => (bool) ($row['enabled'] ?? false),
                'pixel_id' => filled($row['pixel_id'] ?? null) ? (string) $row['pixel_id'] : $defaultPixelId,
            ])->save();
        }
    }

    public function queueForLead(Lead $lead, string $crmEvent): ?MetaConversionEvent
    {
        $lead->loadMissing(['contact', 'adCampaign', 'workspace']);

        return $this->queue($lead->workspace, $crmEvent, Lead::class, (int) $lead->id, [
            'contact' => $lead->contact,
            'lead' => $lead,
            'value_cents' => null,
            'currency' => null,
        ]);
    }

    public function queueForDeal(Deal $deal, string $crmEvent): ?MetaConversionEvent
    {
        $deal->loadMissing(['contact', 'lead', 'workspace']);

        return $this->queue($deal->workspace, $crmEvent, Deal::class, (int) $deal->id, [
            'contact' => $deal->contact,
            'lead' => $deal->lead,
            'value_cents' => $deal->amount_cents,
            'currency' => $deal->currency,
        ]);
    }

    /**
     * @param  array{contact: ?Contact, lead: ?Lead, value_cents: mixed, currency: mixed}  $context
     */
    public function queue(Workspace $workspace, string $crmEvent, string $subjectType, int $subjectId, array $context): ?MetaConversionEvent
    {
        $config = MetaConversionConfig::query()
            ->forWorkspace($workspace)
            ->where('crm_event', $crmEvent)
            ->first();

        if (! $config?->enabled || ! filled($config->pixel_id)) {
            return null;
        }

        $eventId = $this->eventId($workspace, $crmEvent, $subjectType, $subjectId);

        $existing = MetaConversionEvent::query()
            ->forWorkspace($workspace)
            ->where('event_id', $eventId)
            ->first();

        if ($existing && $existing->status === MetaConversionEvent::STATUS_SENT) {
            return $existing;
        }

        $event = $existing ?? MetaConversionEvent::query()->create([
            'workspace_id' => $workspace->id,
            'meta_conversion_config_id' => $config->id,
            'event_id' => $eventId,
            'crm_event' => $crmEvent,
            'meta_event' => $config->meta_event,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'status' => MetaConversionEvent::STATUS_PENDING,
            'request_meta' => [
                'has_email' => filled($context['contact']?->email),
                'has_phone' => filled($context['contact']?->phone_e164 ?? $context['contact']?->phone),
                'campaign_id' => $context['lead']?->adCampaign?->external_id ?? $context['lead']?->ad_campaign_id,
                'currency' => $context['currency'],
                'has_value' => filled($context['value_cents']),
            ],
        ]);

        try {
            SendMetaConversionEvent::dispatch($event->id);
        } catch (Throwable) {
            // The sync queue surfaces job exceptions immediately. Workers
            // still retry from the thrown exception inside the job.
        }

        return $event->refresh();
    }

    public function send(MetaConversionEvent $event): MetaConversionEvent
    {
        $event->loadMissing(['workspace', 'config']);
        $workspace = $event->workspace;
        $config = $event->config;

        if (! $config?->enabled || ! filled($config->pixel_id)) {
            $event->forceFill([
                'status' => MetaConversionEvent::STATUS_SKIPPED,
                'error' => 'Conversion mapping is disabled or missing a pixel id.',
            ])->save();

            return $event;
        }

        $credentials = $this->credentials->resolve($workspace);

        if (! $credentials['ok']) {
            return $this->fail($event, $config, $credentials['reason'] ?? 'Meta is not connected.');
        }

        $payload = $this->payload($event);

        if ($payload === null) {
            $event->forceFill([
                'status' => MetaConversionEvent::STATUS_SKIPPED,
                'error' => 'No hashed user identifiers available.',
            ])->save();

            return $event;
        }

        try {
            $this->graph->post((string) $credentials['token'], '/'.$config->pixel_id.'/events', [
                'data' => [$payload],
            ]);
        } catch (RuntimeException $exception) {
            if ($exception->getMessage() === MetaGraphClient::TOKEN_EXPIRED) {
                $credentials['integration']?->forceFill(['status' => 'expired'])->save();
            }

            return $this->fail($event, $config, 'Meta conversion request failed.');
        } catch (Throwable) {
            return $this->fail($event, $config, 'Meta conversion request failed.');
        }

        $event->forceFill([
            'status' => MetaConversionEvent::STATUS_SENT,
            'attempts' => $event->attempts + 1,
            'sent_at' => now(),
            'failed_at' => null,
            'error' => null,
        ])->save();

        $config->forceFill([
            'last_success_at' => now(),
            'sent_count' => $config->sent_count + 1,
        ])->save();

        Log::info('meta.conversion.sent', [
            'workspace_id' => $workspace->id,
            'event_id' => $event->event_id,
            'meta_event' => $event->meta_event,
        ]);

        return $event->refresh();
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function payload(MetaConversionEvent $event): ?array
    {
        $userData = $this->userData($event);

        if ($userData === []) {
            return null;
        }

        $payload = [
            'event_name' => $event->meta_event,
            'event_time' => now()->timestamp,
            'event_id' => $event->event_id,
            'action_source' => 'system_generated',
            'user_data' => $userData,
        ];

        $custom = [];
        $meta = $event->request_meta ?? [];

        if (($event->meta_event === MetaConversionConfig::META_PURCHASE || filled($meta['has_value'])) && isset($meta['currency'])) {
            $subject = $event->subject_type === Deal::class
                ? Deal::query()->find($event->subject_id)
                : null;

            if ($subject instanceof Deal) {
                $custom['value'] = round(((int) $subject->amount_cents) / 100, 2);
                $custom['currency'] = (string) ($subject->currency ?: 'DZD');
            }
        }

        if ($custom !== []) {
            $payload['custom_data'] = $custom;
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    protected function userData(MetaConversionEvent $event): array
    {
        $contact = $this->contactFor($event);

        if ($contact === null) {
            return [];
        }

        $data = [
            'external_id' => [hash('sha256', (string) $contact->id)],
        ];

        if (filled($contact->email)) {
            $data['em'] = [$this->hash((string) $contact->email)];
        }

        $phone = AlgerianPhone::normalize($contact->phone_e164 ?: $contact->phone);
        if (filled($phone)) {
            $data['ph'] = [$this->hash(preg_replace('/\D+/', '', $phone) ?: $phone)];
        }

        if (count($data) === 1) {
            return [];
        }

        return $data;
    }

    protected function contactFor(MetaConversionEvent $event): ?Contact
    {
        if ($event->subject_type === Lead::class) {
            return Lead::query()->with('contact')->find($event->subject_id)?->contact;
        }

        if ($event->subject_type === Deal::class) {
            return Deal::query()->with('contact')->find($event->subject_id)?->contact;
        }

        return null;
    }

    protected function eventId(Workspace $workspace, string $crmEvent, string $subjectType, int $subjectId): string
    {
        return hash('sha256', $workspace->id.'|'.$crmEvent.'|'.$subjectType.'|'.$subjectId);
    }

    protected function hash(string $value): string
    {
        return hash('sha256', strtolower(trim($value)));
    }

    protected function fail(MetaConversionEvent $event, MetaConversionConfig $config, string $error): MetaConversionEvent
    {
        $event->forceFill([
            'status' => MetaConversionEvent::STATUS_FAILED,
            'attempts' => $event->attempts + 1,
            'failed_at' => now(),
            'error' => $error,
        ])->save();

        $config->forceFill([
            'last_failure_at' => now(),
            'failed_count' => $config->failed_count + 1,
        ])->save();

        Log::warning('meta.conversion.failed', [
            'workspace_id' => $event->workspace_id,
            'event_id' => $event->event_id,
        ]);

        return $event->refresh();
    }
}
