<?php

use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Models\User;
use App\Services\Outbound\WarmupPlanner;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

it('renders the warmup dashboard with every sendable box and hides system roles by default', function () {
    $user = User::factory()->create();

    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'CEO box',
        'from_address' => 'ceo@evotechly.dz',
        'enabled' => true,
        'status' => 'active',
    ]);

    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Postmaster',
        'from_address' => 'postmaster@evotechly.dz',
        'enabled' => true,
        'status' => 'active',
    ]);

    // Disabled boxes are not sendable and stay off the dashboard.
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Off box',
        'from_address' => 'off@evotechly.dz',
        'enabled' => false,
        'status' => 'disabled',
    ]);

    $this->actingAs($user)->get('/outbound/warmup')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('outbound/warmup')
            ->has('mailboxes', 1)
            ->where('mailboxes.0.from_address', 'ceo@evotechly.dz')
            ->has('systemMailboxes', 1)
            ->where('systemMailboxes.0.from_address', 'postmaster@evotechly.dz')
            ->where('systemMailboxes.0.opted_in', false)
            ->has('ramp')
            ->has('summary'));
});

it('computes the conservative ramp and holds at the operator ceiling', function () {
    $planner = app(WarmupPlanner::class);

    // Default ceiling 40: 8, 12, 18, 25, 35, then 45 clamps to 40 and holds.
    expect($planner->capForDay(1))->toBe(8);
    expect($planner->capForDay(2))->toBe(12);
    expect($planner->capForDay(3))->toBe(18);
    expect($planner->capForDay(4))->toBe(25);
    expect($planner->capForDay(5))->toBe(35);
    expect($planner->capForDay(6))->toBe(40);
    expect($planner->capForDay(7))->toBe(40);
    expect($planner->capForDay(30))->toBe(40);

    // A higher ceiling lets the full ramp show before holding.
    expect($planner->capForDay(6, 50))->toBe(45);
    expect($planner->capForDay(7, 50))->toBe(50);
    expect($planner->capForDay(30, 50))->toBe(50);

    // A low ceiling clamps every step.
    expect($planner->capForDay(1, 5))->toBe(5);
    expect($planner->capForDay(9, 5))->toBe(5);
});

it('advances a warming box one plan day per Algiers date and writes the cap', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        'status' => 'warming',
        'warmup_day' => 1,
        'warmup_ceiling' => 40,
        'daily_limit' => 8,
        'warmup_started_at' => now()->subDay(),
        'warmup_last_advanced_on' => '2026-08-22',
    ]);

    $this->artisan('outbound:warmup')->assertSuccessful();

    $mailbox->refresh();
    expect($mailbox->warmup_day)->toBe(2);
    expect($mailbox->daily_limit)->toBe(12);
    expect($mailbox->warmup_last_advanced_on->toDateString())->toBe('2026-08-23');

    // Idempotent: a second run on the same Algiers date changes nothing.
    $this->artisan('outbound:warmup')->assertSuccessful();

    $mailbox->refresh();
    expect($mailbox->warmup_day)->toBe(2);
    expect($mailbox->daily_limit)->toBe(12);
});

it('skips disabled and non-warming boxes on the scheduled advance', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();

    $disabled = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'off@evotechly.dz',
        'enabled' => false,
        'status' => 'disabled',
        'daily_limit' => 8,
        'warmup_day' => 1,
    ]);

    $active = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'live@evotechly.dz',
        'enabled' => true,
        'status' => 'active',
        'daily_limit' => 50,
        'warmup_day' => 0,
    ]);

    $this->artisan('outbound:warmup')->assertSuccessful();

    expect($disabled->refresh()->daily_limit)->toBe(8);
    expect($disabled->warmup_day)->toBe(1);
    expect($active->refresh()->daily_limit)->toBe(50);
    expect($active->warmup_day)->toBe(0);
});

it('never sends peer pings under Pest, even when mailboxes opt in', function () {
    Mail::fake();
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();

    $warming = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'ceo@evotechly.dz',
        'enabled' => true,
        'status' => 'warming',
        'warmup_day' => 2,
        'warmup_ceiling' => 40,
        'daily_limit' => 12,
        'warmup_peers' => true,
        'warmup_last_advanced_on' => '2026-08-22',
    ]);

    $peer = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'mohamed@evotechly.dz',
        'enabled' => true,
        'status' => 'active',
        'warmup_peers' => true,
    ]);

    // The plan pairs only the workspace's own enabled non-system boxes…
    $plan = app(WarmupPlanner::class)->peerPingPlan($user->workspace);
    expect($plan)->not->toBeEmpty();

    foreach ($plan as [$sender, $recipient]) {
        expect($sender->id)->toBe($warming->id);
        expect($recipient->id)->toBe($peer->id);
        expect($recipient->from_address)->toEndWith('@evotechly.dz');
    }

    // …but the scheduled command never sends anything under Pest.
    $this->artisan('outbound:warmup')->assertSuccessful();

    expect(OutboundMessage::query()->count())->toBe(0);
    Mail::assertNothingSent();

    // The ramp advance itself still ran.
    expect($warming->refresh()->daily_limit)->toBe(18);
});

