<?php

namespace Database\Factories;

use App\Models\Contact;
use App\Models\Lead;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    public function definition(): array
    {
        $workspace = Workspace::factory();

        return [
            'workspace_id' => $workspace,
            'contact_id' => Contact::factory()->state(['workspace_id' => $workspace]),
            'title' => fake()->sentence(3),
            'status' => 'new',
            'source' => 'manual',
        ];
    }
}
