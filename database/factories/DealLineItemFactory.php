<?php

namespace Database\Factories;

use App\Models\Deal;
use App\Models\DealLineItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DealLineItem>
 */
class DealLineItemFactory extends Factory
{
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 3);
        $unit = fake()->numberBetween(1_000_000, 10_000_000);

        return [
            'deal_id' => Deal::factory(),
            'product_id' => Product::factory(),
            'name' => fake()->words(2, true),
            'sku' => strtoupper(fake()->bothify('EVO-###')),
            'quantity' => $quantity,
            'unit_cents' => $unit,
            'total_cents' => $quantity * $unit,
        ];
    }
}
