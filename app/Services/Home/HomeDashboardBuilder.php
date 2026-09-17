<?php

namespace App\Services\Home;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\ActivityWorkQueueQuery;
use App\Services\Crm\DealAttentionEvaluator;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Gate;

/**
 * Operating Home — one bounded composition over P11 / P12 / P15.
 * Does not recalculate attention, timing, or financial truth.
 */
class HomeDashboardBuilder
{
    public const TZ = DealAttentionEvaluator::TIMEZONE;

    public const ATTENTION_LIMIT = 6;

    public const WORK_LIMIT = 6;

    public const RECENT_LIMIT = 6;

    public function __construct(
        private DealAttentionEvaluator $attention,
        private ActivityWorkQueueQuery $workQueue,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        $now = DealAttentionEvaluator::now();
        $workspace = $user->workspace;
        $pipeline = $workspace->defaultPipeline();
        $canEdit = $user->canPermission('crm.edit');

        $metrics = $this->metrics($workspace, $pipeline, $now);
        $attention = $this->attention($workspace, $pipeline);
        $work = $this->work($user, $now);
        $pipelineOverview = $this->pipeline($workspace, $pipeline);
        $recent = $this->recent($user, $now);

        return [
            'context' => $this->context($user, $now),
            'metrics' => $metrics,
            'attention' => $attention,
            'work' => $work,
            'pipeline' => $pipelineOverview,
            'recent' => $recent,
            'activation' => $this->activation($workspace, $canEdit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function context(User $user, CarbonInterface $now): array
    {
        $name = trim((string) $user->name);
        $first = $name !== '' ? explode(' ', $name, 2)[0] : $name;

        return [
            'name' => $first,
            'date' => $now->copy()->locale('en')->isoFormat('dddd, D MMMM YYYY'),
            'timezone' => self::TZ,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function metrics(Workspace $workspace, Pipeline $pipeline, CarbonInterface $now): array
    {
        $from = $now->copy()->startOfMonth();
        $to = $now->copy()->endOfMonth();
        $prevFrom = $from->copy()->subMonthNoOverflow()->startOfMonth();
        $prevTo = $from->copy()->subMonthNoOverflow()->endOfMonth();

        $hasDeals = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->exists();

        $wonCents = $this->closedSum($workspace, $pipeline, true, $from, $to);
        $wonPrevCents = $this->closedSum($workspace, $pipeline, true, $prevFrom, $prevTo);
        $wonCount = $this->closedCount($workspace, $pipeline, true, $from, $to);
        $lostCount = $this->closedCount($workspace, $pipeline, false, $from, $to);
        $closedCount = $wonCount + $lostCount;
        $winRate = $closedCount > 0 ? (int) round($wonCount / $closedCount * 100) : null;

        $stageRows = $this->openStageAggregates($workspace, $pipeline);
        $openCount = (int) collect($stageRows)->sum('count');
        $pipelineCents = (int) collect($stageRows)->sum('amount_cents');

        $monthLabel = $from->copy()->locale('en')->isoFormat('MMMM YYYY');

        $kpis = $hasDeals ? [
            $this->kpi(
                'revenue',
                'Won this month',
                $wonCents,
                'money',
                '/crm/deals?status=won',
                $monthLabel,
                $this->percentChange($wonCents, $wonPrevCents),
            ),
            $this->kpi(
                'pipeline',
                'Open pipeline',
                $pipelineCents,
                'money',
                '/crm/deals/board?pipeline='.$pipeline->id,
                'Unweighted open value',
                null,
            ),
            $this->kpi(
                'win_rate',
                'Win rate',
                $winRate,
                'percent',
                '/crm/deals',
                $closedCount > 0 ? 'Won / closed this month' : 'No closed deals this month',
                null,
            ),
            $this->kpi(
                'open_deals',
                'Open deals',
                $openCount,
                'number',
                '/crm/deals',
                'Active in default pipeline',
                null,
            ),
        ] : [];

        return [
            'window' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'label' => $monthLabel,
                'timezone' => self::TZ,
            ],
            'kpis' => $kpis,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attention(Workspace $workspace, Pipeline $pipeline): array
    {
        $query = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id);

        return [
            'items' => $this->attention->queue($query, self::ATTENTION_LIMIT),
            'view_all_href' => '/crm/deals?attention=needs_attention',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function work(User $user, CarbonInterface $now): array
    {
        $preview = $this->workQueue->dashboardWork($user, self::WORK_LIMIT, $now);

        return [
            'counts' => $preview['counts'],
            'items' => $preview['items'],
            'view_all_href' => '/crm/activities',
            'overdue_href' => '/crm/activities?group=overdue',
            'today_href' => '/crm/activities?group=today',
            'upcoming_href' => '/crm/activities?group=upcoming',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pipeline(Workspace $workspace, Pipeline $pipeline): array
    {
        $stages = $this->openStageAggregates($workspace, $pipeline);

        return [
            'pipeline_id' => (int) $pipeline->id,
            'label' => (string) $pipeline->name,
            'deal_count' => (int) collect($stages)->sum('count'),
            'amount_cents' => (int) collect($stages)->sum('amount_cents'),
            'currency' => 'DZD',
            'weighted' => false,
            'stages' => $stages,
            'view_all_href' => '/crm/deals/board?pipeline='.$pipeline->id,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function recent(User $user, CarbonInterface $now): array
    {
        $rows = Activity::query()
            ->forWorkspace($user->workspace)
            ->select([
                'id',
                'workspace_id',
                'type',
                'subject',
                'done',
                'created_at',
                'owner_id',
                'contact_id',
                'deal_id',
                'company_id',
            ])
            ->with([
                'contact:id,workspace_id,first_name,last_name',
                'deal:id,workspace_id,title',
                'company:id,workspace_id,name',
            ])
            ->latest('created_at')
            ->limit(12)
            ->get()
            ->filter(fn (Activity $activity): bool => Gate::forUser($user)->allows('view', $activity))
            ->take(self::RECENT_LIMIT)
            ->values();

        $items = $rows->map(function (Activity $activity) use ($user): array {
            $subject = trim((string) ($activity->subject ?? ''));
            $created = $activity->created_at instanceof CarbonInterface
                ? $activity->created_at->timezone(self::TZ)->toIso8601String()
                : null;

            return [
                'id' => (int) $activity->id,
                'type' => (string) $activity->type,
                'subject' => $subject !== '' ? $subject : ucfirst((string) $activity->type),
                'at' => $created,
                'recordRef' => $this->recentRecordRef($user, $activity),
                'related' => $this->recentRelated($user, $activity),
            ];
        })->all();

        return [
            'kind' => 'logged_activity',
            'items' => $items,
            'view_all_href' => '/crm/activities',
        ];
    }

    /**
     * @return list<array{label: string, href: string}>
     */
    private function activation(Workspace $workspace, bool $canEdit): array
    {
        if (! $canEdit) {
            return [];
        }

        $hasDeals = Deal::query()->forWorkspace($workspace)->exists();
        $hasActivities = Activity::query()->forWorkspace($workspace)->exists();

        if ($hasDeals || $hasActivities) {
            return [];
        }

        return [
            ['label' => __('Create deal'), 'href' => '/crm/deals?create=1'],
            ['label' => __('Create contact'), 'href' => '/crm/contacts?create=1'],
            ['label' => __('Log activity'), 'href' => '/crm/activities?create=1'],
        ];
    }

    /**
     * @return list<array{id: int, name: string, slug: string, count: int, amount_cents: int, href: string}>
     */
    private function openStageAggregates(Workspace $workspace, Pipeline $pipeline): array
    {
        $stages = $pipeline->stages()
            ->orderBy('position')
            ->get(['id', 'name', 'slug', 'is_won', 'is_lost', 'position']);

        $open = $stages->filter(
            fn (Stage $stage): bool => ! $stage->is_won && ! $stage->is_lost,
        )->values();

        $ids = $open->pluck('id');
        $sums = $ids->isEmpty()
            ? collect()
            : Deal::query()
                ->forWorkspace($workspace)
                ->where('pipeline_id', $pipeline->id)
                ->whereIn('stage_id', $ids)
                ->selectRaw('stage_id, COUNT(*) as deal_count, COALESCE(SUM(amount_cents), 0) as amount_cents')
                ->groupBy('stage_id')
                ->get()
                ->keyBy('stage_id');

        return $open->map(function (Stage $stage) use ($sums, $pipeline): array {
            $row = $sums->get($stage->id);

            return [
                'id' => (int) $stage->id,
                'name' => (string) $stage->name,
                'slug' => (string) $stage->slug,
                'count' => (int) ($row->deal_count ?? 0),
                'amount_cents' => (int) ($row->amount_cents ?? 0),
                'href' => '/crm/deals?pipeline='.$pipeline->id.'&stage='.$stage->slug,
            ];
        })->all();
    }

    private function closedSum(
        Workspace $workspace,
        Pipeline $pipeline,
        bool $won,
        CarbonInterface $from,
        CarbonInterface $to,
    ): int {
        return (int) Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->whereNotNull('closed_at')
            ->whereBetween('closed_at', [$from, $to])
            ->whereHas(
                'stage',
                fn ($stage) => $won
                    ? $stage->where('is_won', true)
                    : $stage->where('is_lost', true),
            )
            ->sum('amount_cents');
    }

    private function closedCount(
        Workspace $workspace,
        Pipeline $pipeline,
        bool $won,
        CarbonInterface $from,
        CarbonInterface $to,
    ): int {
        return (int) Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->whereNotNull('closed_at')
            ->whereBetween('closed_at', [$from, $to])
            ->whereHas(
                'stage',
                fn ($stage) => $won
                    ? $stage->where('is_won', true)
                    : $stage->where('is_lost', true),
            )
            ->count();
    }

    /**
     * @return array<string, mixed>
     */
    private function kpi(
        string $key,
        string $label,
        ?int $value,
        string $format,
        string $href,
        ?string $hint,
        ?int $change,
    ): array {
        return [
            'key' => $key,
            'label' => __($label),
            'value' => $value,
            'format' => $format,
            'hint' => $hint !== null ? __($hint) : null,
            'href' => $href,
            'change' => $change,
            'changeLabel' => $change !== null ? __('vs last month') : null,
        ];
    }

    private function percentChange(int $current, int $previous): ?int
    {
        if ($previous <= 0) {
            return null;
        }

        return (int) round(($current - $previous) / $previous * 100);
    }

    /**
     * @return array{type: string, id: int}|null
     */
    private function recentRecordRef(User $user, Activity $activity): ?array
    {
        $deal = $activity->deal;
        if ($deal instanceof Deal && Gate::forUser($user)->allows('view', $deal)) {
            return ['type' => 'deal', 'id' => (int) $deal->id];
        }

        $contact = $activity->contact;
        if ($contact instanceof Contact && Gate::forUser($user)->allows('view', $contact)) {
            return ['type' => 'contact', 'id' => (int) $contact->id];
        }

        $company = $activity->company;
        if ($company instanceof Company && Gate::forUser($user)->allows('view', $company)) {
            return ['type' => 'company', 'id' => (int) $company->id];
        }

        return null;
    }

    /**
     * @return list<array{type: string, id: int, label: string}>
     */
    private function recentRelated(User $user, Activity $activity): array
    {
        $related = [];
        $deal = $activity->deal;
        if ($deal instanceof Deal && Gate::forUser($user)->allows('view', $deal)) {
            $related[] = [
                'type' => 'deal',
                'id' => (int) $deal->id,
                'label' => (string) $deal->title,
            ];
        }

        $contact = $activity->contact;
        if ($contact instanceof Contact && Gate::forUser($user)->allows('view', $contact)) {
            $related[] = [
                'type' => 'contact',
                'id' => (int) $contact->id,
                'label' => $contact->displayName(),
            ];
        }

        $company = $activity->company;
        if ($company instanceof Company && Gate::forUser($user)->allows('view', $company)) {
            $related[] = [
                'type' => 'company',
                'id' => (int) $company->id,
                'label' => (string) $company->name,
            ];
        }

        return $related;
    }
}
