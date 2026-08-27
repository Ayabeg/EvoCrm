<?php

namespace App\Jobs\LeadOs;

use App\Models\Deal;
use App\Models\GraphRun;
use App\Models\Workspace;
use App\Services\LeadOs\DealHealthScorer;
use App\Services\LeadOs\NextMoveAdvisor;

class NextMoveNode extends GraphNodeJob
{
    protected function key(): string
    {
        return 'next-move';
    }

    protected function next(): ?string
    {
        return null;
    }

    protected function runNode(Workspace $workspace, GraphRun $run): array
    {
        $advisor = app(NextMoveAdvisor::class);
        $deals = app(DealHealthScorer::class)->openDeals($workspace);
        $suggested = 0;

        foreach ($deals as $deal) {
            if (! $deal instanceof Deal) {
                continue;
            }

            $advisor->suggest($deal, $run);
            $suggested++;
        }

        return [
            'status' => 'ok',
            'counts' => ['deals' => $suggested],
            'error' => null,
        ];
    }
}
