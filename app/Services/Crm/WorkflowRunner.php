<?php

namespace App\Services\Crm;

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Sequence;
use App\Models\Workflow;
use App\Models\Workspace;
use App\Services\Outbound\SequenceEnrollment;
use Throwable;

class WorkflowRunner
{
    public function __construct(
        private ActivityRecorder $activities,
        private SequenceEnrollment $enrollment,
    ) {}

    public function handleContactCreated(Contact $contact): void
    {
        $workspace = $contact->workspace ?? Workspace::query()->find($contact->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $this->run($workspace, Workflow::TRIGGER_CONTACT_CREATED, $contact, null);
    }

    public function handleDealStageChanged(Deal $deal): void
    {
        $deal->loadMissing(['workspace']);

        $workspace = $deal->workspace ?? Workspace::query()->find($deal->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $contact = $deal->contact_id
            ? Contact::query()->find($deal->contact_id)
            : null;

        $this->run($workspace, Workflow::TRIGGER_DEAL_STAGE_CHANGED, $contact, $deal);
    }

    private function run(Workspace $workspace, string $trigger, ?Contact $contact, ?Deal $deal): void
    {
        $workflows = Workflow::query()
            ->forWorkspace($workspace)
            ->where('active', true)
            ->where('trigger', $trigger)
            ->get();

        foreach ($workflows as $workflow) {
            if ($trigger === Workflow::TRIGGER_DEAL_STAGE_CHANGED
                && $workflow->trigger_stage_id
                && (int) $workflow->trigger_stage_id !== (int) $deal?->stage_id) {
                continue;
            }

            try {
                $this->execute($workspace, $workflow, $contact, $deal);
            } catch (Throwable) {
                // Record writes must not fail because a workflow action could not run.
            }
        }
    }

    private function execute(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal): void
    {
        match ($workflow->action) {
            Workflow::ACTION_CREATE_TASK => $this->createTask($workspace, $workflow, $contact, $deal),
            Workflow::ACTION_ENROLL_SEQUENCE => $this->enrollSequence($workspace, $workflow, $contact),
            default => null,
        };
    }

    private function createTask(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal): void
    {
        $config = $workflow->config();
        $dueInDays = (int) ($config['due_in_days'] ?? 1);

        $this->activities->record($workspace, [
            'type' => 'task',
            'subject' => $this->interpolate(
                (string) ($config['subject'] ?? $this->defaultTaskSubject($contact, $deal)),
                $contact,
                $deal,
            ),
            'body' => $this->interpolate(
                isset($config['body']) ? (string) $config['body'] : null,
                $contact,
                $deal,
            ),
            'due_at' => now()->addDays(max($dueInDays, 0)),
            'owner_id' => $deal !== null ? $deal->owner_id : $contact?->owner_id,
            'contact_id' => $contact?->id,
            'deal_id' => $deal?->id,
            'company_id' => $deal !== null ? $deal->company_id : $contact?->company_id,
            'meta' => [
                'workflow_id' => $workflow->id,
                'source' => 'workflow',
            ],
        ]);
    }

    private function enrollSequence(Workspace $workspace, Workflow $workflow, ?Contact $contact): void
    {
        if (! $contact) {
            return;
        }

        $sequenceId = $workflow->config()['sequence_id'] ?? null;

        $sequence = filled($sequenceId)
            ? Sequence::query()->forWorkspace($workspace)->whereKey($sequenceId)->first()
            : Sequence::query()->forWorkspace($workspace)->orderBy('id')->first();

        if (! $sequence) {
            return;
        }

        $this->enrollment->enroll($workspace, $sequence, $contact);
    }

    private function defaultTaskSubject(?Contact $contact, ?Deal $deal): string
    {
        if ($deal) {
            return 'Follow up on Evotechly deal';
        }

        if ($contact) {
            return 'Follow up with new Evotechly contact';
        }

        return 'Evotechly follow-up';
    }

    private function interpolate(?string $text, ?Contact $contact, ?Deal $deal): ?string
    {
        if ($text === null || $text === '') {
            return $text;
        }

        return strtr($text, [
            '{{contact}}' => $contact?->displayName() ?: 'contact',
            '{{deal}}' => $deal?->title ?: 'deal',
        ]);
    }
}
