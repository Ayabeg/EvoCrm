<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Models\Workspace;
use App\Services\Crm\LeadScorer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ScoreWorkspaceLeads implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(
        public int $workspaceId,
        public ?int $leadId = null,
    ) {}

    public function handle(LeadScorer $scorer): int
    {
        $workspace = Workspace::query()->find($this->workspaceId);

        if (! $workspace instanceof Workspace) {
            return 0;
        }

        $query = Lead::query()
            ->forWorkspace($workspace)
            ->with(['contact.company', 'company', 'deal', 'latestScore']);

        if ($this->leadId) {
            $query->whereKey($this->leadId);
        }

        $scored = 0;

        foreach ($query->orderBy('id')->cursor() as $lead) {
            $scorer->score($lead);
            $scored++;
        }

        return $scored;
    }
}
