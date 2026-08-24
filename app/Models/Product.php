<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'sku', 'name', 'unit_cents', 'currency', 'active'])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    public function unitDzd(): float
    {
        return round(((int) $this->unit_cents) / 100, 2);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(DealLineItem::class);
    }

    public function quoteItems(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }
}
