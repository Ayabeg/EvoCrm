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

    public const DEAL_CREATED_AMOUNT_BRANCH = 'evo_deal_created_amount_branch';

    public const CONTACT_ALGER_BRANCH = 'evo_contact_alger_branch';

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
     *     action_config: array<string, mixed>,
     *     condition_field: string|null,
     *     condition_operator: string|null,
     *     condition_value: string|null,
     *     else_action: string|null,
     *     else_action_config: array<string, mixed>|null
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
                'condition_field' => null,
                'condition_operator' => null,
                'condition_value' => null,
                'else_action' => null,
                'else_action_config' => null,
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
                'condition_field' => null,
                'condition_operator' => null,
                'condition_value' => null,
                'else_action' => null,
                'else_action_config' => null,
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
                'condition_field' => null,
                'condition_operator' => null,
                'condition_value' => null,
                'else_action' => null,
                'else_action_config' => null,
            ],
            [
                'key' => self::DEAL_CREATED_AMOUNT_BRANCH,
                'name' => 'Gros deal DZD → call today, else first wilaya check',
                'description' => 'When an Evotechly deal is created, branch on amount. 500,000 DZD or more gets a same-day owner call; smaller deals get a lighter first check-in.',
                'trigger' => Workflow::TRIGGER_DEAL_CREATED,
                'action' => Workflow::ACTION_CREATE_TASK,
                'stage_slug' => null,
                'action_config' => [
                    'subject' => 'Gros deal Evotechly — call {{contact}} today',
                    'body' => 'This deal is 500,000 DZD or more. Confirm the buying committee in the wilaya and lock a same-day call.',
                    'due_in_days' => 0,
                ],
                'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
                'condition_operator' => Workflow::OP_GTE,
                'condition_value' => '500000',
                'else_action' => Workflow::ACTION_CREATE_TASK,
                'else_action_config' => [
                    'subject' => 'New Evotechly deal — first wilaya check-in',
                    'body' => 'A new deal landed under 500,000 DZD. Confirm the wilaya, the buyer, and the next step.',
                    'due_in_days' => 1,
                ],
            ],
            [
                'key' => self::CONTACT_ALGER_BRANCH,
                'name' => 'Contact in Alger → first sequence, else ask the wilaya',
                'description' => 'When a contact is created, enroll Alger contacts in the first outbound sequence. Everyone else gets a task to confirm their wilaya before a first visit.',
                'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
                'action' => Workflow::ACTION_ENROLL_SEQUENCE,
                'stage_slug' => null,
                'action_config' => [
                    'sequence_id' => null,
                ],
                'condition_field' => 'contact.wilaya',
                'condition_operator' => Workflow::OP_EQ,
                'condition_value' => 'Alger',
                'else_action' => Workflow::ACTION_CREATE_TASK,
                'else_action_config' => [
                    'subject' => 'Confirm wilaya for {{contact}}',
                    'body' => 'This Evotechly contact is not marked Alger. Ask which wilaya they operate in before the first visit.',
                    'due_in_days' => 1,
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
     *     action_config: array<string, mixed>,
     *     condition_field: string|null,
     *     condition_operator: string|null,
     *     condition_value: string|null,
     *     else_action: string|null,
     *     else_action_config: array<string, mixed>|null
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
            'condition_field' => $template['condition_field'],
            'condition_operator' => $template['condition_operator'],
            'condition_value' => $template['condition_value'],
            'else_action' => $template['else_action'],
            'else_action_config' => $template['else_action_config'],
            'active' => true,
            'template_key' => $template['key'],
        ]);
    }
}
