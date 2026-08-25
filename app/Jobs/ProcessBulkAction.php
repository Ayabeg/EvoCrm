<?php

namespace App\Jobs;

use App\Models\BulkActionRun;
use App\Services\Crm\BulkActionRunner;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessBulkAction implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(public int $runId) {}

    public function handle(BulkActionRunner $runner): void
    {
        $run = BulkActionRun::query()->find($this->runId);

        if ($run) {
            $runner->process($run);
        }
    }
}
