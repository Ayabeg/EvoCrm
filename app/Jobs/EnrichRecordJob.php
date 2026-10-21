<?php

namespace App\Jobs;

use App\Models\Workspace;
use App\Services\Enrichment\EnrichmentService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EnrichRecordJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $uniqueFor = 3600;

    public int $timeout = 60;

    /** @var list<int> */
    public array $backoff = [30, 120];

    public function __construct(
        public int $workspaceId,
        public string $targetType,
        public int $targetId,
    ) {}

    public function uniqueId(): string
    {
        return implode(':', [$this->workspaceId, $this->targetType, $this->targetId]);
    }

    public function handle(EnrichmentService $enrichment): void
    {
        $workspace = Workspace::query()->find($this->workspaceId);

        if (! $workspace) {
            return;
        }

        $enrichment->enrich($workspace, $this->targetType, $this->targetId);
    }
}
