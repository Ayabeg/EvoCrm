<?php

use App\Enums\WorkspaceRole;
use App\Models\SalesQuota;
use App\Models\User;

it('renders the monthly quota settings page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/settings/quotas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/quotas')
            ->where('workspace_amount_dzd', null)
            ->where('timezone', 'Africa/Algiers')
            ->has('people', 1)
            ->where('people.0.id', $user->id)
            ->has('month_label'));
});

it('saves workspace and per-person monthly quotas in DZD', function () {
    $user = User::factory()->create();
    $member = User::factory()->create([
        'workspace_id' => $user->workspace_id,
        'role' => WorkspaceRole::Member,
        'name' => 'Sara',
    ]);

    $this->actingAs($user)
        ->from('/settings/quotas')
        ->put('/settings/quotas', [
            'workspace_amount_dzd' => 8000000,
            'people' => [
                ['id' => $user->id, 'amount_dzd' => 3000000],
                ['id' => $member->id, 'amount_dzd' => 5000000],
            ],
        ])
        ->assertRedirect('/settings/quotas');

    expect($user->workspace->fresh()->monthly_quota_cents)->toBe(800_000_000)
        ->and(SalesQuota::query()->where('user_id', $user->id)->value('amount_cents'))->toBe(300_000_000)
        ->and(SalesQuota::query()->where('user_id', $member->id)->value('amount_cents'))->toBe(500_000_000);
});

it('clears a personal quota when the amount is left blank', function () {
    $user = User::factory()->create();
    SalesQuota::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'amount_cents' => 2_000_000_00,
    ]);

    $this->actingAs($user)
        ->put('/settings/quotas', [
            'workspace_amount_dzd' => '',
            'people' => [
                ['id' => $user->id, 'amount_dzd' => ''],
            ],
        ])
        ->assertRedirect('/settings/quotas');

    expect($user->workspace->fresh()->monthly_quota_cents)->toBeNull()
        ->and(SalesQuota::query()->where('user_id', $user->id)->exists())->toBeFalse();
});

it('forbids members from saving quotas', function () {
    $user = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($user)
        ->put('/settings/quotas', [
            'workspace_amount_dzd' => 1000000,
        ])
        ->assertForbidden();
});

it('ignores quota rows for people outside the workspace', function () {
    $user = User::factory()->create();
    $stranger = User::factory()->create();

    $this->actingAs($user)
        ->put('/settings/quotas', [
            'workspace_amount_dzd' => 1000000,
            'people' => [
                ['id' => $stranger->id, 'amount_dzd' => 999999],
            ],
        ])
        ->assertRedirect('/settings/quotas');

    expect(SalesQuota::query()->where('user_id', $stranger->id)->exists())->toBeFalse();
});
