<?php

use App\Enums\WorkspaceRole;
use App\Mail\WorkspaceInviteMail;
use App\Models\Mailbox;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

function peopleOwner(): User
{
    return User::factory()->create(['role' => WorkspaceRole::Owner]);
}

function enabledMailboxFor(User $user): Mailbox
{
    return Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'enabled' => true,
        'is_default' => true,
    ]);
}

it('forbids members from viewing the people page', function () {
    $member = User::factory()->create(['role' => WorkspaceRole::Member]);

    $this->actingAs($member)
        ->get(route('settings.people'))
        ->assertForbidden();
});

it('lets owners and admins view the people page', function () {
    $owner = peopleOwner();
    $admin = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Admin,
    ]);

    $this->actingAs($owner)
        ->get(route('settings.people'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/people')
            ->has('people', 2)
            ->where('actorRole', 'owner')
        );

    $this->actingAs($admin)
        ->get(route('settings.people'))
        ->assertOk();
});

it('invites an admin and sends the login email through the workspace mailbox', function () {
    Mail::fake();

    $owner = peopleOwner();
    enabledMailboxFor($owner);

    $this->actingAs($owner)
        ->post(route('settings.people.store'), [
            'name' => 'New Admin',
            'email' => 'admin@evotechly.com',
            'role' => 'admin',
        ])
        ->assertRedirect();

    $invitee = User::query()->where('email', 'admin@evotechly.com')->firstOrFail();

    expect($invitee->workspace_id)->toBe($owner->workspace_id);
    expect($invitee->role)->toBe(WorkspaceRole::Admin);
    // Pending until they set a password through the first-login link.
    expect($invitee->email_verified_at)->toBeNull();

    Mail::assertSent(WorkspaceInviteMail::class, fn (WorkspaceInviteMail $mail) => $mail->hasTo('admin@evotechly.com')
        && str_contains($mail->inviteUrl, '/reset-password/')
        && str_contains($mail->inviteUrl, 'email=admin%40evotechly.com'));
});

it('never carries a standing password in the invite mail', function () {
    Mail::fake();

    $owner = peopleOwner();
    enabledMailboxFor($owner);

    $this->actingAs($owner)
        ->post(route('settings.people.store'), [
            'name' => 'New Member',
            'email' => 'member@evotechly.com',
            'role' => 'member',
        ]);

    Mail::assertSent(WorkspaceInviteMail::class, function (WorkspaceInviteMail $mail) {
        $html = view($mail->content()->view, [
            'inviteeName' => $mail->inviteeName,
            'workspaceName' => $mail->workspaceName,
            'inviterName' => $mail->inviterName,
            'inviteUrl' => $mail->inviteUrl,
        ])->render();

        expect($html)->not->toContain('password:');

        return true;
    });
});

it('cannot invite a second owner', function () {
    Mail::fake();

    $owner = peopleOwner();
    enabledMailboxFor($owner);

    $this->actingAs($owner)
        ->post(route('settings.people.store'), [
            'name' => 'Second Owner',
            'email' => 'owner2@evotechly.com',
            'role' => 'owner',
        ])
        ->assertSessionHasErrors('role');

    expect(User::query()->where('email', 'owner2@evotechly.com')->exists())->toBeFalse();
    Mail::assertNothingSent();
});

it('sends the invite through the default Resend mailer when no mailbox is enabled', function () {
    config(['mail.default' => 'resend']);
    Mail::fake();

    $owner = peopleOwner();

    $this->actingAs($owner)
        ->post(route('settings.people.store'), [
            'name' => 'Resend Person',
            'email' => 'resend-invite@evotechly.com',
            'role' => 'member',
        ])
        ->assertRedirect();

    Mail::assertSent(WorkspaceInviteMail::class, fn (WorkspaceInviteMail $mail) => $mail->hasTo('resend-invite@evotechly.com')
        && $mail->mailer === 'resend');
});

it('keeps the invite pending and fails honestly when no mailbox is enabled', function () {
    Mail::fake();

    $owner = peopleOwner();
    Mailbox::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'enabled' => false,
    ]);

    $this->actingAs($owner)
        ->post(route('settings.people.store'), [
            'name' => 'Pending Person',
            'email' => 'pending@evotechly.com',
            'role' => 'member',
        ])
        ->assertRedirect();

    $invitee = User::query()->where('email', 'pending@evotechly.com')->firstOrFail();
    expect($invitee->email_verified_at)->toBeNull();

    Mail::assertNothingSent();
});

