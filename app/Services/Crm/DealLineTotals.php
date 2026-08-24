<?php

namespace App\Services\Crm;

use App\Models\Deal;
use App\Models\DealLineItem;
use App\Models\Product;

class DealLineTotals
{
    /**
     * @param  array{product_id?: int, name?: string, sku?: string, quantity?: int, unit_cents?: int, unit_dzd?: float|int}  $item
     */
    public function add(Deal $deal, array $item, ?Product $product = null): DealLineItem
    {
        $quantity = max(1, (int) ($item['quantity'] ?? 1));
        $unit = $this->unitCents($item, $product);
        $name = filled($item['name'] ?? null)
            ? (string) $item['name']
            : (string) ($product?->name ?? 'Line item');
        $sku = filled($item['sku'] ?? null)
            ? (string) $item['sku']
            : $product?->sku;

        $line = $deal->lineItems()->create([
            'product_id' => $product?->id ?? ($item['product_id'] ?? null),
            'name' => $name,
            'sku' => $sku,
            'quantity' => $quantity,
            'unit_cents' => $unit,
            'total_cents' => $quantity * $unit,
        ]);

        $this->rollup($deal);

        return $line;
    }

    public function remove(DealLineItem $item): Deal
    {
        $deal = $item->deal;
        $item->delete();

        return $this->rollup($deal);
    }

    /**
     * When the deal has line items, amount_cents is their sum (DZD cents).
     * With no items, the existing manual amount is left alone.
     */
    public function rollup(Deal $deal): Deal
    {
        if ($deal->lineItems()->doesntExist()) {
            return $deal->fresh(['lineItems']) ?? $deal;
        }

        $total = (int) $deal->lineItems()->sum('total_cents');
        $deal->forceFill(['amount_cents' => $total, 'currency' => 'DZD'])->save();

        return $deal->fresh(['lineItems']) ?? $deal;
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
