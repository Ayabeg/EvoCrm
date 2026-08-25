<?php

namespace App\Console\Commands;

use App\Mail\WorkspaceHtmlMail;
use App\Models\ScheduledReport;
use App\Services\Crm\ScheduledReportRenderer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class DeliverScheduledReports extends Command
{
    protected $signature = 'reports:deliver';

    protected $description = 'Send due scheduled report emails';

    public function handle(ScheduledReportRenderer $renderer): int
    {
        $due = ScheduledReport::query()
            ->where('active', true)
            ->with(['savedReport', 'dashboard', 'workspace'])
            ->get();

        $sent = 0;

        foreach ($due as $schedule) {
            $window = $renderer->dueWindow($schedule);
            $recipients = collect($schedule->recipients ?? [])->filter()->all();

            if ($recipients === []) {
                $schedule->forceFill([
                    'last_status' => 'failed',
                    'last_error' => 'No recipients configured.',
                    'last_window' => $window,
                ])->save();

                continue;
            }

            if ($schedule->last_window === $window && $schedule->last_status === 'sent') {
                continue;
            }

            try {
                $document = $renderer->render($schedule);

                foreach ($recipients as $email) {
                    Mail::to($email)->send(new WorkspaceHtmlMail(
                        subjectLine: $document['subject'],
                        htmlBody: $document['html'],
                    ));
                }

                $schedule->forceFill([
                    'last_sent_at' => now(),
                    'last_status' => 'sent',
                    'last_error' => null,
                    'last_window' => $window,
                ])->save();
                $sent++;
            } catch (Throwable $e) {
                $schedule->forceFill([
                    'last_status' => 'failed',
                    'last_error' => $e->getMessage(),
                    'last_window' => $window,
                ])->save();
            }
        }

        $this->info("reports:deliver — {$sent} schedules processed.");

        return self::SUCCESS;
    }
}
