<?php

namespace App\Console\Commands;

use App\Models\Workspace;
use App\Services\Outbound\MailboxSync;
use Illuminate\Console\Command;

class SyncMailStackMailboxes extends Command
{
    protected $signature = 'outbound:sync-mailboxes';

    protected $description = 'Sync mailboxes from the live mail stack API into every workspace';

    public function handle(MailboxSync $sync): int
    {
        if (! $sync->configured()) {
            $this->info('outbound:sync-mailboxes — EVOSALES_MAIL_API_TOKEN is not set; nothing to sync.');

            return self::SUCCESS;
        }

        foreach (Workspace::query()->select('id')->cursor() as $row) {
            $workspace = Workspace::query()->find($row->id);

            $result = $sync->sync($workspace);

            if (! $result['ok']) {
                $this->warn("Workspace {$workspace->id}: {$result['reason']}");

                continue;
            }

            $this->info(
                "Workspace {$workspace->id}: {$result['total']} on the stack — {$result['created']} created, {$result['updated']} updated."
            );
        }

        return self::SUCCESS;
    }
}
