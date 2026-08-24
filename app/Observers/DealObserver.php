<?php

namespace App\Observers;

use App\Models\Deal;
use App\Services\Crm\WorkflowRunner;

class DealObserver
{
    public function __construct(private WorkflowRunner $workflows) {}

    public function created(Deal $deal): void
    {
        $this->workflows->handleDealCreated($deal);
    }

    public function updated(Deal $deal): void
    {
        if (! $deal->wasChanged('stage_id')) {
            return;
        }

        $this->workflows->handleDealStageChanged($deal);
    }
}
