<?php

namespace App\Observers;

use App\Models\Contact;
use App\Services\Crm\WorkflowRunner;

class ContactObserver
{
    public function __construct(private WorkflowRunner $workflows) {}

    public function created(Contact $contact): void
    {
        $this->workflows->handleContactCreated($contact);
    }
}
