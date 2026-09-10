<?php

namespace App\Console\Commands;

use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\SequenceStep;
use App\Services\Crm\ActivityRecorder;
use App\Services\Crm\WorkflowRunner;
use App\Services\Outbound\CampaignService;
use App\Services\Outbound\OutboundDispatcher;
use App\Services\Outbound\QuietHoursGuard;
use App\Services\Outbound\SuppressionService;
use Illuminate\Console\Command;

/**
 * Sends due sequence steps and due broadcast-campaign messages. Quiet hours
 * defer (never fail), suppression cancels the enrollment / fails the single
 * message, and a missing/disabled mailbox fails the message honestly in the
 * outbox. WhatsApp steps stay official-Cloud only.
 */
class RunOutboundSequences extends Command
{
    protected $signature = 'outbound:run {--limit=100}';

    protected $description = 'Dispatch due sequence steps and campaign messages (email + Algerian SMS + official WhatsApp Cloud)';

    public function handle(
        OutboundDispatcher $dispatcher,
        QuietHoursGuard $quietHours,
        SuppressionService $suppressions,
        CampaignService $campaigns,
        WorkflowRunner $workflows,
        ActivityRecorder $activities,
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

            $stepsForVariant = $sequence->steps
                ->when($enrollment->variant_key, fn ($steps) => $steps->where('variant_key', $enrollment->variant_key)->values());

            $step = $stepsForVariant->firstWhere('position', $enrollment->next_step);

            if (! $step) {
                $enrollment->forceFill(['status' => 'finished', 'next_run_at' => null])->save();

                continue;
            }

            if (in_array($step->step_type ?? 'email', ['call', 'meeting'], true)) {
                $activities->record($workspace, [
                    'type' => $step->step_type,
                    'subject' => $step->subject ?: ucfirst($step->step_type).' step · '.$sequence->name,
                    'body' => $step->body ?: ($step->meeting_url ? 'Meeting link: '.$step->meeting_url : null),
                    'due_at' => now(),
                    'contact_id' => $contact->id,
                    'company_id' => $contact->company_id,
                    'meta' => [
                        'sequence_id' => $sequence->id,
                        'enrollment_id' => $enrollment->id,
                        'step_id' => $step->id,
                        'meeting_url' => $step->meeting_url,
                    ],
                ]);

                $next = $stepsForVariant->firstWhere('position', $enrollment->next_step + 1);
                $wasFinished = $enrollment->status === 'finished';

                $enrollment->forceFill($next
                    ? [
                        'next_step' => $next->position,
                        'next_run_at' => now()->addHours($next->delay_hours),
                    ]
                    : [
                        'status' => 'finished',
                        'next_run_at' => null,
                    ])->save();

                if (! $wasFinished && $enrollment->status === 'finished') {
                    $workflows->handleEnrollmentFinished($enrollment);
                }

                $sent++;

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
                // A step can pin a mailbox; otherwise the workspace default.
                $mailbox = $step->mailbox_id
                    ? Mailbox::query()->forWorkspace($workspace)->where('enabled', true)->find($step->mailbox_id)
                    : null;
                $mailbox ??= Mailbox::query()
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

            $subject = $this->resolveAbSubject($step);

            $message = $dispatcher->sendSequenceStep($workspace, $sequence, $contact, [
                'channel' => $step->channel,
                'mailbox_id' => $mailbox?->id,
                'subject' => $subject,
                'body' => $this->mergeMeetingUrl($step->body, $step->meeting_url),
                'wa_template_name' => $step->wa_template_name,
                'wa_template_language' => $step->wa_template_language,
            ]);

            if ($message->status === 'sent' && $step->position === 1 && filled($step->subject_b)) {
                $this->trackAbSend($step, $subject);
            }

            if ($message->status === 'sent') {
                $next = $stepsForVariant->firstWhere('position', $enrollment->next_step + 1);

                $wasFinished = $enrollment->status === 'finished';

                $enrollment->forceFill($next
                    ? [
                        'next_step' => $next->position,
                        'next_run_at' => now()->addHours($next->delay_hours),
                    ]
                    : [
                        'status' => 'finished',
                        'next_run_at' => null,
                    ])->save();

                if (! $wasFinished && $enrollment->status === 'finished') {
                    $workflows->handleEnrollmentFinished($enrollment);
                }

                $sent++;
            } else {
                // Honest retry: the failure stays visible in the outbox.
                $enrollment->forceFill(['next_run_at' => now()->addHours(2)])->save();
                $failed++;
            }
        }

        $expanded = $campaigns->expandDue();
        $campaignTotals = $campaigns->sendDueMessages(max(1, (int) $this->option('limit') - $sent));

        $this->info(sprintf(
            'outbound:run — %d sent, %d deferred, %d failed/cancelled. Campaigns: %d expanded, %d sent, %d deferred, %d failed.',
            $sent,
            $deferred,
            $failed,
            $expanded,
            $campaignTotals['sent'],
            $campaignTotals['deferred'],
            $campaignTotals['failed'],
        ));

        return self::SUCCESS;
    }

    protected function resolveAbSubject(SequenceStep $step): ?string
    {
        if ($step->position !== 1 || ! filled($step->subject_b)) {
            return $step->subject;
        }

        $minSamples = 20;
        $total = (int) $step->ab_sent_a + (int) $step->ab_sent_b;

        if ($total >= $minSamples) {
            $rateA = $step->ab_sent_a > 0 ? $step->ab_open_a / $step->ab_sent_a : 0;
            $rateB = $step->ab_sent_b > 0 ? $step->ab_open_b / $step->ab_sent_b : 0;

            return $rateB > $rateA ? $step->subject_b : $step->subject;
        }

        return ((int) $step->ab_sent_a <= (int) $step->ab_sent_b) ? $step->subject : $step->subject_b;
    }

    protected function trackAbSend(SequenceStep $step, ?string $subject): void
    {
        if ($subject === $step->subject_b) {
            $step->increment('ab_sent_b');
        } else {
            $step->increment('ab_sent_a');
        }
    }

    protected function mergeMeetingUrl(?string $body, ?string $meetingUrl): ?string
    {
        if (! filled($meetingUrl)) {
            return $body;
        }

        $token = '{{meeting_url}}';
        $link = $meetingUrl;

        if ($body && str_contains($body, $token)) {
            return str_replace($token, $link, $body);
        }

        return trim(($body ?? '')."\n\n".$link);
    }
}
