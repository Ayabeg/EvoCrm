<?php

use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

function p20HistorySource(): array
{
    return [
        'page' => File::get(resource_path('js/pages/crm/workflows/index.tsx')),
        'history' => File::get(resource_path('js/components/crm/workflow-execution-history.tsx')),
        'lib' => File::get(resource_path('js/lib/workflow-execution.ts')),
        'authoring' => File::get(resource_path('js/lib/workflow-authoring.ts')),
        'builder' => File::get(resource_path('js/components/crm/workflow-builder.tsx')),
        'js' => File::get(base_path('tests/js/p20-automation-history.ts')),
        'controller' => File::get(app_path('Http/Controllers/Crm/WorkflowController.php')),
        'runner' => File::get(app_path('Services/Crm/WorkflowRunner.php')),
    ];
}

it('keeps P19 authoring frozen and does not invent a second engine', function () {
    $src = p20HistorySource();

    expect(class_exists('App\\Models\\WorkflowV2'))->toBeFalse()
        ->and(class_exists('App\\Models\\AutomationV2'))->toBeFalse()
        ->and($src['builder'])->toContain("label=\"WHEN\"")
        ->and($src['builder'])->toContain("label=\"IF\"")
        ->and($src['builder'])->toContain("label=\"THEN\"")
        ->and($src['builder'])->toContain("label=\"ELSE\"")
        ->and($src['authoring'])->toContain('summarizeWorkflow')
        ->and($src['page'])->toContain('WorkflowBuilder')
        ->and($src['page'])->toContain('Review configuration')
        ->and($src['page'])->toContain('This reviews the structure. It does not run the workflow.')
        ->and($src['page'])->not->toContain('Test succeeded')
        ->and($src['page'])->not->toContain('Ask Evo')
        ->and($src['history'])->not->toContain('onRetry')
        ->and($src['history'])->toContain('Retry is not available')
        ->and($src['lib'])->not->toContain('success_rate')
        ->and($src['lib'])->not->toContain('run_count')
        ->and(substr_count($src['page'], 'if (!beginExclusiveAction(mutatingRef))'))->toBe(4);
});

it('persists an immediate execution with then-branch facts', function () {
    $user = User::factory()->create();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'New contact task',
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Call {{contact}}', 'due_in_days' => 1],
        'active' => true,
    ]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amina',
        'last_name' => 'Hadj',
    ]);

    $execution = WorkflowExecution::query()->where('workspace_id', $user->workspace_id)->first();

    expect($execution)->not->toBeNull()
        ->and($execution->status)->toBe(WorkflowExecution::STATUS_COMPLETED)
        ->and($execution->branch)->toBe('then')
        ->and($execution->action)->toBe(Workflow::ACTION_CREATE_TASK)
        ->and($execution->condition_passed)->toBeNull()
        ->and($execution->contact_id)->toBe($contact->id)
        ->and($execution->started_at)->not->toBeNull()
        ->and($execution->finished_at)->not->toBeNull()
        ->and($execution->result_summary['outcome'] ?? null)->toBe('created_task')
        ->and(Activity::query()->where('contact_id', $contact->id)->count())->toBe(1);
});

it('records else vs then and completed no-action when else is empty', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Amount branch',
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Big deal'],
        'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
        'condition_operator' => Workflow::OP_GTE,
        'condition_value' => '500000',
        'else_action' => null,
        'active' => true,
    ]);

    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Small',
        'amount_cents' => 10000,
        'currency' => 'DZD',
    ]);

    $execution = WorkflowExecution::query()->where('workspace_id', $user->workspace_id)->first();

    expect($execution?->status)->toBe(WorkflowExecution::STATUS_COMPLETED)
        ->and($execution->branch)->toBe('else')
        ->and($execution->action)->toBeNull()
        ->and($execution->condition_passed)->toBeFalse()
        ->and($execution->result_summary['outcome'] ?? null)->toBe('no_action')
        ->and(Activity::query()->where('contact_id', $contact->id)->where('type', 'task')->count())->toBe(0);
});

