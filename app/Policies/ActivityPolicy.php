<?php

namespace App\Policies;

use App\Models\Activity;
use App\Models\User;
use App\Policies\Concerns\AuthorizesWorkspaceCrmRecord;

class ActivityPolicy
{
    use AuthorizesWorkspaceCrmRecord;

    public function view(User $user, Activity $activity): bool
    {
        return $this->belongsToCurrentWorkspace($user, $activity);
    }

    public function update(User $user, Activity $activity): bool
    {
        return $this->canEditWorkspaceRecord($user, $activity);
    }

    public function delete(User $user, Activity $activity): bool
    {
        return $this->update($user, $activity);
    }
}
