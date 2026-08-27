<?php

namespace App\Services\LeadOs;

use App\Models\Deal;
use App\Models\DealSuggestion;
use App\Models\Workspace;
use App\Services\Ai\LlmClient;
use Illuminate\Support\Collection;

/**
 * Weekly list of deals lost in the last 7 days with an Ask Evo draft.
 * A human confirms the reason.
 */
class LostReview
{
    public function __construct(private LlmClient $llm) {}

    /**
     * @return array{status: string, counts: array<string, int>, error: string|null}
     */
    public function run(Workspace $workspace): array
    {
        $deals = $this->lostSince($workspace, 7);
        $written = 0;

        foreach ($deals as $deal) {
            $this->draft($workspace, $deal);
            $written++;
        }

        return [
            'status' => 'ok',
            'counts' => ['deals' => $written],
            'error' => null,
        ];
    }

    public function draft(Workspace $workspace, Deal $deal): DealSuggestion
    {
        $existing = DealSuggestion::query()
            ->where('deal_id', $deal->id)
            ->where('kind', DealSuggestion::KIND_LOST_REASON)
            ->where('status', DealSuggestion::STATUS_PENDING)
            ->latest('id')
            ->first();

        if ($existing) {
            return $existing;
        }

        $deal->loadMissing(['stage', 'contact', 'company']);
        $body = $this->reasonDraft($deal);

        return DealSuggestion::query()->create([
            'workspace_id' => $workspace->id,
            'deal_id' => $deal->id,
            'kind' => DealSuggestion::KIND_LOST_REASON,
            'action' => DealSuggestion::ACTION_CLOSE,
            'confidence' => DealSuggestion::CONFIDENCE_MID,
            'status' => DealSuggestion::STATUS_PENDING,
            'title' => 'Loss reason draft',
            'body' => $body,
            'payload' => [
                'deal_title' => $deal->title,
                'amount_cents' => (int) $deal->amount_cents,
            ],
        ]);
    }

    public function confirm(DealSuggestion $suggestion, ?string $reason = null): void
    {
        $deal = $suggestion->deal ?? Deal::query()->find($suggestion->deal_id);

        if (! $deal instanceof Deal || $suggestion->kind !== DealSuggestion::KIND_LOST_REASON) {
            return;
        }

        $confirmed = trim((string) ($reason ?: $suggestion->body));

        if ($confirmed !== '') {
            $deal->forceFill(['lost_reason' => mb_substr($confirmed, 0, 255)])->save();
        }

        $suggestion->apply();
    }

    /**
     * @return Collection<int, Deal>
     */
    public function lostSince(Workspace $workspace, int $days = 7): Collection
    {
        $since = now()->subDays($days);

        return Deal::query()
            ->forWorkspace($workspace)
            ->with(['stage', 'contact', 'company'])
            ->whereHas('stage', fn ($query) => $query->where('is_lost', true))
            ->where(function ($query) use ($since): void {
                $query->where('closed_at', '>=', $since)
                    ->orWhere(function ($inner) use ($since): void {
                        $inner->whereNull('closed_at')->where('updated_at', '>=', $since);
                    });
            })
            ->orderByDesc('closed_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * @return list<array{id: int, deal_id: int, title: string, amount_cents: int, body: string|null, status: string, lost_reason: string|null}>
     */
    public function present(Workspace $workspace): array
    {
        return DealSuggestion::query()
            ->forWorkspace($workspace)
            ->where('kind', DealSuggestion::KIND_LOST_REASON)
            ->where('status', DealSuggestion::STATUS_PENDING)
            ->with('deal')
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (DealSuggestion $row) => [
                'id' => $row->id,
                'deal_id' => $row->deal_id,
                'title' => $row->deal?->title ?? 'Deal',
                'amount_cents' => (int) ($row->deal?->amount_cents ?? 0),
                'body' => $row->body,
                'status' => $row->status,
                'lost_reason' => $row->deal?->lost_reason,
            ])
            ->all();
    }

    protected function reasonDraft(Deal $deal): string
    {
        $facts = implode(' · ', array_filter([
            $deal->title,
            $deal->stage?->name,
            (int) $deal->amount_cents > 0
                ? number_format(((int) $deal->amount_cents) / 100, 0, ',', ' ').' DZD'
                : 'amount missing',
            $deal->lost_reason,
            $deal->contact?->wilaya,
        ]));

        $fallback = $deal->lost_reason
            ?: 'Lost without a written reason. Confirm why this closed — price, timing, competitor, or no reply.';

        if (! $this->llm->available()) {
            return $fallback;
        }

        $live = $this->llm->complete(
            'You are Evo. Draft one sentence as a loss-reason hypothesis from the supplied deal fields only. Never invent emails or contacts. A human will confirm.',
            $facts,
        );

        $text = trim((string) ($live['text'] ?? ''));

        return $text !== '' ? $text : $fallback;
    }
}
