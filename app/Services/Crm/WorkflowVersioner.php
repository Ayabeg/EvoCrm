<?php

namespace App\Services\Crm;

use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Models\Workspace;
use Illuminate\Validation\ValidationException;

class WorkflowVersioner
{
    public function record(Workflow $workflow, ?User $actor = null, ?int $restoredFromVersionId = null): WorkflowVersion
    {
        $nextVersion = ((int) WorkflowVersion::query()
            ->where('workflow_id', $workflow->id)
            ->max('version')) + 1;

        return WorkflowVersion::query()->create([
            'workspace_id' => $workflow->workspace_id,
            'workflow_id' => $workflow->id,
            'version' => $nextVersion,
            'snapshot' => $this->snapshot($workflow),
            'created_by' => $actor?->id,
            'restored_from_version_id' => $restoredFromVersionId,
        ]);
    }

    public function restore(Workspace $workspace, User $actor, WorkflowVersion $version): Workflow
    {
        abort_unless((int) $version->workspace_id === (int) $workspace->id, 404);

        $workflow = $version->workflow;
        abort_unless($workflow instanceof Workflow && (int) $workflow->workspace_id === (int) $workspace->id, 404);

        $snapshot = $version->snapshot;
        if (! is_array($snapshot) || $snapshot === []) {
            throw ValidationException::withMessages([
                'version' => 'This workflow version has no restorable configuration.',
            ]);
        }

        $workflow->forceFill($snapshot)->save();
        $this->record($workflow, $actor, $version->id);

        return $workflow->fresh();
    }

    /** @return array<string, mixed> */
    private function snapshot(Workflow $workflow): array
    {
        return [
            'name' => $workflow->name,
            'trigger' => $workflow->trigger,
            'trigger_stage_id' => $workflow->trigger_stage_id,
            'trigger_saved_filter_id' => $workflow->trigger_saved_filter_id,
            'trigger_status' => $workflow->trigger_status,
            'action' => $workflow->action,
            'action_config' => $workflow->config(),
            'condition_field' => $workflow->condition_field,
            'condition_operator' => $workflow->condition_operator,
            'condition_value' => $workflow->condition_value,
            'else_action' => $workflow->else_action,
            'else_action_config' => $workflow->elseConfig(),
            'template_key' => $workflow->template_key,
            'delay_minutes' => (int) ($workflow->delay_minutes ?? 0),
        ];
    }
}
