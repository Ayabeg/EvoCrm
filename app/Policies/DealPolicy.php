<?php

namespace App\Policies;

use App\Models\Deal;
use App\Models\User;
use App\Policies\Concerns\AuthorizesWorkspaceCrmRecord;

class DealPolicy
{
    use AuthorizesWorkspaceCrmRecord;

    public function view(User $user, Deal $deal): bool
    {
        return $this->belongsToCurrentWorkspace($user, $deal);
    }

    public function update(User $user, Deal $deal): bool
    {
        return $this->canEditWorkspaceRecord($user, $deal);
    }

    public function delete(User $user, Deal $deal): bool
    {
        return $this->update($user, $deal);
    }

    public function move(User $user, Deal $deal): bool
    {
        return $this->update($user, $deal);
    }
}
