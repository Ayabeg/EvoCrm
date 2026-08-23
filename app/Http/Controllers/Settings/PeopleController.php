<?php

namespace App\Http\Controllers\Settings;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Models\Mailbox;
use App\Models\User;
use App\Services\People\InviteSendResult;
use App\Services\People\WorkspaceInviteMailer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings → People. Owner/admin only (the can-manage-settings middleware
 * guards every route here). One owner by default: owner is never
 * assignable through this controller, the last owner can neither be
 * demoted nor removed, and nobody below owner touches an owner.
 */
class PeopleController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/people', [
            'people' => User::query()
                ->where('workspace_id', $workspace->id)
                ->orderByRaw("case role when 'owner' then 0 when 'admin' then 1 else 2 end")
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'status' => $user->email_verified_at ? 'active' : 'pending',
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                    'invited_at' => $user->created_at?->toIso8601String(),
                    'is_self' => $user->id === $request->user()->id,
                ]),
            'ownerCount' => $this->ownerCount($request->user()),
            'actorRole' => $request->user()->role->value,
            'hasEnabledMailbox' => Mailbox::query()
                ->forWorkspace($workspace)
                ->where('enabled', true)
                ->exists(),
        ]);
    }

    /**
     * Invite = create the person on this workspace (pending) and issue the
     * first-login email. Roles are admin|member only — a second owner needs
     * a real ownership transfer, not an invite.
     */
    public function store(Request $request, WorkspaceInviteMailer $invites): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'role' => ['required', Rule::in([WorkspaceRole::Admin->value, WorkspaceRole::Member->value])],
        ]);

        $invitee = User::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'role' => $data['role'],
            // Placeholder only — never sent. The invite mail carries a
            // single-use set-password link instead of a standing password.
            'password' => Str::random(32),
        ]);

        $this->flashInviteResult($invites->send($invitee, $request->user()), $invitee);

        return back();
    }

    public function resend(Request $request, User $user, WorkspaceInviteMailer $invites): RedirectResponse
    {
        abort_unless((int) $user->workspace_id === (int) $request->user()->workspace_id, 404);

        if ($user->email_verified_at) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "{$user->name} is already active — there is no invite to resend.",
            ]);

            return back();
        }

        $this->flashInviteResult($invites->send($user, $request->user()), $user);

        return back();
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        abort_unless((int) $user->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'role' => ['required', Rule::in([WorkspaceRole::Admin->value, WorkspaceRole::Member->value])],
        ]);

        $actor = $request->user();

        if ($user->role === WorkspaceRole::Owner) {
            abort_unless($actor->role === WorkspaceRole::Owner, 403);

            if ($this->ownerCount($actor) <= 1) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'The last owner keeps their role — transfer ownership before demoting.',
                ]);

                return back();
            }
        }

        $user->forceFill(['role' => $data['role']])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$user->name} is now {$data['role']}.",
        ]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless((int) $user->workspace_id === (int) $request->user()->workspace_id, 404);

        $actor = $request->user();

        if ($user->id === $actor->id) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Use Profile → Delete account to remove yourself.',
            ]);

            return back();
        }

        if ($user->role === WorkspaceRole::Owner) {
            abort_unless($actor->role === WorkspaceRole::Owner, 403);

            if ($this->ownerCount($actor) <= 1) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'The last owner cannot be removed.',
                ]);

                return back();
            }
        }

        $name = $user->name;
        $user->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$name} was removed from the workspace.",
        ]);

        return back();
    }

    private function ownerCount(User $actor): int
    {
        return User::query()
            ->where('workspace_id', $actor->workspace_id)
            ->where('role', WorkspaceRole::Owner->value)
            ->count();
    }

    private function flashInviteResult(InviteSendResult $result, User $invitee): void
    {
        if ($result->ok()) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "Login email sent to {$invitee->email}.",
            ]);

            return;
        }

        Inertia::flash('toast', [
            'type' => 'error',
            'message' => $result->status === 'no_mailbox'
                ? "{$invitee->name} was added as pending, but the workspace has no enabled mailbox — the login email could not be sent. Enable one under Outbound → Mailboxes, then resend the invite."
                : "{$invitee->name} was added as pending, but the login email failed: {$result->error}",
        ]);
    }
}
