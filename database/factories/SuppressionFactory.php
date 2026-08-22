<?php

namespace Database\Factories;

use App\Models\Suppression;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Suppression>
 */
class SuppressionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'type' => 'email',
            'value' => fake()->unique()->safeEmail(),
            'reason' => 'unsubscribe',
            'source' => 'public',
        ];
    }
}
