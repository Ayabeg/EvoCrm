<?php

namespace App\Services\Meetings;

use App\Models\Activity;
use App\Models\Integration;
use App\Models\MeetingSchedule;
use App\Services\Connectors\GoogleApiClient;
use Illuminate\Support\Carbon;

class MeetingSlotFinder
{
    public function __construct(private GoogleApiClient $google) {}

    /**
     * @return list<array{starts_at: string, ends_at: string, label: string, date: string}>
     */
    public function slots(MeetingSchedule $schedule, ?Carbon $from = null, int $businessDays = 10): array
    {
        $tz = $schedule->timezone ?: MeetingSchedule::TIMEZONE;
        $now = Carbon::parse($from ?? now())->timezone($tz);
        $windowEnd = $now->copy()->addDays($businessDays + 6)->endOfDay();
        $busy = $this->busyBlocks($schedule, $now, $windowEnd);
        $weekdays = $schedule->weekdayList();
        $minutes = max(15, (int) $schedule->slot_minutes);

        $slots = [];
        $day = $now->copy()->startOfDay();
        $seenDays = 0;
        $guard = 0;

        while ($seenDays < $businessDays && $guard < 40) {
            $guard++;

            if (in_array($day->isoWeekday(), $weekdays, true)) {
                $seenDays++;
                $cursor = $day->copy()->setTimeFromTimeString($schedule->work_start);
                $close = $day->copy()->setTimeFromTimeString($schedule->work_end);

                while ($cursor->copy()->addMinutes($minutes)->lte($close)) {
                    $end = $cursor->copy()->addMinutes($minutes);

                    if ($cursor->gt($now) && ! $this->overlaps($cursor, $end, $busy)) {
                        $slots[] = [
                            'starts_at' => $cursor->clone()->timezone($tz)->toIso8601String(),
                            'ends_at' => $end->clone()->timezone($tz)->toIso8601String(),
                            'label' => $cursor->format('H:i'),
                            'date' => $cursor->toDateString(),
                        ];
                    }

                    $cursor->addMinutes($minutes);
                }
            }

            $day->addDay();
        }

        return $slots;
    }

    public function isFree(MeetingSchedule $schedule, Carbon $start, Carbon $end): bool
    {
        $busy = $this->busyBlocks($schedule, $start->copy()->subHour(), $end->copy()->addHour());

        return ! $this->overlaps($start, $end, $busy);
    }

    public function calendarConnected(MeetingSchedule $schedule): bool
    {
        $integration = $schedule->workspace?->integration(Integration::PROVIDER_GOOGLE_CALENDAR)
            ?? Integration::query()
                ->where('workspace_id', $schedule->workspace_id)
                ->where('provider', Integration::PROVIDER_GOOGLE_CALENDAR)
                ->first();

        return $integration instanceof Integration && $integration->isConnected();
    }

    /**
     * @return list<array{start: Carbon, end: Carbon}>
     */
    public function busyBlocks(MeetingSchedule $schedule, Carbon $from, Carbon $to): array
    {
        $blocks = [];

        $meetings = Activity::query()
            ->where('workspace_id', $schedule->workspace_id)
            ->where('owner_id', $schedule->user_id)
            ->where('type', 'meeting')
            ->where('done', false)
            ->whereBetween('due_at', [$from->copy()->utc(), $to->copy()->utc()])
            ->get(['due_at', 'meta']);

        foreach ($meetings as $meeting) {
            if (! $meeting->due_at) {
                continue;
            }

            $start = $meeting->due_at->clone();
            $endAt = $meeting->meta['ends_at'] ?? null;
            $end = $endAt
                ? Carbon::parse($endAt)
                : $start->copy()->addMinutes((int) $schedule->slot_minutes);

            $blocks[] = ['start' => $start, 'end' => $end];
        }

        $integration = Integration::query()
            ->where('workspace_id', $schedule->workspace_id)
            ->where('provider', Integration::PROVIDER_GOOGLE_CALENDAR)
            ->first();

        if ($integration instanceof Integration && $integration->isConnected()) {
            foreach ($this->google->busyTimes($integration, $from, $to) as $row) {
                $blocks[] = [
                    'start' => Carbon::parse($row['starts_at']),
                    'end' => Carbon::parse($row['ends_at']),
                ];
            }
        }

        return $blocks;
    }

    /**
     * @param  list<array{start: Carbon, end: Carbon}>  $busy
     */
    private function overlaps(Carbon $start, Carbon $end, array $busy): bool
    {
        foreach ($busy as $block) {
            if ($start->lt($block['end']) && $end->gt($block['start'])) {
                return true;
            }
        }

        return false;
    }
}
