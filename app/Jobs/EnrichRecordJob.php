<?php

namespace App\Jobs;

use App\Models\Workspace;
use App\Services\Enrichment\EnrichmentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EnrichRecordJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 60;

    public function __construct(
        public int $workspaceId,
        public string $targetType,
        public int $targetId,
    ) {}

    public function handle(EnrichmentService $enrichment): void
    {
        $workspace = Workspace::query()->find($this->workspaceId);

        if (! $workspace) {
            return;
        }

        $enrichment->enrich($workspace, $this->targetType, $this->targetId);
    }
}
