<?php

namespace Database\Factories;

use App\Models\OutboundTemplate;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OutboundTemplate>
 */
class OutboundTemplateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->words(3, true),
            'subject' => 'EvoSales — {{first_name}}',
            'body' => "Bonjour {{first_name}},\n\nSuite à votre intérêt pour EvoSales.",
        ];
    }
}
