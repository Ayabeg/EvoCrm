<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'sku' => strtoupper(fake()->unique()->bothify('EVO-###??')),
            'name' => fake()->words(3, true),
            'unit_cents' => fake()->numberBetween(1_000_000, 20_000_000),
            'currency' => 'DZD',
            'active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['active' => false]);
    }
}
