<?php

namespace App\Observers;

use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\MetaConversionConfig;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Crm\WorkflowRunner;
use App\Services\Funnels\FunnelEventRecorder;
use App\Services\Meta\MetaConversionsService;

class DealObserver
{
    public function __construct(
        private WorkflowRunner $workflows,
        private FunnelEventRecorder $funnelEvents,
        private MetaConversionsService $conversions,
        private ProductAnalytics $analytics,
    ) {}

    public function created(Deal $deal): void
    {
        $deal->loadMissing(['stage', 'workspace']);
        $this->analytics->capture(ProductAnalytics::DEAL_CREATED, $this->dealProperties($deal), null, $deal->workspace);
        $this->workflows->handleDealCreated($deal);
        $this->funnelEvents->recordDealCreated($deal);
        $this->conversions->queueForDeal($deal, MetaConversionConfig::CRM_DEAL_CREATED);

        $deal->loadMissing('stage');

        if ($deal->stage?->is_won) {
            $this->analytics->capture(ProductAnalytics::DEAL_WON, $this->dealProperties($deal), null, $deal->workspace);
            $this->conversions->queueForDeal($deal, MetaConversionConfig::CRM_DEAL_WON);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function dealProperties(Deal $deal): array
    {
        return [
            'deal_id' => $deal->id,
            'stage' => $deal->stage?->slug,
            'amount_cents' => $deal->amount_cents,
            'currency' => $deal->currency,
            'source' => $deal->source,
        ];
    }

    public function updated(Deal $deal): void
    {
        if (! $deal->wasChanged('stage_id')) {
            return;
        }

        $deal->unsetRelation('stage')->load(['stage', 'workspace']);
        $this->analytics->capture(ProductAnalytics::DEAL_STAGE_CHANGED, $this->dealProperties($deal), null, $deal->workspace);

        if ($deal->stage?->is_won) {
            $this->analytics->capture(ProductAnalytics::DEAL_WON, $this->dealProperties($deal), null, $deal->workspace);
        }

        if ($deal->stage?->is_lost) {
            $this->analytics->capture(ProductAnalytics::DEAL_LOST, $this->dealProperties($deal), null, $deal->workspace);
        }

        $this->workflows->handleDealStageChanged($deal);

        $slug = $deal->stage?->slug;

        if ($slug === 'proposal') {
            $this->funnelEvents->recordDealStage($deal, FunnelEvent::TYPE_CONFIRMED);
        }

        if ($deal->stage?->is_won) {
            $this->funnelEvents->recordDealStage($deal, FunnelEvent::TYPE_DELIVERED);
            $this->conversions->queueForDeal($deal, MetaConversionConfig::CRM_DEAL_WON);
        }
    }
}
