<?php

namespace App\Services\Crm;

use App\Models\Workflow;
use App\Models\Workspace;
use Illuminate\Validation\ValidationException;

class EvoWorkflowTemplates
{
    public const NEW_CONTACT_TASK = 'evo_new_contact_task';

    public const DEAL_QUALIFIED_TASK = 'evo_deal_qualified_task';

    public const NEW_CONTACT_ENROLL = 'evo_new_contact_enroll';

    /**
     * Evotechly-worded starters. Not a HubSpot gallery.
     *
     * @return list<array{
     *     key: string,
     *     name: string,
     *     description: string,
     *     trigger: string,
     *     action: string,
     *     stage_slug: string|null,
     *     action_config: array<string, mixed>
     * }>
     */
    public function all(): array
    {
        return [
            [
                'key' => self::NEW_CONTACT_TASK,
                'name' => 'New Evotechly contact → first task',
                'description' => 'When a contact is created in EvoSales, open a task so the owner can introduce Evotechly.',
                'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
                'action' => Workflow::ACTION_CREATE_TASK,
                'stage_slug' => null,
                'action_config' => [
                    'subject' => 'Introduce Evotechly to {{contact}}',
                    'body' => 'A new contact landed in EvoSales. Confirm they are the right buyer and book a first conversation.',
                    'due_in_days' => 1,
                ],
            ],
            [
                'key' => self::DEAL_QUALIFIED_TASK,
                'name' => 'Deal reached Qualified → next-step task',
                'description' => 'When a deal moves to Qualified, create a task to lock the next Evotechly conversation.',
                'trigger' => Workflow::TRIGGER_DEAL_STAGE_CHANGED,
                'action' => Workflow::ACTION_CREATE_TASK,
                'stage_slug' => 'qualified',
                'action_config' => [
                    'subject' => 'Qualified deal — set the next Evotechly step',
                    'body' => 'This deal just reached Qualified. Confirm the buying committee and schedule the demo.',
                    'due_in_days' => 1,
                ],
            ],
            [
                'key' => self::NEW_CONTACT_ENROLL,
                'name' => 'New Evotechly contact → first outbound sequence',
                'description' => 'When a contact is created, enroll them in the workspace’s first outbound sequence if one exists.',
                'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
                'action' => Workflow::ACTION_ENROLL_SEQUENCE,
                'stage_slug' => null,
                'action_config' => [
                    'sequence_id' => null,
                ],
            ],
        ];
    }

    /**
     * @return array{
     *     key: string,
     *     name: string,
     *     description: string,
     *     trigger: string,
     *     action: string,
     *     stage_slug: string|null,
     *     action_config: array<string, mixed>
     * }
     */
    public function find(string $key): array
    {
        foreach ($this->all() as $template) {
            if ($template['key'] === $key) {
                return $template;
            }
        }

        throw ValidationException::withMessages([
            'template_key' => 'Unknown Evotechly workflow template.',
        ]);
    }

    public function apply(Workspace $workspace, string $key): Workflow
    {
        $template = $this->find($key);

        $stageId = null;
        if (filled($template['stage_slug'])) {
            $stageId = $workspace->defaultPipeline()->stageBySlug((string) $template['stage_slug'])?->id;
        }

        return Workflow::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $template['name'],
            'trigger' => $template['trigger'],
            'trigger_stage_id' => $stageId,
            'action' => $template['action'],
            'action_config' => $template['action_config'],
            'active' => true,
            'template_key' => $template['key'],
        ]);
    }
}
