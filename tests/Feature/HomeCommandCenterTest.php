<?php

use App\Enums\ChannelType;
use App\Models\Activity;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\OutboundMessage;
use App\Models\Thread;
use App\Models\User;

function homeDeal(User $user, string $stageSlug = 'new'): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => 'Home deal '.$stageSlug,
        'amount_cents' => 100_000,
        'currency' => 'DZD',
    ]);
}

it('serves the command center to the owner without the old warning wall', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('today', 6)
            ->has('departments', 6)
            ->has('nextSteps')
            ->has('charts')
            ->missing('evolution')
            ->missing('meta_connected')
            ->missing('stats')
        );
});

it('points every department tile at an in-app route', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('departments.0.name', 'Inbox')
            ->where('departments.0.href', '/inbox')
            ->where('departments.1.name', 'Leads')
            ->where('departments.1.href', '/leads')
            ->where('departments.2.name', 'Contacts')
            ->where('departments.2.href', '/crm/contacts')
            ->where('departments.3.name', 'Ads')
            ->where('departments.3.href', '/ads')
            ->where('departments.4.name', 'Outbound')
            ->where('departments.4.href', '/outbound')
            ->where('departments.5.name', 'Integrations')
            ->where('departments.5.href', '/settings/apps')
        );
});

it('never ejects to desk.evotechly.com or outbound.evotechly.com from home', function () {
    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    expect($response->headers->get('Location'))->toBeNull();

    // The home page's own props carry no external host: every tile and row
    // stays on the CRM hostname. (The shared workspace prop keeps the desk
    // embed URL as a setting — /inbox iframes it in-app, never ejects.)
    $props = $response->viewData('page')['props'];
    $home = json_encode([
        'today' => $props['today'],
        'nextSteps' => $props['nextSteps'],
        'departments' => $props['departments'],
        'charts' => $props['charts'],
    ]);
    expect($home)
        ->not->toContain('desk.evotechly.com')
        ->not->toContain('outbound.evotechly.com')
        ->not->toContain('billionmail')
        ->not->toContain('baileys')
        ->not->toContain('http://')
        ->not->toContain('https://');
});

it('counts only real numbers in the today strip', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    // One open deal; the won one stays out of the count.
    homeDeal($user, 'new');
    homeDeal($user, 'won');

    // Tasks: due today and overdue count; done, future, and non-tasks do not.
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Due today',
        'due_at' => now()->addHours(2),
        'done' => false,
        'contact_id' => $contact->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Overdue',
        'due_at' => now()->subDay(),
        'done' => false,
        'contact_id' => $contact->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Done already',
        'due_at' => now()->subHour(),
        'done' => true,
        'contact_id' => $contact->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Tomorrow',
        'due_at' => now()->addDay(),
        'done' => false,
        'contact_id' => $contact->id,
    ]);
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'note',
        'subject' => 'Not a task',
        'due_at' => now()->addHour(),
        'done' => false,
        'contact_id' => $contact->id,
    ]);

    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'connected'],
    );
    Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'unread_count' => 3,
    ]);

    // Outbound: two sent today (one backdated to yesterday), one deferred.
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'today@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    $yesterday = OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'yesterday@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    $yesterday->forceFill(['sent_at' => now()->subDay()])->save();
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'deferred@example.dz',
        'status' => 'queued',
        'deferred_until' => now()->addHours(3),
    ]);

    // Leads: two new today, one backdated to yesterday.
    Lead::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => $contact->id]);
    $oldLead = Lead::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => $contact->id]);
    $oldLead->forceFill(['created_at' => now()->subDay()])->save();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('today.0.key', 'open_deals')
            ->where('today.0.value', 1)
            ->where('today.1.key', 'tasks_due')
            ->where('today.1.value', 2)
            ->where('today.2.key', 'inbox_unread')
            ->where('today.2.value', 3)
            ->where('today.3.key', 'outbound_sent')
            ->where('today.3.value', 1)
            ->where('today.4.key', 'outbound_deferred')
            ->where('today.4.value', 1)
            ->where('today.5.key', 'leads_new')
            ->where('today.5.value', 1)
            ->where('departments.0.value', 3)
            ->where('departments.1.value', 1)
            ->where('departments.2.value', 3)
            ->where('departments.3.connected', false)
            ->where('departments.4.value', 1)
        );
});

it('caps next steps at five open tasks, soonest first', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    foreach (range(1, 7) as $hours) {
        Activity::query()->create([
            'workspace_id' => $workspace->id,
            'type' => 'task',
            'subject' => "Task {$hours}",
            'due_at' => now()->addHours($hours),
            'done' => false,
            'contact_id' => $contact->id,
        ]);
    }

    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Already done',
        'due_at' => now()->addHour(),
        'done' => true,
        'contact_id' => $contact->id,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('nextSteps', 5)
            ->where('nextSteps.0.subject', 'Task 1')
            ->where('nextSteps.4.subject', 'Task 5')
        );
});

it('marks the Ads tile connected when the workspace Meta connection exists', function () {
    $user = User::factory()->create();

    $user->workspace->integrations()->create([
        'provider' => 'meta',
        'status' => 'connected',
        'access_token' => 'test-token',
        'connected_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('departments.3.key', 'ads')
            ->where('departments.3.connected', true)
        );
});

it('redirects signed-in users from / to the command center', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/')
        ->assertRedirect(route('dashboard', absolute: false));
});

it('sends guests from / to the login screen, never the command center', function () {
    $this->get('/')->assertRedirect(route('login'));

    $this->followingRedirects()
        ->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/login'));
});

it('puts Home first on the rail, pointing at the command center', function () {
    $sidebar = file_get_contents(resource_path('js/components/app-sidebar.tsx'));

    expect($sidebar)
        ->toContain("label: 'Home'")
        ->toContain("href: '/dashboard'")
        ->toContain("activePaths: ['/']");

    // Home leads the rail — ahead of My Inbox.
    expect(strpos($sidebar, "label: 'Home'"))
        ->toBeLessThan(strpos($sidebar, "label: 'My Inbox'"));
});
