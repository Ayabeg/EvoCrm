<?php

namespace App\Observers;

use App\Models\Contact;
use App\Services\Crm\SegmentMatcher;
use App\Services\Crm\WorkflowRunner;

class ContactObserver
{
    public function __construct(private WorkflowRunner $workflows) {}

    public function created(Contact $contact): void
    {
        $this->workflows->handleContactCreated($contact);
    }

    public function saved(Contact $contact): void
    {
        if ($contact->wasRecentlyCreated) {
            return;
        }

        app(SegmentMatcher::class)->syncContact($contact);
    }
}
