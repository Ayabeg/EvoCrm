<?php

namespace App\Console\Commands;

use App\Models\Workspace;
use App\Services\Outbound\ImapReplyPoller;
use Illuminate\Console\Command;

class PollImapReplies extends Command
{
    protected $signature = 'outbound:poll-replies';

    protected $description = 'Poll enabled mailboxes over IMAP for replies (requires ext-imap)';

    public function handle(ImapReplyPoller $poller): int
    {
        if (! function_exists('imap_open')) {
            $this->warn('PHP ext-imap is not installed — reply polling is off. Sends are unaffected.');

            return self::SUCCESS;
        }

        $total = 0;

        foreach (Workspace::query()->select('id')->cursor() as $row) {
            $workspace = Workspace::query()->find($row->id);

            foreach ($poller->poll($workspace) as $result) {
                $total += $result['replies'];

                if ($result['error']) {
                    $this->warn("{$result['mailbox']}: {$result['error']}");
                }
            }
        }

        $this->info("outbound:poll-replies — {$total} new replies.");

        return self::SUCCESS;
    }
}
