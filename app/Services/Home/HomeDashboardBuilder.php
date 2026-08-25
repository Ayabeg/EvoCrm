<?php

namespace App\Services\Home;

use App\Models\Activity;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\OutboundMessage;
use App\Models\Thread;
use App\Models\User;
use App\Models\Workspace;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Home command center — real workspace metrics only. Omits sections when
 * there is no underlying data (never fabricates charts or KPIs).
 */
class HomeDashboardBuilder
{
    private const TZ = 'Africa/Algiers';

    private const MAX_DAYS = 92;

    private const STALLED_DAYS = 7;

    public function __construct(
        private ?int $ownerId = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(Workspace $workspace, CarbonInterface $from, CarbonInterface $to): array
    {
        $days = (int) $from->diffInDays($to) + 1;
        $prevTo = $from->copy()->subDay()->endOfDay();
        $prevFrom = $prevTo->copy()->subDays($days - 1)->startOfDay();

        $deals = $this->constrainOwner(Deal::query()->forWorkspace($workspace)->with(['stage', 'owner']))->get();
        $pipeline = $workspace->defaultPipeline();
        $stages = $pipeline->stages()->orderBy('position')->get();

        $open = $deals->filter(fn (Deal $d) => $d->stage && ! $d->stage->isTerminal());
        $wonInWindow = $deals->filter(fn (Deal $d) => $d->stage?->is_won && $this->inWindow($d->closed_at, $from, $to));
        $wonPrev = $deals->filter(fn (Deal $d) => $d->stage?->is_won && $this->inWindow($d->closed_at, $prevFrom, $prevTo));
        $lostInWindow = $deals->filter(fn (Deal $d) => $d->stage?->is_lost && $this->inWindow($d->closed_at, $from, $to));
        $closedInWindow = $wonInWindow->count() + $lostInWindow->count();

        $revenueCents = (int) $wonInWindow->sum('amount_cents');
        $revenuePrevCents = (int) $wonPrev->sum('amount_cents');
        $pipelineCents = (int) $open->sum('amount_cents');

        $activitiesDone = $this->constrainOwner(
            Activity::query()->forWorkspace($workspace)->where('done', true)
                ->whereBetween('completed_at', [$from, $to])
        )->count();
        $activitiesDonePrev = $this->constrainOwner(
            Activity::query()->forWorkspace($workspace)->where('done', true)
                ->whereBetween('completed_at', [$prevFrom, $prevTo])
        )->count();

        $winRate = $closedInWindow > 0
            ? (int) round($wonInWindow->count() / $closedInWindow * 100)
            : null;

        $kpis = array_values(array_filter([
            $this->kpi('revenue', 'Revenue', $revenueCents, 'money', $revenueCents, $revenuePrevCents, '/crm/reports?category=sales'),
            $this->kpi('pipeline', 'Pipeline', $pipelineCents, 'money', $pipelineCents, null, '/crm/deals/board', 'Open opportunity value'),
            $this->kpi('win_rate', 'Win rate', $winRate, 'percent', $winRate, null, '/crm/reports?category=pipeline', $closedInWindow > 0 ? 'Closed in period' : null),
            $this->kpi('open_deals', 'Open deals', $open->count(), 'number', $open->count(), null, '/crm/deals', 'Active in pipeline'),
            $deals->isNotEmpty() || $activitiesDone > 0
                ? $this->kpi('activities', 'Activities done', $activitiesDone, 'number', $activitiesDone, $activitiesDonePrev, '/crm/activities', 'Completed in period')
                : null,
        ]));

        $primaryChart = $this->wonRevenueChart($wonInWindow, $from, $to);
        $pipelineHealth = $this->pipelineHealth($open, $stages, $pipelineCents);

        return [
            'window' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'days' => $days,
                'timezone' => self::TZ,
            ],
            'kpis' => $kpis,
            'primaryChart' => $primaryChart,
            'pipelineHealth' => $pipelineHealth,
            'attention' => $this->attention($workspace, $open, $from),
            'activityFeed' => $this->activityFeed($workspace),
            'salesPerformance' => $this->salesPerformance($wonInWindow),
            'quickActions' => [
                ['label' => 'New deal', 'href' => '/crm/deals'],
                ['label' => 'New lead', 'href' => '/crm/leads'],
                ['label' => 'Add contact', 'href' => '/crm/contacts'],
                ['label' => 'Create task', 'href' => '/crm/activities?type=task'],
                ['label' => 'Log activity', 'href' => '/crm/activities?type=note'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function parseWindow(?string $fromInput, ?string $toInput): array
    {
        $to = $toInput
            ? Carbon::parse($toInput, self::TZ)->endOfDay()
            : now(self::TZ)->endOfDay();
        $from = $fromInput
            ? Carbon::parse($fromInput, self::TZ)->startOfDay()
            : $to->copy()->subDays(29)->startOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        if ($from->diffInDays($to) >= self::MAX_DAYS) {
            $from = $to->copy()->subDays(self::MAX_DAYS - 1)->startOfDay();
        }

        return [$from, $to];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function kpi(
        string $key,
        string $label,
        int|null $value,
        string $format,
        int|null $currentForChange,
        int|null $previous,
        string $href,
        ?string $hint = null,
    ): ?array {
        if ($value === null && $format !== 'percent') {
            return null;
        }

        return [
            'key' => $key,
            'label' => $label,
            'value' => $value,
            'format' => $format,
            'hint' => $hint,
            'href' => $href,
            'change' => $this->percentChange($currentForChange, $previous),
            'changeLabel' => 'vs previous period',
        ];
    }

    private function percentChange(?int $current, ?int $previous): ?int
    {
        if ($current === null || $previous === null) {
            return null;
        }

        if ($previous === 0) {
            return $current > 0 ? 100 : ($current < 0 ? -100 : 0);
        }

        return (int) round(($current - $previous) / $previous * 100);
    }

    /**
     * @param  Collection<int, Deal>  $won
     * @return array<string, mixed>|null
     */
    private function wonRevenueChart(Collection $won, CarbonInterface $from, CarbonInterface $to): ?array
    {
        if ($won->isEmpty()) {
            return null;
        }

        [$labels, $counts] = $this->dailySeries(
            $won->pluck('closed_at'),
            $from,
            $to,
        );
        [, $amounts] = $this->dailySeries(
            $won->pluck('closed_at'),
            $from,
            $to,
            $won->pluck('amount_cents')->map(fn ($c) => (int) round($c / 100)),
        );

        $hasSignal = collect($amounts)->contains(fn ($v) => $v > 0);

        if (! $hasSignal) {
            return null;
        }

        return [
            'id' => 'evoviz.area',
            'title' => 'Revenue won over time',
            'labels' => $labels,
            'series' => [[
                'name' => 'Won (DZD)',
                'data' => $amounts,
                'tone' => 'mark',
            ]],
            'total' => (int) round($won->sum('amount_cents') / 100),
            'valueLabel' => 'DZD',
            'href' => '/crm/reports?category=sales',
        ];
    }

    /**
     * @param  Collection<int, Deal>  $open
     * @param  Collection<int, \App\Models\Stage>  $stages
     * @return array<string, mixed>|null
     */
    private function pipelineHealth(Collection $open, Collection $stages, int $pipelineCents): ?array
    {
        if ($open->isEmpty()) {
            return null;
        }

        $openStages = $stages->where('is_won', false)->where('is_lost', false);
        $stageRows = $openStages->map(fn ($stage) => [
            'name' => $stage->name,
            'count' => $open->where('stage_id', $stage->id)->count(),
            'amount_cents' => (int) $open->where('stage_id', $stage->id)->sum('amount_cents'),
        ])->values()->all();

        $chart = [
            'id' => 'evoviz.ranked-bars',
            'title' => 'Open deals by stage',
            'labels' => collect($stageRows)->pluck('name')->all(),
            'series' => [[
                'name' => 'Deals',
                'data' => collect($stageRows)->pluck('count')->all(),
                'tone' => 'ink',
            ]],
            'total' => $open->count(),
            'valueLabel' => 'deals',
            'href' => '/crm/deals/board',
        ];

        return [
            'total_cents' => $pipelineCents,
            'deal_count' => $open->count(),
            'stages' => $stageRows,
            'chart' => collect($stageRows)->contains(fn ($s) => $s['count'] > 0) ? $chart : null,
        ];
    }

    /**
     * @param  Collection<int, Deal>  $open
     * @return array<int, array<string, mixed>>
     */
    private function attention(Workspace $workspace, Collection $open, CarbonInterface $from): array
    {
        $items = [];
        $stalledCutoff = now(self::TZ)->subDays(self::STALLED_DAYS);

        $stalled = $open->filter(function (Deal $deal) use ($stalledCutoff) {
            return $deal->last_activity_at === null || $deal->last_activity_at->lt($stalledCutoff);
        })->count();

        if ($stalled > 0) {
            $items[] = [
                'key' => 'stalled_deals',
                'title' => 'Stalled deals',
                'description' => "{$stalled} deal".($stalled === 1 ? '' : 's').' with no activity for '.self::STALLED_DAYS.'+ days',
                'actionLabel' => 'Review deals',
                'href' => '/crm/deals',
            ];
        }

        $tasksDueToday = $this->constrainOwner(
            Activity::query()->forWorkspace($workspace)
                ->where('type', 'task')
                ->where('done', false)
                ->whereNotNull('due_at')
                ->whereBetween('due_at', [now(self::TZ)->startOfDay(), now(self::TZ)->endOfDay()])
        )->count();

        if ($tasksDueToday > 0) {
            $items[] = [
                'key' => 'tasks_due',
                'title' => 'Tasks due today',
                'description' => "{$tasksDueToday} task".($tasksDueToday === 1 ? '' : 's').' due today',
                'actionLabel' => 'View tasks',
                'href' => '/crm/activities?date=today',
            ];
        }

        $overdue = $this->constrainOwner(
            Activity::query()->forWorkspace($workspace)
                ->where('done', false)
                ->whereNotNull('due_at')
                ->where('due_at', '<', now(self::TZ))
        )->count();

        if ($overdue > 0) {
            $items[] = [
                'key' => 'overdue_activities',
                'title' => 'Overdue activities',
                'description' => "{$overdue} overdue item".($overdue === 1 ? '' : 's'),
                'actionLabel' => 'Review',
                'href' => '/crm/activities?overdue=1',
            ];
        }

        $unread = (int) Thread::query()->forWorkspace($workspace)->sum('unread_count');
        if ($unread > 0) {
            $items[] = [
                'key' => 'inbox_unread',
                'title' => 'Unread conversations',
                'description' => "{$unread} unread in desk",
                'actionLabel' => 'Open inbox',
                'href' => '/inbox',
            ];
        }

        $leadsNoFollowUp = $this->constrainOwner(
            Lead::query()->forWorkspace($workspace)
                ->whereDoesntHave('contact.activities', fn (Builder $q) => $q
                    ->where('type', 'task')
                    ->where('done', false)
                    ->whereNotNull('due_at'))
        )->count();

        if ($leadsNoFollowUp > 0) {
            $items[] = [
                'key' => 'leads_followup',
                'title' => 'Leads without follow-up',
                'description' => "{$leadsNoFollowUp} lead".($leadsNoFollowUp === 1 ? '' : 's').' with no scheduled task',
                'actionLabel' => 'Follow up',
                'href' => '/crm/leads',
            ];
        }

        $deferred = OutboundMessage::query()->forWorkspace($workspace)
            ->where('direction', 'out')
            ->where('status', 'queued')
            ->whereNotNull('deferred_until')
            ->where('deferred_until', '>', now())
            ->count();

        if ($deferred > 0) {
            $items[] = [
                'key' => 'outbound_deferred',
                'title' => 'Deferred sends',
                'description' => "{$deferred} outbound message".($deferred === 1 ? '' : 's').' queued for later',
                'actionLabel' => 'Review outbound',
                'href' => '/outbound/outbox',
            ];
        }

        return $items;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function activityFeed(Workspace $workspace): array
    {
        return $this->constrainOwner(
            Activity::query()->forWorkspace($workspace)
                ->with(['actor', 'contact', 'deal'])
                ->latest('updated_at')
                ->limit(12)
        )->get()->map(fn (Activity $activity) => [
            'id' => $activity->id,
            'type' => $activity->type,
            'subject' => $activity->subject,
            'done' => $activity->done,
            'actor' => $activity->actor?->name,
            'contact' => $activity->contact?->displayName(),
            'deal' => $activity->deal?->title,
            'at' => $activity->updated_at?->timezone(self::TZ)->format('Y-m-d H:i'),
            'href' => $activity->deal_id
                ? "/crm/deals/{$activity->deal_id}"
                : ($activity->contact_id ? "/crm/contacts/{$activity->contact_id}" : '/crm/activities'),
        ])->all();
    }

    /**
     * @param  Collection<int, Deal>  $won
     * @return array<int, array<string, mixed>>|null
     */
    private function salesPerformance(Collection $won): ?array
    {
        if ($won->isEmpty()) {
            return null;
        }

        $rows = $won->groupBy('owner_id')->map(function (Collection $group) {
            /** @var Deal $first */
            $first = $group->first();

            return [
                'owner' => $first->owner?->name ?? 'Unassigned',
                'won' => $group->count(),
                'revenue_cents' => (int) $group->sum('amount_cents'),
            ];
        })->sortByDesc('revenue_cents')->take(5)->values()->all();

        return count($rows) > 0 ? $rows : null;
    }

    private function inWindow(?CarbonInterface $date, CarbonInterface $from, CarbonInterface $to): bool
    {
        return $date !== null && $date->betweenIncluded($from, $to);
    }

    /**
     * @param  Collection<int, CarbonInterface|null>  $dates
     * @param  Collection<int, int|float>|null  $weights
     * @return array{0: array<int, string>, 1: array<int, int>}
     */
    private function dailySeries(Collection $dates, CarbonInterface $from, CarbonInterface $to, ?Collection $weights = null): array
    {
        $days = collect();
        for ($day = $from->copy()->startOfDay(); $day->lte($to); $day = $day->addDay()) {
            $days->push($day->toDateString());
        }

        $sums = collect();
        $dates->values()->each(function (?CarbonInterface $date, $i) use ($sums, $weights) {
            if ($date === null) {
                return;
            }

            $key = $date->copy()->setTimezone(self::TZ)->toDateString();
            $sums[$key] = ($sums[$key] ?? 0) + ($weights ? (float) ($weights[$i] ?? 1) : 1);
        });

        return [
            $days->map(fn (string $day) => Carbon::parse($day)->format('d/m'))->all(),
            $days->map(fn (string $day) => (int) round($sums[$day] ?? 0))->all(),
        ];
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private function constrainOwner(Builder $query, string $column = 'owner_id'): Builder
    {
        if ($this->ownerId !== null) {
            $query->where($column, $this->ownerId);
        }

        return $query;
    }
}
