<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\CustomAttributeDefinition;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Crm\EvoWorkflowTemplates;
use App\Services\Crm\WorkflowRunner;
use App\Services\Outbound\SuppressionService;
use Illuminate\Support\Facades\Http;

it('lists the automation page with the Evotechly templates', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/crm/workflows')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/workflows/index')
            ->has('workflows', 0)
            ->has('templates', 5)
            ->where('templates.0.key', EvoWorkflowTemplates::NEW_CONTACT_TASK)
            ->where('templates.1.key', EvoWorkflowTemplates::DEAL_QUALIFIED_TASK)
            ->where('templates.2.key', EvoWorkflowTemplates::NEW_CONTACT_ENROLL)
            ->where('templates.3.key', EvoWorkflowTemplates::DEAL_CREATED_AMOUNT_BRANCH)
            ->where('templates.4.key', EvoWorkflowTemplates::CONTACT_ALGER_BRANCH)
            ->where('templates.0.name', 'New Evotechly contact → first task')
            ->where('templates.3.name', 'Gros deal DZD → call today, else first wilaya check')
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
        EvoWorkflowTemplates::DEAL_CREATED_AMOUNT_BRANCH,
        EvoWorkflowTemplates::CONTACT_ALGER_BRANCH,
    ] as $key) {
        $this->actingAs($user)
            ->post('/crm/workflows/templates', ['template_key' => $key])
            ->assertRedirect('/crm/workflows');
    }

    $amountBranch = Workflow::query()->where('template_key', EvoWorkflowTemplates::DEAL_CREATED_AMOUNT_BRANCH)->first();

    expect(Workflow::query()->forWorkspace($user->workspace)->count())->toBe(5)
        ->and(Workflow::query()->where('template_key', EvoWorkflowTemplates::DEAL_QUALIFIED_TASK)->first()?->trigger_stage_id)
        ->toBe($user->workspace->defaultPipeline()->stageBySlug('qualified')->id)
        ->and($amountBranch?->condition_field)->toBe(Workflow::CONDITION_DEAL_AMOUNT)
        ->and($amountBranch?->else_action)->toBe(Workflow::ACTION_CREATE_TASK)
        ->and(Workflow::query()->where('template_key', EvoWorkflowTemplates::CONTACT_ALGER_BRANCH)->first()?->condition_value)
        ->toBe('Alger');
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

it('creates a workflow with a branch and a webhook action', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/crm/workflows', [
            'name' => 'Gros deal → webhook',
            'trigger' => Workflow::TRIGGER_DEAL_CREATED,
            'action' => Workflow::ACTION_SEND_WEBHOOK,
            'webhook_url' => 'https://hooks.evotechly.dz/deals',
            'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
            'condition_operator' => Workflow::OP_GTE,
            'condition_value' => '500000',
            'else_action' => Workflow::ACTION_CREATE_TASK,
            'else_subject' => 'Small Evotechly deal',
        ])
        ->assertRedirect('/crm/workflows');

    $workflow = Workflow::query()->where('name', 'Gros deal → webhook')->first();

    expect($workflow)->not->toBeNull()
        ->and($workflow->trigger)->toBe(Workflow::TRIGGER_DEAL_CREATED)
        ->and($workflow->action)->toBe(Workflow::ACTION_SEND_WEBHOOK)
        ->and($workflow->config()['url'] ?? null)->toBe('https://hooks.evotechly.dz/deals')
        ->and($workflow->condition_field)->toBe(Workflow::CONDITION_DEAL_AMOUNT)
        ->and($workflow->condition_operator)->toBe(Workflow::OP_GTE)
        ->and($workflow->else_action)->toBe(Workflow::ACTION_CREATE_TASK);
});