it('resends the invite for a pending user', function () {
    Mail::fake();

    $owner = peopleOwner();
    enabledMailboxFor($owner);

    $invitee = User::factory()->unverified()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->post(route('settings.people.resend', $invitee))
        ->assertRedirect();

    Mail::assertSent(WorkspaceInviteMail::class, fn (WorkspaceInviteMail $mail) => $mail->hasTo($invitee->email));
});

it('does not resend an invite to an active user', function () {
    Mail::fake();

    $owner = peopleOwner();
    enabledMailboxFor($owner);

    $active = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->post(route('settings.people.resend', $active))
        ->assertRedirect();

    Mail::assertNothingSent();
});

it('changes a member to admin', function () {
    $owner = peopleOwner();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->put(route('settings.people.role', $member), ['role' => 'admin'])
        ->assertRedirect();

    expect($member->refresh()->role)->toBe(WorkspaceRole::Admin);
});

it('cannot demote the last owner', function () {
    $owner = peopleOwner();

    $this->actingAs($owner)
        ->put(route('settings.people.role', $owner), ['role' => 'member'])
        ->assertRedirect();

    expect($owner->refresh()->role)->toBe(WorkspaceRole::Owner);
});

it('prevents an admin from modifying an owner', function () {
    $owner = peopleOwner();
    $admin = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Admin,
    ]);

    $this->actingAs($admin)
        ->put(route('settings.people.role', $owner), ['role' => 'member'])
        ->assertForbidden();

    $this->actingAs($admin)
        ->delete(route('settings.people.destroy', $owner))
        ->assertForbidden();
});

it('never assigns the owner role through the people endpoints', function () {
    $owner = peopleOwner();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->put(route('settings.people.role', $member), ['role' => 'owner'])
        ->assertSessionHasErrors('role');

    expect($member->refresh()->role)->toBe(WorkspaceRole::Member);
});

it('removes a member from the workspace', function () {
    $owner = peopleOwner();
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->delete(route('settings.people.destroy', $member))
        ->assertRedirect();

    expect(User::query()->find($member->id))->toBeNull();
});

it('cannot remove the last owner', function () {
    $owner = peopleOwner();
    $otherOwner = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Owner,
    ]);

    // With two owners, removing the other one is allowed…
    $this->actingAs($owner)
        ->delete(route('settings.people.destroy', $otherOwner))
        ->assertRedirect();
    expect(User::query()->find($otherOwner->id))->toBeNull();

    // …but the last remaining owner stays.
    $this->actingAs($owner)
        ->delete(route('settings.people.destroy', $owner))
        ->assertRedirect();
    expect(User::query()->find($owner->id))->not->toBeNull();
});

it('cannot remove yourself from the people page', function () {
    $owner = peopleOwner();
    $admin = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Admin,
    ]);

    $this->actingAs($admin)
        ->delete(route('settings.people.destroy', $admin))
        ->assertRedirect();

    expect(User::query()->find($admin->id))->not->toBeNull();
});

it('scopes people actions to the current workspace', function () {
    $owner = peopleOwner();
    $outsider = User::factory()->create([
        'workspace_id' => Workspace::factory(),
        'role' => WorkspaceRole::Member,
    ]);

    $this->actingAs($owner)
        ->put(route('settings.people.role', $outsider), ['role' => 'admin'])
        ->assertNotFound();

    $this->actingAs($owner)
        ->delete(route('settings.people.destroy', $outsider))
        ->assertNotFound();

    $this->actingAs($owner)
        ->post(route('settings.people.resend', $outsider))
        ->assertNotFound();
});

it('activates the invite when the password is set through the first-login link', function () {
    $owner = peopleOwner();

    $invitee = User::factory()->unverified()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
    ]);

    $token = Password::broker()->createToken($invitee);

    $this->get(route('password.reset', ['token' => $token, 'email' => $invitee->email]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/reset-password'));

    $this->post(route('password.update'), [
        'token' => $token,
        'email' => $invitee->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertRedirect();

    expect($invitee->refresh()->email_verified_at)->not->toBeNull();

    $this->post(route('login.store'), [
        'email' => $invitee->email,
        'password' => 'new-password',
    ])->assertRedirect(route('dashboard', absolute: false));
});

it('stamps last_login_at when a person logs in', function () {
    $user = User::factory()->create(['last_login_at' => null]);

    expect($user->last_login_at)->toBeNull();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect();

    expect($user->refresh()->last_login_at)->not->toBeNull();
});
