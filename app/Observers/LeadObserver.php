<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\MetaConversionConfig;
use App\Services\Crm\WorkflowRunner;
use App\Services\Funnels\FunnelEventRecorder;
use App\Services\Meta\MetaConversionsService;

class LeadObserver
{
    public function __construct(
        private FunnelEventRecorder $recorder,
        private WorkflowRunner $workflows,
        private MetaConversionsService $conversions,
    ) {}

    public function created(Lead $lead): void
    {
        $this->recorder->recordLeadCreated($lead);
        $this->conversions->queueForLead($lead, MetaConversionConfig::CRM_LEAD_CREATED);
    }

    public function updated(Lead $lead): void
    {
        if (! $lead->wasChanged('qualified_at') || $lead->qualified_at === null) {
            return;
        }

        $this->workflows->handleLeadQualified($lead);
        $this->recorder->recordLeadQualified($lead);
        $this->conversions->queueForLead($lead, MetaConversionConfig::CRM_LEAD_QUALIFIED);
    }
}
