<?php

namespace App\Services\LeadOs;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\DealSuggestion;
use App\Models\Message;
use App\Models\Stage;
use App\Models\Workspace;
use App\Services\Ai\LlmClient;
use App\Services\Crm\ActivityRecorder;

/**
 * After a human logs a note, call, email, or inbound WhatsApp, queue one draft.
 * Never auto-advance the deal.
 */
class AfterTouchDraft
{
    public function __construct(private LlmClient $llm) {}

    public function shouldDraft(Activity $activity): bool
    {
        return $activity->deal_id
            && in_array($activity->type, ['note', 'call', 'email', 'whatsapp'], true);
    }

    public function logInboundWhatsApp(Workspace $workspace, Contact $contact, Message $message): void
    {
        $deals = Deal::query()
            ->forWorkspace($workspace)
            ->where('contact_id', $contact->id)
            ->with(['stage', 'pipeline.stages', 'contact'])
            ->whereHas('stage', fn ($query) => $query->where('is_won', false)->where('is_lost', false))
            ->get();

        $recorder = app(ActivityRecorder::class);

        foreach ($deals as $deal) {
            if (! $deal instanceof Deal) {
                continue;
            }

            $recorder->record($workspace, [
                'type' => 'whatsapp',
                'subject' => 'Inbound WhatsApp',
                'body' => $message->body,
                'contact_id' => $contact->id,
                'deal_id' => $deal->id,
                'company_id' => $deal->company_id,
                'provider' => $message->provider,
                'provider_event_id' => (string) ($message->provider_message_id ?: $message->id),
                'meta' => [
                    'direction' => 'inbound',
                    'message_id' => $message->id,
                    'auto_send' => false,
                ],
            ]);
        }
    }

    public function draft(Activity $activity): ?DealSuggestion
    {
        if (! $this->shouldDraft($activity)) {
            return null;
        }

        $deal = Deal::query()->with(['stage', 'pipeline.stages', 'contact'])->find($activity->deal_id);

        if (! $deal instanceof Deal || $deal->stage?->isTerminal()) {
            return null;
        }

        $existing = DealSuggestion::query()
            ->where('activity_id', $activity->id)
            ->where('kind', DealSuggestion::KIND_AFTER_TOUCH)
            ->first();

        if ($existing) {
            return $existing;
        }

        $next = $this->nextOpenStage($deal);
        $action = $next instanceof Stage
            ? DealSuggestion::ACTION_NEXT_STAGE
            : DealSuggestion::ACTION_FOLLOW_UP;
        $body = $this->body($deal, $activity, $next);

        return DealSuggestion::query()->create([
            'workspace_id' => $activity->workspace_id,
            'deal_id' => $deal->id,
            'activity_id' => $activity->id,
            'kind' => DealSuggestion::KIND_AFTER_TOUCH,
            'action' => $action,
            'confidence' => DealSuggestion::CONFIDENCE_MID,
            'status' => DealSuggestion::STATUS_PENDING,
            'title' => $next instanceof Stage
                ? 'Suggested next stage: '.$next->name
                : 'Suggested follow-up',
            'body' => $body,
            'payload' => [
                'stage_id' => $next?->id,
                'auto_advance' => false,
                'source_activity_type' => $activity->type,
            ],
        ]);
    }

    /**
     * Human apply: write next_step / lost-reason text. Never move the stage.
     */
    public function apply(DealSuggestion $suggestion): void
    {
        $deal = $suggestion->deal ?? Deal::query()->find($suggestion->deal_id);

        if (! $deal instanceof Deal || $suggestion->status !== DealSuggestion::STATUS_PENDING) {
            return;
        }

        $deal->forceFill([
            'next_step' => mb_substr($suggestion->title, 0, 180),
        ])->save();

        $suggestion->apply();
    }

    protected function body(Deal $deal, Activity $activity, ?Stage $next): string
    {
        $touch = $activity->type.' — '.($activity->subject ?: ($activity->body ?: 'logged'));
        $fallback = $next instanceof Stage
            ? 'After that '.$activity->type.', a human can move this to '.$next->name.' if the buyer advanced. Evo will not auto-advance.'
            : 'After that '.$activity->type.', draft a follow-up. Evo will not auto-advance.';

        if (! $this->llm->available()) {
            return $fallback.' Touch: '.$touch;
        }

        $live = $this->llm->complete(
            'You are Evo. Suggest one next stage or follow-up sentence from this touch. Never invent emails. Never say the deal was moved.',
            'Deal '.$deal->title.' in '.($deal->stage?->name ?? 'open').'. Touch: '.$touch.'. Next open stage: '.($next?->name ?? 'none').'.',
        );

        $text = trim((string) ($live['text'] ?? ''));

        return $text !== '' ? $text : $fallback;
    }

    protected function nextOpenStage(Deal $deal): ?Stage
    {
        $current = $deal->stage;

        if (! $current instanceof Stage) {
            return null;
        }

        return ($deal->pipeline?->stages ?? collect())
            ->sortBy('position')
            ->first(fn (Stage $stage) => (int) $stage->position > (int) $current->position
                && ! $stage->is_won
                && ! $stage->is_lost);
    }
}
