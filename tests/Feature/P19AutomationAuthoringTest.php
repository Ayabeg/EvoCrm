<?php

use App\Enums\WorkspaceRole;
use App\Models\Mailbox;
use App\Models\Sequence;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Crm\EvoWorkflowTemplates;
use Illuminate\Support\Facades\File;

function p19AuthoringSource(): array
{
    return [
        'page' => File::get(resource_path('js/pages/crm/workflows/index.tsx')),
        'builder' => File::get(resource_path('js/components/crm/workflow-builder.tsx')),
        'lib' => File::get(resource_path('js/lib/workflow-authoring.ts')),
        'controller' => File::get(app_path('Http/Controllers/Crm/WorkflowController.php')),
        'runner' => File::get(app_path('Services/Crm/WorkflowRunner.php')),
        'model' => File::get(app_path('Models/Workflow.php')),
        'js' => File::get(base_path('tests/js/p19-automation-authoring.ts')),
        'package' => File::get(base_path('package.json')),
    ];
}

it('keeps structured authoring on the existing engine without a canvas or AI seam', function () {
    $src = p19AuthoringSource();

    expect(class_exists('App\\Models\\WorkflowV2'))->toBeFalse()
        ->and($src['package'])->not->toContain('reactflow')
        ->and($src['package'])->not->toContain('@xyflow')
        ->and($src['package'])->not->toContain('xyflow')
        ->and($src['page'])->toContain('CreateDrawer')
        ->and($src['page'])->toContain('border-hairline')
        ->and($src['page'])->toContain('WorkflowBuilder')
        ->and($src['page'])->not->toContain('--aurora-')
        ->and($src['page'])->not->toContain('Build workflow with AI')
        ->and($src['page'])->not->toContain('prompt-to-workflow')
        ->and($src['page'])->not->toContain('Ask Evo')
        ->and($src['builder'])->toContain("data-workflow-section={step}")
        ->and($src['builder'])->toContain("step: 'when' | 'if' | 'then' | 'else'")
        ->and($src['builder'])->toContain('label="WHEN"')
        ->and($src['builder'])->toContain('label="IF"')
        ->and($src['builder'])->toContain('label="THEN"')
        ->and($src['builder'])->toContain('label="ELSE"')
        ->and($src['builder'])->not->toContain('ReactFlow')
        ->and($src['lib'])->toContain('summarizeWorkflow')
        ->and($src['lib'])->not->toContain('starts_with')
        ->and($src['page'])->toContain('disabled={!canManage || mutating}')
        ->and($src['page'])->toContain('if (!beginExclusiveAction(mutatingRef))')
        ->and($src['page'])->toContain('releaseExclusiveAction(mutatingRef)')
        ->and($src['page'])->toContain('Discard unsaved changes')
        ->and($src['controller'])->not->toContain('WorkflowV2');
});

it('locks the authoring registries to the runner identifiers', function () {
    $lib = p19AuthoringSource()['lib'];

    foreach (Workflow::triggers() as $trigger) {
        expect($lib)->toContain("'{$trigger}'");
    }

    foreach (Workflow::actions() as $action) {
        expect($lib)->toContain("'{$action}'");
    }

    foreach (Workflow::operators() as $operator) {
        expect($lib)->toContain("'{$operator}'");
    }

    expect($lib)->not->toContain('send_whatsapp')
        ->and($lib)->not->toContain('and_or')
        ->and($lib)->not->toContain('nested_branch');
});

it('exposes truthful list props and capability flags without fake run metrics', function () {
    $user = User::factory()->create();
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
    ]);
    Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'channel' => 'email',
    ]);

    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'active' => false,
        'name' => 'Draft follow-up',
    ]);

    $this->actingAs($user)
        ->get('/crm/workflows')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/workflows/index')
            ->has('workflows', 1)
            ->where('workflows.0.id', $workflow->id)
            ->where('workflows.0.active', false)
            ->where('workflows.0.trigger', Workflow::TRIGGER_CONTACT_CREATED)
            ->has('workflows.0.updated_at')
            ->has('workflows.0.trigger_stage_id')
            ->has('capabilities.can_manage')
            ->where('capabilities.can_manage', true)
            ->where('capabilities.has_mailbox', true)
            ->where('capabilities.has_sequences', true)
            ->has('members')
            ->has('ticket_statuses')
            ->missing('workflows.0.success_rate')
            ->missing('workflows.0.run_count')
        );
});

