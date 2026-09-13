<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;
use App\Policies\Concerns\AuthorizesWorkspaceCrmRecord;

class LeadPolicy
{
    use AuthorizesWorkspaceCrmRecord;

    public function view(User $user, Lead $lead): bool
    {
        return $this->belongsToCurrentWorkspace($user, $lead);
    }

    public function update(User $user, Lead $lead): bool
    {
        return $this->canEditWorkspaceRecord($user, $lead);
    }

    public function delete(User $user, Lead $lead): bool
    {
        return $this->update($user, $lead);
    }

    public function qualify(User $user, Lead $lead): bool
    {
        return $this->update($user, $lead);
    }
}
