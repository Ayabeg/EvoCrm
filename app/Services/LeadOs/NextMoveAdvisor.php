<?php

namespace App\Services\LeadOs;

use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealHealthSnapshot;
use App\Models\DealSuggestion;
use App\Models\GraphRun;
use App\Models\Stage;
use App\Models\Workspace;
use App\Services\Crm\ActivityRecorder;

/**
 * Exactly one CTA per open deal. Mid-confidence or ambiguous stays
 * for a human. Never auto-sends email or WhatsApp Cloud.
 */
class NextMoveAdvisor
{
    public function __construct(
        private DealHealthScorer $health,
        private ActivityRecorder $activities,
    ) {}

    public function suggest(Deal $deal, ?GraphRun $run = null): DealSuggestion
    {
        $deal->loadMissing(['contact', 'stage', 'pipeline.stages']);

        $computed = $this->decide($deal);

        DealSuggestion::query()
            ->where('deal_id', $deal->id)
            ->where('kind', DealSuggestion::KIND_NEXT_MOVE)
            ->where('status', DealSuggestion::STATUS_PENDING)
            ->update([
                'status' => DealSuggestion::STATUS_DISMISSED,
                'dismissed_at' => now(),
            ]);

        return DealSuggestion::query()->create([
            'workspace_id' => $deal->workspace_id,
            'deal_id' => $deal->id,
            'graph_run_id' => $run?->id,
            'kind' => DealSuggestion::KIND_NEXT_MOVE,
            'action' => $computed['action'],
            'confidence' => $computed['confidence'],
            'status' => DealSuggestion::STATUS_PENDING,
            'title' => $computed['title'],
            'body' => $computed['body'],
            'payload' => $computed['payload'],
        ]);
    }

    /**
     * @return array{action: string, confidence: string, title: string, body: string, payload: array<string, mixed>}
     */
    public function decide(Deal $deal): array
    {
        $snapshot = $this->health->latestFor($deal);
        $band = $snapshot?->band;
        $contact = $deal->contact instanceof Contact ? $deal->contact : null;
        $phone = filled($contact?->phone_e164 ?: $contact?->phone);
        $email = filled($contact?->email);
        $days = $deal->last_activity_at
            ? (int) $deal->last_activity_at->diffInDays(now())
            : null;
        $nextStage = $this->nextOpenStage($deal);
        $signals = 0;

        if ($days === null || $days > 7) {
            $signals++;
        }
        if ($band === DealHealthSnapshot::BAND_STALLED) {
            $signals++;
        }
        if ((int) $deal->amount_cents <= 0) {
            $signals++;
        }

        if ($signals >= 2 && $phone && $email) {
            return [
                'action' => DealSuggestion::ACTION_LEAVE_FOR_HUMAN,
                'confidence' => DealSuggestion::CONFIDENCE_MID,
                'title' => 'Leave for a human',
                'body' => 'Signals are mixed — pick the channel yourself. Evo will not auto-send.',
                'payload' => ['auto_send' => false],
            ];
        }

        if ($band === DealHealthSnapshot::BAND_STALLED && $days !== null && $days >= 21) {
            return [
                'action' => DealSuggestion::ACTION_CLOSE,
                'confidence' => DealSuggestion::CONFIDENCE_MID,
                'title' => 'Close or recycle',
                'body' => 'Quiet for '.$days.' days. A human should close or reopen — nothing is sent.',
                'payload' => ['auto_send' => false],
            ];
        }

        if ($nextStage && $band === DealHealthSnapshot::BAND_HEALTHY && $days !== null && $days <= 3 && (int) $deal->amount_cents > 0) {
            return [
                'action' => DealSuggestion::ACTION_ADVANCE,
                'confidence' => DealSuggestion::CONFIDENCE_HIGH,
                'title' => 'Advance to '.$nextStage->name,
                'body' => 'Recent activity and a set amount. Apply only if the buyer actually moved.',
                'payload' => ['stage_id' => $nextStage->id, 'auto_send' => false],
            ];
        }

        if ($phone && ($days === null || $days >= 7)) {
            $whatsappReady = $this->looksLikeAlgerianMobile($contact?->phone_e164 ?: $contact?->phone);

            if ($whatsappReady && $days !== null && $days >= 10) {
                return [
                    'action' => DealSuggestion::ACTION_WHATSAPP,
                    'confidence' => DealSuggestion::CONFIDENCE_MID,
                    'title' => 'WhatsApp Cloud template',
                    'body' => 'Suggest an official Cloud template. A human must send it — Evo never auto-sends WhatsApp.',
                    'payload' => ['channel' => 'whatsapp_cloud', 'auto_send' => false],
                ];
            }

            return [
                'action' => DealSuggestion::ACTION_CALL,
                'confidence' => DealSuggestion::CONFIDENCE_HIGH,
                'title' => 'Call '.$contact->displayName(),
                'body' => $days === null
                    ? 'No activity yet. Start with a +213 call.'
                    : 'Quiet for '.$days.' days. Call before writing.',
                'payload' => ['auto_send' => false],
            ];
        }

        if ($email) {
            return [
                'action' => DealSuggestion::ACTION_EMAIL,
                'confidence' => DealSuggestion::CONFIDENCE_MID,
                'title' => 'Draft a follow-up email',
                'body' => 'A human applies the draft. Evo does not send mail.',
                'payload' => ['auto_send' => false],
            ];
        }

        return [
            'action' => DealSuggestion::ACTION_LEAVE_FOR_HUMAN,
            'confidence' => DealSuggestion::CONFIDENCE_LOW,
            'title' => 'Leave for a human',
            'body' => 'No phone or email on the contact. Do not invent one.',
            'payload' => ['auto_send' => false],
        ];
    }

