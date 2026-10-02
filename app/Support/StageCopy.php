<?php

namespace App\Support;

use Illuminate\Support\Collection;

/**
 * One display order for pipeline stages. Backend slugs stay English;
 * customer labels go through __() so FR/EN/AR stay in lockstep.
 */
class StageCopy
{
    public const DISPLAY_ORDER = ['new', 'qualified', 'proposal', 'demo', 'won', 'lost'];

    public const KEYS = [
        'new' => 'New',
        'qualified' => 'Qualification',
        'proposal' => 'Proposal',
        'demo' => 'Demo',
        'won' => 'Won',
        'lost' => 'Lost',
    ];

    public static function key(?string $slug): ?string
    {
        if (! $slug || ! isset(self::KEYS[$slug])) {
            return null;
        }

        return self::KEYS[$slug];
    }

    public static function label(?string $slug, ?string $fallback = null): string
    {
        $key = self::key($slug);

        if ($key) {
            return __($key);
        }

        return $fallback ? __($fallback) : '—';
    }

    /**
     * @param  Collection<int, mixed>|array<int, mixed>  $stages
     * @return Collection<int, mixed>
     */
    public static function sort(Collection|array $stages): Collection
    {
        return collect($stages)
            ->sortBy(function (mixed $stage): int {
                $slug = is_array($stage)
                    ? (string) ($stage['slug'] ?? '')
                    : (string) ($stage->slug ?? '');
                $index = array_search($slug, self::DISPLAY_ORDER, true);

                return $index === false ? 99 : $index;
            })
            ->values();
    }

    public static function isOpen(?string $slug, bool $isWon = false, bool $isLost = false): bool
    {
        if ($isWon || $isLost) {
            return false;
        }

        return in_array($slug, ['new', 'qualified', 'proposal', 'demo'], true);
    }
}
