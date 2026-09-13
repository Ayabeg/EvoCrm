<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;
use App\Policies\Concerns\AuthorizesWorkspaceCrmRecord;

class CompanyPolicy
{
    use AuthorizesWorkspaceCrmRecord;

    public function view(User $user, Company $company): bool
    {
        return $this->belongsToCurrentWorkspace($user, $company);
    }

    public function update(User $user, Company $company): bool
    {
        return $this->canEditWorkspaceRecord($user, $company);
    }

    public function delete(User $user, Company $company): bool
    {
        return $this->update($user, $company);
    }
}
