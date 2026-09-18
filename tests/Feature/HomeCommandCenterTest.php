<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Services\Crm\DealAttentionEvaluator;
use Carbon\Carbon;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-09-16 12:00:00', DealAttentionEvaluator::TIMEZONE));
});

afterEach(function () {
    Carbon::setTestNow();
});

it('serves the operating home dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('context')
            ->has('metrics')
            ->has('attention')
            ->has('work')
            ->has('pipeline')
            ->has('recent')
            ->has('activation'));
});

it('builds attention from P12 deal exceptions not stalled counts', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    $deal = Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('new')->id,
        'title' => 'Needs a next step',
        'amount_cents' => 100_000,
        'currency' => 'DZD',
        'owner_id' => $user->id,
        'last_activity_at' => now()->subDays(10),
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('attention.items', 1)
            ->where('attention.items.0.id', $deal->id)
            ->where('attention.items.0.primary.type', DealAttentionEvaluator::TYPE_NO_NEXT_ACTION));
});

it('does not expose owner period filters on the operating home', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard?owner_id='.$user->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('filters')
            ->missing('owners')
            ->has('metrics.kpis'));
});

it('offers real create actions on an empty workspace', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activation.activated', false)
            ->has('activation.steps', 5)
            ->where('activation.steps.2.href', '/crm/deals?create=1')
            ->where('activation.steps.0.href', '/crm/contacts?create=1')
            ->where('activation.steps.3.href', '/crm/activities?create=1'));
});

it('includes recently logged activity by created_at', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create(['workspace_id' => $user->workspace_id]);

    Activity::query()->create([
        'workspace_id' => $user->workspace_id,
        'type' => 'note',
        'subject' => 'Called prospect',
        'contact_id' => $contact->id,
        'actor_id' => $user->id,
        'owner_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->has('recent.items', 1)
            ->where('recent.items.0.subject', 'Called prospect')
            ->where('recent.kind', 'logged_activity'));
});
