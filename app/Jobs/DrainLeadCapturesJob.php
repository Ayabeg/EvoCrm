<?php

namespace App\Jobs;

use App\Services\Crm\LeadCaptureDrainer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DrainLeadCapturesJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 120;

    public function __construct(public int $limit = 100) {}

    public function handle(LeadCaptureDrainer $drainer): void
    {
        $drainer->drain($this->limit);
    }
}
