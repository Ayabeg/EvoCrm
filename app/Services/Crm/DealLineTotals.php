<?php

namespace App\Services\Crm;

use App\Models\Deal;
use App\Models\DealLineItem;
use App\Models\Product;

class DealLineTotals
{
    /**
     * @param  array<string, mixed>  $item
     */
    public function add(Deal $deal, array $item, ?Product $product = null): DealLineItem
    {
        $quantity = max(1, (int) ($item['quantity'] ?? 1));
        $unit = $this->unitCents($item, $product);
        $name = filled($item['name'] ?? null)
            ? (string) $item['name']
            : ($product instanceof Product ? $product->name : 'Line item');
        $sku = filled($item['sku'] ?? null)
            ? (string) $item['sku']
            : ($product instanceof Product ? $product->sku : null);

        $line = $deal->lineItems()->create([
            'product_id' => $product instanceof Product ? $product->id : ($item['product_id'] ?? null),
            'name' => $name,
            'sku' => $sku,
            'quantity' => $quantity,
            'unit_cents' => $unit,
            'total_cents' => $quantity * $unit,
        ]);

        $this->rollup($deal);

        return $line;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    public function update(DealLineItem $line, array $item, ?Product $product = null): DealLineItem
    {
        $quantity = max(1, (int) ($item['quantity'] ?? $line->quantity));
        $unit = array_key_exists('unit_cents', $item) || array_key_exists('unit_dzd', $item)
            ? $this->unitCents($item, $product)
            : (int) $line->unit_cents;
        $name = filled($item['name'] ?? null)
            ? (string) $item['name']
            : ($product instanceof Product ? $product->name : $line->name);
        $sku = filled($item['sku'] ?? null)
            ? (string) $item['sku']
            : ($product instanceof Product ? $product->sku : $line->sku);

        $line->forceFill([
            'product_id' => $product instanceof Product ? $product->id : ($item['product_id'] ?? $line->product_id),
            'name' => $name,
            'sku' => $sku,
            'quantity' => $quantity,
            'unit_cents' => $unit,
            'total_cents' => $quantity * $unit,
        ])->save();

        $this->rollup($line->deal);

        return $line->fresh() ?? $line;
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
     * @param  array<string, mixed>  $item
     */
    protected function unitCents(array $item, ?Product $product): int
    {
        if (isset($item['unit_cents'])) {
            return (int) $item['unit_cents'];
        }

        if (isset($item['unit_dzd'])) {
            return (int) round(((float) $item['unit_dzd']) * 100);
        }

        return $product instanceof Product ? (int) $product->unit_cents : 0;
    }
}
