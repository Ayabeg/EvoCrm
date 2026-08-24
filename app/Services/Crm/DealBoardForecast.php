<?php

namespace App\Services\Crm;

use App\Models\Stage;

/**
 * Weighted pipeline forecast for the deals board.
 *
 * Stage win probability is 0–100. Stored `stages.probability` wins when set;
 * otherwise the Evotechly Sales defaults from config('evosales.pipeline'):
 * New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0.
 * Unknown open stages use config('evosales.stage_probability_fallback') (20).
 */
class DealBoardForecast
{
    public static function probabilityFor(Stage $stage): int
    {
        $stored = $stage->getAttributes()['probability'] ?? null;

        if ($stored !== null && $stored !== '') {
            return max(0, min(100, (int) $stored));
        }

        if ($stage->is_won) {
            return 100;
        }

        if ($stage->is_lost) {
            return 0;
        }

        $configured = collect(config('evosales.pipeline', []))
            ->firstWhere('slug', $stage->slug);

        if (is_array($configured) && array_key_exists('probability', $configured)) {
            return max(0, min(100, (int) $configured['probability']));
        }

        return max(0, min(100, (int) config('evosales.stage_probability_fallback', 20)));
    }

    public static function weightedCents(int $amountCents, int $probability): int
    {
        return (int) round($amountCents * max(0, min(100, $probability)) / 100);
    }
}
