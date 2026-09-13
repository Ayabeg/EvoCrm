<?php

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

it('issues a workspace-scoped Sanctum token that can list own contacts', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amine',
        'last_name' => 'Saidi',
        'email' => 'amine@clinic.dz',
    ]);

    $issue = $this->postJson('/api/v1/auth/token', [
        'email' => $user->email,
        'password' => 'password',
        'device_name' => 'iPhone',
    ]);

    $issue->assertOk()
        ->assertJsonPath('data.token_type', 'Bearer')
        ->assertJsonPath('data.workspace.id', $user->workspace_id)
        ->assertJsonPath('data.user.email', $user->email);

    $token = $issue->json('data.token');
    expect($token)->toBeString()->not->toBeEmpty();

    $this->withToken($token)
        ->getJson('/api/v1/contacts')
        ->assertOk()
        ->assertJsonPath('data.0.id', $contact->id)
        ->assertJsonPath('data.0.email', 'amine@clinic.dz');
});

it('revokes the current Sanctum token', function () {
    $user = User::factory()->create();
    $token = apiToken($user, 'android');

    $this->withToken($token)
        ->deleteJson('/api/v1/auth/token')
        ->assertNoContent();

    expect(PersonalAccessToken::query()->count())->toBe(0);

    // HTTP tests reuse the app container; drop the in-memory guard so the
    // deleted bearer token is actually re-checked (production is one request).
    $this->app['auth']->forgetGuards();

    $this->withToken($token)
        ->getJson('/api/v1/me')
        ->assertUnauthorized();
});

it('rejects invalid Sanctum credentials without issuing a token', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/token', [
        'email' => $user->email,
        'password' => 'wrong-password',
        'device_name' => 'iPhone',
    ])->assertUnprocessable();

    expect(PersonalAccessToken::query()->count())->toBe(0);
});

it('returns the current user and workspace for a valid Sanctum token', function () {
    $user = User::factory()->create(['name' => 'Lina Owner']);

    $this->withToken(apiToken($user))
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.user.name', 'Lina Owner')
        ->assertJsonPath('data.workspace.id', $user->workspace_id)
        ->assertJsonPath('data.permissions', fn ($permissions) => in_array('crm.view', $permissions, true));
});

it('forbids members from creating contacts via ApiV1 without crm.edit', function () {
    $member = User::factory()->create([
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->withToken(apiToken($member))
        ->postJson('/api/v1/contacts', [
            'first_name' => 'Blocked',
            'email' => 'blocked@example.test',
        ])
        ->assertForbidden();
});
