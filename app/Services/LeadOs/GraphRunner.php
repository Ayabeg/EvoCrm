<?php

namespace App\Services\LeadOs;

use App\Jobs\LeadOs\CaptureDrainNode;
use App\Models\GraphRun;
use App\Models\Workspace;

class GraphRunner
{
    public function start(Workspace $workspace, string $triggeredBy = 'nightly'): GraphRun
    {
        $run = GraphRun::query()->create([
            'workspace_id' => $workspace->id,
            'triggered_by' => $triggeredBy,
            'status' => GraphRun::STATUS_PENDING,
            'nodes' => collect(GraphRun::NODES)->map(fn (string $key) => [
                'key' => $key,
                'status' => GraphRun::NODE_PENDING,
                'counts' => [],
                'error' => null,
            ])->all(),
        ]);

        $run->markRunning();
        CaptureDrainNode::dispatch($workspace->id, $run->id);

        return $run->fresh();
    }

    public function latest(Workspace $workspace): ?GraphRun
    {
        return GraphRun::query()
            ->forWorkspace($workspace)
            ->latest('id')
            ->first();
    }
}
