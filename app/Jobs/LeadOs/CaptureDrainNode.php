<?php

namespace App\Jobs\LeadOs;

use App\Models\GraphRun;
use App\Models\Workspace;
use App\Services\LeadOs\SiblingCommand;

class CaptureDrainNode extends GraphNodeJob
{
    protected function key(): string
    {
        return 'capture-drain';
    }

    protected function next(): ?string
    {
        return EnrichNode::class;
    }

    protected function runNode(Workspace $workspace, GraphRun $run): array
    {
        return app(SiblingCommand::class)->invoke('leads:capture-drain', [
            '--workspace' => $workspace->id,
        ]);
    }
}
