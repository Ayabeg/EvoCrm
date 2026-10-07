<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Deal;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * One deterministic Deal attention evaluator.
 *
 * Shipped signals: overdue_activity, no_next_action.
 * Deferred: stale, stage_aging (see docs/implementation/p12-pipeline-attention.md).
 *
 * Authoritative clock: Africa/Algiers — the existing CRM date convention
 * (Home, board, activities). Not browser-local. workspace.timezone exists
 * but is not the backend truth for deal/activity due math today.
 */
class DealAttentionEvaluator
{
    public const TIMEZONE = 'Africa/Algiers';

    public const TYPE_OVERDUE_ACTIVITY = 'overdue_activity';

    public const TYPE_NO_NEXT_ACTION = 'no_next_action';

    public const SEVERITY_CRITICAL = 'critical';

    public const SEVERITY_WARNING = 'warning';

    public const SEVERITY_INFO = 'info';

    public const FILTER_NEEDS_ATTENTION = 'needs_attention';

    public const FILTER_OVERDUE = 'overdue';

    public const FILTER_NO_NEXT_ACTION = 'no_next_action';

    /** @var list<string> */
    public const FILTERS = [
        self::FILTER_NEEDS_ATTENTION,
        self::FILTER_OVERDUE,
        self::FILTER_NO_NEXT_ACTION,
    ];

    public const QUEUE_LIMIT = 8;

    public static function now(): CarbonInterface
    {
        return now(self::TIMEZONE);
    }

    public static function normalizeFilter(mixed $value): ?string
    {
        $mode = is_string($value) ? trim($value) : '';

        return in_array($mode, self::FILTERS, true) ? $mode : null;
    }

    /**
     * @param  iterable<int, Activity>  $scheduled
     * @return array{signals: list<array<string, mixed>>, primary: ?array<string, mixed>}
     */
    public function evaluate(Deal $deal, iterable $scheduled, ?CarbonInterface $now = null): array
    {
        $now ??= self::now();
        $signals = [];

        $openScheduled = collect($scheduled)
            ->filter(fn ($activity) => $activity instanceof Activity
                && (int) $activity->deal_id === (int) $deal->id
                && $activity->done === false
                && $activity->due_at instanceof CarbonInterface)
            ->values();

        $overdue = $openScheduled
            ->filter(fn (Activity $activity) => $activity->due_at->lt($now))
            ->sortBy(fn (Activity $activity) => [$activity->due_at->timestamp, $activity->id])
            ->values();

        if ($overdue->isNotEmpty()) {
            $activity = $overdue->first();
            $when = $activity->due_at->timezone(self::TIMEZONE)->format('d M H:i');
            $subject = trim((string) ($activity->subject ?: ucfirst((string) $activity->type)));
            $signals[] = [
                'type' => self::TYPE_OVERDUE_ACTIVITY,
                'severity' => self::SEVERITY_CRITICAL,
                'label' => 'Overdue activity',
                'reason' => $subject !== ''
                    ? ':subject was due :when'
                    : 'An activity was due :when',
                'reason_replace' => [
                    'subject' => $subject,
                    'when' => $when,
                ],
                'at' => $activity->due_at->timezone(self::TIMEZONE)->toIso8601String(),
                'ref' => ['type' => 'activity', 'id' => (int) $activity->id],
            ];
        }

        if ($this->isOpenDeal($deal) && ! $this->hasNextAction($deal, $openScheduled, $now)) {
            $signals[] = [
                'type' => self::TYPE_NO_NEXT_ACTION,
                'severity' => self::SEVERITY_WARNING,
                'label' => 'No next action',
                'reason' => 'This open deal has no scheduled next action.',
                'at' => null,
                'ref' => null,
            ];
        }

        return [
            'signals' => $signals,
            'primary' => $signals[0] ?? null,
        ];
    }

    /**
     * Board / List render primary only. Drawer uses the full payload.
     *
     * @param  array{signals?: mixed, primary?: mixed}|null  $attention
     * @return array{primary: array{type: string, severity: string, label: string}}|null
     */
    public function compact(?array $attention): ?array
    {
        $primary = is_array($attention) ? ($attention['primary'] ?? null) : null;
        if (! is_array($primary) || ! isset($primary['type'], $primary['severity'], $primary['label'])) {
            return null;
        }

        return [
            'primary' => [
                'type' => (string) $primary['type'],
                'severity' => (string) $primary['severity'],
                'label' => (string) $primary['label'],
            ],
        ];
    }

    /**
     * One activity query for the whole set. Never foreach-Deal query Activities.
     *
     * @param  Collection<int, Deal>  $deals
     * @return array<int, array{signals: list<array<string, mixed>>, primary: ?array<string, mixed>}>
     */
    public function presentMany(Collection $deals, ?CarbonInterface $now = null): array
    {
        $now ??= self::now();
        $ids = $deals->pluck('id')->filter()->values();
        $byDeal = $this->scheduledByDeal($ids);

        $out = [];
        foreach ($deals as $deal) {
            $out[(int) $deal->id] = $this->evaluate(
                $deal,
                $byDeal[(int) $deal->id] ?? collect(),
                $now,
            );
        }

        return $out;
    }

