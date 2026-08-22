<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->company(),
            'domain' => fake()->optional()->domainName(),
            'city' => fake()->optional()->city(),
            'country' => 'DZ',
        ];
    }
}
