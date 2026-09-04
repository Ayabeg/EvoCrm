<?php

namespace App\Observers;

use App\Models\Contact;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Crm\SegmentMatcher;
use App\Services\Crm\WorkflowRunner;

class ContactObserver
{
    public function __construct(
        private WorkflowRunner $workflows,
        private ProductAnalytics $analytics,
    ) {}

    public function created(Contact $contact): void
    {
        $contact->loadMissing('workspace');
        $this->analytics->capture(ProductAnalytics::CONTACT_CREATED, [
            'contact_id' => $contact->id,
            'source' => $contact->source,
        ], null, $contact->workspace);
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
