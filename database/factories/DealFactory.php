<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Workspace;
use App\Services\Identity\WorkspaceProvisioner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Deal>
 */
class DealFactory extends Factory
{
    public function definition(): array
    {
        $workspace = Workspace::factory()->create();
        app(WorkspaceProvisioner::class)->seedDefaults($workspace);
        $pipeline = $workspace->defaultPipeline();

        return [
            'workspace_id' => $workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $pipeline->stageBySlug('new')->id,
            'title' => fake()->sentence(3),
            'amount_cents' => fake()->numberBetween(50_000, 2_500_000),
            'currency' => 'DZD',
        ];
    }
}
