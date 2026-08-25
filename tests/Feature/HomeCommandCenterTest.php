<?php

use App\Enums\ChannelType;
use App\Models\Activity;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Deal;
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
