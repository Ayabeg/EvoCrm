<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Crm\EvoWorkflowTemplates;
use App\Services\Outbound\SuppressionService;

it('lists the automation page with the three Evotechly templates', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/workflows')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/workflows/index')
            ->has('workflows', 0)
            ->has('templates', 3)
            ->where('templates.0.key', EvoWorkflowTemplates::NEW_CONTACT_TASK)
            ->where('templates.1.key', EvoWorkflowTemplates::DEAL_QUALIFIED_TASK)
            ->where('templates.2.key', EvoWorkflowTemplates::NEW_CONTACT_ENROLL)
            ->where('templates.0.name', 'New Evotechly contact → first task')
        );

    $this->actingAs($user)
        ->get('/automation')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/workflows/index'));
});

it('creates a workflow from the form', function () {
    $user = User::factory()->create();
    $qualified = $user->workspace->defaultPipeline()->stageBySlug('qualified');

    $this->actingAs($user)
        ->post('/crm/workflows', [
            'name' => 'Deal → Qualified → task',
            'trigger' => Workflow::TRIGGER_DEAL_STAGE_CHANGED,
            'trigger_stage_id' => $qualified->id,
            'action' => Workflow::ACTION_CREATE_TASK,
            'subject' => 'Qualified Evotechly follow-up',
        ])
        ->assertRedirect('/crm/workflows');

    expect(Workflow::query()->where('name', 'Deal → Qualified → task')->first())
        ->not->toBeNull()
        ->trigger->toBe(Workflow::TRIGGER_DEAL_STAGE_CHANGED)
        ->action->toBe(Workflow::ACTION_CREATE_TASK)
        ->trigger_stage_id->toBe($qualified->id);
});

it('applies each Evo template into the workspace', function () {
    $user = User::factory()->create();

    foreach ([
        EvoWorkflowTemplates::NEW_CONTACT_TASK,
        EvoWorkflowTemplates::DEAL_QUALIFIED_TASK,
        EvoWorkflowTemplates::NEW_CONTACT_ENROLL,
    ] as $key) {
        $this->actingAs($user)
            ->post('/crm/workflows/templates', ['template_key' => $key])
            ->assertRedirect('/crm/workflows');
    }

    expect(Workflow::query()->forWorkspace($user->workspace)->count())->toBe(3)
        ->and(Workflow::query()->where('template_key', EvoWorkflowTemplates::DEAL_QUALIFIED_TASK)->first()?->trigger_stage_id)
        ->toBe($user->workspace->defaultPipeline()->stageBySlug('qualified')->id);
});

it('creates a task when a contact is created', function () {
    $user = User::factory()->create();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'New contact → task',
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => [
            'subject' => 'Introduce Evotechly to {{contact}}',
            'body' => 'First Evotechly conversation.',
        ],
    ]);

    $this->actingAs($user)
        ->post('/crm/contacts', [
            'first_name' => 'Amine',
            'last_name' => 'Kaci',
            'email' => 'amine.kaci@evotechly.dz',
            'phone' => '0550199111',
        ])
        ->assertRedirect();

    $contact = Contact::query()->forWorkspace($user->workspace)->where('email', 'amine.kaci@evotechly.dz')->first();
    $task = Activity::query()->where('contact_id', $contact->id)->where('type', 'task')->first();

    expect($contact)->not->toBeNull()
        ->and($task)->not->toBeNull()
        ->and($task->subject)->toBe('Introduce Evotechly to Amine Kaci')
        ->and($task->meta['source'] ?? null)->toBe('workflow');
});

it('creates a task when a deal moves to Qualified', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $qualified = $pipeline->stageBySlug('qualified');
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    Workflow::factory()->create([
        'workspace_id' => $workspace->id,
        'name' => 'Deal → Qualified → task',
        'trigger' => Workflow::TRIGGER_DEAL_STAGE_CHANGED,
        'trigger_stage_id' => $qualified->id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => [
            'subject' => 'Qualified deal — set the next Evotechly step',
        ],
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinique pilot',
        'amount_cents' => 250000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    expect(Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->count())->toBe(0);

    $deal->moveTo($qualified, $user);

    $task = Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->first();

    expect($task)->not->toBeNull()
        ->and($task->subject)->toBe('Qualified deal — set the next Evotechly step')
        ->and($task->contact_id)->toBe($contact->id)
        ->and($task->owner_id)->toBe($user->id);
});

it('enrolls a new contact in the first outbound sequence', function () {
    $user = User::factory()->create();
    $first = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'First Evotechly drip',
        'channel' => 'email',
    ]);
    Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Later drip',
        'channel' => 'email',
    ]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'New contact → first sequence',
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_ENROLL_SEQUENCE,
        'action_config' => ['sequence_id' => null],
    ]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'sara@evotechly.dz',
    ]);

    expect(Enrollment::query()->where('contact_id', $contact->id)->where('sequence_id', $first->id)->exists())->toBeTrue();
});

it('does not create a Qualified task when the deal moves to Demo', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_STAGE_CHANGED,
        'trigger_stage_id' => $pipeline->stageBySlug('qualified')->id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Should not fire'],
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Skip',
        'currency' => 'DZD',
    ]);

    $deal->moveTo($pipeline->stageBySlug('demo'));

    expect(Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->count())->toBe(0);
});

it('does not run an inactive workflow', function () {
    $user = User::factory()->create();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'active' => false,
        'action_config' => ['subject' => 'Inactive'],
    ]);

    Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    expect(Activity::query()->where('type', 'task')->where('subject', 'Inactive')->count())->toBe(0);
});

it('skips enroll when the workspace has no sequence', function () {
    $user = User::factory()->create();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'action' => Workflow::ACTION_ENROLL_SEQUENCE,
        'action_config' => ['sequence_id' => null],
    ]);

    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    expect(Enrollment::query()->where('contact_id', $contact->id)->exists())->toBeFalse();
});

it('does not fail contact creation when enroll hits the suppression list', function () {
    $user = User::factory()->create();
    Sequence::factory()->create(['workspace_id' => $user->workspace_id, 'channel' => 'email']);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'action' => Workflow::ACTION_ENROLL_SEQUENCE,
        'action_config' => ['sequence_id' => null],
    ]);

    app(SuppressionService::class)->suppress($user->workspace, 'email', 'blocked@evotechly.dz');

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'email' => 'blocked@evotechly.dz',
    ]);

    expect($contact->exists)->toBeTrue()
        ->and(Enrollment::query()->where('contact_id', $contact->id)->exists())->toBeFalse();
});

it('adds Automation last in the CRM nav group without reordering the rest', function () {
    $sidebar = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($sidebar)
        ->toContain("label: 'Automation'")
        ->toContain("href: '/crm/workflows'");

    expect(strpos($sidebar, "href: '/crm/companies'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/deals'"))
        ->and(strpos($sidebar, "href: '/crm/deals'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/leads'"))
        ->and(strpos($sidebar, "href: '/crm/leads'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/segments'"))
        ->and(strpos($sidebar, "href: '/crm/segments'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/workflows'"));
});
