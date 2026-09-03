<?php

namespace App\Observers;

use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Models\MetaConversionConfig;
use App\Services\Crm\WorkflowRunner;
use App\Services\Funnels\FunnelEventRecorder;
use App\Services\Meta\MetaConversionsService;

class DealObserver
{
    public function __construct(
        private WorkflowRunner $workflows,
        private FunnelEventRecorder $funnelEvents,
        private MetaConversionsService $conversions,
    ) {}

    public function created(Deal $deal): void
    {
        $this->workflows->handleDealCreated($deal);
        $this->funnelEvents->recordDealCreated($deal);
        $this->conversions->queueForDeal($deal, MetaConversionConfig::CRM_DEAL_CREATED);

        $deal->loadMissing('stage');

        if ($deal->stage?->is_won) {
            $this->conversions->queueForDeal($deal, MetaConversionConfig::CRM_DEAL_WON);
        }
    }

    public function updated(Deal $deal): void
    {
        if (! $deal->wasChanged('stage_id')) {
            return;
        }

        $deal->unsetRelation('stage')->load('stage');
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