it('marks a webhook HTTP failure as failed without breaking the trigger write', function () {
    Http::fake(['https://hooks.evotechly.dz/*' => Http::response('no', 500)]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_SEND_WEBHOOK,
        'action_config' => ['url' => 'https://hooks.evotechly.dz/down?token=super-secret'],
        'active' => true,
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $user->workspace->defaultPipeline()->id,
        'stage_id' => $user->workspace->defaultPipeline()->stageBySlug('new')->id,
        'title' => 'Still created',
        'currency' => 'DZD',
    ]);

    $execution = WorkflowExecution::query()->where('workspace_id', $user->workspace_id)->first();

    expect($deal->exists)->toBeTrue()
        ->and($execution?->status)->toBe(WorkflowExecution::STATUS_FAILED)
        ->and($execution->error_summary)->toContain('HTTP 500')
        ->and($execution->action_parameters['url'] ?? null)->toBe('https://hooks.evotechly.dz/down')
        ->and(json_encode($execution->action_parameters))->not->toContain('super-secret');
});

it('cancels pending delayed runs when the workflow is turned off and keeps completed history', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Later'],
        'delay_minutes' => 60,
        'active' => true,
    ]);

    $pending = WorkflowExecution::query()->where('workflow_id', $workflow->id)->first();

    WorkflowExecution::query()->create([
        'workspace_id' => $user->workspace_id,
        'workflow_id' => $workflow->id,
        'workflow_name' => $workflow->name,
        'contact_id' => $contact->id,
        'trigger' => $workflow->trigger,
        'branch' => 'then',
        'action' => $workflow->action,
        'run_at' => now()->subHour(),
        'started_at' => now()->subHour(),
        'finished_at' => now()->subHour(),
        'status' => WorkflowExecution::STATUS_COMPLETED,
    ]);

    expect($pending?->status)->toBe(WorkflowExecution::STATUS_PENDING);

    $this->actingAs($user)
        ->post("/crm/workflows/{$workflow->id}/toggle")
        ->assertRedirect('/crm/workflows');

    expect($pending->fresh()->status)->toBe(WorkflowExecution::STATUS_CANCELLED)
        ->and($pending->fresh()->error_summary)->toContain('turned off')
        ->and(WorkflowExecution::query()->where('workflow_id', $workflow->id)->where('status', WorkflowExecution::STATUS_COMPLETED)->count())->toBe(1)
        ->and(Activity::query()->where('contact_id', $contact->id)->count())->toBe(0);
});

it('claims a delayed row once and does not execute it twice', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Due now', 'due_in_days' => 0],
        'active' => true,
    ]);

    WorkflowExecution::query()->create([
        'workspace_id' => $user->workspace_id,
        'workflow_id' => $workflow->id,
        'contact_id' => $contact->id,
        'run_at' => now()->subMinute(),
        'status' => WorkflowExecution::STATUS_PENDING,
    ]);

    Artisan::call('workflow:run');
    Artisan::call('workflow:run');

    expect(Activity::query()->where('contact_id', $contact->id)->count())->toBe(1)
        ->and(WorkflowExecution::query()->first()?->status)->toBe(WorkflowExecution::STATUS_COMPLETED);
});

