<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\CustomAttributeDefinition;
use App\Models\Sequence;
use App\Models\Stage;
use App\Models\Workflow;
use App\Models\Workspace;
use App\Services\Crm\EvoWorkflowTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    public function index(Request $request, EvoWorkflowTemplates $templates): Response
    {
        $workspace = $request->user()->workspace;

        $workflows = Workflow::query()
            ->forWorkspace($workspace)
            ->with('triggerStage')
            ->latest()
            ->get()
            ->map(fn (Workflow $workflow) => [
                'id' => $workflow->id,
                'name' => $workflow->name,
                'trigger' => $workflow->trigger,
                'trigger_stage' => $workflow->triggerStage?->name,
                'action' => $workflow->action,
                'action_config' => $workflow->config(),
                'condition_field' => $workflow->condition_field,
                'condition_operator' => $workflow->condition_operator,
                'condition_value' => $workflow->condition_value,
                'else_action' => $workflow->else_action,
                'else_action_config' => $workflow->elseConfig(),
                'active' => $workflow->active,
                'template_key' => $workflow->template_key,
                'created_at' => $workflow->created_at?->toIso8601String(),
            ]);

        $stages = Stage::query()
            ->where('pipeline_id', $workspace->defaultPipeline()->id)
            ->orderBy('position')
            ->get(['id', 'name', 'slug']);

        $sequences = Sequence::query()
            ->forWorkspace($workspace)
            ->orderBy('id')
            ->get(['id', 'name', 'channel']);

        return Inertia::render('crm/workflows/index', [
            'workflows' => $workflows,
            'templates' => $templates->all(),
            'stages' => $stages,
            'sequences' => $sequences,
            'condition_fields' => $this->conditionFieldOptions($workspace),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;
        $data = $this->validated($request, $workspace);

        $stageId = $data['trigger'] === Workflow::TRIGGER_DEAL_STAGE_CHANGED
            ? $data['trigger_stage_id']
            : null;

        if ($stageId) {
            Stage::query()
                ->where('pipeline_id', $workspace->defaultPipeline()->id)
                ->findOrFail($stageId);
        }

        $workspace->workflows()->create([
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'trigger_stage_id' => $stageId,
            'action' => $data['action'],
            'action_config' => $this->actionConfig($data['action'], $data['then']),
            'condition_field' => $data['condition_field'],
            'condition_operator' => $data['condition_field'] ? $data['condition_operator'] : null,
            'condition_value' => $data['condition_field'] ? $data['condition_value'] : null,
            'else_action' => $data['condition_field'] ? $data['else_action'] : null,
            'else_action_config' => $data['condition_field'] && $data['else_action']
                ? $this->actionConfig($data['else_action'], $data['else'])
                : null,
            'active' => true,
        ]);

        return redirect()->route('crm.workflows.index');
    }

    public function update(Request $request, Workflow $workflow): RedirectResponse
    {
        abort_unless((int) $workflow->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $data = $this->validated($request, $workspace);

        $stageId = $data['trigger'] === Workflow::TRIGGER_DEAL_STAGE_CHANGED
            ? $data['trigger_stage_id']
            : null;

        if ($stageId) {
            Stage::query()
                ->where('pipeline_id', $workspace->defaultPipeline()->id)
                ->findOrFail($stageId);
        }

        $workflow->update([
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'trigger_stage_id' => $stageId,
            'action' => $data['action'],
            'action_config' => $this->actionConfig($data['action'], $data['then']),
            'condition_field' => $data['condition_field'],
            'condition_operator' => $data['condition_field'] ? $data['condition_operator'] : null,
            'condition_value' => $data['condition_field'] ? $data['condition_value'] : null,
            'else_action' => $data['condition_field'] ? $data['else_action'] : null,
            'else_action_config' => $data['condition_field'] && $data['else_action']
                ? $this->actionConfig($data['else_action'], $data['else'])
                : null,
        ]);

        return redirect()->route('crm.workflows.index');
    }

    public function storeTemplate(Request $request, EvoWorkflowTemplates $templates): RedirectResponse
    {
        $data = $request->validate([
            'template_key' => ['required', 'string', 'max:80'],
        ]);

        $templates->apply($request->user()->workspace, $data['template_key']);

        return redirect()->route('crm.workflows.index');
    }

    public function toggle(Request $request, Workflow $workflow): RedirectResponse
    {
        abort_unless((int) $workflow->workspace_id === (int) $request->user()->workspace_id, 404);

        $workflow->forceFill(['active' => ! $workflow->active])->save();

        return redirect()->route('crm.workflows.index');
    }

    public function destroy(Request $request, Workflow $workflow): RedirectResponse
    {
        abort_unless((int) $workflow->workspace_id === (int) $request->user()->workspace_id, 404);

        $workflow->delete();

        return redirect()->route('crm.workflows.index');
    }

    /**
     * @return array{
     *     name: string,
     *     trigger: string,
     *     trigger_stage_id: int|null,
     *     action: string,
     *     then: array{subject: string|null, body: string|null, due_in_days: int, sequence_id: int|null, webhook_url: string|null},
     *     condition_field: string|null,
     *     condition_operator: string|null,
     *     condition_value: string|null,
     *     else_action: string|null,
     *     else: array{subject: string|null, body: string|null, due_in_days: int, sequence_id: int|null, webhook_url: string|null}
     * }
     */
    protected function validated(Request $request, Workspace $workspace): array
    {
        $needsValue = filled($request->input('condition_field'))
            && ! in_array($request->input('condition_operator'), [Workflow::OP_IS_SET, Workflow::OP_IS_EMPTY], true);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'trigger' => ['required', Rule::in(Workflow::triggers())],
            'trigger_stage_id' => [
                Rule::requiredIf($request->input('trigger') === Workflow::TRIGGER_DEAL_STAGE_CHANGED),
                'nullable',
                'integer',
            ],
            'action' => ['required', Rule::in(Workflow::actions())],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['nullable', 'string'],
            'due_in_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'sequence_id' => ['nullable', 'integer'],
            'webhook_url' => [
                Rule::requiredIf($request->input('action') === Workflow::ACTION_SEND_WEBHOOK),
                'nullable',
                'url:http,https',
                'max:500',
            ],
            'condition_field' => ['nullable', 'string', 'max:80', Rule::in($this->allowedConditionFields($workspace))],
            'condition_operator' => [
                Rule::requiredIf(filled($request->input('condition_field'))),
                'nullable',
                Rule::in(Workflow::operators()),
            ],
            'condition_value' => [
                Rule::requiredIf($needsValue),
                'nullable',
                'string',
                'max:180',
            ],
            'else_action' => [
                'nullable',
                Rule::in(Workflow::actions()),
            ],
            'else_subject' => ['nullable', 'string', 'max:180'],
            'else_body' => ['nullable', 'string'],
            'else_due_in_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'else_sequence_id' => ['nullable', 'integer'],
            'else_webhook_url' => [
                Rule::requiredIf($request->input('else_action') === Workflow::ACTION_SEND_WEBHOOK),
                'nullable',
                'url:http,https',
                'max:500',
            ],
        ]);

        return [
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'trigger_stage_id' => isset($data['trigger_stage_id']) ? (int) $data['trigger_stage_id'] : null,
            'action' => $data['action'],
            'then' => [
                'subject' => $data['subject'] ?? null,
                'body' => $data['body'] ?? null,
                'due_in_days' => (int) ($data['due_in_days'] ?? 1),
                'sequence_id' => isset($data['sequence_id']) ? (int) $data['sequence_id'] : null,
                'webhook_url' => $data['webhook_url'] ?? null,
            ],
            'condition_field' => filled($data['condition_field'] ?? null) ? (string) $data['condition_field'] : null,
            'condition_operator' => filled($data['condition_operator'] ?? null) ? (string) $data['condition_operator'] : null,
            'condition_value' => array_key_exists('condition_value', $data) ? $data['condition_value'] : null,
            'else_action' => filled($data['else_action'] ?? null) ? (string) $data['else_action'] : null,
            'else' => [
                'subject' => $data['else_subject'] ?? null,
                'body' => $data['else_body'] ?? null,
                'due_in_days' => (int) ($data['else_due_in_days'] ?? 1),
                'sequence_id' => isset($data['else_sequence_id']) ? (int) $data['else_sequence_id'] : null,
                'webhook_url' => $data['else_webhook_url'] ?? null,
            ],
        ];
    }

    /**
     * @param  array{subject: string|null, body: string|null, due_in_days: int, sequence_id: int|null, webhook_url: string|null}  $data
     * @return array<string, mixed>
     */
    protected function actionConfig(string $action, array $data): array
    {
        if ($action === Workflow::ACTION_ENROLL_SEQUENCE) {
            return [
                'sequence_id' => $data['sequence_id'],
            ];
        }

        if ($action === Workflow::ACTION_SEND_WEBHOOK) {
            return [
                'url' => $data['webhook_url'],
            ];
        }

        return [
            'subject' => $data['subject'] ?: 'Follow up in EvoSales',
            'body' => $data['body'],
            'due_in_days' => $data['due_in_days'],
        ];
    }

    /**
     * @return list<string>
     */
    protected function allowedConditionFields(Workspace $workspace): array
    {
        $fields = Workflow::builtInConditionFields();

        foreach ($this->contactAttributeKeys($workspace) as $key) {
            $fields[] = 'contact.attr.'.$key;
        }

        return $fields;
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    protected function conditionFieldOptions(Workspace $workspace): array
    {
        $options = [
            ['value' => Workflow::CONDITION_DEAL_AMOUNT, 'label' => 'Deal amount (DZD)'],
            ['value' => Workflow::CONDITION_DEAL_STAGE, 'label' => 'Deal stage'],
            ['value' => 'contact.wilaya', 'label' => 'Contact wilaya'],
            ['value' => 'contact.city', 'label' => 'Contact city'],
            ['value' => 'contact.source', 'label' => 'Contact source'],
            ['value' => 'contact.email', 'label' => 'Contact email'],
            ['value' => 'contact.phone', 'label' => 'Contact phone'],
        ];

        foreach ($this->contactAttributeDefinitions($workspace) as $definition) {
            $options[] = [
                'value' => 'contact.attr.'.$definition->key,
                'label' => 'Contact · '.$definition->label,
            ];
        }

        return $options;
    }

    /**
     * @return list<string>
     */
    protected function contactAttributeKeys(Workspace $workspace): array
    {
        return array_values($this->contactAttributeDefinitions($workspace)
            ->map(fn (CustomAttributeDefinition $definition): string => $definition->key)
            ->all());
    }

    /**
     * @return Collection<int, CustomAttributeDefinition>
     */
    protected function contactAttributeDefinitions(Workspace $workspace): Collection
    {
        return CustomAttributeDefinition::query()
            ->forWorkspace($workspace)
            ->where('entity', 'contact')
            ->orderBy('label')
            ->get();
    }
}
