<?php

namespace App\Jobs;

use App\Models\MetaWebhookEvent;
use App\Models\Workspace;
use App\Services\Ads\LeadFormIngestor;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Meta\MetaLeadAdsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class ProcessMetaWebhookEvent implements ShouldQueue
{
    use Queueable;

    private const PROCESSING_LEASE_MINUTES = 2;

    public int $tries = 5;

    public int $timeout = 60;

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [10, 30, 60, 120];
    }

    public function __construct(public int $eventId) {}

    public function handle(LeadFormIngestor $ingestor, MetaLeadAdsService $leads, ProductAnalytics $analytics): void
    {
        $event = DB::transaction(function (): ?MetaWebhookEvent {
            $event = MetaWebhookEvent::query()
                ->with('workspace')
                ->whereKey($this->eventId)
                ->lockForUpdate()
                ->first();

            if (! $event || $event->isProcessed()) {
                return null;
            }

            if ($event->status === MetaWebhookEvent::STATUS_PROCESSING
                && $event->updated_at?->gt(now()->subMinutes(self::PROCESSING_LEASE_MINUTES))) {
                return null;
            }

            $event->forceFill([
                'status' => MetaWebhookEvent::STATUS_PROCESSING,
                'attempts' => $event->attempts + 1,
            ])->save();

            return $event;
        });

        if (! $event) {
            return;
        }

        try {
            $payload = is_array($event->payload) ? $event->payload : [];
            $workspace = $event->workspace;

            if (! $workspace instanceof Workspace) {
                throw new RuntimeException('Webhook event has no workspace.');
            }

            if (! isset($payload['fields']) && ! isset($payload['field_data']) && filled($payload['leadgen_id'] ?? null)) {
                $retrieved = $leads->retrieveLead($workspace, (string) $payload['leadgen_id']);
                $payload = array_merge($payload, $leads->normalizeLeadRow($retrieved));
            }

            $ingestor->ingest($workspace, $payload);

            $analytics->capture(ProductAnalytics::META_LEAD_RECEIVED, [
                'provider_event_id' => $event->provider_event_id,
                'leadgen_id' => $payload['leadgen_id'] ?? null,
                'form_id' => $payload['form_id'] ?? null,
            ], null, $workspace);

            $event->forceFill([
                'status' => MetaWebhookEvent::STATUS_PROCESSED,
                'processed_at' => now(),
                'failed_at' => null,
                'error' => null,
            ])->save();

            Log::info('meta.webhook.processed', [
                'workspace_id' => $event->workspace_id,
                'provider_event_id' => $event->provider_event_id,
            ]);
        } catch (Throwable $exception) {
            $event->forceFill([
                'status' => MetaWebhookEvent::STATUS_FAILED,
                'failed_at' => now(),
                'error' => mb_substr($exception->getMessage(), 0, 500),
            ])->save();

            Log::warning('meta.webhook.failed', [
                'workspace_id' => $event->workspace_id,
                'provider_event_id' => $event->provider_event_id,
            ]);

            throw $exception;
        }
    }
}
