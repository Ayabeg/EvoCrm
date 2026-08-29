<?php

namespace App\Jobs\LeadOs;

use App\Models\GraphRun;
use App\Models\Workspace;
use App\Services\LeadOs\SiblingCommand;

class ScoreNode extends GraphNodeJob
{
    protected function key(): string
    {
        return 'score';
    }

    protected function next(): ?string
    {
        return DealHealthNode::class;
    }

    protected function runNode(Workspace $workspace, GraphRun $run): array
    {
        return app(SiblingCommand::class)->invoke('leads:score', [
            'workspace' => $workspace->id,
        ]);
    }
}
