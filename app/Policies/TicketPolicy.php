<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;
use App\Policies\Concerns\AuthorizesWorkspaceCrmRecord;

class TicketPolicy
{
    use AuthorizesWorkspaceCrmRecord;

    public function view(User $user, Ticket $ticket): bool
    {
        return $this->belongsToCurrentWorkspace($user, $ticket);
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $this->canEditWorkspaceRecord($user, $ticket);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $this->update($user, $ticket);
    }

    public function move(User $user, Ticket $ticket): bool
    {
        return $this->update($user, $ticket);
    }
}
