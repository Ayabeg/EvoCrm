<?php

namespace App\Observers;

use App\Models\Deal;
use App\Models\FunnelEvent;
use App\Services\Crm\WorkflowRunner;
use App\Services\Funnels\FunnelEventRecorder;

class DealObserver
{
    public function __construct(
        private WorkflowRunner $workflows,
        private FunnelEventRecorder $funnelEvents,
    ) {}

    public function created(Deal $deal): void
    {
        $this->workflows->handleDealCreated($deal);
        $this->funnelEvents->recordDealCreated($deal);
    }

    public function updated(Deal $deal): void
    {
        if (! $deal->wasChanged('stage_id')) {
            return;
        }

        $this->workflows->handleDealStageChanged($deal);

        $deal->loadMissing('stage');
        $slug = $deal->stage?->slug;

        if ($slug === 'proposal') {
            $this->funnelEvents->recordDealStage($deal, FunnelEvent::TYPE_CONFIRMED);
        }

        if ($deal->stage?->is_won) {
            $this->funnelEvents->recordDealStage($deal, FunnelEvent::TYPE_DELIVERED);
        }
    }
}
