<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;

it('lets the owner turn simple mode off and restore power nav', function () {
    $workspace = app(WorkspaceProvisioner::class)->provision('Toggle Clinic');
    $owner = User::factory()->create([
        'workspace_id' => $workspace->id,
        'role' => WorkspaceRole::Owner,
    ]);

    $this->actingAs($owner)
        ->get('/settings/workspace')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/workspace')
            ->where('simple_mode', true));

    $this->actingAs($owner)
        ->from('/settings/workspace')
        ->put('/settings/workspace', ['simple_mode' => false])
        ->assertRedirect('/settings/workspace');

    expect($workspace->fresh()->simple_mode)->toBeFalse();

    $this->actingAs($owner)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->where('simpleMode', false)
                ->where('features.tickets', true)
                ->where('features.sms', true);

            $hrefs = collect($page->toArray()['props']['nav'] ?? [])->pluck('href');

            expect($hrefs)->toContain('/crm/tickets')
                ->and($hrefs)->toContain('/settings/sms');
        });

    $this->actingAs($owner)->get('/crm/tickets')->assertOk();
});

it('forbids members from changing simple mode', function () {
    $workspace = app(WorkspaceProvisioner::class)->provision('Member Clinic');
    $owner = User::factory()->create([
        'workspace_id' => $workspace->id,
        'role' => WorkspaceRole::Owner,
    ]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($member)
        ->put('/settings/workspace', ['simple_mode' => false])
        ->assertForbidden();

    expect($workspace->fresh()->simple_mode)->toBeTrue();
});
