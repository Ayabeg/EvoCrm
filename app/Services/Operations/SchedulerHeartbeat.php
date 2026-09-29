<?php

namespace App\Services\Operations;

use Illuminate\Support\Facades\Cache;

class SchedulerHeartbeat
{
    public const CACHE_KEY = 'scheduler:heartbeat_at';

    public const STALE_AFTER_SECONDS = 180;

    public function beat(): string
    {
        $at = now()->toIso8601String();

        Cache::put(self::CACHE_KEY, $at, now()->addDay());

        return $at;
    }

    /**
     * @return array{ok: bool, last_run_at: string|null, stale: bool, stale_after_seconds: int}
     */
    public function status(): array
    {
        $lastRunAt = Cache::get(self::CACHE_KEY);
        $lastRunAt = is_string($lastRunAt) && $lastRunAt !== '' ? $lastRunAt : null;
        $stale = $lastRunAt === null
            || now()->parse($lastRunAt)->lt(now()->subSeconds(self::STALE_AFTER_SECONDS));

        return [
            'ok' => $lastRunAt !== null && ! $stale,
            'last_run_at' => $lastRunAt,
            'stale' => $stale,
            'stale_after_seconds' => self::STALE_AFTER_SECONDS,
        ];
    }
}
