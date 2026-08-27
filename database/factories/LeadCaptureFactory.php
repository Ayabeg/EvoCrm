<?php

namespace Database\Factories;

use App\Models\LeadCapture;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadCapture>
 */
class LeadCaptureFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'source' => LeadCapture::SOURCE_CSV,
            'status' => LeadCapture::STATUS_NEW,
            'name' => fake()->name(),
            'phone' => '+21355'.fake()->numerify('#######'),
            'email' => fake()->unique()->safeEmail(),
            'company' => fake()->company(),
            'wilaya' => 'Alger',
            'raw_payload' => [],
        ];
    }
}
