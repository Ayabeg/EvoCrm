<?php

namespace App\Jobs\LeadOs;

use App\Models\GraphRun;
use App\Models\Workspace;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

abstract class GraphNodeJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(
        public int $workspaceId,
        public int $graphRunId,
    ) {}

    abstract protected function key(): string;

    /**
     * @return class-string<GraphNodeJob>|null
     */
    abstract protected function next(): ?string;

    /**
     * @return array{status: string, counts: array<string, int>, error: string|null}
     */
    abstract protected function runNode(Workspace $workspace, GraphRun $run): array;

    public function handle(): void
    {
        $run = GraphRun::query()->find($this->graphRunId);
        $workspace = Workspace::query()->find($this->workspaceId);

        if (! $run instanceof GraphRun || ! $workspace instanceof Workspace) {
            return;
        }

        $run->recordNode($this->key(), GraphRun::NODE_PENDING);

        $failed = false;

        try {
            $result = $this->runNode($workspace, $run);
            $failed = ($result['status'] ?? GraphRun::NODE_FAILED) === GraphRun::NODE_FAILED;
            $run->recordNode(
                $this->key(),
                $result['status'] ?? GraphRun::NODE_FAILED,
                $result['counts'] ?? [],
                $result['error'] ?? null,
            );
        } catch (Throwable $e) {
            $failed = true;
            $run->recordNode($this->key(), GraphRun::NODE_FAILED, [], $e->getMessage());
        }

        if ($failed) {
            $run->refresh()->finish();

            return;
        }

        $next = $this->next();

        if ($next) {
            $next::dispatch($this->workspaceId, $this->graphRunId);

            return;
        }

        $run->refresh()->finish();
    }
}
