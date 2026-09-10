<?php

use App\Enums\ChannelType;
use App\Models\Activity;
use App\Models\AiInsight;
use App\Models\Channel;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\EnrichmentRun;
use App\Models\Mailbox;
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

it('serves the command center dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('window')
            ->has('kpis')
            ->has('attention')
            ->has('guidedActions')
            ->has('caughtUp')
            ->has('activityFeed')
            ->has('quickActions')
            ->has('owners')
            ->has('filters')
            ->has('dataAsOf'));
});

it('builds attention items from real workspace data', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    homeDeal($user, 'new')->forceFill([
        'last_activity_at' => now()->subDays(10),
    ])->save();

    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Overdue',
        'due_at' => now()->subDay(),
        'done' => false,
        'contact_id' => $contact->id,
    ]);

    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WA', 'status' => 'connected'],
    );
    Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'unread_count' => 2,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('attention', 3)
            ->where('attention.0.key', 'stalled_deals')
            ->where('attention.1.key', 'overdue_activities')
            ->where('attention.2.key', 'inbox_unread'));
});

it('filters dashboard by owner', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);

    homeDeal($user, 'won')->forceFill([
        'owner_id' => $user->id,
        'closed_at' => now(),
    ])->save();
    homeDeal($user, 'won')->forceFill([
        'owner_id' => $other->id,
        'closed_at' => now(),
    ])->save();

    $this->actingAs($user)
        ->get('/dashboard?owner_id='.$user->id)
        ->assertInertia(fn ($page) => $page
            ->where('filters.owner_id', $user->id)
            ->where('kpis.0.key', 'revenue'));
});

it('offers real connect actions on an empty workspace', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('caughtUp', true)
            ->where('guidedActions.0.key', 'connect_mailbox')
            ->where('guidedActions.0.href', '/outbound/mailboxes')
            ->where('guidedActions.1.key', 'connect_meta')
            ->where('guidedActions.1.href', '/settings/apps')
            ->where('guidedActions.2.key', 'connect_whatsapp')
            ->where('guidedActions.2.href', '/settings/evolution')
            ->where('guidedActions.3.key', 'connect_calendar')
            ->where('guidedActions.3.href', '/settings/connectors'));
});

it('hides the mailbox action once an enabled mailbox exists', function () {
    $user = User::factory()->create();

    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('guidedActions.0.key', 'connect_meta')
            ->where('guidedActions.3.key', 'create_sequence')
            ->has('guidedActions', 4));
});

it('adds a deal next-step action for open deals without a next action', function () {
    $user = User::factory()->create();
    $deal = homeDeal($user, 'new');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('guidedActions')
            ->where('guidedActions.4.key', 'deal_next_step_'.$deal->id)
            ->where('guidedActions.4.href', '/crm/deals/'.$deal->id)
            ->where('guidedActions.4.category', 'deal'));
});

it('includes recent activity feed rows', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'note',
        'subject' => 'Called prospect',
        'contact_id' => $contact->id,
        'actor_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('activityFeed', 1)
            ->where('activityFeed.0.subject', 'Called prospect'));
});

it('surfaces the latest Google Places run next to Lead OS health', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

    EnrichmentRun::factory()->create([
        'workspace_id' => $user->workspace_id,
        'target_type' => EnrichmentRun::TARGET_COMPANY,
        'target_id' => $company->id,
        'source' => EnrichmentRun::SOURCE_WEBSITE,
        'field' => 'website_title',
        'value' => 'Old site',
        'status' => EnrichmentRun::STATUS_APPLIED,
    ]);
    $places = EnrichmentRun::factory()->create([
        'workspace_id' => $user->workspace_id,
        'target_type' => EnrichmentRun::TARGET_COMPANY,
        'target_id' => $company->id,
        'source' => EnrichmentRun::SOURCE_GOOGLE_PLACES,
        'field' => 'address',
        'value' => 'Hydra, Alger',
        'status' => EnrichmentRun::STATUS_APPLIED,
    ]);

    $other = User::factory()->create();
    EnrichmentRun::factory()->create([
        'workspace_id' => $other->workspace_id,
        'target_type' => EnrichmentRun::TARGET_COMPANY,
        'target_id' => Company::factory()->create(['workspace_id' => $other->workspace_id])->id,
        'source' => EnrichmentRun::SOURCE_GOOGLE_PLACES,
        'field' => 'address',
        'value' => 'Oran',
        'status' => EnrichmentRun::STATUS_APPLIED,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('placesRun.id', $places->id)
            ->where('placesRun.field', 'address')
            ->where('placesRun.value', 'Hydra, Alger')
            ->where('placesRun.status', EnrichmentRun::STATUS_APPLIED)
            ->where('placesRun.href', '/crm/companies/'.$company->id));
});

it('does not invent a Places run when none exist', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('placesRun', null)
            ->where('researchBrief', null));
});

it('surfaces the latest research brief on Home next to Places', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Clinique Atlas',
        'city' => 'Alger',
        'wilaya' => 'Alger',
    ]);

    $brief = AiInsight::query()->create([
        'workspace_id' => $user->workspace_id,
        'subject_type' => 'company',
        'subject_id' => $company->id,
        'question' => 'Research brief',
        'answer' => 'Clinique Atlas is a clinic in Alger. Domain clinique-atlas.dz is on file.',
        'source' => 'fields',
    ]);

    $other = User::factory()->create();
    AiInsight::query()->create([
        'workspace_id' => $other->workspace_id,
        'subject_type' => 'company',
        'subject_id' => Company::factory()->create(['workspace_id' => $other->workspace_id])->id,
        'question' => 'Research brief',
        'answer' => 'Other workspace brief',
        'source' => 'fields',
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('researchBrief.id', $brief->id)
            ->where('researchBrief.subject_type', 'company')
            ->where('researchBrief.source', 'fields')
            ->where('researchBrief.href', '/crm/companies/'.$company->id)
            ->where('researchBrief.answer', 'Clinique Atlas is a clinic in Alger. Domain clinique-atlas.dz is on file.')
        );
});
