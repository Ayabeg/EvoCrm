<?php

namespace App\Policies\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait AuthorizesWorkspaceCrmRecord
{
    public function viewAny(User $user): bool
    {
        return (bool) $user->workspace_id;
    }

    public function create(User $user): bool
    {
        return (bool) $user->workspace_id
            && $user->canPermission('crm.edit');
    }

    protected function belongsToCurrentWorkspace(User $user, Model $record): bool
    {
        return (int) $record->getAttribute('workspace_id') === (int) $user->workspace_id;
    }

    protected function canEditWorkspaceRecord(User $user, Model $record): bool
    {
        return $this->belongsToCurrentWorkspace($user, $record)
            && $user->canPermission('crm.edit');
    }
}
