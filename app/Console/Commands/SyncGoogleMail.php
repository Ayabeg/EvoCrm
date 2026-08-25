<?php

namespace App\Console\Commands;

use App\Models\Workspace;
use App\Services\Connectors\GoogleMailSync;
use Illuminate\Console\Command;

class SyncGoogleMail extends Command
{
    protected $signature = 'google:sync-mail';

    protected $description = 'Incrementally import Gmail metadata into CRM timelines';

    public function handle(GoogleMailSync $sync): int
    {
        $imported = 0;

        Workspace::query()->orderBy('id')->each(function (Workspace $workspace) use ($sync, &$imported): void {
            $result = $sync->sync($workspace);
            $imported += (int) ($result['imported'] ?? 0);
        });

        $this->info("google:sync-mail — {$imported} messages imported.");

        return self::SUCCESS;
    }
}
