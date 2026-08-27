<?php

namespace App\Console\Commands;

use App\Services\Crm\LeadCaptureDrainer;
use Illuminate\Console\Command;

class DrainLeadCaptures extends Command
{
    protected $signature = 'leads:capture-drain {--limit=100}';

    protected $description = 'Process pending lead_captures into existing Lead records (dedupe by phone or email)';

    public function handle(LeadCaptureDrainer $drainer): int
    {
        $processed = $drainer->drain((int) $this->option('limit'));

        $this->info("leads:capture-drain — {$processed} pending capture(s) processed.");

        return self::SUCCESS;
    }
}