it('saves a create as draft when the authoring UI sends active false', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/workflows', [
            'name' => 'P19 simple draft',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
            'subject' => 'Introduce Evotechly',
            'active' => false,
        ])
        ->assertRedirect('/crm/workflows');

    $workflow = Workflow::query()->where('name', 'P19 simple draft')->first();

    expect($workflow)->not->toBeNull()
        ->and($workflow->active)->toBeFalse()
        ->and($workflow->trigger)->toBe(Workflow::TRIGGER_CONTACT_CREATED)
        ->and($workflow->action)->toBe(Workflow::ACTION_CREATE_TASK)
        ->and($workflow->config()['subject'] ?? null)->toBe('Introduce Evotechly');
});

it('keeps omitted active as live so existing posts stay unchanged', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/workflows', [
            'name' => 'Legacy create stays live',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
        ])
        ->assertRedirect('/crm/workflows');

    expect(Workflow::query()->where('name', 'Legacy create stays live')->first()?->active)->toBeTrue();
});

it('updates structure without changing enablement', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'active' => false,
        'name' => 'Before edit',
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Old'],
    ]);

    $this->actingAs($user)
        ->put("/crm/workflows/{$workflow->id}", [
            'name' => 'After edit',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
            'subject' => 'New subject',
            'active' => true,
        ])
        ->assertRedirect('/crm/workflows');

    $workflow->refresh();

    expect($workflow->name)->toBe('After edit')
        ->and($workflow->active)->toBeFalse()
        ->and($workflow->config()['subject'] ?? null)->toBe('New subject');
});

it('round-trips a conditional else branch including else-only property fields', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/workflows', [
            'name' => 'P19 else property',
            'trigger' => Workflow::TRIGGER_DEAL_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
            'subject' => 'Gros deal',
            'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
            'condition_operator' => Workflow::OP_GTE,
            'condition_value' => '500000',
            'else_action' => Workflow::ACTION_SET_PROPERTY,
            'else_property_entity' => 'contact',
            'else_property_field' => 'wilaya',
            'else_property_value' => 'Alger',
            'active' => false,
        ])
        ->assertRedirect('/crm/workflows');

    $workflow = Workflow::query()->where('name', 'P19 else property')->first();

    expect($workflow)->not->toBeNull()
        ->and($workflow->condition_field)->toBe(Workflow::CONDITION_DEAL_AMOUNT)
        ->and($workflow->condition_operator)->toBe(Workflow::OP_GTE)
        ->and($workflow->else_action)->toBe(Workflow::ACTION_SET_PROPERTY)
        ->and($workflow->elseConfig()['field'] ?? null)->toBe('wilaya')
        ->and($workflow->elseConfig()['value'] ?? null)->toBe('Alger')
        ->and($workflow->elseConfig()['entity'] ?? null)->toBe('contact');

    $this->actingAs($user)
        ->put("/crm/workflows/{$workflow->id}", [
            'name' => 'P19 else property',
            'trigger' => Workflow::TRIGGER_DEAL_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
            'subject' => 'Gros deal',
            'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
            'condition_operator' => Workflow::OP_GTE,
            'condition_value' => '750000',
            'else_action' => Workflow::ACTION_SET_PROPERTY,
            'else_property_entity' => 'contact',
            'else_property_field' => 'city',
            'else_property_value' => 'Oran',
        ])
        ->assertRedirect('/crm/workflows');

    $workflow->refresh();

    expect($workflow->condition_value)->toBe('750000')
        ->and($workflow->elseConfig()['field'] ?? null)->toBe('city')
        ->and($workflow->elseConfig()['value'] ?? null)->toBe('Oran');
});

