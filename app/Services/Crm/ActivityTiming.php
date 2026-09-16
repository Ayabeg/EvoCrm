<?php

namespace App\Services\Crm;

use App\Models\Activity;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

/**
 * Shared Activity timing buckets.
 *
 * Overdue is the P12 predicate: incomplete + real due_at + due_at < now(Africa/Algiers).
 * Clock is DealAttentionEvaluator::TIMEZONE — not browser-local, not workspaces.timezone.
 */
class ActivityTiming
{
    public const GROUP_OVERDUE = 'overdue';

    public const GROUP_TODAY = 'today';

    public const GROUP_UPCOMING = 'upcoming';

    public const GROUP_UNSCHEDULED = 'unscheduled';

    public const GROUP_COMPLETED = 'completed';

    /** @var list<string> */
    public const GROUPS = [
        self::GROUP_OVERDUE,
        self::GROUP_TODAY,
        self::GROUP_UPCOMING,
        self::GROUP_UNSCHEDULED,
        self::GROUP_COMPLETED,
    ];

    public static function now(?CarbonInterface $now = null): CarbonInterface
    {
        return $now ?? DealAttentionEvaluator::now();
    }

    public static function endOfDay(?CarbonInterface $now = null): CarbonInterface
    {
        return self::now($now)->copy()->endOfDay();
    }

    public static function isOverdue(Activity $activity, ?CarbonInterface $now = null): bool
    {
        $now = self::now($now);

        return $activity->done === false
            && $activity->due_at instanceof CarbonInterface
            && $activity->due_at->lt($now);
    }

    public static function isToday(Activity $activity, ?CarbonInterface $now = null): bool
    {
        $now = self::now($now);

        return $activity->done === false
            && $activity->due_at instanceof CarbonInterface
            && ! $activity->due_at->lt($now)
            && $activity->due_at->lte(self::endOfDay($now));
    }

    public static function isUpcoming(Activity $activity, ?CarbonInterface $now = null): bool
    {
        $now = self::now($now);

        return $activity->done === false
            && $activity->due_at instanceof CarbonInterface
            && $activity->due_at->gt(self::endOfDay($now));
    }

    public static function isUnscheduled(Activity $activity): bool
    {
        return $activity->done === false && $activity->due_at === null;
    }

    public static function isCompleted(Activity $activity): bool
    {
        return $activity->done === true;
    }

    public static function bucket(Activity $activity, ?CarbonInterface $now = null): string
    {
        if (self::isCompleted($activity)) {
            return self::GROUP_COMPLETED;
        }

        if (self::isUnscheduled($activity)) {
            return self::GROUP_UNSCHEDULED;
        }

        if (self::isOverdue($activity, $now)) {
            return self::GROUP_OVERDUE;
        }

        if (self::isToday($activity, $now)) {
            return self::GROUP_TODAY;
        }

        return self::GROUP_UPCOMING;
    }

    /**
     * @param  Builder<Activity>  $query
     * @return Builder<Activity>
     */
    public static function constrain(Builder $query, string $group, ?CarbonInterface $now = null): Builder
    {
        $now = self::now($now);
        $endOfDay = self::endOfDay($now);

        return match ($group) {
            self::GROUP_OVERDUE => $query
                ->where('done', false)
                ->whereNotNull('due_at')
                ->where('due_at', '<', $now),
            self::GROUP_TODAY => $query
                ->where('done', false)
                ->whereNotNull('due_at')
                ->where('due_at', '>=', $now)
                ->where('due_at', '<=', $endOfDay),
            self::GROUP_UPCOMING => $query
                ->where('done', false)
                ->whereNotNull('due_at')
                ->where('due_at', '>', $endOfDay),
            self::GROUP_UNSCHEDULED => $query
                ->where('done', false)
                ->whereNull('due_at'),
            self::GROUP_COMPLETED => $query->where('done', true),
            default => $query,
        };
    }
}