it('creates a task when a deal is created', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Deal created → task',
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => [
            'subject' => 'New Evotechly deal — {{deal}}',
        ],
    ]);

    $this->actingAs($user)
        ->post('/crm/deals', [
            'contact_id' => $contact->id,
            'title' => 'Clinique Hydra',
            'amount_dzd' => 120000,
        ])
        ->assertRedirect();

    $deal = Deal::query()->forWorkspace($user->workspace)->where('title', 'Clinique Hydra')->first();
    $task = Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->first();

    expect($deal)->not->toBeNull()
        ->and($task)->not->toBeNull()
        ->and($task->subject)->toBe('New Evotechly deal — Clinique Hydra')
        ->and($task->contact_id)->toBe($contact->id);
});

it('posts a webhook when a deal is created', function () {
    Http::fake(['https://hooks.evotechly.dz/*' => Http::response(['ok' => true], 200)]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Kaci',
        'wilaya' => 'Alger',
    ]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_SEND_WEBHOOK,
        'action_config' => ['url' => 'https://hooks.evotechly.dz/deals'],
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $user->workspace->defaultPipeline()->id,
        'stage_id' => $user->workspace->defaultPipeline()->stageBySlug('new')->id,
        'title' => 'Clinique Hydra',
        'amount_cents' => 75_000_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    Http::assertSent(function ($request) use ($deal, $contact) {
        return $request->url() === 'https://hooks.evotechly.dz/deals'
            && $request['source'] === 'evosales'
            && $request['deal']['id'] === $deal->id
            && (float) $request['deal']['amount_dzd'] === 750000.0
            && $request['contact']['id'] === $contact->id
            && $request['contact']['wilaya'] === 'Alger';
    });
});

it('does not post workflow data to a private webhook destination', function () {
    Http::fake();

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_SEND_WEBHOOK,
        'action_config' => ['url' => 'http://127.0.0.1/admin'],
    ]);

    Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $user->workspace->defaultPipeline()->id,
        'stage_id' => $user->workspace->defaultPipeline()->stageBySlug('new')->id,
        'title' => 'Private destination blocked',
        'currency' => 'DZD',
    ]);

    Http::assertNothingSent();
});

it('does not fail deal creation when the webhook is down', function () {
    Http::fake(['https://hooks.evotechly.dz/*' => Http::response('no', 500)]);

    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_SEND_WEBHOOK,
        'action_config' => ['url' => 'https://hooks.evotechly.dz/down'],
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $user->workspace->defaultPipeline()->id,
        'stage_id' => $user->workspace->defaultPipeline()->stageBySlug('new')->id,
        'title' => 'Still created',
        'currency' => 'DZD',
    ]);

    expect($deal->exists)->toBeTrue();
});

it('takes the then path when deal amount meets the branch', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Gros deal Evotechly — call today'],
        'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
        'condition_operator' => Workflow::OP_GTE,
        'condition_value' => '500000',
        'else_action' => Workflow::ACTION_CREATE_TASK,
        'else_action_config' => ['subject' => 'First wilaya check-in'],
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Clinique pilot',
        'amount_cents' => 75_000_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    $subjects = Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->pluck('subject');

    expect($subjects->all())->toBe(['Gros deal Evotechly — call today']);
});

it('takes the else path when deal amount misses the branch', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Gros deal Evotechly — call today'],
        'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
        'condition_operator' => Workflow::OP_GTE,
        'condition_value' => '500000',
        'else_action' => Workflow::ACTION_CREATE_TASK,
        'else_action_config' => ['subject' => 'First wilaya check-in'],
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Small clinic',
        'amount_cents' => 12_000_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
    ]);

    $subjects = Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->pluck('subject');

    expect($subjects->all())->toBe(['First wilaya check-in']);
});

it('does nothing on the else path when no else action is set', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);
    $pipeline = $user->workspace->defaultPipeline();

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Only big deals'],
        'condition_field' => Workflow::CONDITION_DEAL_AMOUNT,
        'condition_operator' => Workflow::OP_GTE,
        'condition_value' => '500000',
        'else_action' => null,
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Tiny',
        'amount_cents' => 10000,
        'currency' => 'DZD',
    ]);

    expect(Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->count())->toBe(0);
});

