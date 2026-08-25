<?php

namespace App\Console\Commands;

use App\Models\Workspace;
use App\Services\Connectors\GoogleCalendarSync;
use Illuminate\Console\Command;

class SyncGoogleCalendar extends Command
{
    protected $signature = 'google:sync-calendar';

    protected $description = 'Incrementally import Google Calendar events into CRM meetings';

    public function handle(GoogleCalendarSync $sync): int
    {
        $imported = 0;

        Workspace::query()->orderBy('id')->each(function (Workspace $workspace) use ($sync, &$imported): void {
            $result = $sync->sync($workspace);
            $imported += (int) ($result['imported'] ?? 0);
        });

        $this->info("google:sync-calendar — {$imported} events imported.");

        return self::SUCCESS;
    }
}
