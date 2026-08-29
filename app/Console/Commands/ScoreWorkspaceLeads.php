<?php

namespace App\Console\Commands;

use App\Jobs\ScoreWorkspaceLeads as ScoreWorkspaceLeadsJob;
use App\Models\Workspace;
use App\Services\Crm\LeadScorer;
use Illuminate\Console\Command;

class ScoreWorkspaceLeads extends Command
{
    protected $signature = 'leads:score
        {workspace? : Workspace id. Omit to score every workspace.}
        {--lead= : Score a single lead id inside the workspace}
        {--queue : Dispatch the job instead of scoring inline}';

    protected $description = 'Recompute formula lead scores (0–100) and apply qualify / convert / hold thresholds';

    public function handle(): int
    {
        $workspaceId = $this->argument('workspace');
        $leadId = $this->option('lead') !== null && $this->option('lead') !== ''
            ? (int) $this->option('lead')
            : null;

        $ids = $workspaceId !== null && $workspaceId !== ''
            ? [(int) $workspaceId]
            : Workspace::query()->orderBy('id')->pluck('id')->all();

        $total = 0;

        foreach ($ids as $id) {
            $job = new ScoreWorkspaceLeadsJob((int) $id, $leadId);

            if ($this->option('queue')) {
                dispatch($job);
                $this->info("leads:score — queued workspace {$id}");

                continue;
            }

            $scored = $job->handle(app(LeadScorer::class));
            $total += $scored;
            $this->info("leads:score — {$scored} lead(s) in workspace {$id}");
        }

        if (! $this->option('queue')) {
            $this->info("leads:score — {$total} lead(s) scored.");
        }

        return self::SUCCESS;
    }
}