it('exposes paginated sanitized history without fake metrics or retry', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'History source',
        'active' => false,
    ]);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Nadia',
        'last_name' => 'Cherif',
        'email' => 'nadia.cherif@clinic.dz',
    ]);

    foreach (range(1, 26) as $index) {
        WorkflowExecution::query()->create([
            'workspace_id' => $user->workspace_id,
            'workflow_id' => $workflow->id,
            'workflow_name' => $workflow->name,
            'contact_id' => $contact->id,
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'branch' => 'then',
            'action' => Workflow::ACTION_CREATE_TASK,
            'run_at' => now()->subMinutes($index),
            'started_at' => now()->subMinutes($index),
            'finished_at' => now()->subMinutes($index),
            'status' => WorkflowExecution::STATUS_COMPLETED,
            'result_summary' => ['outcome' => 'created_task', 'summary' => 'Created a task.'],
        ]);
    }

    $this->actingAs($user)
        ->get('/crm/workflows?view=history')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/workflows/index')
            ->where('view', 'history')
            ->has('executions.data', 25)
            ->where('executions.paginator.total', 26)
            ->where('executions.paginator.per_page', 25)
            ->where('executions.paginator.page', 1)
            ->where('executions.contract.retry_available', false)
            ->where('executions.contract.test_available', false)
            ->where('executions.data.0.can_retry', false)
            ->where('executions.data.0.workflow_name', 'History source')
            ->where('executions.data.0.record.contact.visible', true)
            ->where('executions.data.0.record.contact.label', 'Nadia Cherif')
            ->missing('executions.data.0.success_rate')
            ->missing('workflows.0.run_count')
        );

    $this->actingAs($user)
        ->get('/crm/workflows?view=history&history_page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('executions.data', 1)
            ->where('executions.paginator.page', 2)
        );
});

it('hides another owner deal from a team-only member and still shows the execution', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => ['deals.team_only'],
    ]);
    $contact = Contact::factory()->create(['workspace_id' => $owner->workspace_id]);
    $workflow = Workflow::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'active' => false,
    ]);
    $deal = Deal::query()->create([
        'workspace_id' => $owner->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $owner->workspace->defaultPipeline()->id,
        'stage_id' => $owner->workspace->defaultPipeline()->stageBySlug('new')->id,
        'title' => 'Confidential clinic deal',
        'owner_id' => $owner->id,
        'currency' => 'DZD',
    ]);

    $execution = WorkflowExecution::query()->create([
        'workspace_id' => $owner->workspace_id,
        'workflow_id' => $workflow->id,
        'workflow_name' => $workflow->name,
        'contact_id' => $contact->id,
        'deal_id' => $deal->id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'run_at' => now(),
        'status' => WorkflowExecution::STATUS_COMPLETED,
        'error_summary' => 'Mail failed for hidden@clinic.dz',
        'action_parameters' => ['body' => 'Call hidden@clinic.dz', 'url' => 'https://hooks.example.com/x?token=abc'],
    ]);

    $this->actingAs($member)
        ->get('/crm/workflows?view=history&execution='.$execution->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('executions.data.0.record.deal.visible', false)
            ->where('executions.data.0.record.deal.label', 'Record hidden')
            ->where('executions.selected.record.deal.visible', false)
            ->where('executions.selected.record.deal.label', 'Record hidden')
            ->where('executions.selected.action_parameters.url', 'https://hooks.example.com/x')
        );
});

it('lets a member without automation.manage inspect history but not mutate', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $workflow = Workflow::factory()->create([
        'workspace_id' => $member->workspace_id,
        'active' => false,
    ]);

    WorkflowExecution::query()->create([
        'workspace_id' => $member->workspace_id,
        'workflow_id' => $workflow->id,
        'run_at' => now(),
        'status' => WorkflowExecution::STATUS_COMPLETED,
    ]);

    $this->actingAs($member)
        ->get('/crm/workflows?view=history')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('capabilities.can_manage', false)
            ->has('executions.data', 1)
        );

    $this->actingAs($member)
        ->post("/crm/workflows/{$workflow->id}/toggle")
        ->assertForbidden();
});

it('locks the P20 proof file to truthful history language', function () {
    $js = p20HistorySource()['js'];

    expect($js)->toContain('retry is not available')
        ->and($js)->toContain('fake test run is not available')
        ->and($js)->toContain('hidden records do not leak names')
        ->and($js)->toContain("'pending'")
        ->and($js)->toContain("'running'")
        ->and($js)->toContain("'failed'");
});
