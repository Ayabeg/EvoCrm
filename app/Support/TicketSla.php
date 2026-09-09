<?php

namespace App\Support;

use App\Models\Ticket;
use DateTimeInterface;
use Illuminate\Support\Carbon;

final class TicketSla
{
    public const TIMEZONE = 'Africa/Algiers';

    public const WORK_START = '08:00';

    public const WORK_END = '21:00';

    public const HIGH_HOURS = 8;

    public const DEFAULT_HOURS = 24;

    public static function hoursFor(?string $priority): int
    {
        return $priority === Ticket::PRIORITY_HIGH ? self::HIGH_HOURS : self::DEFAULT_HOURS;
    }

    public static function dueAt(?string $priority, DateTimeInterface|null $from = null): Carbon
    {
        return self::addWorkingHours($from ?? now(), self::hoursFor($priority));
    }

    public static function addWorkingHours(DateTimeInterface $from, int $hours): Carbon
    {
        $cursor = Carbon::parse($from)->timezone(self::TIMEZONE);
        $remaining = max(0, $hours) * 60;
        $guard = 0;

        while ($remaining > 0 && $guard < 10_000) {
            $guard++;
            $cursor = self::snapToWork($cursor);
            $end = $cursor->copy()->setTimeFromTimeString(self::WORK_END);
            $available = (int) $cursor->diffInMinutes($end, false);

            if ($available <= 0) {
                $cursor = self::nextWorkStart($cursor);

                continue;
            }

            if ($remaining <= $available) {
                return $cursor->copy()->addMinutes($remaining);
            }

            $remaining -= $available;
            $cursor = self::nextWorkStart($end);
        }

        return $cursor;
    }

    /**
     * @return 'none'|'open'|'met'|'breached'
     */
    public static function state(Ticket $ticket, DateTimeInterface|null $now = null): string
    {
        if (! $ticket->sla_due_at) {
            return 'none';
        }

        $now = Carbon::parse($now ?? now());

        if ($ticket->first_response_at) {
            return $ticket->first_response_at->lte($ticket->sla_due_at) ? 'met' : 'breached';
        }

        return $now->gt($ticket->sla_due_at) ? 'breached' : 'open';
    }

    public static function label(Ticket $ticket, DateTimeInterface|null $now = null): string
    {
        return match (self::state($ticket, $now)) {
            'met' => 'Met',
            'breached' => 'Overdue',
            'open' => self::remainingLabel($ticket->sla_due_at, $now),
            default => '—',
        };
    }

    public static function remainingLabel(?DateTimeInterface $due, DateTimeInterface|null $now = null): string
    {
        if (! $due) {
            return '—';
        }

        $now = Carbon::parse($now ?? now())->timezone(self::TIMEZONE);
        $dueAt = Carbon::parse($due)->timezone(self::TIMEZONE);
        $minutes = (int) $now->diffInMinutes($dueAt, false);

        if ($minutes <= 0) {
            return 'Overdue';
        }

        if ($minutes < 60) {
            return $minutes.'m left';
        }

        $hours = intdiv($minutes, 60);

        if ($hours < 24) {
            return $hours.'h left';
        }

        return intdiv($hours, 24).'d left';
    }

    protected static function snapToWork(Carbon $at): Carbon
    {
        $hm = $at->format('H:i');

        if ($hm >= self::WORK_START && $hm < self::WORK_END) {
            return $at;
        }

        if ($hm < self::WORK_START) {
            return $at->copy()->setTimeFromTimeString(self::WORK_START);
        }

        return $at->copy()->addDay()->setTimeFromTimeString(self::WORK_START);
    }

    protected static function nextWorkStart(Carbon $at): Carbon
    {
        $hm = $at->format('H:i');

        if ($hm < self::WORK_START) {
            return $at->copy()->setTimeFromTimeString(self::WORK_START);
        }

        return $at->copy()->addDay()->setTimeFromTimeString(self::WORK_START);
    }
}
