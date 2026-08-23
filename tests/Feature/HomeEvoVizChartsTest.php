<?php

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\OutboundMessage;
use App\Models\User;

function evoVizDeal(User $user, string $stageSlug): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => 'Chart deal '.$stageSlug,
        'amount_cents' => 100_000,
        'currency' => 'DZD',
    ]);
}

it('serves home with an empty charts list when no series has data', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('charts', 0)
        );
});

it('builds the pipeline bar from real open-stage deal counts', function () {
    $user = User::factory()->create();

    evoVizDeal($user, 'new');
    evoVizDeal($user, 'new');
    evoVizDeal($user, 'qualified');
    evoVizDeal($user, 'won'); // terminal stages stay out of the bar

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('charts.0.id', 'evoviz.bar')
            ->where('charts.0.title', 'Pipeline by stage')
            ->where('charts.0.labels', ['New', 'Qualified', 'Demo', 'Proposal'])
            ->where('charts.0.series.0.name', 'Deals')
            ->where('charts.0.series.0.data', [2, 1, 0, 0])
            ->where('charts.0.total', 3)
            ->where('charts.0.href', '/leads')
        );
});

it('buckets new leads into the last 14 days for the area chart', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    Lead::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => $contact->id]);
    $twoDaysAgo = Lead::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => $contact->id]);
    $twoDaysAgo->forceFill(['created_at' => now()->subDays(2)])->save();
    $tooOld = Lead::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => $contact->id]);
    $tooOld->forceFill(['created_at' => now()->subDays(20)])->save();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('charts.0.id', 'evoviz.area')
            ->has('charts.0.labels', 14)
            ->has('charts.0.series.0.data', 14)
            ->where('charts.0.series.0.data.11', 1)
            ->where('charts.0.series.0.data.13', 1)
            ->where('charts.0.total', 2)
        );
});

it('sparks outbound sends per day and skips deferred-only silence', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'one@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    $yesterday = OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'two@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);
    $yesterday->forceFill(['sent_at' => now()->subDay()])->save();
    // Deferred and inbound messages never count as sent.
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'held@example.dz',
        'status' => 'queued',
        'deferred_until' => now()->addHours(2),
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('charts.0.id', 'evoviz.kpi-spark')
            ->has('charts.0.series.0.data', 14)
            ->where('charts.0.series.0.data.12', 1)
            ->where('charts.0.series.0.data.13', 1)
            ->where('charts.0.total', 2)
        );
});

it('draws the deals-by-outcome donut from real stage flags', function () {
    $user = User::factory()->create();

    evoVizDeal($user, 'new');
    evoVizDeal($user, 'demo');
    evoVizDeal($user, 'won');
    evoVizDeal($user, 'lost');

    // Bar first (open stages), donut after it — no leads or sends here.
    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('charts.1.id', 'evoviz.donut')
            ->where('charts.1.labels', ['Open', 'Won', 'Lost'])
            ->where('charts.1.series.0.data', [2, 1, 1])
            ->where('charts.1.total', 4)
        );
});

it('keys every chart payload with an evoviz.* contract id', function () {
    $user = User::factory()->create();
    $workspace = $user->workspace;
    $contact = Contact::factory()->create(['workspace_id' => $workspace->id]);

    evoVizDeal($user, 'new');
    evoVizDeal($user, 'won');
    Lead::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => $contact->id]);
    OutboundMessage::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => $contact->id,
        'channel' => 'email',
        'direction' => 'out',
        'to_address' => 'sent@example.dz',
        'status' => 'sent',
        'sent_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertOk();

    $charts = $response->viewData('page')['props']['charts'];

    expect($charts)->toHaveCount(4);

    $ids = array_column($charts, 'id');
    foreach ($ids as $id) {
        expect($id)->toStartWith('evoviz.');
    }
    expect($ids)->toContain('evoviz.bar', 'evoviz.area', 'evoviz.kpi-spark', 'evoviz.donut');

    // Chart props stay on the CRM hostname — no desk or mail-host ejects.
    expect(json_encode($charts))
        ->not->toContain('desk.evotechly.com')
        ->not->toContain('outbound.evotechly.com')
        ->not->toContain('http://')
        ->not->toContain('https://');
});
