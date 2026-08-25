<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\User;

it('enforces default member permissions on CRM mutations and exports', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($member)->get('/crm/contacts')->assertOk();
    $this->actingAs($member)
        ->post('/crm/contacts', [
            'first_name' => 'Blocked',
            'email' => 'blocked@example.test',
        ])
        ->assertForbidden();
    $this->actingAs($member)->get('/crm/contacts/export')->assertForbidden();

    expect(Contact::query()->where('workspace_id', $member->workspace_id)->count())->toBe(0);
});

it('allows a supported member override through the same server boundary', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => ['crm.edit'],
    ]);

    $this->actingAs($member)
        ->post('/crm/contacts', [
            'first_name' => 'Allowed',
            'email' => 'allowed@example.test',
        ])
        ->assertRedirect();

    expect(Contact::query()
        ->where('workspace_id', $member->workspace_id)
        ->where('email', 'allowed@example.test')
        ->exists())->toBeTrue();
});

it('lets owners edit only supported overrides for members in their workspace', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->put("/settings/permissions/{$member->id}", [
            'permissions' => ['crm.edit', 'crm.export'],
        ])
        ->assertRedirect();

    expect($member->fresh()->permissions)->toBe(['crm.edit', 'crm.export']);

    $this->actingAs($owner)
        ->put("/settings/permissions/{$member->id}", [
            'permissions' => ['unknown.permission'],
        ])
        ->assertSessionHasErrors('permissions.0');
});

it('prevents admins and cross-workspace owners from changing member overrides', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $admin = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Admin,
    ]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);
    $otherOwner = User::factory()->create(['role' => WorkspaceRole::Owner]);

    $this->actingAs($admin)
        ->put("/settings/permissions/{$member->id}", ['permissions' => ['crm.edit']])
        ->assertForbidden();

    $this->actingAs($otherOwner)
        ->put("/settings/permissions/{$member->id}", ['permissions' => ['crm.edit']])
        ->assertNotFound();
});

it('keeps owner and admin role defaults while reserving permission grants for owners', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $admin = User::factory()->create(['role' => WorkspaceRole::Admin]);
    $member = User::factory()->create(['role' => WorkspaceRole::Member]);

    expect($owner->canPermission('settings.permissions'))->toBeTrue()
        ->and($admin->canPermission('crm.edit'))->toBeTrue()
        ->and($admin->canPermission('settings.permissions'))->toBeFalse()
        ->and($member->canPermission('crm.edit'))->toBeFalse();
});
