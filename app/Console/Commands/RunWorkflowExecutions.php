<?php

namespace App\Console\Commands;

use App\Models\WorkflowExecution;
use App\Services\Crm\WorkflowExecutionRedactor;
use App\Services\Crm\WorkflowRunner;
use Illuminate\Console\Command;

class RunWorkflowExecutions extends Command
{
    protected $signature = 'workflow:run {--limit=100}';

    protected $description = 'Execute due delayed workflow actions';

    public function handle(WorkflowRunner $runner, WorkflowExecutionRedactor $redactor): int
    {
        $dueIds = WorkflowExecution::query()
            ->where('status', WorkflowExecution::STATUS_PENDING)
            ->where('run_at', '<=', now())
            ->orderBy('run_at')
            ->limit((int) $this->option('limit'))
            ->pluck('id');

        $completed = 0;

        foreach ($dueIds as $id) {
            $claimed = WorkflowExecution::query()
                ->whereKey($id)
                ->where('status', WorkflowExecution::STATUS_PENDING)
                ->update([
                    'status' => WorkflowExecution::STATUS_RUNNING,
                    'started_at' => now(),
                ]);

            if ($claimed === 0) {
                continue;
            }

            $execution = WorkflowExecution::query()
                ->with(['workflow', 'contact', 'deal', 'ticket'])
                ->find($id);

            if (! $execution instanceof WorkflowExecution) {
                continue;
            }

            $workflow = $execution->workflow;

            if (! $workflow || ! $workflow->active) {
                $execution->forceFill([
                    'status' => WorkflowExecution::STATUS_CANCELLED,
                    'finished_at' => now(),
                    'error_summary' => $workflow
                        ? 'Workflow was off when this delayed run became due.'
                        : 'Workflow was missing when this delayed run became due.',
                ])->save();

                continue;
            }

            $outcome = $runner->executeScheduled(
                $workflow,
                $execution->contact,
                $execution->deal,
                $execution->ticket,
            );

            $execution->forceFill($outcome->attributes($redactor))->save();

            if ($outcome->succeeded()) {
                $completed++;
            }
        }

        $this->info("workflow:run — {$completed} completed of {$dueIds->count()} due.");

        return self::SUCCESS;
    }
}
