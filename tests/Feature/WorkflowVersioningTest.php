<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use App\Services\Crm\WorkflowVersioner;

function workflowVersionPayload(string $name): array
{
    return [
        'name' => $name,
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'subject' => 'Call contact',
        'body' => 'Confirm the next step.',
        'due_in_days' => 1,
        'active' => false,
    ];
}

it('records workflow versions and restores an earlier configuration', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);

    $this->actingAs($owner)
        ->post('/crm/workflows', workflowVersionPayload('First draft'))
        ->assertRedirect('/crm/workflows');

    $workflow = Workflow::query()->forWorkspace($owner->workspace)->firstOrFail();
    $firstVersion = WorkflowVersion::query()->where('workflow_id', $workflow->id)->firstOrFail();

    $this->actingAs($owner)
        ->put("/crm/workflows/{$workflow->id}", workflowVersionPayload('Second draft'))
        ->assertRedirect('/crm/workflows');

    expect(WorkflowVersion::query()->where('workflow_id', $workflow->id)->count())->toBe(2)
        ->and($firstVersion->snapshot['name'])->toBe('First draft');

    $this->actingAs($owner)
        ->get('/crm/workflows')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('workflows.0.versions', 2)
            ->where('workflows.0.versions.0.version', 2)
        );

    $this->actingAs($owner)
        ->post("/crm/workflows/versions/{$firstVersion->id}/restore")
        ->assertRedirect('/crm/workflows');

    expect($workflow->fresh()->name)->toBe('First draft')
        ->and(WorkflowVersion::query()->where('workflow_id', $workflow->id)->count())->toBe(3)
        ->and(WorkflowVersion::query()->where('workflow_id', $workflow->id)->latest('id')->value('restored_from_version_id'))->toBe($firstVersion->id);
});

it('protects workflow version restore with automation permission', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $workflow = Workflow::factory()->create(['workspace_id' => $member->workspace_id]);
    $version = app(WorkflowVersioner::class)->record($workflow);

    $this->actingAs($member)
        ->post("/crm/workflows/versions/{$version->id}/restore")
        ->assertForbidden();
});