it('ignores workspaces with fewer than two peer-opted mailboxes in the ping plan', function () {
    $user = User::factory()->create();

    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'solo@evotechly.dz',
        'enabled' => true,
        'status' => 'warming',
        'warmup_peers' => true,
    ]);

    // A system role never joins the pool, opted into peers or not.
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'noreply@evotechly.dz',
        'enabled' => true,
        'status' => 'warming',
        'warmup_peers' => true,
    ]);

    expect(app(WarmupPlanner::class)->peerPingPlan($user->workspace))->toBeEmpty();
});

it('toggles warmup on and off from the dashboard', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        'status' => 'active',
        'daily_limit' => 50,
    ]);

    $this->actingAs($user)->post("/outbound/warmup/{$mailbox->id}/toggle")->assertRedirect();

    $mailbox->refresh();
    expect($mailbox->status)->toBe('warming');
    expect($mailbox->warmup_day)->toBe(1);
    expect($mailbox->daily_limit)->toBe(8);
    expect($mailbox->warmup_previous_limit)->toBe(50);
    expect($mailbox->warmup_last_advanced_on->toDateString())
        ->toBe(now('Africa/Algiers')->toDateString());

    $this->actingAs($user)->post("/outbound/warmup/{$mailbox->id}/toggle")->assertRedirect();

    $mailbox->refresh();
    expect($mailbox->status)->toBe('active');
    expect($mailbox->daily_limit)->toBe(40);
});

it('refuses to start warmup on a disabled mailbox', function () {
    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => false,
        'status' => 'disabled',
    ]);

    $this->actingAs($user)->post("/outbound/warmup/{$mailbox->id}/toggle")
        ->assertStatus(422);

    expect($mailbox->refresh()->status)->toBe('disabled');
});

it('opts a system mailbox into warmup explicitly', function () {
    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'postmaster@evotechly.dz',
        'enabled' => true,
        'status' => 'active',
    ]);

    $this->actingAs($user)->post("/outbound/warmup/{$mailbox->id}/include")->assertRedirect();
    expect($mailbox->refresh()->warmup_opted_in)->toBeTrue();

    $this->actingAs($user)->get('/outbound/warmup')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('mailboxes', 1)
            ->where('mailboxes.0.from_address', 'postmaster@evotechly.dz')
            ->where('mailboxes.0.is_system', true));

    // Regular mailboxes 404 on the include endpoint — it is for system roles.
    $regular = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'amine@evotechly.dz',
        'enabled' => true,
    ]);

    $this->actingAs($user)->post("/outbound/warmup/{$regular->id}/include")
        ->assertNotFound();
});

it('updates the ceiling and clamps a warming box whose cap exceeds it', function () {
    $user = User::factory()->create();
    $mailbox = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        'status' => 'warming',
        'warmup_day' => 5,
        'daily_limit' => 35,
        'warmup_ceiling' => 40,
    ]);

    $this->actingAs($user)->put("/outbound/warmup/{$mailbox->id}", [
        'warmup_ceiling' => 20,
        'warmup_peers' => '1',
    ])->assertRedirect();

    $mailbox->refresh();
    expect($mailbox->warmup_ceiling)->toBe(20);
    expect($mailbox->daily_limit)->toBe(20);
    expect($mailbox->warmup_peers)->toBeTrue();
});

it('keeps other workspaces out of the warmup dashboard and command', function () {
    $this->travelTo(Carbon::parse('2026-08-23 10:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $stranger = User::factory()->create();

    $foreign = Mailbox::factory()->create([
        'workspace_id' => $stranger->workspace_id,
        'from_address' => 'foreign@example.dz',
        'enabled' => true,
        'status' => 'warming',
        'warmup_day' => 1,
        'daily_limit' => 8,
        'warmup_last_advanced_on' => '2026-08-22',
    ]);

    $this->actingAs($user)->get('/outbound/warmup')->assertOk()
        ->assertInertia(fn ($page) => $page->has('mailboxes', 0));

    $this->actingAs($user)->post("/outbound/warmup/{$foreign->id}/toggle")->assertNotFound();

    // The scheduled advance is global, but the foreign box still advances on
    // its own workspace's terms — and never leaks into this one.
    $this->artisan('outbound:warmup')->assertSuccessful();
    expect($foreign->refresh()->daily_limit)->toBe(12);
});
