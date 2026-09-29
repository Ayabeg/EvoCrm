<?php

namespace App\Console\Commands;

use App\Services\Operations\SchedulerHeartbeat;
use Illuminate\Console\Command;

class RecordSchedulerHeartbeat extends Command
{
    protected $signature = 'schedule:heartbeat';

    protected $description = 'Record that the Laravel scheduler process is alive';

    public function handle(SchedulerHeartbeat $heartbeat): int
    {
        $at = $heartbeat->beat();

        $this->info('schedule:heartbeat recorded '.$at);

        return self::SUCCESS;
    }
}