it('stores create_deal title and amount the runner can execute', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/workflows', [
            'name' => 'P19 create deal',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_CREATE_DEAL,
            'subject' => 'Pilot clinic',
            'property_value' => '250000',
            'active' => false,
        ])
        ->assertRedirect('/crm/workflows');

    $config = Workflow::query()->where('name', 'P19 create deal')->first()?->config();

    expect($config['title'] ?? null)->toBe('Pilot clinic')
        ->and($config['amount_cents'] ?? null)->toBe(25_000_000);
});

it('validates required trigger action and condition fields on the server', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/crm/workflows')
        ->post('/crm/workflows', [
            'name' => 'Broken',
        ])
        ->assertRedirect('/crm/workflows')
        ->assertSessionHasErrors(['trigger', 'action']);

    $this->actingAs($user)
        ->from('/crm/workflows')
        ->post('/crm/workflows', [
            'name' => 'Bad trigger',
            'trigger' => 'deal.won',
            'action' => Workflow::ACTION_CREATE_TASK,
        ])
        ->assertRedirect('/crm/workflows')
        ->assertSessionHasErrors('trigger');

    $this->actingAs($user)
        ->from('/crm/workflows')
        ->post('/crm/workflows', [
            'name' => 'Bad action',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => 'send_whatsapp',
        ])
        ->assertRedirect('/crm/workflows')
        ->assertSessionHasErrors('action');

    $this->actingAs($user)
        ->from('/crm/workflows')
        ->post('/crm/workflows', [
            'name' => 'Webhook without url',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_SEND_WEBHOOK,
        ])
        ->assertRedirect('/crm/workflows')
        ->assertSessionHasErrors('webhook_url');

    $this->actingAs($user)
        ->from('/crm/workflows')
        ->post('/crm/workflows', [
            'name' => 'Condition without value',
            'trigger' => Workflow::TRIGGER_DEAL_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
            'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
            'condition_operator' => Workflow::OP_GTE,
        ])
        ->assertRedirect('/crm/workflows')
        ->assertSessionHasErrors('condition_value');

    $this->actingAs($user)
        ->from('/crm/workflows')
        ->post('/crm/workflows', [
            'name' => 'Unknown operator',
            'trigger' => Workflow::TRIGGER_DEAL_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
            'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
            'condition_operator' => 'starts_with',
            'condition_value' => '500000',
        ])
        ->assertRedirect('/crm/workflows')
        ->assertSessionHasErrors('condition_operator');
});

it('toggles enablement from the server and leaves failed posts unchanged', function () {
    $user = User::factory()->create();
    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'active' => false,
    ]);

    $this->actingAs($user)
        ->post("/crm/workflows/{$workflow->id}/toggle")
        ->assertRedirect('/crm/workflows');

    expect($workflow->fresh()->active)->toBeTrue();

    $this->actingAs($user)
        ->post("/crm/workflows/{$workflow->id}/toggle")
        ->assertRedirect('/crm/workflows');

    expect($workflow->fresh()->active)->toBeFalse();

    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->post("/crm/workflows/{$workflow->id}/toggle")
        ->assertNotFound();

    expect($workflow->fresh()->active)->toBeFalse();
});

it('blocks members without automation.manage from mutating workflows', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $workflow = Workflow::factory()->create([
        'workspace_id' => $member->workspace_id,
    ]);

    $this->actingAs($member)->get('/crm/workflows')->assertOk();

    $this->actingAs($member)
        ->post('/crm/workflows', [
            'name' => 'Blocked',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
        ])
        ->assertForbidden();

    $this->actingAs($member)
        ->put("/crm/workflows/{$workflow->id}", [
            'name' => 'Blocked edit',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
        ])
        ->assertForbidden();

    $this->actingAs($member)
        ->post("/crm/workflows/{$workflow->id}/toggle")
        ->assertForbidden();

    $this->actingAs($member)
        ->delete("/crm/workflows/{$workflow->id}")
        ->assertForbidden();

    $this->actingAs($member)
        ->post('/crm/workflows/templates', [
            'template_key' => EvoWorkflowTemplates::NEW_CONTACT_TASK,
        ])
        ->assertForbidden();

    expect(Workflow::query()->forWorkspace($member->workspace)->count())->toBe(1);
});

