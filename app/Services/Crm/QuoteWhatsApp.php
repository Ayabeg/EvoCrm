<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Quote;
use App\Models\Workspace;
use App\Services\Meetings\MeetingWhatsApp;
use Throwable;

class QuoteWhatsApp
{
    public function __construct(private MeetingWhatsApp $whatsapp) {}

    public function confirm(Quote $quote, Activity $activity): void
    {
        $quote->loadMissing(['deal.contact', 'workspace']);

        $workspace = $quote->workspace;
        $contact = $quote->deal?->contact;

        if (! $workspace instanceof Workspace || ! $contact instanceof Contact) {
            return;
        }

        $name = filled($contact->first_name) ? (string) $contact->first_name : 'there';
        $amount = number_format(((int) $quote->total_cents) / 100, 0, ',', ' ').' '.($quote->currency ?: 'DZD');
        $phone = (string) ($contact->phone_e164 ?: $contact->phone ?: '');

        try {
            $status = $this->whatsapp->send(
                $workspace,
                $contact,
                $phone,
                MeetingWhatsApp::TEMPLATE_QUOTE,
                'Salaam '.$name.' — quote accepted: '.$amount.'.',
                [$name, $amount, (string) $quote->id],
            );
        } catch (Throwable) {
            $status = 'failed';
        }

        if ($status) {
            $activity->mergeMeta(['whatsapp_confirm' => $status]);
        }
    }
}
