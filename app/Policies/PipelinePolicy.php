<?php

namespace App\Policies;

use App\Models\Pipeline;
use App\Models\User;

class PipelinePolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user->workspace_id;
    }

    public function view(User $user, Pipeline $pipeline): bool
    {
        return (int) $pipeline->workspace_id === (int) $user->workspace_id;
    }

    public function create(User $user): bool
    {
        return $user->role->canManageSettings();
    }

    public function update(User $user, Pipeline $pipeline): bool
    {
        return (int) $pipeline->workspace_id === (int) $user->workspace_id
            && $user->role->canManageSettings();
    }

    public function delete(User $user, Pipeline $pipeline): bool
    {
        return $this->update($user, $pipeline)
            && ! $pipeline->is_default
            && $pipeline->deals()->count() === 0;
    }
}
