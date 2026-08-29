<?php

namespace App\Jobs\LeadOs;

use App\Models\GraphRun;
use App\Models\Workspace;
use App\Services\LeadOs\SiblingCommand;

class EnrichNode extends GraphNodeJob
{
    protected function key(): string
    {
        return 'enrich';
    }

    protected function next(): ?string
    {
        return ResearchNode::class;
    }

    protected function runNode(Workspace $workspace, GraphRun $run): array
    {
        return app(SiblingCommand::class)->invoke('leads:enrich', [
            '--workspace' => $workspace->id,
        ]);
    }
}
