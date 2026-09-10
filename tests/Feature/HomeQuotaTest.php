<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\SalesQuota;
use App\Models\User;
use Illuminate\Support\Carbon;

function quotaDeal(User $user, int $amountCents, ?User $owner = null, ?Carbon $closedAt = null): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();
    $owner = $owner ?? $user;

    return Deal::query()->create([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug('won')->id,
        'owner_id' => $owner->id,
        'title' => 'Quota won',
        'amount_cents' => $amountCents,
        'currency' => 'DZD',
        'closed_at' => $closedAt ?? now(),
    ]);
}

it('exposes a no-target quota on home with a settings CTA for managers', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->where('quota.status', 'no_target')
            ->where('quota.target_cents', null)
            ->where('quota.can_manage', true)
            ->where('quota.settings_href', '/settings/quotas')
            ->where('quota.timezone', 'Africa/Algiers'));
});

it('measures workspace quota against closed-won in the Algiers calendar month', function () {
    $this->travelTo(Carbon::parse('2026-09-10 12:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $user->workspace->forceFill(['monthly_quota_cents' => 8_000_000_00])->save();

    quotaDeal($user, 3_000_000_00);
    quotaDeal($user, 1_000_000_00, $user, Carbon::parse('2026-08-31 18:00:00', 'Africa/Algiers'));

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('quota.month', '2026-09')
            ->where('quota.label', 'September 2026')
            ->where('quota.target_cents', 8_000_000_00)
            ->where('quota.won_cents', 3_000_000_00)
            ->where('quota.won_count', 1)
            ->where('quota.remaining_cents', 5_000_000_00)
            ->where('quota.attainment_pct', 37.5)
            ->where('quota.status', 'on_track')
            ->where('quota.day', 10)
            ->where('quota.days', 30));
});

it('marks the workspace behind pace when won is under expected', function () {
    $this->travelTo(Carbon::parse('2026-09-15 09:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $user->workspace->forceFill(['monthly_quota_cents' => 2_000_000_00])->save();
    quotaDeal($user, 200_000_00);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('quota.status', 'behind')
            ->where('quota.won_cents', 200_000_00)
            ->where('quota.target_cents', 2_000_000_00));
});

it('marks quota hit when closed-won meets the monthly target', function () {
    $this->travelTo(Carbon::parse('2026-09-08 09:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $user->workspace->forceFill(['monthly_quota_cents' => 1_000_000_00])->save();
    quotaDeal($user, 1_200_000_00);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('quota.status', 'hit')
            ->where('quota.remaining_cents', 0));
});

it('lists per-person quotas independently of the workspace target', function () {
    $this->travelTo(Carbon::parse('2026-09-10 12:00:00', 'Africa/Algiers'));

    $user = User::factory()->create(['name' => 'Amine']);
    $other = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Sara',
        'role' => WorkspaceRole::Member,
    ]);
    $user->workspace->forceFill(['monthly_quota_cents' => 5_000_000_00])->save();

    SalesQuota::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'amount_cents' => 2_000_000_00,
    ]);
    SalesQuota::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $other->id,
        'amount_cents' => 3_000_000_00,
    ]);

    quotaDeal($user, 1_000_000_00, $user);
    quotaDeal($user, 500_000_00, $other);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('quota.target_cents', 5_000_000_00)
            ->where('quota.won_cents', 1_500_000_00)
            ->has('quota.owners', 2)
            ->where('quota.owners.0.name', 'Amine')
            ->where('quota.owners.0.won_cents', 1_000_000_00)
            ->where('quota.owners.0.target_cents', 2_000_000_00)
            ->where('quota.owners.0.attainment_pct', 50.0)
            ->where('quota.owners.1.name', 'Sara')
            ->where('quota.owners.1.target_cents', 3_000_000_00)
            ->where('quota.owners.1.won_cents', 500_000_00));
});

it('scopes quota owners and won amount when Home is filtered by owner', function () {
    $this->travelTo(Carbon::parse('2026-09-10 12:00:00', 'Africa/Algiers'));

    $user = User::factory()->create(['name' => 'Amine']);
    $other = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Sara',
        'role' => WorkspaceRole::Member,
    ]);

    SalesQuota::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'amount_cents' => 2_000_000_00,
    ]);
    SalesQuota::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $other->id,
        'amount_cents' => 3_000_000_00,
    ]);

    quotaDeal($user, 1_000_000_00, $user);
    quotaDeal($user, 900_000_00, $other);

    $this->actingAs($user)
        ->get('/dashboard?owner_id='.$user->id)
        ->assertInertia(fn ($page) => $page
            ->where('quota.target_cents', 2_000_000_00)
            ->where('quota.won_cents', 1_000_000_00)
            ->has('quota.owners', 1)
            ->where('quota.owners.0.name', 'Amine'));
});
