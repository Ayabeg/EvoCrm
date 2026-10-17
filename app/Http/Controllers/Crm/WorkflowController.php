<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\Deal;
use App\Models\Mailbox;
use App\Models\SavedFilter;
use App\Models\Sequence;
use App\Models\Stage;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Models\WorkflowVersion;
use App\Models\Workspace;
use App\Services\Crm\EvoWorkflowTemplates;
use App\Services\Crm\WorkflowExecutionPresenter;
use App\Services\Crm\WorkflowRunner;
use App\Services\Crm\WorkflowVersioner;
use App\Support\CrmHub;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    public function index(Request $request, EvoWorkflowTemplates $templates, CrmHub $hub, WorkflowExecutionPresenter $executions): Response
    {
        $workspace = $request->user()->workspace;
        $user = $request->user();

        $workflows = Workflow::query()
            ->forWorkspace($workspace)
            ->with(['triggerStage', 'versions.createdBy'])
            ->latest('updated_at')
            ->get()
            ->map(fn (Workflow $workflow) => [
                'id' => $workflow->id,
                'name' => $workflow->name,
                'trigger' => $workflow->trigger,
                'trigger_stage' => $workflow->triggerStage?->name,
                'trigger_stage_id' => $workflow->trigger_stage_id,
                'trigger_status' => $workflow->trigger_status,
                'trigger_status_label' => $workflow->trigger_status
                    ? Ticket::statusLabel((string) $workflow->trigger_status)
                    : null,
                'trigger_saved_filter_id' => $workflow->trigger_saved_filter_id,
                'action' => $workflow->action,
                'action_config' => $workflow->config(),
                'condition_field' => $workflow->condition_field,
                'condition_operator' => $workflow->condition_operator,
                'condition_value' => $workflow->condition_value,
                'else_action' => $workflow->else_action,
                'else_action_config' => $workflow->elseConfig(),
                'active' => $workflow->active,
                'template_key' => $workflow->template_key,
                'delay_minutes' => (int) ($workflow->delay_minutes ?? 0),
                'created_at' => $workflow->created_at?->toIso8601String(),
                'updated_at' => $workflow->updated_at?->toIso8601String(),
                'versions' => $workflow->versions
                    ->take(8)
                    ->map(fn (WorkflowVersion $version): array => [
                        'id' => $version->id,
                        'version' => $version->version,
                        'created_at' => $version->created_at?->toIso8601String(),
                        'created_by' => $version->createdBy?->name,
                        'restored_from_version_id' => $version->restored_from_version_id,
                    ])
                    ->values()
                    ->all(),
            ]);

        $stages = Stage::query()
            ->where('pipeline_id', $workspace->defaultPipeline()->id)
            ->orderBy('position')
            ->get(['id', 'name', 'slug']);

        $sequences = Sequence::query()
            ->forWorkspace($workspace)
            ->orderBy('id')
            ->get(['id', 'name', 'channel']);

        $hasMailbox = Mailbox::query()
            ->forWorkspace($workspace)
            ->where('enabled', true)
            ->exists();

        return Inertia::render('crm/workflows/index', [
            'workflows' => $workflows,
            'templates' => $templates->all(),
            'stages' => $stages,
            'sequences' => $sequences,
            'segments' => SavedFilter::query()
                ->forWorkspace($workspace)
                ->where('entity', 'contact')
                ->orderBy('name')
                ->get(['id', 'name']),
            'condition_fields' => $this->conditionFieldOptions($workspace),
            'members' => collect($hub->members($workspace))
                ->map(fn (User $member): array => [
                    'id' => $member->id,
                    'name' => $member->name,
                ])
                ->values()
                ->all(),
            'ticket_statuses' => collect(Ticket::STATUSES)
                ->map(fn (string $status): array => [
                    'value' => $status,
                    'label' => Ticket::statusLabel($status),
                ])
                ->values()
                ->all(),
            'capabilities' => [
                'can_manage' => $user->canPermission('automation.manage'),
                'has_mailbox' => $hasMailbox,
                'has_sequences' => $sequences->isNotEmpty(),
            ],
            'view' => $request->string('view')->toString() === 'history' ? 'history' : 'workflows',
            'executions' => $executions->page($workspace, $user, $request),
        ]);
    }

    public function store(Request $request, WorkflowVersioner $versioner): RedirectResponse
    {
        $workspace = $request->user()->workspace;
        $data = $this->validated($request, $workspace);

        $stageId = $data['trigger'] === Workflow::TRIGGER_DEAL_STAGE_CHANGED
            ? $data['trigger_stage_id']
            : null;
        $triggerStatus = $data['trigger'] === Workflow::TRIGGER_TICKET_STATUS_CHANGED
            ? $data['trigger_status']
            : null;

        if ($stageId) {
            Stage::query()
                ->where('pipeline_id', $workspace->defaultPipeline()->id)
                ->findOrFail($stageId);
        }

        $workflow = $workspace->workflows()->create([
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'trigger_stage_id' => $stageId,
            'trigger_status' => $triggerStatus,
            'trigger_saved_filter_id' => $data['trigger_saved_filter_id'],
            'action' => $data['action'],
            'action_config' => $this->actionConfig($data['action'], $data['then']),
            'condition_field' => $data['condition_field'],
            'condition_operator' => $data['condition_field'] ? $data['condition_operator'] : null,
            'condition_value' => $data['condition_field'] ? $data['condition_value'] : null,
            'else_action' => $data['condition_field'] ? $data['else_action'] : null,
            'else_action_config' => $data['condition_field'] && $data['else_action']
                ? $this->actionConfig($data['else_action'], $data['else'])
                : null,
            'active' => $data['active'],
            'delay_minutes' => (int) ($data['delay_minutes'] ?? 0),
        ]);
        $versioner->record($workflow, $request->user());

        return redirect()->route('crm.workflows.index');
    }

    public function update(Request $request, Workflow $workflow, WorkflowVersioner $versioner): RedirectResponse
    {
        abort_unless((int) $workflow->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $data = $this->validated($request, $workspace);

        $stageId = $data['trigger'] === Workflow::TRIGGER_DEAL_STAGE_CHANGED
            ? $data['trigger_stage_id']
            : null;
        $triggerStatus = $data['trigger'] === Workflow::TRIGGER_TICKET_STATUS_CHANGED
            ? $data['trigger_status']
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
            'trigger_status' => $triggerStatus,
            'trigger_saved_filter_id' => $data['trigger_saved_filter_id'],
            'action' => $data['action'],
            'action_config' => $this->actionConfig($data['action'], $data['then']),
            'condition_field' => $data['condition_field'],
            'condition_operator' => $data['condition_field'] ? $data['condition_operator'] : null,
            'condition_value' => $data['condition_field'] ? $data['condition_value'] : null,
            'else_action' => $data['condition_field'] ? $data['else_action'] : null,
            'else_action_config' => $data['condition_field'] && $data['else_action']
                ? $this->actionConfig($data['else_action'], $data['else'])
                : null,
            'delay_minutes' => (int) ($data['delay_minutes'] ?? $workflow->delay_minutes ?? 0),
        ]);
        $workflow->refresh();
        $versioner->record($workflow, $request->user());

        return redirect()->route('crm.workflows.index');
    }

    public function storeTemplate(Request $request, EvoWorkflowTemplates $templates, WorkflowVersioner $versioner): RedirectResponse
    {
        $data = $request->validate([
            'template_key' => ['required', 'string', 'max:80'],
        ]);

        $workflow = $templates->apply($request->user()->workspace, $data['template_key']);
        $versioner->record($workflow, $request->user());

        return redirect()->route('crm.workflows.index');
    }

    public function toggle(Request $request, Workflow $workflow): RedirectResponse
    {
        abort_unless((int) $workflow->workspace_id === (int) $request->user()->workspace_id, 404);

        $workflow->forceFill(['active' => ! $workflow->active])->save();

        if (! $workflow->active) {
            WorkflowExecution::query()
                ->where('workflow_id', $workflow->id)
                ->where('status', WorkflowExecution::STATUS_PENDING)
                ->update([
                    'status' => WorkflowExecution::STATUS_CANCELLED,
                    'finished_at' => now(),
                    'error_summary' => 'Workflow was turned off before this delayed run executed.',
                ]);
        }

        return redirect()->route('crm.workflows.index');
    }

    public function test(Request $request, Workflow $workflow, WorkflowRunner $runner): RedirectResponse
    {
        abort_unless((int) $workflow->workspace_id === (int) $request->user()->workspace_id, 404);

        $workspace = $request->user()->workspace;
        $data = $request->validate([
            'contact_id' => ['nullable', 'integer'],
            'deal_id' => ['nullable', 'integer'],
            'ticket_id' => ['nullable', 'integer'],
        ]);

        $contact = isset($data['contact_id'])
            ? Contact::query()->forWorkspace($workspace)->findOrFail($data['contact_id'])
            : null;
        $deal = isset($data['deal_id'])
            ? Deal::query()->forWorkspace($workspace)->with('contact')->findOrFail($data['deal_id'])
            : null;
        $ticket = isset($data['ticket_id'])
            ? Ticket::query()->forWorkspace($workspace)->with(['contact', 'deal'])->findOrFail($data['ticket_id'])
            : null;

        if (! $contact && ! $deal && ! $ticket) {
            [$contact, $deal, $ticket] = $this->defaultPreviewRecords($workspace, $workflow);
        }

        $contact ??= $deal?->contact ?? $ticket?->contact;
        $deal ??= $ticket?->deal;
        $preview = $runner->preview($workspace, $workflow, $contact, $deal, $ticket);
        $action = $preview['action'] ?? 'no action';
        $condition = $preview['condition_passed'] === null
            ? 'no condition'
            : ($preview['condition_passed'] ? 'condition passed' : 'condition did not pass');

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Dry run complete: :branch branch → :action; :condition. No changes were made.', [
                'branch' => $preview['branch'],
                'action' => $action,
                'condition' => $condition,
            ]),
        ]);

        return back();
    }

    public function replay(Request $request, WorkflowExecution $execution, WorkflowRunner $runner): RedirectResponse
    {
        abort_unless((int) $execution->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless($request->user()->canPermission('automation.manage'), 403);
        abort_unless($execution->status === WorkflowExecution::STATUS_FAILED, 422);

        $runner->replay($request->user()->workspace, $execution->load([
            'workflow',
            'contact',
            'deal',
            'ticket',
        ]));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Failed workflow run replayed. The original execution was kept unchanged.'),
        ]);

        return back();
    }

    public function restoreVersion(Request $request, WorkflowVersion $version, WorkflowVersioner $versioner): RedirectResponse
    {
        abort_unless((int) $version->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless($request->user()->canPermission('automation.manage'), 403);

        $versioner->restore($request->user()->workspace, $request->user(), $version);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Workflow restored from version :version. A new version was recorded.', [
                'version' => $version->version,
            ]),
        ]);

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
     *     else: array{subject: string|null, body: string|null, due_in_days: int, sequence_id: int|null, webhook_url: string|null},
     *     delay_minutes: int,
     *     active: bool
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
            'trigger_status' => [
                'nullable',
                'string',
                Rule::in(Ticket::STATUSES),
            ],
            'trigger_saved_filter_id' => [
                Rule::requiredIf(in_array($request->input('trigger'), [
                    Workflow::TRIGGER_SEGMENT_ENTERED,
                    Workflow::TRIGGER_SEGMENT_EXITED,
                ], true)),
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
            'delay_minutes' => ['nullable', 'integer', 'min:0', 'max:43200'],
            'property_entity' => ['nullable', 'in:contact,deal'],
            'property_field' => ['nullable', 'string', 'max:80'],
            'property_value' => ['nullable', 'string', 'max:500'],
            'assign_owner_id' => ['nullable', 'integer'],
            'assign_entity' => ['nullable', 'in:contact,deal'],
            'notify_user_id' => ['nullable', 'integer'],
            'else_property_entity' => ['nullable', 'in:contact,deal'],
            'else_property_field' => ['nullable', 'string', 'max:80'],
            'else_property_value' => ['nullable', 'string', 'max:500'],
            'else_assign_owner_id' => ['nullable', 'integer'],
            'else_assign_entity' => ['nullable', 'in:contact,deal'],
            'else_notify_user_id' => ['nullable', 'integer'],
            'active' => ['sometimes', 'boolean'],
        ]);

        return [
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'trigger_stage_id' => isset($data['trigger_stage_id']) ? (int) $data['trigger_stage_id'] : null,
            'trigger_status' => filled($data['trigger_status'] ?? null) ? (string) $data['trigger_status'] : null,
            'trigger_saved_filter_id' => isset($data['trigger_saved_filter_id']) ? (int) $data['trigger_saved_filter_id'] : null,
            'action' => $data['action'],
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
                'property_entity' => $data['else_property_entity'] ?? null,
                'property_field' => $data['else_property_field'] ?? null,
                'property_value' => $data['else_property_value'] ?? null,
                'assign_owner_id' => isset($data['else_assign_owner_id']) ? (int) $data['else_assign_owner_id'] : null,
                'assign_entity' => $data['else_assign_entity'] ?? null,
                'notify_user_id' => isset($data['else_notify_user_id']) ? (int) $data['else_notify_user_id'] : null,
            ],
            'delay_minutes' => (int) ($data['delay_minutes'] ?? 0),
            'active' => array_key_exists('active', $data) ? (bool) $data['active'] : true,
            'then' => [
                'subject' => $data['subject'] ?? null,
                'body' => $data['body'] ?? null,
                'due_in_days' => (int) ($data['due_in_days'] ?? 1),
                'sequence_id' => isset($data['sequence_id']) ? (int) $data['sequence_id'] : null,
                'webhook_url' => $data['webhook_url'] ?? null,
                'property_entity' => $data['property_entity'] ?? null,
                'property_field' => $data['property_field'] ?? null,
                'property_value' => $data['property_value'] ?? null,
                'assign_owner_id' => isset($data['assign_owner_id']) ? (int) $data['assign_owner_id'] : null,
                'assign_entity' => $data['assign_entity'] ?? null,
                'notify_user_id' => isset($data['notify_user_id']) ? (int) $data['notify_user_id'] : null,
            ],
        ];
    }

    /**
     * @return array{0: Contact|null, 1: Deal|null, 2: Ticket|null}
     */
    private function defaultPreviewRecords(Workspace $workspace, Workflow $workflow): array
    {
        if (str_starts_with($workflow->trigger, 'ticket.')) {
            $ticket = Ticket::query()
                ->forWorkspace($workspace)
                ->with(['contact', 'deal'])
                ->latest('id')
                ->first();

            return [$ticket?->contact, $ticket?->deal, $ticket];
        }

        if (str_starts_with($workflow->trigger, 'deal.')) {
            $deal = Deal::query()
                ->forWorkspace($workspace)
                ->with('contact')
                ->latest('id')
                ->first();

            return [$deal?->contact, $deal, null];
        }

        return [
            Contact::query()->forWorkspace($workspace)->latest('id')->first(),
            null,
            null,
        ];
    }

    /**
     * @param  array{subject: string|null, body: string|null, due_in_days: int, sequence_id: int|null, webhook_url: string|null, property_entity?: string|null, property_field?: string|null, property_value?: string|null, assign_owner_id?: int|null, assign_entity?: string|null, notify_user_id?: int|null}  $data
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

        if ($action === Workflow::ACTION_SET_PROPERTY) {
            return [
                'entity' => $data['property_entity'] ?? 'contact',
                'field' => $data['property_field'] ?? '',
                'value' => $data['property_value'] ?? null,
            ];
        }

        if ($action === Workflow::ACTION_ASSIGN_OWNER) {
            return [
                'entity' => $data['assign_entity'] ?? 'contact',
                'owner_id' => $data['assign_owner_id'] ?? null,
            ];
        }

        if ($action === Workflow::ACTION_CREATE_DEAL) {
            $amount = $data['property_value'] ?? null;

            return [
                'title' => $data['subject'] ?: null,
                'amount_cents' => filled($amount) ? (int) round(((float) $amount) * 100) : 0,
                'subject' => $data['subject'] ?: 'Follow up in EvoSales',
                'body' => $data['body'] ?? null,
                'due_in_days' => $data['due_in_days'] ?? 1,
            ];
        }

        if ($action === Workflow::ACTION_NOTIFY_USER) {
            return [
                'subject' => $data['subject'] ?: 'Workflow notification',
                'body' => $data['body'],
                'user_id' => $data['notify_user_id'] ?? null,
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
            ['value' => Workflow::CONDITION_TICKET_STATUS, 'label' => 'Ticket status'],
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