    /**
     * Human apply: create a task or advance only when the human asked.
     * Never sends email or WhatsApp Cloud.
     */
    public function apply(DealSuggestion $suggestion, Workspace $workspace): void
    {
        $suggestion->loadMissing(['deal.stage', 'deal.pipeline.stages']);
        $deal = $suggestion->deal;

        if (! $deal instanceof Deal || $suggestion->status !== DealSuggestion::STATUS_PENDING) {
            return;
        }

        if ($suggestion->isHumanOnly() && in_array($suggestion->action, [
            DealSuggestion::ACTION_EMAIL,
            DealSuggestion::ACTION_WHATSAPP,
            DealSuggestion::ACTION_LEAVE_FOR_HUMAN,
        ], true)) {
            $this->activities->record($workspace, [
                'type' => 'task',
                'subject' => $suggestion->title,
                'body' => $suggestion->body,
                'deal_id' => $deal->id,
                'contact_id' => $deal->contact_id,
                'company_id' => $deal->company_id,
                'owner_id' => $deal->owner_id,
                'due_at' => now()->addDay(),
                'meta' => [
                    'source' => 'next_move',
                    'action' => $suggestion->action,
                    'auto_send' => false,
                ],
            ]);
            $suggestion->apply();

            return;
        }

        if ($suggestion->action === DealSuggestion::ACTION_CALL) {
            $this->activities->record($workspace, [
                'type' => 'task',
                'subject' => $suggestion->title,
                'body' => $suggestion->body,
                'deal_id' => $deal->id,
                'contact_id' => $deal->contact_id,
                'company_id' => $deal->company_id,
                'owner_id' => $deal->owner_id,
                'due_at' => now()->addDay(),
                'meta' => ['source' => 'next_move', 'action' => 'call', 'auto_send' => false],
            ]);
        }

        if ($suggestion->action === DealSuggestion::ACTION_ADVANCE) {
            $stageId = (int) data_get($suggestion->payload, 'stage_id');
            $stage = $deal->pipeline?->stages?->firstWhere('id', $stageId);
            $suggestion->apply();
            if ($stage instanceof Stage) {
                $deal->moveTo($stage);
            }

            return;
        }

        $suggestion->apply();
    }

    public function latestPending(Deal $deal, string $kind = DealSuggestion::KIND_NEXT_MOVE): ?DealSuggestion
    {
        return DealSuggestion::query()
            ->where('deal_id', $deal->id)
            ->where('kind', $kind)
            ->where('status', DealSuggestion::STATUS_PENDING)
            ->latest('id')
            ->first();
    }

    protected function nextOpenStage(Deal $deal): ?Stage
    {
        $stages = $deal->pipeline?->stages
            ?? collect();

        $current = $deal->stage;

        if (! $current instanceof Stage) {
            return null;
        }

        return $stages
            ->sortBy('position')
            ->first(fn (Stage $stage) => (int) $stage->position > (int) $current->position
                && ! $stage->is_won
                && ! $stage->is_lost);
    }

    protected function looksLikeAlgerianMobile(?string $phone): bool
    {
        if (! filled($phone)) {
            return false;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        return str_starts_with($digits, '213') || str_starts_with($digits, '0');
    }
}
