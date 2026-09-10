<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Services\Crm\TicketSlaWhatsApp;
use Illuminate\Console\Command;

class CheckTicketSla extends Command
{
    protected $signature = 'tickets:check-sla {--limit=200}';

    protected $description = 'Mark overdue first-response SLAs, fire ticket.sla_breached workflows, and flush deferred WhatsApp pings';

    public function handle(TicketSlaWhatsApp $whatsapp): int
    {
        $due = Ticket::query()
            ->whereNull('sla_breached_at')
            ->whereNotNull('sla_due_at')
            ->where('sla_due_at', '<=', now())
            ->where('status', '!=', Ticket::STATUS_CLOSED)
            ->orderBy('id')
            ->limit((int) $this->option('limit'))
            ->get();

        $marked = 0;

        foreach ($due as $ticket) {
            if ($ticket->markSlaBreached()) {
                $marked++;
            }
        }

        $flushed = $whatsapp->flushDeferred((int) $this->option('limit'));

        $this->info("tickets:check-sla — {$marked} breached of {$due->count()} due, {$flushed} WhatsApp ping".($flushed === 1 ? '' : 's').' flushed.');

        return self::SUCCESS;
    }
}
