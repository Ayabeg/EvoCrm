<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowExecution;

it('replays a failed workflow as a new auditable execution', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Replay task', 'due_in_days' => 1],
        'active' => false,
    ]);
    $failed = WorkflowExecution::query()->create([
        'workspace_id' => $user->workspace_id,
        'workflow_id' => $workflow->id,
        'workflow_name' => $workflow->name,
        'contact_id' => $contact->id,
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'status' => WorkflowExecution::STATUS_FAILED,
        'error_summary' => 'Temporary failure.',
        'run_at' => now()->subMinute(),
    ]);

    $this->actingAs($user)
        ->post("/crm/workflows/executions/{$failed->id}/replay")
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.message', fn (string $message): bool => str_contains($message, 'replayed'));

    $executions = WorkflowExecution::query()->where('workflow_id', $workflow->id)->orderBy('id')->get();

    expect($executions)->toHaveCount(2)
        ->and($executions->first()->status)->toBe(WorkflowExecution::STATUS_FAILED)
        ->and($executions->last()->status)->toBe(WorkflowExecution::STATUS_COMPLETED)
        ->and($executions->last()->contact_id)->toBe($contact->id)
        ->and(Activity::query()->where('contact_id', $contact->id)->count())->toBe(1);
});

it('does not expose replay for successful executions', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create(['workspace_id' => $user->workspace_id]);
    $execution = WorkflowExecution::query()->create([
        'workspace_id' => $user->workspace_id,
        'workflow_id' => $workflow->id,
        'workflow_name' => $workflow->name,
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'status' => WorkflowExecution::STATUS_COMPLETED,
        'run_at' => now(),
    ]);

    $this->actingAs($user)
        ->post("/crm/workflows/executions/{$execution->id}/replay")
        ->assertStatus(422);
});