it('branches on contact wilaya then enrolls or creates a task', function () {
    $user = User::factory()->create();
    $sequence = Sequence::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Alger drip',
        'channel' => 'email',
    ]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_ENROLL_SEQUENCE,
        'action_config' => ['sequence_id' => $sequence->id],
        'condition_field' => 'contact.wilaya',
        'condition_operator' => Workflow::OP_EQ,
        'condition_value' => 'Alger',
        'else_action' => Workflow::ACTION_CREATE_TASK,
        'else_action_config' => ['subject' => 'Confirm wilaya for {{contact}}'],
    ]);

    $alger = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Sara',
        'last_name' => 'Khelifi',
        'wilaya' => 'Alger',
        'email' => 'sara.khelifi@evotechly.dz',
    ]);
    $oran = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Karim',
        'last_name' => 'Benali',
        'wilaya' => 'Oran',
        'email' => 'karim.benali@evotechly.dz',
    ]);

    expect(Enrollment::query()->where('contact_id', $alger->id)->where('sequence_id', $sequence->id)->exists())->toBeTrue()
        ->and(Activity::query()->where('contact_id', $alger->id)->where('type', 'task')->count())->toBe(0)
        ->and(Enrollment::query()->where('contact_id', $oran->id)->exists())->toBeFalse()
        ->and(Activity::query()->where('contact_id', $oran->id)->where('type', 'task')->first()?->subject)
        ->toBe('Confirm wilaya for Karim Benali');
});

it('branches on a contact custom property', function () {
    $user = User::factory()->create();

    $definition = CustomAttributeDefinition::query()->create([
        'workspace_id' => $user->workspace_id,
        'entity' => 'contact',
        'key' => 'sector',
        'label' => 'Sector',
        'type' => 'list',
        'options' => ['santé', 'retail'],
    ]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Clinic',
    ]);

    CustomAttributeValue::query()->create([
        'workspace_id' => $user->workspace_id,
        'definition_id' => $definition->id,
        'entity_type' => 'contact',
        'entity_id' => $contact->id,
        'value' => 'santé',
    ]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_CONTACT_CREATED,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Santé buyer — book Evotechly demo'],
        'condition_field' => 'contact.attr.sector',
        'condition_operator' => Workflow::OP_EQ,
        'condition_value' => 'santé',
        'else_action' => Workflow::ACTION_CREATE_TASK,
        'else_action_config' => ['subject' => 'Qualify sector'],
    ]);

    app(WorkflowRunner::class)->handleContactCreated($contact->fresh());

    expect(Activity::query()->where('contact_id', $contact->id)->where('type', 'task')->pluck('subject')->all())
        ->toBe(['Santé buyer — book Evotechly demo']);
});

it('branches on deal stage after a move', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'trigger' => Workflow::TRIGGER_DEAL_STAGE_CHANGED,
        'trigger_stage_id' => $pipeline->stageBySlug('qualified')->id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Qualified and high amount'],
        'condition_field' => Workflow::CONDITION_DEAL_STAGE,
        'condition_operator' => Workflow::OP_EQ,
        'condition_value' => 'qualified',
        'else_action' => Workflow::ACTION_CREATE_TASK,
        'else_action_config' => ['subject' => 'Should not fire'],
    ]);

    $deal = Deal::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Stage branch',
        'currency' => 'DZD',
    ]);

    $deal->moveTo($pipeline->stageBySlug('qualified'), $user);

    expect(Activity::query()->where('deal_id', $deal->id)->where('type', 'task')->pluck('subject')->all())
        ->toBe(['Qualified and high amount']);
});

it('keeps Workflows in Plus without reordering Vendre objects', function () {
    $sidebar = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($sidebar)
        ->toContain("label: 'Workflows'")
        ->toContain("href: '/crm/workflows'")
        ->toContain("activePaths: ['/automation']")
        ->toContain("label: 'Vendre'");

    expect(strpos($sidebar, "href: '/crm/leads'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/contacts'"))
        ->and(strpos($sidebar, "href: '/crm/contacts'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/companies'"))
        ->and(strpos($sidebar, "href: '/crm/companies'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/deals'"))
        ->and(strpos($sidebar, "href: '/crm/deals'"))
        ->toBeLessThan(strpos($sidebar, "href: '/crm/segments'"));
});
