<?php

namespace App\Console\Commands;

use App\Models\Integration;
use App\Models\MetaSyncRun;
use App\Models\Workspace;
use App\Services\Meta\MetaSyncService;
use Illuminate\Console\Command;

class SyncMetaWorkspaces extends Command
{
    protected $signature = 'meta:sync {--kind=ads}';

    protected $description = 'Incrementally sync Meta ads, lead forms, or historical leads for connected workspaces';

    public function handle(MetaSyncService $sync): int
    {
        $kind = (string) $this->option('kind');
        $synced = 0;

        Workspace::query()->orderBy('id')->each(function (Workspace $workspace) use ($sync, $kind, &$synced): void {
            $integration = $workspace->integration(Integration::PROVIDER_META);

            if (! $integration?->isConnected()) {
                return;
            }

            $result = $sync->run($workspace, $kind, MetaSyncRun::MODE_SCHEDULED);
            if ($result['ok']) {
                $synced++;
            }
        });

        $this->info("meta:sync — {$synced} workspace(s) synced.");

        return self::SUCCESS;
    }
}
