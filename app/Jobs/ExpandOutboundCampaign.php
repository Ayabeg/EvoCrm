<?php

namespace App\Jobs;

use App\Models\OutboundCampaign;
use App\Services\Crm\WorkflowExecutionRedactor;
use App\Services\Outbound\CampaignService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class ExpandOutboundCampaign implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $uniqueFor = 3600;

    public int $timeout = 120;

    /** @var list<int> */
    public array $backoff = [30, 120];

    public function __construct(
        public int $campaignId,
        public ?int $cursor = null,
    ) {}

    public function uniqueId(): string
    {
        return 'outbound-campaign-expansion:'.$this->campaignId.':'.($this->cursor ?? 'start');
    }

    public function handle(CampaignService $campaigns): void
    {
        $campaign = OutboundCampaign::query()->find($this->campaignId);

        if (! $campaign || $campaign->status !== OutboundCampaign::STATUS_EXPANDING) {
            return;
        }

        if ($this->cursor !== null && (int) $campaign->expansion_cursor !== $this->cursor) {
            return;
        }

        if ($campaigns->expandChunk($campaign)) {
            self::dispatch($this->campaignId, (int) $campaign->refresh()->expansion_cursor);
        }
    }

    public function failed(?Throwable $exception): void
    {
        OutboundCampaign::query()
            ->whereKey($this->campaignId)
            ->where('status', OutboundCampaign::STATUS_EXPANDING)
            ->update([
                'status' => OutboundCampaign::STATUS_CANCELLED,
                'expansion_error' => app(WorkflowExecutionRedactor::class)->redactError(
                    $exception?->getMessage() ?: 'Campaign expansion worker failed.',
                ),
            ]);
    }
}
