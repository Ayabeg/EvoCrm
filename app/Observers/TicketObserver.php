<?php

namespace App\Observers;

use App\Models\Ticket;
use App\Services\Crm\WorkflowRunner;

class TicketObserver
{
    public function __construct(private WorkflowRunner $workflows) {}

    public function created(Ticket $ticket): void
    {
        $this->workflows->handleTicketCreated($ticket);
    }

    public function updated(Ticket $ticket): void
    {
        if ($ticket->wasChanged('status')) {
            $this->workflows->handleTicketStatusChanged($ticket);
        }

        if ($ticket->wasChanged('sla_breached_at') && $ticket->sla_breached_at) {
            $this->workflows->handleTicketSlaBreached($ticket);
        }
    }
}
