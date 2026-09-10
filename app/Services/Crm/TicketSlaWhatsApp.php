<?php

namespace App\Services\Crm;

use App\Models\Activity;
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

        $this->deliver($activity, $ticket, $workspace, $contact);
    }

    public function flushDeferred(int $limit = 200): int
    {
        $rows = Activity::query()
            ->where('type', 'notification')
            ->where('meta->source', 'ticket_sla')
            ->where('meta->whatsapp_sla', 'deferred')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $sent = 0;

        foreach ($rows as $activity) {
            if (! $activity instanceof Activity) {
                continue;
            }

            if ($this->flushOne($activity)) {
                $sent++;
            }
        }

        return $sent;
    }

    protected function flushOne(Activity $activity): bool
    {
        $ticket = Ticket::query()
            ->with(['contact', 'workspace'])
            ->find((int) ($activity->meta['ticket_id'] ?? 0));

        if (! $ticket instanceof Ticket) {
            $activity->mergeMeta(['whatsapp_sla' => 'skipped']);

            return false;
        }

        $workspace = $ticket->workspace;
        $contact = $ticket->contact;

        if (! $workspace instanceof Workspace || ! $contact instanceof Contact) {
            $activity->mergeMeta(['whatsapp_sla' => 'skipped']);

            return false;
        }

        if ($ticket->status === Ticket::STATUS_CLOSED || $ticket->first_response_at) {
            $activity->mergeMeta(['whatsapp_sla' => 'skipped']);

            return false;
        }

        if ($this->quietHours->blocks($workspace)) {
            return false;
        }

        $this->deliver($activity, $ticket, $workspace, $contact);

        return ($activity->fresh()?->meta['whatsapp_sla'] ?? null) === 'sent';
    }

    protected function deliver(Activity $activity, Ticket $ticket, Workspace $workspace, Contact $contact): void
    {
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

        $activity->mergeMeta(['whatsapp_sla' => $status ?: 'skipped']);
    }
}