it('lets a member with automation.manage create a draft', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => ['automation.manage'],
    ]);

    $this->actingAs($member)
        ->post('/crm/workflows', [
            'name' => 'Granted member draft',
            'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
            'action' => Workflow::ACTION_CREATE_TASK,
            'active' => false,
        ])
        ->assertRedirect('/crm/workflows');

    expect(Workflow::query()->where('name', 'Granted member draft')->first()?->active)->toBeFalse();
});

it('instantiates existing templates into executable workflow rows', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/workflows/templates', [
            'template_key' => EvoWorkflowTemplates::DEAL_CREATED_AMOUNT_BRANCH,
        ])
        ->assertRedirect('/crm/workflows');

    $workflow = Workflow::query()
        ->where('template_key', EvoWorkflowTemplates::DEAL_CREATED_AMOUNT_BRANCH)
        ->first();

    expect($workflow)->not->toBeNull()
        ->and(in_array($workflow->trigger, Workflow::triggers(), true))->toBeTrue()
        ->and(in_array($workflow->action, Workflow::actions(), true))->toBeTrue()
        ->and($workflow->else_action === null || in_array($workflow->else_action, Workflow::actions(), true))->toBeTrue()
        ->and($workflow->condition_operator === null || in_array($workflow->condition_operator, Workflow::operators(), true))->toBeTrue();
});

it('locks the authoring proof file to the runner registries and summaries', function () {
    $js = p19AuthoringSource()['js'];

    foreach (Workflow::triggers() as $trigger) {
        expect($js)->toContain("'{$trigger}'");
    }

    foreach (Workflow::actions() as $action) {
        expect($js)->toContain("'{$action}'");
    }

    foreach (Workflow::operators() as $operator) {
        expect($js)->toContain("'{$operator}'");
    }

    expect($js)->toContain('When a contact is created create a task')
        ->and($js)->toContain('else create a task “Light check-in”')
        ->and($js)->toContain("payload.active, false")
        ->and($js)->toContain("!('actions' in payload)")
        ->and($js)->toContain('invented action is rejected')
        ->and($js)->toContain('frontend-only operator is rejected')
        ->and($js)->toContain('two synchronous save attempts create one workflow')
        ->and($js)->toContain('422/failure releaseExclusiveAction unlocks retry')
        ->and($js)->toContain('failed save keeps a dirty draft');
});

it('claims a synchronous mutation lock before every authoring write', function () {
    $page = p19AuthoringSource()['page'];
    $lib = p19AuthoringSource()['lib'];

    expect($lib)->toContain('export function beginExclusiveAction')
        ->and($lib)->toContain('if (lock.current)')
        ->and($page)->toContain('if (!beginExclusiveAction(mutatingRef))')
        ->and(substr_count($page, 'if (!beginExclusiveAction(mutatingRef))'))->toBe(7)
        ->and($page)->toContain("router.post('/crm/workflows', payload, visit)")
        ->and($page)->toContain('router.put(`/crm/workflows/${editingId}`, payload, visit)')
        ->and($page)->toContain('`/crm/workflows/${workflow.id}/toggle`')
        ->and($page)->toContain("'/crm/workflows/templates'")
        ->and($page)->toContain('router.delete(`/crm/workflows/${workflow.id}`')
        ->and($page)->toContain('onError: () => {')
        ->and($page)->toContain('ignoreDirtyClose.current = false')
        ->and($page)->toContain('if (mutatingRef.current)')
        ->and($page)->not->toContain('if (submitting)')
        ->and($page)->not->toContain('togglingId');
});
