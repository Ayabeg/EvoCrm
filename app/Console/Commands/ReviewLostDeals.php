<?php

namespace App\Console\Commands;

use App\Models\Workspace;
use App\Services\LeadOs\LostReview;
use Illuminate\Console\Command;

class ReviewLostDeals extends Command
{
    protected $signature = 'deals:lost-review {--workspace=}';

    protected $description = 'Draft Ask Evo loss reasons for deals lost in the last 7 days';

    public function handle(LostReview $review): int
    {
        $workspaceId = $this->option('workspace');
        $query = Workspace::query()->orderBy('id');

        if (filled($workspaceId)) {
            $query->whereKey((int) $workspaceId);
        }

        $deals = 0;

        $query->each(function (Workspace $workspace) use ($review, &$deals): void {
            $result = $review->run($workspace);
            $deals += (int) ($result['counts']['deals'] ?? 0);
        });

        $this->info("deals:lost-review — {$deals} draft".($deals === 1 ? '' : 's').'.');

        return self::SUCCESS;
    }
}
