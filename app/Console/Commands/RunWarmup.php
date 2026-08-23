<?php

namespace App\Console\Commands;

use App\Models\Mailbox;
use App\Models\Workspace;
use App\Services\Outbound\WarmupPlanner;
use Illuminate\Console\Command;

/**
 * The daily warmup tick (Africa/Algiers): advance every warming mailbox one
 * plan day and write its new daily_limit, then send the optional peer pings
 * between the workspace's own enabled non-system mailboxes. Disabled and
 * non-warming boxes are skipped; quiet hours still apply to the pings.
 */
class RunWarmup extends Command
{
    protected $signature = 'outbound:warmup';

    protected $description = 'Advance mailbox warmup plans and send optional peer pings between workspace mailboxes';

    public function handle(WarmupPlanner $planner): int
    {
        $advanced = 0;

        Mailbox::query()
            ->where('enabled', true)
            ->where('status', 'warming')
            ->chunkById(100, function ($mailboxes) use ($planner, &$advanced): void {
                foreach ($mailboxes as $mailbox) {
                    if ($planner->advance($mailbox)) {
                        $advanced++;
                    }
                }
            });

        $pings = 0;

        Workspace::query()
            ->whereHas('mailboxes', fn ($query) => $query
                ->where('enabled', true)
                ->where('warmup_peers', true))
            ->get()
            ->each(function (Workspace $workspace) use ($planner, &$pings): void {
                $pings += $planner->sendPeerPings($workspace);
            });

        $this->info(sprintf(
            'outbound:warmup — %d plans advanced, %d peer pings sent.',
            $advanced,
            $pings,
        ));

        return self::SUCCESS;
    }
}
