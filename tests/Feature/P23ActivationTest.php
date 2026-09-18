<?php

use App\Enums\WorkspaceRole;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\Pipeline;
use App\Models\User;
use App\Models\WorkspaceActivationPreference;
use App\Services\Activation\WorkspaceActivationService;
use Illuminate\Support\Facades\File;

function p23Contact(User $user, array $overrides = []): Contact
{
    return Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => $overrides['first_name'] ?? 'Lina',
        'last_name' => $overrides['last_name'] ?? 'Hadj',
    ]);
}

function p23Deal(User $user, array $overrides = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = $overrides['contact'] ?? p23Contact($user);

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $overrides['pipeline_id'] ?? $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => $overrides['title'] ?? 'First deal',
        'amount_cents' => $overrides['amount_cents'] ?? 250_000,
        'currency' => 'DZD',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
    ]);
}

function p23Activity(User $user, array $overrides = []): Activity
{
    return Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => $overrides['type'] ?? 'task',
        'subject' => $overrides['subject'] ?? 'Follow up',
        'owner_id' => $overrides['owner_id'] ?? $user->id,
        'actor_id' => $overrides['actor_id'] ?? $user->id,
        'contact_id' => $overrides['contact_id'] ?? null,
        'deal_id' => $overrides['deal_id'] ?? null,
    ]);
}

function p23ConnectMeta(User $user): Integration
{
    return $user->workspace->integrations()->create([
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => 'p23-secret-token',
        'scopes' => ['pages_show_list'],
        'meta' => ['name' => 'Clinic Ads'],
        'connected_at' => now(),
    ]);
}

it('derives an empty workspace as unactivated with performable create CTAs', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->where('activation.activated', false)
            ->where('activation.dismissed', false)
            ->where('activation.visible', true)
            ->where('activation.collapsed', false)
            ->where('activation.progress.completed', 0)
            ->where('activation.progress.total', 5)
            ->where('activation.progress.core_completed', 0)
            ->where('activation.progress.core_total', 3)
            ->has('activation.steps', 5)
            ->where('activation.steps.0.id', 'add_crm_data')
            ->where('activation.steps.0.complete', false)
            ->where('activation.steps.0.href', '/crm/contacts?create=1')
            ->where('activation.steps.0.secondary_href', '/crm/contacts/import')
            ->where('activation.steps.1.id', 'configure_pipeline')
            ->where('activation.steps.1.complete', false)
            ->where('activation.steps.1.href', '/settings/pipelines')
            ->where('activation.steps.2.href', '/crm/deals?create=1')
            ->where('activation.steps.3.href', '/crm/activities?create=1')
            ->where('activation.steps.4.href', '/settings/apps')
            ->missing('activation.steps.4.access_token')
            ->has('attention')
            ->has('work')
            ->has('pipeline')
            ->has('recent'));
});

it('activates only after core CRM facts exist, not after optional integration', function () {
    $user = User::factory()->create();
    p23ConnectMeta($user);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', false)
            ->where('activation.steps.4.complete', true)
            ->where('activation.progress.core_completed', 0));

    p23Contact($user);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', false)
            ->where('activation.steps.0.complete', true)
            ->where('activation.progress.core_completed', 1));

    p23Deal($user);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', false)
            ->where('activation.steps.2.complete', true)
            ->where('activation.progress.core_completed', 2));

    p23Activity($user);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', true)
            ->where('activation.collapsed', true)
            ->where('activation.visible', true)
            ->where('activation.progress.core_completed', 3)
            ->where('activation.progress.completed', 4));
});

it('counts a company as CRM data without requiring a contact', function () {
    $user = User::factory()->create();
    Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Hydra',
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.steps.0.complete', true)
            ->where('activation.activated', false));
});

it('marks pipeline complete only when customized vs the seeded Sales default', function () {
    $user = User::factory()->create();
    $pipeline = $user->workspace->defaultPipeline();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('activation.steps.1.complete', false));

    $pipeline->forceFill(['name' => 'Enterprise'])->save();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('activation.steps.1.complete', true));
});

it('marks pipeline complete when a second pipeline exists', function () {
    $user = User::factory()->create();

    Pipeline::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Partners',
        'is_default' => false,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('activation.steps.1.complete', true));
});

it('consumes P22 mailbox connection without leaking secrets', function () {
    $user = User::factory()->create();
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        'password' => 'mailbox-secret',
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.steps.4.complete', true)
            ->where('activation.activated', false)
            ->missing('activation.access_token')
            ->missing('activation.steps.4.password'));
});

