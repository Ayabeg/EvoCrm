<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

trait AuthorizesApiWorkspace
{
    protected function workspace(Request $request): Workspace
    {
        $workspace = $request->user()?->workspace;
        abort_unless($workspace instanceof Workspace, 403, 'User is not assigned to a workspace.');

        return $workspace;
    }

    protected function ensureInWorkspace(Model $model, Workspace $workspace): void
    {
        abort_unless((int) $model->getAttribute('workspace_id') === (int) $workspace->id, 404);
    }
}
