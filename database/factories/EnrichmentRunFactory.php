<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\EnrichmentRun;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EnrichmentRun>
 */
class EnrichmentRunFactory extends Factory
{
    public function definition(): array
    {
        $workspace = Workspace::factory();

        return [
            'workspace_id' => $workspace,
            'target_type' => EnrichmentRun::TARGET_COMPANY,
            'target_id' => Company::factory()->state(['workspace_id' => $workspace]),
            'source' => EnrichmentRun::SOURCE_WEBSITE,
            'field' => 'website_title',
            'value' => fake()->sentence(3),
            'confidence' => 0.9,
            'raw' => [],
            'status' => EnrichmentRun::STATUS_PROPOSED,
        ];
    }
}
