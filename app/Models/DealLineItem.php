<?php

namespace App\Models;

use Database\Factories\DealLineItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['deal_id', 'product_id', 'name', 'sku', 'quantity', 'unit_cents', 'total_cents'])]
class DealLineItem extends Model
{
    /** @use HasFactory<DealLineItemFactory> */
    use HasFactory;

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unitDzd(): float
    {
        return round(((int) $this->unit_cents) / 100, 2);
    }

    public function totalDzd(): float
    {
        return round(((int) $this->total_cents) / 100, 2);
    }
}
