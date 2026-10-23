<?php

namespace App\Jobs;

use App\Models\BulkActionRun;
use App\Services\Crm\BulkActionRunner;
use App\Services\Crm\WorkflowExecutionRedactor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

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

    public function failed(?Throwable $exception): void
    {
        BulkActionRun::query()
            ->whereKey($this->runId)
            ->whereNotIn('status', [BulkActionRun::STATUS_COMPLETED, BulkActionRun::STATUS_FAILED])
            ->update([
                'status' => BulkActionRun::STATUS_FAILED,
                'error_summary' => mb_substr(
                    app(WorkflowExecutionRedactor::class)->redactError(
                        $exception?->getMessage() ?: 'Bulk action worker failed.',
                    ),
                    0,
                    500,
                ),
            ]);
    }
}
