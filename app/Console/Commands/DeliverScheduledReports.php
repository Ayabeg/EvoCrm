<?php

namespace App\Console\Commands;

use App\Models\ScheduledReport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class DeliverScheduledReports extends Command
{
    protected $signature = 'reports:deliver';

    protected $description = 'Send due scheduled report emails';

    public function handle(): int
    {
        $due = ScheduledReport::query()
            ->where('active', true)
            ->where(function ($query) {
                $query->whereNull('last_sent_at')
                    ->orWhere('last_sent_at', '<', now()->subDay());
            })
            ->get();

        $sent = 0;

        foreach ($due as $schedule) {
            $recipients = collect($schedule->recipients ?? [])->filter()->all();

            if ($recipients === []) {
                continue;
            }

            foreach ($recipients as $email) {
                Mail::raw(
                    'Your EvoSales scheduled report is ready. View dashboards at your CRM reports page.',
                    fn ($message) => $message->to($email)->subject('EvoSales scheduled report')
                );
            }

            $schedule->forceFill(['last_sent_at' => now()])->save();
            $sent++;
        }

        $this->info("reports:deliver — {$sent} schedules processed.");

        return self::SUCCESS;
    }
}
