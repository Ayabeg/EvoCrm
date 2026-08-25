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

it('serves the data-first command center', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('today', 6)
            ->has('owners')
            ->has('filters')
            ->has('dataAsOf')
            ->missing('nextSteps')
            ->missing('inboxPreview')
            ->missing('recentDeals')
            ->missing('departments')
            ->missing('charts'));
});

it('counts real numbers in the today strip', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);
    homeDeal($user, 'new');
    homeDeal($user, 'won');
    Activity::query()->create([
        'workspace_id' => $workspace->id,
        'type' => 'task',
        'subject' => 'Due',
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
    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $workspace->id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WA', 'status' => 'connected'],
    );
    Thread::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'unread_count' => 3,
    ]);
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'a@b.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'c@b.dz',
        'status' => 'queued',
        'deferred_until' => now()->addHours(3),
    ]);
    Lead::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => $contact->id]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('today.0.value', 1)
            ->where('today.1.value', 2)
            ->where('today.2.value', 3)
            ->where('today.3.key', 'leads_new')
            ->where('today.4.value', 1)
            ->where('today.5.value', 1));
});

it('filters open deals by owner in the KPI strip', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);

    homeDeal($user, 'new')->forceFill(['owner_id' => $user->id])->save();
    homeDeal($user, 'new')->forceFill(['owner_id' => $other->id])->save();

    $this->actingAs($user)
        ->get('/dashboard?owner_id='.$user->id)
        ->assertInertia(fn ($page) => $page->where('today.0.value', 1));
});