it('does not treat wizard finish as workspace activation', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/setup/start?step=finish')
        ->assertOk();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', false)
            ->where('activation.progress.core_completed', 0)
            ->where('activation.steps.0.complete', false));
});

it('hides the checklist after dismiss without marking steps complete', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/dashboard')
        ->post('/dashboard/activation/dismiss')
        ->assertRedirect('/dashboard');

    expect(WorkspaceActivationPreference::query()
        ->where('workspace_id', $user->workspace_id)
        ->where('user_id', $user->id)
        ->whereNotNull('dismissed_at')
        ->exists())->toBeTrue();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.dismissed', true)
            ->where('activation.visible', false)
            ->where('activation.activated', false)
            ->where('activation.steps.0.complete', false)
            ->where('activation.steps.2.complete', false));
});

it('lets a view-only member see progress without perform CTAs', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    p23Contact($owner);
    p23Deal($owner);
    p23ConnectMeta($owner);

    $this->actingAs($member)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.visible', true)
            ->where('activation.activated', false)
            ->where('activation.steps.0.complete', true)
            ->where('activation.steps.0.href', null)
            ->where('activation.steps.0.secondary_href', null)
            ->where('activation.steps.1.href', null)
            ->where('activation.steps.2.href', null)
            ->where('activation.steps.3.href', null)
            ->where('activation.steps.4.complete', true)
            ->where('activation.steps.4.href', null)
            ->where('activation.steps.0.can_perform', false)
            ->where('activation.steps.2.can_view', true));
});

it('keeps activation facts inside the current workspace', function () {
    $alpha = User::factory()->create();
    $beta = User::factory()->create();
    p23Contact($alpha);
    p23Deal($alpha);
    p23Activity($alpha);
    p23ConnectMeta($alpha);

    $this->actingAs($beta)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', false)
            ->where('activation.progress.completed', 0)
            ->where('activation.steps.0.complete', false)
            ->where('activation.steps.2.complete', false)
            ->where('activation.steps.3.complete', false)
            ->where('activation.steps.4.complete', false));

    $this->actingAs($alpha)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', true)
            ->where('activation.steps.4.complete', true));
});

it('does not share dismissal across members or workspaces', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);
    $other = User::factory()->create();

    $this->actingAs($owner)
        ->post('/dashboard/activation/dismiss')
        ->assertRedirect();

    $this->actingAs($member)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.dismissed', false)
            ->where('activation.visible', true));

    $this->actingAs($other)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.dismissed', false)
            ->where('activation.visible', true));
});

it('re-derives core steps after the last matching records are deleted', function () {
    $user = User::factory()->create();
    $contact = p23Contact($user);
    $deal = p23Deal($user, ['contact' => $contact]);
    $activity = p23Activity($user, ['deal_id' => $deal->id, 'contact_id' => $contact->id]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('activation.activated', true));

    $activity->delete();
    $deal->delete();
    $contact->delete();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', false)
            ->where('activation.steps.0.complete', false)
            ->where('activation.steps.2.complete', false)
            ->where('activation.steps.3.complete', false));
});

it('forbids guests from dismissing activation', function () {
    $this->post('/dashboard/activation/dismiss')->assertRedirect('/login');
});

it('keeps P23 presentation off tokens and frozen Home widgets intact in source', function () {
    $service = File::get(app_path('Services/Activation/WorkspaceActivationService.php'));
    $home = File::get(resource_path('js/pages/home.tsx'));
    $checklist = File::get(resource_path('js/components/dashboard/activation-checklist.tsx'));
    $builder = File::get(app_path('Services/Home/HomeDashboardBuilder.php'));

    expect($service)->toContain('has_configured_integration')
        ->and($service)->not->toContain('access_token')
        ->and($checklist)->toContain('role="progressbar"')
        ->and($checklist)->toContain('Dismiss')
        ->and($checklist)->not->toContain('confetti')
        ->and($checklist)->not->toContain('lucide-react')
        ->and($home)->toContain('ActivationChecklist')
        ->and($home)->toContain("title={t('Needs attention')}")
        ->and($home)->toContain("t('Today')")
        ->and($home)->toContain('HomeKpiStrip')
        ->and($home)->toContain('Pipeline')
        ->and($home)->toContain('Recent records')
        ->and($builder)->toContain('WorkspaceActivationService')
        ->and(app(WorkspaceActivationService::class))->toBeInstanceOf(WorkspaceActivationService::class);
});
