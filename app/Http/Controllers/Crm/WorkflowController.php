<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Sequence;
use App\Models\Stage;
use App\Models\Workflow;
use App\Services\Crm\EvoWorkflowTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;
        $data = $this->validated($request);

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
            'action_config' => $this->actionConfig($data),
            'active' => true,
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
     * @return array{name: string, trigger: string, trigger_stage_id: int|null, action: string, subject: string|null, body: string|null, due_in_days: int, sequence_id: int|null}
     */
    protected function validated(Request $request): array
    {
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
        ]);

        return [
            'name' => $data['name'],
            'trigger' => $data['trigger'],
            'trigger_stage_id' => isset($data['trigger_stage_id']) ? (int) $data['trigger_stage_id'] : null,
            'action' => $data['action'],
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'] ?? null,
            'due_in_days' => (int) ($data['due_in_days'] ?? 1),
            'sequence_id' => isset($data['sequence_id']) ? (int) $data['sequence_id'] : null,
        ];
    }

    /**
     * @param  array{action: string, subject: string|null, body: string|null, due_in_days: int, sequence_id: int|null}  $data
     * @return array<string, mixed>
     */
    protected function actionConfig(array $data): array
    {
        if ($data['action'] === Workflow::ACTION_ENROLL_SEQUENCE) {
            return [
                'sequence_id' => $data['sequence_id'],
            ];
        }

        return [
            'subject' => $data['subject'] ?: 'Follow up in EvoSales',
            'body' => $data['body'],
            'due_in_days' => $data['due_in_days'],
        ];
    }
}
