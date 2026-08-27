<?php

namespace App\Observers;

use App\Models\Lead;
use App\Services\Crm\WorkflowRunner;
use App\Services\Funnels\FunnelEventRecorder;

class LeadObserver
{
    public function __construct(
        private FunnelEventRecorder $recorder,
        private WorkflowRunner $workflows,
    ) {}

    public function created(Lead $lead): void
    {
        $this->recorder->recordLeadCreated($lead);
    }

    public function updated(Lead $lead): void
    {
        if (! $lead->wasChanged('qualified_at') || $lead->qualified_at === null) {
            return;
        }

        $this->workflows->handleLeadQualified($lead);
    }
}
