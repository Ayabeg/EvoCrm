<?php

namespace App\Http\Controllers\Settings;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermissionsController extends Controller
{
    /**
     * @return array<int, array{key: string, label: string, owner: bool, admin: bool, member: bool}>
     */
    private function matrix(): array
    {
        $configured = config('permissions.capabilities', []);
        $matrix = [];

        if (! is_array($configured)) {
            return $matrix;
        }

        foreach ($configured as $key => $capability) {
            if (! is_string($key) || ! is_array($capability) || ! is_array($capability['defaults'] ?? null)) {
                continue;
            }

            $matrix[] = [
                'key' => $key,
                'label' => (string) ($capability['label'] ?? $key),
                'owner' => (bool) ($capability['defaults']['owner'] ?? false),
                'admin' => (bool) ($capability['defaults']['admin'] ?? false),
                'member' => (bool) ($capability['defaults']['member'] ?? false),
            ];
        }

        return $matrix;
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user()->role->canManageSettings(), 403);

        $workspace = $request->user()->workspace;

        return Inertia::render('settings/permissions', [
            'matrix' => $this->matrix(),
            'members' => User::query()
                ->where('workspace_id', $workspace->id)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'permissions']),
            'canManage' => $request->user()->canPermission('settings.permissions'),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();

        abort_unless($actor->canPermission('settings.permissions'), 403);
        abort_unless((int) $user->workspace_id === (int) $actor->workspace_id, 404);
        abort_unless($user->role === WorkspaceRole::Member, 422);

        $supported = array_keys(config('permissions.capabilities', []));
        $data = $request->validate([
            'permissions' => ['sometimes', 'array', 'max:'.count($supported)],
            'permissions.*' => ['string', Rule::in($supported)],
        ]);

        $user->forceFill([
            'permissions' => array_values(array_intersect($supported, array_unique($data['permissions'] ?? []))),
        ])->save();

        return back();
    }
}
