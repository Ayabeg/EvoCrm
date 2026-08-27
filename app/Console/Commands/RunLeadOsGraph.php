<?php

namespace App\Console\Commands;

use App\Models\Workspace;
use App\Services\LeadOs\GraphRunner;
use Illuminate\Console\Command;

class RunLeadOsGraph extends Command
{
    protected $signature = 'lead-os:graph {--workspace=} {--triggered-by=nightly}';

    protected $description = 'Run the nightly Lead OS worker graph for one or all workspaces';

    public function handle(GraphRunner $runner): int
    {
        $workspaceId = $this->option('workspace');
        $triggeredBy = (string) ($this->option('triggered-by') ?: 'nightly');
        $query = Workspace::query()->orderBy('id');

        if (filled($workspaceId)) {
            $query->whereKey((int) $workspaceId);
        }

        $ran = 0;

        $query->each(function (Workspace $workspace) use ($runner, $triggeredBy, &$ran): void {
            $runner->start($workspace, $triggeredBy);
            $ran++;
        });

        $this->info("lead-os:graph — {$ran} workspace".($ran === 1 ? '' : 's')." queued ({$triggeredBy}).");

        return self::SUCCESS;
    }
}
