<?php

namespace Database\Factories;

use App\Models\OutboundCampaign;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OutboundCampaign>
 */
class OutboundCampaignFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => 'Newsletter — '.fake()->words(2, true),
            'status' => OutboundCampaign::STATUS_DRAFT,
            'subject' => 'Hello {{first_name}}',
            'body' => 'Bonjour {{first_name}}, news from Evotechly.',
        ];
    }
}
