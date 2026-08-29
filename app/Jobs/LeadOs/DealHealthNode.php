<?php

namespace App\Jobs\LeadOs;

use App\Models\Deal;
use App\Models\GraphRun;
use App\Models\Workspace;
use App\Services\LeadOs\DealHealthScorer;

class DealHealthNode extends GraphNodeJob
{
    protected function key(): string
    {
        return 'deal-health';
    }

    protected function next(): ?string
    {
        return NextMoveNode::class;
    }

    protected function runNode(Workspace $workspace, GraphRun $run): array
    {
        $scorer = app(DealHealthScorer::class);
        $deals = $scorer->openDeals($workspace);
        $scored = 0;

        foreach ($deals as $deal) {
            if (! $deal instanceof Deal) {
                continue;
            }

            $computed = $scorer->withAskEvoReason($scorer->score($deal), $deal);
            $scorer->persist($workspace, $deal, $computed, $run);
            $scored++;
        }

        return [
            'status' => 'ok',
            'counts' => ['deals' => $scored],
            'error' => null,
        ];
    }
}
