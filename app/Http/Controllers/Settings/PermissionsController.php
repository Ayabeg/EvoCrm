<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermissionsController extends Controller
{
    /**
     * RBAC matrix v1 — read-only stub for workspace admins.
     *
     * @return array<int, array{key: string, label: string, owner: bool, admin: bool, member: bool}>
     */
    private function matrix(): array
    {
        return [
            ['key' => 'deals.view', 'label' => 'View deals', 'owner' => true, 'admin' => true, 'member' => true],
            ['key' => 'deals.edit', 'label' => 'Edit deals', 'owner' => true, 'admin' => true, 'member' => false],
            ['key' => 'contacts.export', 'label' => 'Export contacts', 'owner' => true, 'admin' => true, 'member' => false],
            ['key' => 'settings.pipelines', 'label' => 'Manage pipelines', 'owner' => true, 'admin' => true, 'member' => false],
            ['key' => 'settings.attributes', 'label' => 'Manage attributes', 'owner' => true, 'admin' => true, 'member' => false],
            ['key' => 'settings.permissions', 'label' => 'Manage permissions', 'owner' => true, 'admin' => false, 'member' => false],
            ['key' => 'reports.dashboards', 'label' => 'Save dashboards', 'owner' => true, 'admin' => true, 'member' => true],
        ];
    }

    public function index(Request $request): Response
    {
        abort_unless(in_array($request->user()->role, ['owner', 'admin'], true), 403);

        $workspace = $request->user()->workspace;

        return Inertia::render('settings/permissions', [
            'matrix' => $this->matrix(),
            'members' => User::query()
                ->where('workspace_id', $workspace->id)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'permissions']),
        ]);
    }
}
