<?php

namespace App\Services\Crm;

use App\Models\Contact;
use App\Models\Ticket;
use App\Models\Workspace;
use App\Services\Meetings\MeetingWhatsApp;
use App\Services\Outbound\QuietHoursGuard;
use Throwable;

class TicketSlaWhatsApp
{
    public function __construct(
        private MeetingWhatsApp $whatsapp,
        private ActivityRecorder $activities,
        private QuietHoursGuard $quietHours,
    ) {}

    public function notify(Ticket $ticket): void
    {
        $ticket->loadMissing(['contact', 'workspace']);

        $workspace = $ticket->workspace;
        $contact = $ticket->contact;

        if (! $workspace instanceof Workspace || ! $contact instanceof Contact) {
            return;
        }

        $activity = $this->activities->record($workspace, [
            'type' => 'notification',
            'subject' => 'SLA breached · '.$ticket->number,
            'body' => 'First-response SLA lapsed on '.$ticket->number.'.',
            'contact_id' => $contact->id,
            'deal_id' => $ticket->deal_id,
            'company_id' => $ticket->company_id,
            'owner_id' => $ticket->owner_id,
            'meta' => ['ticket_id' => $ticket->id, 'source' => 'ticket_sla'],
        ]);

        if ($this->quietHours->blocks($workspace)) {
            $activity->mergeMeta(['whatsapp_sla' => 'deferred']);

            return;
        }

        $name = filled($contact->first_name) ? (string) $contact->first_name : 'there';
        $number = (string) $ticket->number;
        $phone = (string) ($contact->phone_e164 ?: $contact->phone ?: '');

        try {
            $status = $this->whatsapp->send(
                $workspace,
                $contact,
                $phone,
                MeetingWhatsApp::TEMPLATE_SLA,
                'Salaam '.$name.' — we still owe you a reply on '.$number.'.',
                [$name, $number],
            );
        } catch (Throwable) {
            $status = 'failed';
        }

        if ($status) {
            $activity->mergeMeta(['whatsapp_sla' => $status]);
        }
    }
}