    /**
     * @param  Builder<Deal>  $query
     * @return Builder<Deal>
     */
    public function apply(Builder $query, ?string $mode): Builder
    {
        $mode = self::normalizeFilter($mode);
        if ($mode === null) {
            return $query;
        }

        $now = self::now();

        return match ($mode) {
            self::FILTER_OVERDUE => $this->constrainOverdue($query, $now),
            self::FILTER_NO_NEXT_ACTION => $this->constrainNoNextAction($query, $now),
            default => $query->where(function (Builder $inner) use ($now): void {
                $this->constrainOverdue($inner, $now);
                $inner->orWhere(function (Builder $open) use ($now): void {
                    $this->constrainNoNextAction($open, $now);
                });
            }),
        };
    }

    /**
     * @param  Builder<Deal>  $query
     * @return Builder<Deal>
     */
    public function orderByUrgency(Builder $query, ?CarbonInterface $now = null): Builder
    {
        $now ??= self::now();
        $stamp = $now->toDateTimeString();

        return $query
            ->orderByRaw(
                'CASE WHEN EXISTS (
                    SELECT 1 FROM activities
                    WHERE activities.deal_id = deals.id
                      AND activities.done = 0
                      AND activities.due_at IS NOT NULL
                      AND activities.due_at < ?
                ) THEN 0 ELSE 1 END',
                [$stamp],
            )
            ->orderByRaw(
                '(SELECT MIN(activities.due_at) FROM activities
                  WHERE activities.deal_id = deals.id
                    AND activities.done = 0
                    AND activities.due_at IS NOT NULL
                    AND activities.due_at < ?)',
                [$stamp],
            )
            ->orderBy('deals.id');
    }

    /**
     * Compact queue. Same evaluator. Severity, then overdue duration, then id.
     * Not amount.
     *
     * @param  Builder<Deal>  $query
     * @return list<array{id: int, title: string, href: string, primary: array<string, mixed>}>
     */
    public function queue(Builder $query, int $limit = self::QUEUE_LIMIT): array
    {
        $limit = max(1, min(self::QUEUE_LIMIT, $limit));
        $now = self::now();

        $candidates = $this->orderByUrgency(
            $this->apply((clone $query)->with(['stage']), self::FILTER_NEEDS_ATTENTION),
            $now,
        )->limit($limit)->get();

        $attentions = $this->presentMany($candidates, $now);

        return $candidates
            ->map(function (Deal $deal) use ($attentions): ?array {
                $attention = $attentions[(int) $deal->id] ?? null;
                $primary = is_array($attention) ? ($attention['primary'] ?? null) : null;
                if (! is_array($primary)) {
                    return null;
                }

                return [
                    'id' => (int) $deal->id,
                    'title' => (string) $deal->title,
                    'href' => "/crm/deals/{$deal->id}",
                    'primary' => [
                        'type' => (string) $primary['type'],
                        'severity' => (string) $primary['severity'],
                        'label' => (string) $primary['label'],
                        'reason' => (string) ($primary['reason'] ?? ''),
                        'reason_replace' => is_array($primary['reason_replace'] ?? null)
                            ? $primary['reason_replace']
                            : [],
                    ],
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function isOpenDeal(Deal $deal): bool
    {
        $stage = $deal->relationLoaded('stage') ? $deal->stage : null;

        if ($stage === null) {
            return false;
        }

        return ! $stage->is_won && ! $stage->is_lost;
    }

    /**
     * @param  Collection<int, Activity>  $openScheduled
     */
    private function hasNextAction(Deal $deal, Collection $openScheduled, CarbonInterface $now): bool
    {
        if ($openScheduled->isNotEmpty()) {
            return true;
        }

        $nextAt = $deal->next_activity_at;

        return $nextAt instanceof CarbonInterface && ! $nextAt->lt($now);
    }

    /**
     * @param  Builder<Deal>  $query
     * @return Builder<Deal>
     */
    private function constrainOverdue(Builder $query, CarbonInterface $now): Builder
    {
        return $query->whereHas('activities', function (Builder $activity) use ($now): void {
            $activity->where('done', false)
                ->whereNotNull('due_at')
                ->where('due_at', '<', $now);
        });
    }

    /**
     * @param  Builder<Deal>  $query
     * @return Builder<Deal>
     */
    private function constrainNoNextAction(Builder $query, CarbonInterface $now): Builder
    {
        return $query
            ->whereHas('stage', fn (Builder $stage) => $stage->where('is_won', false)->where('is_lost', false))
            ->where(function (Builder $inner) use ($now): void {
                $inner->whereNull('next_activity_at')
                    ->orWhere('next_activity_at', '<', $now);
            })
            ->whereDoesntHave('activities', function (Builder $activity): void {
                $activity->where('done', false)->whereNotNull('due_at');
            });
    }

    /**
     * @param  Collection<int, mixed>  $dealIds
     * @return array<int, Collection<int, Activity>>
     */
    private function scheduledByDeal(Collection $dealIds): array
    {
        if ($dealIds->isEmpty()) {
            return [];
        }

        return Activity::query()
            ->whereIn('deal_id', $dealIds)
            ->where('done', false)
            ->whereNotNull('due_at')
            ->get(['id', 'deal_id', 'type', 'subject', 'due_at', 'done'])
            ->groupBy(fn (Activity $activity): int => (int) $activity->deal_id)
            ->all();
    }
}
