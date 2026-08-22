<?php

namespace App\Services\Outbound;

use App\Models\Contact;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\Workspace;
use App\Services\Crm\ActivityRecorder;
use Illuminate\Validation\ValidationException;

class SequenceEnrollment
{
    public function __construct(
        private SuppressionService $suppressions,
        private ActivityRecorder $activities,
    ) {}

    public function enroll(Workspace $workspace, Sequence $sequence, Contact $contact): Enrollment
    {
        if ((int) $sequence->workspace_id !== (int) $workspace->id) {
            throw ValidationException::withMessages([
                'sequence_id' => 'Sequence does not belong to this workspace.',
            ]);
        }

        if ((int) $contact->workspace_id !== (int) $workspace->id) {
            throw ValidationException::withMessages([
                'contact_id' => 'Contact does not belong to this workspace.',
            ]);
        }

        if ($this->suppressions->isSuppressed($workspace, $contact->email, $contact->phone_e164)) {
            throw ValidationException::withMessages([
                'contact_id' => 'Contact is on the suppression list.',
            ]);
        }

        $enrollment = Enrollment::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'sequence_id' => $sequence->id,
                'contact_id' => $contact->id,
            ],
            [
                'status' => 'active',
                'next_step' => 1,
                'next_run_at' => now(),
            ]
        );

        $this->activities->record($workspace, [
            'type' => 'sequence',
            'subject' => "Enrolled in {$sequence->name}",
            'body' => "Sequence {$sequence->name} ({$sequence->channel}).",
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'meta' => ['sequence_id' => $sequence->id, 'enrollment_id' => $enrollment->id],
        ]);

        return $enrollment;
    }
}
