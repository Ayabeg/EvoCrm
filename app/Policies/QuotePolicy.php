<?php

namespace App\Policies;

use App\Models\Quote;
use App\Models\User;
use App\Policies\Concerns\AuthorizesWorkspaceCrmRecord;

class QuotePolicy
{
    use AuthorizesWorkspaceCrmRecord;

    public function view(User $user, Quote $quote): bool
    {
        return $this->belongsToCurrentWorkspace($user, $quote);
    }

    public function update(User $user, Quote $quote): bool
    {
        return $this->canEditWorkspaceRecord($user, $quote);
    }

    public function delete(User $user, Quote $quote): bool
    {
        return $this->update($user, $quote);
    }

    public function acceptInternal(User $user, Quote $quote): bool
    {
        return $this->update($user, $quote);
    }
}
