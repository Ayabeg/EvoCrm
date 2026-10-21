<?php

namespace App\Jobs;

use App\Models\Workspace;
use App\Services\Enrichment\EnrichmentService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Queue\Middleware\WithoutOverlapping;

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

    /**
     * Keep provider traffic bounded per workspace and prevent a duplicate
     * dispatch from running against the same record concurrently.
     *
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            (new RateLimited('enrichment'))->releaseAfter(60),
            (new WithoutOverlapping($this->uniqueId()))->releaseAfter(30)->expireAfter($this->timeout + 30),
        ];
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
