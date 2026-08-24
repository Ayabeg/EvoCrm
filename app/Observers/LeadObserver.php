<?php

namespace App\Observers;

use App\Models\Lead;
use App\Services\Funnels\FunnelEventRecorder;

class LeadObserver
{
    public function __construct(private FunnelEventRecorder $recorder) {}

    public function created(Lead $lead): void
    {
        $this->recorder->recordLeadCreated($lead);
    }
}
