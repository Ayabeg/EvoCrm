<?php

namespace App\Console\Commands;

use App\Services\Meetings\MeetingLifecycle;
use Illuminate\Console\Command;

class NudgeMeetings extends Command
{
    protected $signature = 'meetings:nudge {--limit=200}';

    protected $description = 'Send 24h meeting reminders and mark ended slots as no-show';

    public function handle(MeetingLifecycle $lifecycle): int
    {
        $limit = (int) $this->option('limit');
        $reminded = $lifecycle->remindUpcoming($limit);
        $closed = $lifecycle->closeNoShows($limit);

        $this->info("meetings:nudge — {$reminded} reminded, {$closed} no-show.");

        return self::SUCCESS;
    }
}
