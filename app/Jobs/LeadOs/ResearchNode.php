<?php

namespace App\Jobs\LeadOs;

use App\Models\GraphRun;
use App\Models\Workspace;
use App\Services\LeadOs\ResearchBrief;

class ResearchNode extends GraphNodeJob
{
    protected function key(): string
    {
        return 'research';
    }

    protected function next(): ?string
    {
        return ScoreNode::class;
    }

    protected function runNode(Workspace $workspace, GraphRun $run): array
    {
        return app(ResearchBrief::class)->run($workspace);
    }
}
