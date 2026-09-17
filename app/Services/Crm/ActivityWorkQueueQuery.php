<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;

/**
 * Permission-safe Activities work queue. One Activity domain.
 * Counts are authoritative totals for the current scope/type/owner — not page-scoped.
 */
class ActivityWorkQueueQuery
{
    public const PAGE_SIZE = 40;

    public const GROUP_LIMIT = 40;

    public const COMPLETED_PREVIEW = 8;

    /** @var list<string> */
    public const TYPES = ['note', 'task', 'call', 'meeting', 'email'];

    /** @var list<string> */
    public const SCOPES = ['mine', 'all'];

    /**
     * @return array<string, mixed>
     */
    public function present(User $user, Request $request, ?CarbonInterface $now = null): array
    {
        $now = ActivityTiming::now($now);
        $filters = $this->normalizeFilters($request, $user);
        $base = $this->baseQuery($user, $filters);

        $counts = [];
        foreach (ActivityTiming::GROUPS as $group) {
            $counts[$group] = (int) ActivityTiming::constrain(clone $base, $group, $now)->count();
        }
        $counts['open'] = $counts['overdue'] + $counts['today'] + $counts['upcoming'] + $counts['unscheduled'];
        $counts['total'] = $counts['open'] + $counts['completed'];

        if ($filters['group'] !== null) {
            [$groups, $flat, $paginator] = $this->presentSingleGroup(
                $user,
                $base,
                $filters['group'],
                $counts,
                $filters['page'],
                $now,
            );
        } else {
            [$groups, $flat, $paginator] = $this->presentGrouped($user, $base, $counts, $now);
        }

        $members = $user->workspace->users()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $member): array => [
                'id' => (int) $member->id,
                'name' => (string) $member->name,
            ])
            ->values()
            ->all();

        return [
            'queue' => [
                'groups' => $groups,
                'counts' => $counts,
                'paginator' => $paginator,
            ],
            'activities' => $flat,
            'members' => $members,
            'filters' => $filters,
            'capabilities' => [
                'can_create' => Gate::forUser($user)->allows('create', Activity::class),
                'can_complete' => $user->canPermission('crm.edit'),
            ],
            'recordCount' => $filters['group'] !== null
                ? $counts[$filters['group']]
                : $counts['open'],
        ];
    }

    /**
     * Compact My work preview for the operating home. Same timing predicates
     * and row presenter as the P15 queue. Does not recalculate overdue/today.
     *
     * @return array{counts: array{overdue: int, today: int, upcoming: int}, items: list<array<string, mixed>>}
     */
    public function dashboardWork(User $user, int $limit = 6, ?CarbonInterface $now = null): array
    {
        $now = ActivityTiming::now($now);
        $limit = max(1, min(8, $limit));
        $base = $this->baseQuery($user, [
            'scope' => 'mine',
            'type' => null,
            'owner_id' => (int) $user->id,
        ]);

        $counts = [
            'overdue' => (int) ActivityTiming::constrain(clone $base, ActivityTiming::GROUP_OVERDUE, $now)->count(),
            'today' => (int) ActivityTiming::constrain(clone $base, ActivityTiming::GROUP_TODAY, $now)->count(),
            'upcoming' => (int) ActivityTiming::constrain(clone $base, ActivityTiming::GROUP_UPCOMING, $now)->count(),
        ];

        $items = [];
        foreach ([
            ActivityTiming::GROUP_OVERDUE,
            ActivityTiming::GROUP_TODAY,
            ActivityTiming::GROUP_UPCOMING,
        ] as $group) {
            $remaining = $limit - count($items);
            if ($remaining <= 0) {
                break;
            }

            $query = ActivityTiming::constrain(clone $base, $group, $now);
            $this->orderGroup($query, $group);
            $items = array_merge(
                $items,
                $this->presentRows($user, $query->limit($remaining)->get(), $now),
            );
        }

        return [
            'counts' => $counts,
            'items' => array_slice($items, 0, $limit),
        ];
    }

    /**
     * @return array{
     *     scope: string,
     *     group: ?string,
     *     type: ?string,
     *     owner_id: ?int,
     *     page: int,
     *     create: bool
     * }
     */
    public function normalizeFilters(Request $request, User $user): array
    {
        $scope = $request->string('scope')->toString();
        if (! in_array($scope, self::SCOPES, true)) {
            $scope = 'mine';
        }

        $group = $request->string('group')->toString();
        if ($group === '') {
            $date = $request->string('date')->toString();
            if (in_array($date, ['overdue', 'today'], true)) {
                $group = $date;
            }
        }
        if (! in_array($group, ActivityTiming::GROUPS, true)) {
            $group = null;
        }

        $type = $request->string('type')->toString();
        if (! in_array($type, self::TYPES, true)) {
            $type = null;
        }

        $ownerId = $request->integer('owner_id') ?: null;
        if ($scope === 'mine') {
            $ownerId = (int) $user->id;
        }

        return [
            'scope' => $scope,
            'group' => $group,
            'type' => $type,
            'owner_id' => $ownerId,
            'page' => max(1, $request->integer('page') ?: 1),
            'create' => $request->string('create')->toString() === '1',
        ];
    }

    /**
     * @param  array{scope: string, type: ?string, owner_id: ?int}  $filters
     * @return Builder<Activity>
     */
    private function baseQuery(User $user, array $filters): Builder
    {
        $query = Activity::query()
            ->forWorkspace($user->workspace)
            ->select([
                'id',
                'workspace_id',
                'type',
                'subject',
                'due_at',
                'completed_at',
                'done',
                'owner_id',
                'contact_id',
                'deal_id',
                'company_id',
                'meta',
                'created_at',
            ])
            ->with([
                'owner:id,name',
                'contact:id,workspace_id,first_name,last_name',
                'deal:id,workspace_id,title',
                'company:id,workspace_id,name',
            ]);

        if ($filters['scope'] === 'mine') {
            $query->where('owner_id', $user->id);
        } elseif ($filters['owner_id'] !== null) {
            $query->where('owner_id', $filters['owner_id']);
        }

        if ($filters['type'] !== null) {
            $query->where('type', $filters['type']);
        }

        return $query;
    }

    /**
     * @param  Builder<Activity>  $base
     * @param  array<string, int>  $counts
     * @return array{0: array<string, mixed>, 1: list<array<string, mixed>>, 2: array<string, mixed>}
     */
    private function presentSingleGroup(
        User $user,
        Builder $base,
        string $group,
        array $counts,
        int $page,
        CarbonInterface $now,
    ): array {
        $total = $counts[$group];
        $lastPage = max(1, (int) ceil($total / self::PAGE_SIZE));
        $page = min($page, $lastPage);

        $query = ActivityTiming::constrain(clone $base, $group, $now);
        $this->orderGroup($query, $group);
        $items = $this->presentRows($user, $query->forPage($page, self::PAGE_SIZE)->get(), $now);

        $groups = [
            $group => [
                'key' => $group,
                'label' => $this->label($group),
                'count' => $total,
                'items' => $items,
                'has_more' => $page < $lastPage,
            ],
        ];

        return [
            $groups,
            $items,
            [
                'page' => $page,
                'last_page' => $lastPage,
                'per_page' => self::PAGE_SIZE,
                'has_more' => $page < $lastPage,
            ],
        ];
    }

    /**
     * @param  Builder<Activity>  $base
     * @param  array<string, int>  $counts
     * @return array{0: array<string, mixed>, 1: list<array<string, mixed>>, 2: array<string, mixed>}
     */
    private function presentGrouped(User $user, Builder $base, array $counts, CarbonInterface $now): array
    {
        $groups = [];
        $flat = [];

        foreach ([ActivityTiming::GROUP_OVERDUE, ActivityTiming::GROUP_TODAY, ActivityTiming::GROUP_UPCOMING] as $group) {
            $section = $this->presentLimitedGroup($user, $base, $group, $counts[$group], self::GROUP_LIMIT, $now);
            $groups[$group] = $section;
            $flat = array_merge($flat, $section['items']);
        }

        if ($counts['unscheduled'] > 0) {
            $section = $this->presentLimitedGroup(
                $user,
                $base,
                ActivityTiming::GROUP_UNSCHEDULED,
                $counts['unscheduled'],
                self::GROUP_LIMIT,
                $now,
            );
            $groups['unscheduled'] = $section;
            $flat = array_merge($flat, $section['items']);
        }

        $section = $this->presentLimitedGroup(
            $user,
            $base,
            ActivityTiming::GROUP_COMPLETED,
            $counts['completed'],
            self::COMPLETED_PREVIEW,
            $now,
        );
        $groups['completed'] = $section;

        return [
            $groups,
            $flat,
            [
                'page' => 1,
                'last_page' => 1,
                'per_page' => self::GROUP_LIMIT,
                'has_more' => false,
            ],
        ];
    }

    /**
     * @param  Builder<Activity>  $base
     * @return array{key: string, label: string, count: int, items: list<array<string, mixed>>, has_more: bool}
     */
    private function presentLimitedGroup(
        User $user,
        Builder $base,
        string $group,
        int $count,
        int $limit,
        CarbonInterface $now,
    ): array {
        $query = ActivityTiming::constrain(clone $base, $group, $now);
        $this->orderGroup($query, $group);
        $items = $this->presentRows($user, $query->limit($limit)->get(), $now);

        return [
            'key' => $group,
            'label' => $this->label($group),
            'count' => $count,
            'items' => $items,
            'has_more' => $count > count($items),
        ];
    }

    /**
     * @param  Builder<Activity>  $query
     */
    private function orderGroup(Builder $query, string $group): void
    {
        if ($group === ActivityTiming::GROUP_COMPLETED) {
            $query->orderByDesc('completed_at')->orderByDesc('id');

            return;
        }

        if ($group === ActivityTiming::GROUP_UNSCHEDULED) {
            $query->orderByDesc('created_at')->orderByDesc('id');

            return;
        }

        $query->orderBy('due_at')->orderBy('id');
    }

    /**
     * @param  Collection<int, Activity>  $rows
     * @return list<array<string, mixed>>
     */
    private function presentRows(User $user, Collection $rows, CarbonInterface $now): array
    {
        return $rows
            ->filter(fn (Activity $activity): bool => Gate::forUser($user)->allows('view', $activity))
            ->map(fn (Activity $activity): array => $this->presentRow($user, $activity, $now))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function presentRow(User $user, Activity $activity, CarbonInterface $now): array
    {
        $dueAt = $activity->due_at instanceof CarbonInterface
            ? $activity->due_at->timezone(DealAttentionEvaluator::TIMEZONE)->toIso8601String()
            : null;
        $completedAt = $activity->completed_at instanceof CarbonInterface
            ? $activity->completed_at->timezone(DealAttentionEvaluator::TIMEZONE)->toIso8601String()
            : null;

        return [
            'id' => (int) $activity->id,
            'type' => (string) $activity->type,
            'subject' => $this->subject($activity),
            'due_at' => $dueAt,
            'completed_at' => $completedAt,
            'done' => (bool) $activity->done,
            'group' => ActivityTiming::bucket($activity, $now),
            'owner' => $activity->owner ? [
                'id' => (int) $activity->owner->id,
                'name' => (string) $activity->owner->name,
            ] : null,
            'related' => $this->related($user, $activity),
            'meta' => [
                'attendance' => $activity->attendance(),
            ],
            'can_complete' => $activity->done === false
                && Gate::forUser($user)->allows('update', $activity),
        ];
    }

    private function subject(Activity $activity): string
    {
        $subject = trim((string) ($activity->subject ?? ''));

        return $subject !== '' ? $subject : ucfirst((string) $activity->type);
    }

    /**
     * Compact Deal → Contact → Company. Omit any association the user cannot view.
     * Never amount, stage, or attention.
     *
     * @return list<array{type: string, id: int, label: string}>
     */
    private function related(User $user, Activity $activity): array
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

    private function label(string $group): string
    {
        return match ($group) {
            ActivityTiming::GROUP_OVERDUE => 'Overdue',
            ActivityTiming::GROUP_TODAY => 'Today',
            ActivityTiming::GROUP_UPCOMING => 'Upcoming',
            ActivityTiming::GROUP_UNSCHEDULED => 'Unscheduled',
            ActivityTiming::GROUP_COMPLETED => 'Completed',
            default => ucfirst($group),
        };
    }
}
