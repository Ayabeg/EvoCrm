<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;
use App\Policies\Concerns\AuthorizesWorkspaceCrmRecord;

class ContactPolicy
{
    use AuthorizesWorkspaceCrmRecord;

    public function view(User $user, Contact $contact): bool
    {
        return $this->belongsToCurrentWorkspace($user, $contact);
    }

    public function update(User $user, Contact $contact): bool
    {
        return $this->canEditWorkspaceRecord($user, $contact);
    }

    public function delete(User $user, Contact $contact): bool
    {
        return $this->update($user, $contact);
    }
}
