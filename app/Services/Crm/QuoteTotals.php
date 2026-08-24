<?php

namespace App\Services\Crm;

use App\Models\Product;
use App\Models\Quote;

class QuoteTotals
{
    /**
     * @param  array<int, array{name?: string, product_id?: int, quantity?: int, unit_cents?: int, unit_dzd?: float|int}>  $items
     */
    public function sync(Quote $quote, array $items): Quote
    {
        $quote->items()->delete();

        $total = 0;

        foreach ($items as $item) {
            $product = $this->resolveProduct($quote, $item);
            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $unit = $this->unitCents($item, $product);
            $line = $quantity * $unit;
            $total += $line;

            $quote->items()->create([
                'product_id' => $product?->id,
                'name' => filled($item['name'] ?? null) ? $item['name'] : ($product?->name ?? 'Line item'),
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

    /**
     * @param  array{product_id?: int}  $item
     */
    protected function resolveProduct(Quote $quote, array $item): ?Product
    {
        $productId = (int) ($item['product_id'] ?? 0);

        if ($productId < 1) {
            return null;
        }

        return Product::query()
            ->forWorkspace($quote->workspace_id)
            ->active()
            ->find($productId);
    }

    /**
     * @param  array{unit_cents?: int, unit_dzd?: float|int}  $item
     */
    protected function unitCents(array $item, ?Product $product): int
    {
        if (array_key_exists('unit_cents', $item) && $item['unit_cents'] !== null) {
            return (int) $item['unit_cents'];
        }

        if (array_key_exists('unit_dzd', $item) && $item['unit_dzd'] !== null) {
            return (int) round(((float) $item['unit_dzd']) * 100);
        }

        return (int) ($product?->unit_cents ?? 0);
    }
}
