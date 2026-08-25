<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\OutboundMessage;
use App\Models\Sequence;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\WorkflowRunner;
use Illuminate\Support\Facades\Artisan;

it('schedules delayed workflow executions instead of running immediately', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;

    $workflow = Workflow::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Delayed task',
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Delayed follow-up', 'due_in_days' => 1],
        'delay_minutes' => 60,
        'active' => true,
    ]);

    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    expect(WorkflowExecution::query()->where('workflow_id', $workflow->id)->count())->toBe(1)
        ->and(Activity::query()->where('contact_id', $contact->id)->count())->toBe(0);
});

it('runs due workflow executions via workflow:run command', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    $workflow = Workflow::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Due task',
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Due now', 'due_in_days' => 0],
        'active' => true,
    ]);

    WorkflowExecution::query()->create([
        'workspace_id' => $workspace->id,
        'workflow_id' => $workflow->id,
        'contact_id' => $contact->id,
        'run_at' => now()->subMinute(),
        'status' => WorkflowExecution::STATUS_PENDING,
    ]);

    Artisan::call('workflow:run');

    expect(Activity::query()->where('contact_id', $contact->id)->count())->toBe(1)
        ->and(WorkflowExecution::query()->first()?->status)->toBe(WorkflowExecution::STATUS_COMPLETED);
});

it('assigns owner via workflow action', function () {
    $user = User::factory()->create();
    $assignee = User::factory()->create(['workspace_id' => $user->workspace_id]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => null,
    ]);

    $workflow = Workflow::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Assign owner',
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_ASSIGN_OWNER,
        'action_config' => ['entity' => 'contact', 'owner_id' => $assignee->id],
        'active' => true,
    ]);

    app(WorkflowRunner::class)->executeScheduled($workflow, $contact, null);

    expect($contact->fresh()->owner_id)->toBe($assignee->id);
});

it('filters contacts by sequence enrollment and email reply behavior', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $filter = app(CrmFilter::class);

    $sequence = Sequence::query()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Nurture',
        'channel' => 'email',
        'active' => true,
    ]);

    $enrolled = Contact::factory()->create(['workspace_id' => $workspace->id, 'first_name' => 'Enrolled']);
    $replied = Contact::factory()->create(['workspace_id' => $workspace->id, 'first_name' => 'Replied']);
    Contact::factory()->create(['workspace_id' => $workspace->id, 'first_name' => 'Other']);

    Enrollment::query()->create([
        'workspace_id' => $workspace->id,
        'sequence_id' => $sequence->id,
        'contact_id' => $enrolled->id,
        'status' => 'active',
        'next_step' => 1,
    ]);

    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $replied->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => $replied->email,
        'status' => 'sent',
        'replied_at' => now(),
    ]);

    expect($filter->count($workspace, 'contact', ['enrolled_in_sequence' => $sequence->id]))->toBe(1)
        ->and($filter->count($workspace, 'contact', ['email_replied' => true]))->toBe(1);
});
