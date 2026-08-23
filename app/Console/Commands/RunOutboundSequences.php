<?php

namespace App\Console\Commands;

use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Services\Outbound\OutboundDispatcher;
use App\Services\Outbound\QuietHoursGuard;
use App\Services\Outbound\SuppressionService;
use Illuminate\Console\Command;

/**
 * Sends due sequence steps. Quiet hours defer (never fail), suppression
 * cancels the enrollment, and a missing/disabled mailbox fails the message
 * honestly in the outbox. WhatsApp steps stay official-Cloud only.
 */
class RunOutboundSequences extends Command
{
    protected $signature = 'outbound:run {--limit=100}';

    protected $description = 'Dispatch due sequence steps (email + official WhatsApp Cloud)';

    public function handle(
        OutboundDispatcher $dispatcher,
        QuietHoursGuard $quietHours,
        SuppressionService $suppressions,
    ): int {
        $due = Enrollment::query()
            ->where('status', 'active')
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', now())
            ->with(['sequence.steps', 'contact.company', 'workspace'])
            ->limit((int) $this->option('limit'))
            ->get();

        $sent = 0;
        $deferred = 0;
        $failed = 0;

        foreach ($due as $enrollment) {
            $sequence = $enrollment->sequence;
            $contact = $enrollment->contact;
            $workspace = $enrollment->workspace;

            if (! $sequence || ! $contact || ! $workspace) {
                continue;
            }

            if (! $sequence->active) {
                continue;
            }

            $step = $sequence->steps->firstWhere('position', $enrollment->next_step);

            if (! $step) {
                $enrollment->forceFill(['status' => 'finished', 'next_run_at' => null])->save();

                continue;
            }

            if ($suppressions->isSuppressed($workspace, $contact->email, $contact->phone_e164)) {
                $enrollment->forceFill(['status' => 'cancelled', 'next_run_at' => null])->save();
                $failed++;

                continue;
            }

            if ($quietHours->blocks($workspace)) {
                $hours = $workspace->activeQuietHours();
                $enrollment->forceFill([
                    'next_run_at' => $hours ? $hours->nextAllowedAt() : now()->addHour(),
                ])->save();
                $deferred++;

                continue;
            }

            $mailbox = null;
            if ($step->channel === 'email') {
                $mailbox = Mailbox::query()
                    ->forWorkspace($workspace)
                    ->where('enabled', true)
                    ->orderByDesc('is_default')
                    ->first();

                if ($mailbox && $mailbox->overDailyLimit()) {
                    $enrollment->forceFill(['next_run_at' => now()->addHour()])->save();
                    $deferred++;

                    continue;
                }
            }

            $message = $dispatcher->sendSequenceStep($workspace, $sequence, $contact, [
                'channel' => $step->channel,
                'mailbox_id' => $mailbox?->id,
                'subject' => $step->subject,
                'body' => $step->body,
                'wa_template_name' => $step->wa_template_name,
                'wa_template_language' => $step->wa_template_language,
            ]);

            if ($message->status === 'sent') {
                $next = $sequence->steps->firstWhere('position', $enrollment->next_step + 1);

                $enrollment->forceFill($next
                    ? [
                        'next_step' => $next->position,
                        'next_run_at' => now()->addHours($next->delay_hours),
                    ]
                    : [
                        'status' => 'finished',
                        'next_run_at' => null,
                    ])->save();
                $sent++;
            } else {
                // Honest retry: the failure stays visible in the outbox.
                $enrollment->forceFill(['next_run_at' => now()->addHours(2)])->save();
                $failed++;
            }
        }

        $this->info("outbound:run — {$sent} sent, {$deferred} deferred, {$failed} failed/cancelled.");

        return self::SUCCESS;
    }
}
