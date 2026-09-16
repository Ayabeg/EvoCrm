<?php

namespace App\Services\Desk;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Thread;
use App\Models\User;
use App\Services\Crm\DealAttentionEvaluator;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Throwable;

/**
 * One permission-safe Inbox CRM context composition.
 *
 * Selected-thread only. No peek waterfall. No fake primary Deal.
 * Attention reuses DealAttentionEvaluator::evaluate in memory.
 */
class InboxCrmContextComposer
{
    public const DEAL_LIMIT = 12;

    public const RECENT_LIMIT = 40;

    public const TASK_LIMIT = 4;

    public const NOTE_LIMIT = 4;

    public function __construct(private DealAttentionEvaluator $evaluator) {}

    /**
     * @return array<string, mixed>
     */
    public function present(User $user, ?Thread $thread): array
    {
        $empty = $this->emptyPayload($thread?->id);

        if (! $thread instanceof Thread) {
            return $empty;
        }

        $contact = $thread->relationLoaded('contact') ? $thread->contact : $thread->contact()->first();

        if (! $contact instanceof Contact) {
            return [
                ...$empty,
                'thread_id' => (int) $thread->id,
                'empty' => 'no_contact',
            ];
        }

        if (! Gate::forUser($user)->allows('view', $contact)) {
            return [
                ...$empty,
                'thread_id' => (int) $thread->id,
                'empty' => 'restricted',
            ];
        }

        $contact->loadMissing(['company:id,name', 'owner:id,name']);

        $company = $contact->company;
        if ($company instanceof Company && ! Gate::forUser($user)->allows('view', $company)) {
            $company = null;
        }

        $deals = $this->visibleDeals($user, $contact, $thread);
        $dealIds = $deals->pluck('id')->map(fn ($id): int => (int) $id)->values();

        $primaryDealId = $this->authoritativePrimaryDealId($thread, $dealIds);

        $recent = $this->visibleActivities($user, (int) $contact->id, $dealIds, recent: true);
        $scheduled = $this->visibleActivities($user, (int) $contact->id, $dealIds, recent: false);

        $now = DealAttentionEvaluator::now();
        $presentedDeals = $deals
            ->map(function (Deal $deal) use ($scheduled, $now, $contact, $company): array {
                $dealScheduled = $scheduled
                    ->filter(fn (Activity $activity): bool => (int) $activity->deal_id === (int) $deal->id)
                    ->values();

                $attention = $this->evaluator->evaluate($deal, $dealScheduled, $now);

                return $this->presentDeal($deal, $attention, $dealScheduled, $now);
            })
            ->all();

        $primary = $primaryDealId !== null
            ? collect($presentedDeals)->firstWhere('id', $primaryDealId)
            : null;

        return [
            'thread_id' => (int) $thread->id,
            'empty' => null,
            'contact' => $this->presentContact($contact),
            'company' => $company instanceof Company ? $this->presentCompany($company) : null,
            'primary_deal_id' => $primaryDealId,
            'deals' => $presentedDeals,
            'attention' => is_array($primary) ? ($primary['attention'] ?? null) : null,
            'last_activity' => $this->presentLastActivity($recent),
            'next_activity' => $this->presentNextActivity($scheduled, $primaryDealId, $deals, $now),
            'tasks' => $this->presentTasks($scheduled, $recent),
            'notes' => $this->presentNotes($recent),
            'capabilities' => [
                'can_create_activity' => Gate::forUser($user)->allows('create', Activity::class),
                'can_peek' => true,
                'can_open_contact' => true,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function failed(?int $threadId, Throwable $exception): array
    {
        report($exception);

        return [
            ...$this->emptyPayload($threadId),
            'empty' => 'error',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function emptyPayload(?int $threadId): array
    {
        return [
            'thread_id' => $threadId,
            'empty' => 'no_thread',
            'contact' => null,
            'company' => null,
            'primary_deal_id' => null,
            'deals' => [],
            'attention' => null,
            'last_activity' => null,
            'next_activity' => null,
            'tasks' => [],
            'notes' => [],
            'capabilities' => [
                'can_create_activity' => false,
                'can_peek' => false,
                'can_open_contact' => false,
            ],
        ];
    }

    /**
     * @return Collection<int, Deal>
     */
    private function visibleDeals(User $user, Contact $contact, Thread $thread): Collection
    {
        $workspace = $user->workspace;

        $deals = Deal::query()
            ->forWorkspace($workspace)
            ->where('contact_id', $contact->id)
            ->with([
                'stage:id,name,slug,is_won,is_lost',
                'owner:id,name',
                'company:id,name',
                'contact:id,first_name,last_name',
            ])
            ->limit(self::DEAL_LIMIT)
            ->get();

        $ticketDealId = $thread->ticket?->deal_id;
        if ($ticketDealId && ! $deals->contains('id', (int) $ticketDealId)) {
            $ticketDeal = Deal::query()
                ->forWorkspace($workspace)
                ->with([
                    'stage:id,name,slug,is_won,is_lost',
                    'owner:id,name',
                    'company:id,name',
                    'contact:id,first_name,last_name',
                ])
                ->find((int) $ticketDealId);

            if ($ticketDeal instanceof Deal) {
                $deals->prepend($ticketDeal);
            }
        }

        return $deals
            ->unique('id')
            ->filter(fn (Deal $deal): bool => Gate::forUser($user)->allows('view', $deal))
            ->sortBy(function (Deal $deal): array {
                $open = $this->isOpenDeal($deal);

                return [$open ? 0 : 1, (int) $deal->id];
            })
            ->values();
    }

    /**
     * @param  Collection<int, int>  $visibleDealIds
     */
    private function authoritativePrimaryDealId(Thread $thread, Collection $visibleDealIds): ?int
    {
        $ticketDealId = $thread->ticket?->deal_id;
        if (! $ticketDealId) {
            return null;
        }

        $id = (int) $ticketDealId;

        return $visibleDealIds->contains($id) ? $id : null;
    }

    /**
     * @param  Collection<int, int>  $dealIds
     * @return Collection<int, Activity>
     */
    private function visibleActivities(User $user, int $contactId, Collection $dealIds, bool $recent): Collection
    {
        $query = Activity::query()
            ->forWorkspace($user->workspace)
            ->where(function ($inner) use ($contactId, $dealIds): void {
                $inner->where('contact_id', $contactId);
                if ($dealIds->isNotEmpty()) {
                    $inner->orWhereIn('deal_id', $dealIds->all());
                }
            });

        if ($recent) {
            $query->orderByDesc('created_at')->limit(self::RECENT_LIMIT);
        } else {
            $query->where('done', false)->whereNotNull('due_at');
        }

        return $query
            ->get(['id', 'workspace_id', 'type', 'subject', 'due_at', 'created_at', 'done', 'deal_id', 'contact_id'])
            ->filter(fn (Activity $activity): bool => Gate::forUser($user)->allows('view', $activity))
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function presentContact(Contact $contact): array
    {
        return [
            'id' => (int) $contact->id,
            'name' => $contact->displayName(),
            'email' => $contact->email,
            'phone' => $contact->phone_e164,
            'owner' => $contact->owner ? [
                'id' => (int) $contact->owner->id,
                'name' => (string) $contact->owner->name,
                'label' => 'Contact owner',
            ] : null,
            'href' => "/crm/contacts/{$contact->id}",
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentCompany(Company $company): array
    {
        return [
            'id' => (int) $company->id,
            'name' => (string) $company->name,
            'href' => "/crm/companies/{$company->id}",
        ];
    }

    /**
     * @param  array{signals: list<array<string, mixed>>, primary: ?array<string, mixed>}  $attention
     * @param  Collection<int, Activity>  $scheduled
     * @return array<string, mixed>
     */
    private function presentDeal(
        Deal $deal,
        array $attention,
        Collection $scheduled,
        CarbonInterface $now,
    ): array {
        $open = $this->isOpenDeal($deal);
        $stage = $deal->stage;
        $dealContact = $deal->contact;
        $dealCompany = $deal->company;

        return [
            'id' => (int) $deal->id,
            'title' => (string) $deal->title,
            'amount_cents' => (int) $deal->amount_cents,
            'currency' => $deal->currency ?? 'DZD',
            'stage' => [
                'id' => $deal->stage_id ? (int) $deal->stage_id : null,
                'name' => $stage?->name,
                'slug' => $stage?->slug,
                'is_won' => (bool) ($stage?->is_won),
                'is_lost' => (bool) ($stage?->is_lost),
            ],
            'owner' => $deal->owner ? [
                'id' => (int) $deal->owner->id,
                'name' => (string) $deal->owner->name,
                'label' => 'Deal owner',
            ] : null,
            'associations' => array_values(array_filter([
                $dealContact instanceof Contact ? ['type' => 'contact', 'id' => (int) $dealContact->id, 'label' => $dealContact->displayName()] : null,
                $dealCompany instanceof Company ? ['type' => 'company', 'id' => (int) $dealCompany->id, 'label' => (string) $dealCompany->name] : null,
            ])),
            'is_open' => $open,
            'is_won' => (bool) ($stage?->is_won),
            'is_lost' => (bool) ($stage?->is_lost),
            'next_activity' => $this->dealNextActivity($deal, $scheduled, $now),
            'attention' => $attention,
            'href' => "/crm/deals/{$deal->id}",
        ];
    }

    /**
     * @param  Collection<int, Activity>  $recent
     * @return array<string, mixed>|null
     */
    private function presentLastActivity(Collection $recent): ?array
    {
        $activity = $recent
            ->sortByDesc(fn (Activity $activity): array => [
                $activity->created_at?->getTimestamp() ?? 0,
                (int) $activity->id,
            ])
            ->first();

        if (! $activity instanceof Activity) {
            return null;
        }

        return $this->presentActivitySummary($activity, $activity->created_at);
    }

    /**
     * @param  Collection<int, Activity>  $scheduled
     * @param  Collection<int, Deal>  $deals
     * @return array<string, mixed>|null
     */
    private function presentNextActivity(
        Collection $scheduled,
        ?int $primaryDealId,
        Collection $deals,
        CarbonInterface $now,
    ): ?array {
        $pool = $scheduled;
        if ($primaryDealId !== null) {
            $pool = $scheduled->filter(
                fn (Activity $activity): bool => (int) $activity->deal_id === $primaryDealId,
            );
        }

        $upcoming = $pool
            ->filter(fn (Activity $activity): bool => $activity->due_at instanceof CarbonInterface && ! $activity->due_at->lt($now))
            ->sortBy(fn (Activity $activity): array => [$activity->due_at->timestamp, $activity->id])
            ->first();

        if ($upcoming instanceof Activity) {
            return $this->presentActivitySummary($upcoming, $upcoming->due_at);
        }

        $deal = $primaryDealId !== null
            ? $deals->firstWhere('id', $primaryDealId)
            : $deals
                ->filter(fn (Deal $item): bool => $this->isOpenDeal($item)
                    && $item->next_activity_at instanceof CarbonInterface
                    && ! $item->next_activity_at->lt($now))
                ->sortBy(fn (Deal $item): int => $item->next_activity_at->timestamp)
                ->first();

        if ($deal instanceof Deal && $deal->next_activity_at instanceof CarbonInterface && ! $deal->next_activity_at->lt($now)) {
            return [
                'id' => null,
                'type' => 'scheduled',
                'subject' => 'Next activity',
                'at' => $deal->next_activity_at->timezone(DealAttentionEvaluator::TIMEZONE)->toIso8601String(),
                'deal_id' => (int) $deal->id,
                'done' => false,
            ];
        }

        return null;
    }

    /**
     * @param  Collection<int, Activity>  $scheduled
     * @return array<string, mixed>|null
     */
    private function dealNextActivity(Deal $deal, Collection $scheduled, CarbonInterface $now): ?array
    {
        $upcoming = $scheduled
            ->filter(fn (Activity $activity): bool => $activity->due_at instanceof CarbonInterface && ! $activity->due_at->lt($now))
            ->sortBy(fn (Activity $activity): array => [$activity->due_at->timestamp, $activity->id])
            ->first();

        if ($upcoming instanceof Activity) {
            return $this->presentActivitySummary($upcoming, $upcoming->due_at);
        }

        if ($deal->next_activity_at instanceof CarbonInterface && ! $deal->next_activity_at->lt($now)) {
            return [
                'id' => null,
                'type' => 'scheduled',
                'subject' => 'Next activity',
                'at' => $deal->next_activity_at->timezone(DealAttentionEvaluator::TIMEZONE)->toIso8601String(),
                'deal_id' => (int) $deal->id,
                'done' => false,
            ];
        }

        return null;
    }

    /**
     * @param  Collection<int, Activity>  $scheduled
     * @param  Collection<int, Activity>  $recent
     * @return list<array<string, mixed>>
     */
    private function presentTasks(Collection $scheduled, Collection $recent): array
    {
        $tasks = $scheduled
            ->filter(fn (Activity $activity): bool => $activity->type === 'task')
            ->concat($recent->filter(fn (Activity $activity): bool => $activity->type === 'task'))
            ->unique('id')
            ->sortBy(fn (Activity $activity): array => [
                $activity->done ? 1 : 0,
                $activity->due_at?->timestamp ?? PHP_INT_MAX,
                (int) $activity->id,
            ])
            ->take(self::TASK_LIMIT)
            ->values();

        return $tasks
            ->map(fn (Activity $activity): array => $this->presentActivitySummary($activity, $activity->due_at ?? $activity->created_at))
            ->all();
    }

    /**
     * @param  Collection<int, Activity>  $recent
     * @return list<array<string, mixed>>
     */
    private function presentNotes(Collection $recent): array
    {
        return $recent
            ->filter(fn (Activity $activity): bool => $activity->type === 'note')
            ->take(self::NOTE_LIMIT)
            ->map(fn (Activity $activity): array => $this->presentActivitySummary($activity, $activity->created_at))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function presentActivitySummary(Activity $activity, ?CarbonInterface $at): array
    {
        return [
            'id' => (int) $activity->id,
            'type' => (string) $activity->type,
            'subject' => trim((string) ($activity->subject ?: ucfirst((string) $activity->type))),
            'at' => $at?->timezone(DealAttentionEvaluator::TIMEZONE)->toIso8601String(),
            'deal_id' => $activity->deal_id ? (int) $activity->deal_id : null,
            'done' => (bool) $activity->done,
        ];
    }

    private function isOpenDeal(Deal $deal): bool
    {
        $stage = $deal->stage;

        if ($stage === null) {
            return false;
        }

        return ! $stage->is_won && ! $stage->is_lost;
    }
}
