<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\SalesQuota;
use App\Models\User;
use App\Services\Home\QuotaTracker;
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

it('keeps quota off the operating home', function () {
    $user = User::factory()->create();
    $user->workspace->forceFill(['monthly_quota_cents' => 8_000_000_00])->save();
    quotaDeal($user, 3_000_000_00);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->missing('quota'));
});

it('exposes a no-target quota from the tracker for managers', function () {
    $user = User::factory()->create();

    $payload = app(QuotaTracker::class)->present(
        $user->workspace,
        null,
        $user->role->canManageSettings(),
    );

    expect($payload['status'])->toBe('no_target')
        ->and($payload['target_cents'])->toBeNull()
        ->and($payload['can_manage'])->toBeTrue()
        ->and($payload['settings_href'])->toBe('/settings/quotas')
        ->and($payload['timezone'])->toBe('Africa/Algiers');
});

it('measures workspace quota against closed-won in the Algiers calendar month', function () {
    $this->travelTo(Carbon::parse('2026-09-10 12:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $user->workspace->forceFill(['monthly_quota_cents' => 8_000_000_00])->save();

    quotaDeal($user, 3_000_000_00);
    quotaDeal($user, 1_000_000_00, $user, Carbon::parse('2026-08-31 18:00:00', 'Africa/Algiers'));

    $payload = app(QuotaTracker::class)->present($user->workspace);

    expect($payload['month'])->toBe('2026-09')
        ->and($payload['label'])->toBe('September 2026')
        ->and($payload['target_cents'])->toBe(8_000_000_00)
        ->and($payload['won_cents'])->toBe(3_000_000_00)
        ->and($payload['won_count'])->toBe(1)
        ->and($payload['remaining_cents'])->toBe(5_000_000_00)
        ->and($payload['attainment_pct'])->toBe(37.5)
        ->and($payload['status'])->toBe('on_track')
        ->and($payload['day'])->toBe(10)
        ->and($payload['days'])->toBe(30);
});

it('marks the workspace behind pace when won is under expected', function () {
    $this->travelTo(Carbon::parse('2026-09-15 09:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $user->workspace->forceFill(['monthly_quota_cents' => 2_000_000_00])->save();
    quotaDeal($user, 200_000_00);

    $payload = app(QuotaTracker::class)->present($user->workspace);

    expect($payload['status'])->toBe('behind')
        ->and($payload['won_cents'])->toBe(200_000_00)
        ->and($payload['target_cents'])->toBe(2_000_000_00);
});

it('marks quota hit when closed-won meets the monthly target', function () {
    $this->travelTo(Carbon::parse('2026-09-08 09:00:00', 'Africa/Algiers'));

    $user = User::factory()->create();
    $user->workspace->forceFill(['monthly_quota_cents' => 1_000_000_00])->save();
    quotaDeal($user, 1_200_000_00);

    $payload = app(QuotaTracker::class)->present($user->workspace);

    expect($payload['status'])->toBe('hit')
        ->and($payload['remaining_cents'])->toBe(0);
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

    $payload = app(QuotaTracker::class)->present($user->workspace);

    expect($payload['target_cents'])->toBe(5_000_000_00)
        ->and($payload['won_cents'])->toBe(1_500_000_00)
        ->and($payload['owners'])->toHaveCount(2)
        ->and($payload['owners'][0]['name'])->toBe('Amine')
        ->and($payload['owners'][0]['won_cents'])->toBe(1_000_000_00)
        ->and($payload['owners'][0]['target_cents'])->toBe(2_000_000_00)
        ->and($payload['owners'][0]['attainment_pct'])->toEqual(50)
        ->and($payload['owners'][1]['name'])->toBe('Sara')
        ->and($payload['owners'][1]['target_cents'])->toBe(3_000_000_00)
        ->and($payload['owners'][1]['won_cents'])->toBe(500_000_00);
});

it('scopes quota owners and won amount when the tracker is filtered by owner', function () {
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

    $payload = app(QuotaTracker::class)->present($user->workspace, $user->id);

    expect($payload['target_cents'])->toBe(2_000_000_00)
        ->and($payload['won_cents'])->toBe(1_000_000_00)
        ->and($payload['owners'])->toHaveCount(1)
        ->and($payload['owners'][0]['name'])->toBe('Amine');
});
