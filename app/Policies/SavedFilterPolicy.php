<?php

namespace App\Policies;

use App\Models\SavedFilter;
use App\Models\User;

class SavedFilterPolicy
{
    public function viewAny(User $user): bool
    {
        return (bool) $user->workspace_id;
    }

    public function view(User $user, SavedFilter $savedFilter): bool
    {
        return (int) $savedFilter->workspace_id === (int) $user->workspace_id;
    }

    public function create(User $user): bool
    {
        return (bool) $user->workspace_id;
    }

    public function update(User $user, SavedFilter $savedFilter): bool
    {
        if ((int) $savedFilter->workspace_id !== (int) $user->workspace_id) {
            return false;
        }

        return $savedFilter->user_id === null
            || (int) $savedFilter->user_id === (int) $user->id
            || $user->role->canManageSettings();
    }

    public function delete(User $user, SavedFilter $savedFilter): bool
    {
        return $this->update($user, $savedFilter);
    }
}
