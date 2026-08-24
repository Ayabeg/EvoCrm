<?php

namespace App\Console\Commands;

use App\Models\WorkflowExecution;
use App\Services\Crm\WorkflowRunner;
use Illuminate\Console\Command;

class RunWorkflowExecutions extends Command
{
    protected $signature = 'workflow:run {--limit=100}';

    protected $description = 'Execute due delayed workflow actions';

    public function handle(WorkflowRunner $runner): int
    {
        $due = WorkflowExecution::query()
            ->where('status', WorkflowExecution::STATUS_PENDING)
            ->where('run_at', '<=', now())
            ->with(['workflow', 'contact', 'deal'])
            ->limit((int) $this->option('limit'))
            ->get();

        $completed = 0;

        foreach ($due as $execution) {
            $workflow = $execution->workflow;

            if (! $workflow || ! $workflow->active) {
                $execution->forceFill(['status' => WorkflowExecution::STATUS_CANCELLED])->save();

                continue;
            }

            try {
                $runner->executeScheduled($workflow, $execution->contact, $execution->deal);
                $execution->forceFill(['status' => WorkflowExecution::STATUS_COMPLETED])->save();
                $completed++;
            } catch (\Throwable) {
                $execution->forceFill(['status' => WorkflowExecution::STATUS_CANCELLED])->save();
            }
        }

        $this->info("workflow:run — {$completed} completed of {$due->count()} due.");

        return self::SUCCESS;
    }
}
