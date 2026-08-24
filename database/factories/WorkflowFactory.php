<?php

namespace Database\Factories;

use App\Models\Workflow;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workflow>
 */
class WorkflowFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => 'New Evotechly contact — first task',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'trigger_stage_id' => null,
            'action' => Workflow::ACTION_CREATE_TASK,
            'action_config' => [
                'subject' => 'Introduce Evotechly to {{contact}}',
                'body' => 'A new contact landed in EvoSales. Book a first conversation.',
                'due_in_days' => 1,
            ],
            'active' => true,
            'template_key' => null,
        ];
    }
}
