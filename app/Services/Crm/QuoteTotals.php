<?php

namespace App\Services\Crm;

use App\Models\Quote;

class QuoteTotals
{
    /**
     * @param  array<int, array{name: string, quantity?: int, unit_cents?: int, unit_dzd?: float|int}>  $items
     */
    public function sync(Quote $quote, array $items): Quote
    {
        $quote->items()->delete();

        $total = 0;

        foreach ($items as $item) {
            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $unit = array_key_exists('unit_cents', $item)
                ? (int) $item['unit_cents']
                : (int) round(((float) ($item['unit_dzd'] ?? 0)) * 100);
            $line = $quantity * $unit;
            $total += $line;

            $quote->items()->create([
                'name' => $item['name'],
                'quantity' => $quantity,
                'unit_cents' => $unit,
                'total_cents' => $line,
            ]);
        }

        $quote->forceFill(['total_cents' => $total])->save();

        return $quote->fresh(['items']) ?? $quote;
    }

    public function recount(Quote $quote): Quote
    {
        $total = (int) $quote->items()->sum('total_cents');
        $quote->forceFill(['total_cents' => $total])->save();

        return $quote->fresh(['items']) ?? $quote;
    }
}
