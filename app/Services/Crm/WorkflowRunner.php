<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Lead;
use App\Models\Mailbox;
use App\Models\SavedFilter;
use App\Models\Sequence;
use App\Models\Stage;
use App\Models\Ticket;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;
use App\Services\Enrichment\WebsiteFetcher;
use App\Services\Outbound\QuietHoursGuard;
use App\Services\Outbound\SequenceEnrollment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Throwable;

class WorkflowRunner
{
    public function __construct(
        private ActivityRecorder $activities,
        private SequenceEnrollment $enrollment,
        private CustomAttributes $attributes,
        private QuietHoursGuard $quietHours,
        private ProductAnalytics $analytics,
        private WorkflowExecutionRedactor $redactor,
        private WebsiteFetcher $websiteFetcher,
    ) {}

    public function handleContactCreated(Contact $contact): void
    {
        $workspace = $contact->workspace ?? Workspace::query()->find($contact->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $this->run($workspace, Workflow::TRIGGER_CONTACT_CREATED, $contact, null);
    }

    public function handleDealCreated(Deal $deal): void
    {
        $deal->loadMissing(['workspace', 'stage']);

        $workspace = $deal->workspace ?? Workspace::query()->find($deal->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $contact = $deal->contact_id
            ? Contact::query()->find($deal->contact_id)
            : null;

        $this->run($workspace, Workflow::TRIGGER_DEAL_CREATED, $contact, $deal);
    }

    public function handleDealStageChanged(Deal $deal): void
    {
        $deal->loadMissing(['workspace', 'stage']);

        $workspace = $deal->workspace ?? Workspace::query()->find($deal->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $contact = $deal->contact_id
            ? Contact::query()->find($deal->contact_id)
            : null;

        $this->run($workspace, Workflow::TRIGGER_DEAL_STAGE_CHANGED, $contact, $deal);
    }

    public function handleEnrollmentFinished(Enrollment $enrollment): void
    {
        $enrollment->loadMissing(['workspace', 'contact']);
        $workspace = $enrollment->workspace;

        if (! $workspace instanceof Workspace || ! $enrollment->contact) {
            return;
        }

        $this->run($workspace, Workflow::TRIGGER_ENROLLMENT_FINISHED, $enrollment->contact, null);
    }

    public function handleSegmentEntered(Contact $contact, SavedFilter $segment): void
    {
        $this->runSegmentTrigger($contact, $segment, Workflow::TRIGGER_SEGMENT_ENTERED);
    }

    public function handleSegmentExited(Contact $contact, SavedFilter $segment): void
    {
        $this->runSegmentTrigger($contact, $segment, Workflow::TRIGGER_SEGMENT_EXITED);
    }

    private function runSegmentTrigger(Contact $contact, SavedFilter $segment, string $trigger): void
    {
        $workspace = $contact->workspace ?? Workspace::query()->find($contact->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $workflows = Workflow::query()
            ->forWorkspace($workspace)
            ->where('active', true)
            ->where('trigger', $trigger)
            ->where(function ($query) use ($segment) {
                $query->whereNull('trigger_saved_filter_id')
                    ->orWhere('trigger_saved_filter_id', $segment->id);
            })
            ->get();

        foreach ($workflows as $workflow) {
            try {
                if ((int) ($workflow->delay_minutes ?? 0) > 0) {
                    $this->schedule($workspace, $workflow, $contact, null);
                } else {
                    $this->recordImmediate(
                        $workspace,
                        $workflow,
                        $contact,
                        null,
                        null,
                        $this->execute($workspace, $workflow, $contact, null),
                    );
                }
            } catch (Throwable) {
            }
        }
    }

    public function handleLeadScored(Lead $lead): void
    {
        $this->runLeadTrigger($lead, Workflow::TRIGGER_LEAD_SCORED);
    }

    public function handleLeadQualified(Lead $lead): void
    {
        $this->runLeadTrigger($lead, Workflow::TRIGGER_LEAD_QUALIFIED);
    }

    private function runLeadTrigger(Lead $lead, string $trigger): void
    {
        $lead->loadMissing(['workspace', 'contact', 'deal']);
        $workspace = $lead->workspace ?? Workspace::query()->find($lead->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $this->run($workspace, $trigger, $lead->contact, $lead->deal);
    }

    public function handleEnrollmentReplied(Contact $contact, Enrollment $enrollment): void
    {
        $workspace = $contact->workspace ?? Workspace::query()->find($contact->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $this->run($workspace, Workflow::TRIGGER_ENROLLMENT_REPLIED, $contact, null);
    }

    public function handleMeetingBooked(Activity $activity): void
    {
        $workspace = Workspace::query()->find($activity->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $contact = $activity->contact_id
            ? Contact::query()->find($activity->contact_id)
            : null;
        $deal = $activity->deal_id
            ? Deal::query()->find($activity->deal_id)
            : null;

        $this->run($workspace, Workflow::TRIGGER_MEETING_BOOKED, $contact, $deal);
    }

    public function handleMeetingNoShow(Activity $activity): void
    {
        $workspace = Workspace::query()->find($activity->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $contact = $activity->contact_id
            ? Contact::query()->find($activity->contact_id)
            : null;
        $deal = $activity->deal_id
            ? Deal::query()->find($activity->deal_id)
            : null;

        $this->run($workspace, Workflow::TRIGGER_MEETING_NO_SHOW, $contact, $deal);
    }

    public function handleTicketCreated(Ticket $ticket): void
    {
        $this->runTicketTrigger($ticket, Workflow::TRIGGER_TICKET_CREATED);
    }

    public function handleTicketStatusChanged(Ticket $ticket): void
    {
        $this->runTicketTrigger($ticket, Workflow::TRIGGER_TICKET_STATUS_CHANGED);
    }

    public function handleTicketSlaBreached(Ticket $ticket): void
    {
        $this->runTicketTrigger($ticket, Workflow::TRIGGER_TICKET_SLA_BREACHED);
    }

    private function runTicketTrigger(Ticket $ticket, string $trigger): void
    {
        $ticket->loadMissing(['workspace', 'contact', 'deal']);

        $workspace = $ticket->workspace ?? Workspace::query()->find($ticket->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $this->run($workspace, $trigger, $ticket->contact, $ticket->deal, $ticket);
    }

    /**
     * Execute a scheduled workflow action (called by workflow:run).
     */
    public function executeScheduled(Workflow $workflow, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): WorkflowExecutionOutcome
    {
        $workspace = $workflow->workspace ?? Workspace::query()->find($workflow->workspace_id);

        if (! $workspace instanceof Workspace) {
            $now = now();

            return new WorkflowExecutionOutcome(
                status: WorkflowExecution::STATUS_FAILED,
                branch: null,
                action: null,
                conditionPassed: null,
                resultSummary: null,
                errorSummary: 'Workspace was missing when the delayed run executed.',
                actionParameters: null,
                startedAt: $now,
                finishedAt: $now,
            );
        }

        return $this->execute($workspace, $workflow, $contact, $deal, $ticket);
    }

    /**
     * Resolve a workflow branch without executing or persisting its action.
     *
     * @return array{branch: string, action: string|null, condition_passed: bool|null, action_parameters: array<string, mixed>}
     */
    public function preview(
        Workspace $workspace,
        Workflow $workflow,
        ?Contact $contact = null,
        ?Deal $deal = null,
        ?Ticket $ticket = null,
    ): array {
        $hasCondition = $workflow->hasCondition();
        $conditionPassed = $hasCondition
            ? $this->conditionPasses($workspace, $workflow, $contact, $deal, $ticket)
            : null;
        $useThen = ! $hasCondition || $conditionPassed;
        $action = $useThen ? $workflow->action : $workflow->else_action;
        $config = $useThen ? $workflow->config() : $workflow->elseConfig();

        return [
            'branch' => $useThen ? 'then' : 'else',
            'action' => filled($action) ? (string) $action : null,
            'condition_passed' => $conditionPassed,
            'action_parameters' => $this->redactor->redactParameters($config),
        ];
    }

    /**
     * Replay a failed execution with the workflow's current configuration.
     *
     * The original row is never mutated. A new row records the result so
     * operators can compare the failed attempt with its replay.
     */
    public function replay(Workspace $workspace, WorkflowExecution $execution): WorkflowExecution
    {
        $workflow = $execution->workflow;
        if (! $workflow instanceof Workflow) {
            throw new RuntimeException('The workflow for this execution no longer exists.');
        }

        $outcome = $this->execute(
            $workspace,
            $workflow,
            $execution->contact,
            $execution->deal,
            $execution->ticket,
        );

        return WorkflowExecution::query()->create([
            'workspace_id' => $workspace->id,
            'workflow_id' => $workflow->id,
            'workflow_name' => $workflow->name,
            'contact_id' => $execution->contact_id,
            'deal_id' => $execution->deal_id,
            'ticket_id' => $execution->ticket_id,
            'trigger' => $execution->trigger ?: $workflow->trigger,
            'delay_minutes' => 0,
            'run_at' => $outcome->startedAt,
            ...$outcome->attributes($this->redactor),
        ]);
    }

    private function run(Workspace $workspace, string $trigger, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): void
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

            if ($trigger === Workflow::TRIGGER_TICKET_STATUS_CHANGED
                && filled($workflow->trigger_status)
                && (string) $workflow->trigger_status !== (string) $ticket?->status) {
                continue;
            }

            try {
                if ((int) ($workflow->delay_minutes ?? 0) > 0) {
                    $this->schedule($workspace, $workflow, $contact, $deal, $ticket);

                    continue;
                }

                $this->recordImmediate(
                    $workspace,
                    $workflow,
                    $contact,
                    $deal,
                    $ticket,
                    $this->execute($workspace, $workflow, $contact, $deal, $ticket),
                );
            } catch (Throwable) {
                // Record writes must not fail because a workflow action could not run.
            }
        }
    }

    private function schedule(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): void
    {
        $runAt = now()->addMinutes((int) $workflow->delay_minutes);

        if ($this->quietHours->blocks($workspace)) {
            $hours = $workspace->activeQuietHours();
            $allowed = $hours?->nextAllowedAt() ?? $runAt;
            if ($allowed->greaterThan($runAt)) {
                $runAt = $allowed;
            }
        }

        WorkflowExecution::query()->create([
            'workspace_id' => $workspace->id,
            'workflow_id' => $workflow->id,
            'workflow_name' => $workflow->name,
            'contact_id' => $contact?->id,
            'deal_id' => $deal?->id,
            'ticket_id' => $ticket?->id,
            'trigger' => $workflow->trigger,
            'delay_minutes' => (int) ($workflow->delay_minutes ?? 0),
            'run_at' => $runAt,
            'status' => WorkflowExecution::STATUS_PENDING,
        ]);
    }

    private function recordImmediate(
        Workspace $workspace,
        Workflow $workflow,
        ?Contact $contact,
        ?Deal $deal,
        ?Ticket $ticket,
        WorkflowExecutionOutcome $outcome,
    ): void {
        try {
            WorkflowExecution::query()->create([
                'workspace_id' => $workspace->id,
                'workflow_id' => $workflow->id,
                'workflow_name' => $workflow->name,
                'contact_id' => $contact?->id,
                'deal_id' => $deal?->id,
                'ticket_id' => $ticket?->id,
                'trigger' => $workflow->trigger,
                'delay_minutes' => 0,
                'run_at' => $outcome->startedAt,
                ...$outcome->attributes($this->redactor),
            ]);
        } catch (Throwable $exception) {
            Log::warning('workflow.execution.persist_failed', [
                'workflow_id' => $workflow->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function execute(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): WorkflowExecutionOutcome
    {
        $startedAt = now();
        $hasCondition = $workflow->hasCondition();
        $useThen = ! $hasCondition || $this->conditionPasses($workspace, $workflow, $contact, $deal, $ticket);
        $action = $useThen ? $workflow->action : $workflow->else_action;
        $config = $useThen ? $workflow->config() : $workflow->elseConfig();
        $branch = $useThen ? 'then' : 'else';

        if (! filled($action)) {
            return new WorkflowExecutionOutcome(
                status: WorkflowExecution::STATUS_COMPLETED,
                branch: $branch,
                action: null,
                conditionPassed: $hasCondition ? $useThen : null,
                resultSummary: [
                    'outcome' => 'no_action',
                    'summary' => 'No action configured on this branch.',
                ],
                errorSummary: null,
                actionParameters: null,
                startedAt: $startedAt,
                finishedAt: now(),
            );
        }

        try {
            $result = match ($action) {
                Workflow::ACTION_CREATE_TASK => $this->createTask($workspace, $workflow, $contact, $deal, $config, $ticket),
                Workflow::ACTION_ENROLL_SEQUENCE => $this->enrollSequence($workspace, $config, $contact),
                Workflow::ACTION_SEND_WEBHOOK => $this->sendWebhook($workflow, $config, $contact, $deal, $ticket),
                Workflow::ACTION_SET_PROPERTY => $this->setProperty($workspace, $config, $contact, $deal),
                Workflow::ACTION_ASSIGN_OWNER => $this->assignOwner($config, $contact, $deal),
                Workflow::ACTION_CREATE_DEAL => $this->createDeal($workspace, $config, $contact),
                Workflow::ACTION_SEND_EMAIL => $this->sendEmail($workspace, $config, $contact),
                Workflow::ACTION_NOTIFY_USER => $this->notifyUser($workspace, $config, $contact, $deal, $ticket),
                default => [
                    'outcome' => 'unknown_action',
                    'summary' => 'Action is not registered on the runner.',
                ],
            };

            $this->analytics->capture(ProductAnalytics::WORKFLOW_EXECUTED, [
                'workflow_id' => $workflow->id,
                'workflow_name' => $workflow->name,
                'trigger' => $workflow->trigger,
                'action' => $action,
                'contact_id' => $contact?->id,
                'deal_id' => $deal?->id,
                'ticket_id' => $ticket?->id,
            ], null, $workspace);

            return new WorkflowExecutionOutcome(
                status: WorkflowExecution::STATUS_COMPLETED,
                branch: $branch,
                action: $action,
                conditionPassed: $hasCondition ? $useThen : null,
                resultSummary: $result,
                errorSummary: null,
                actionParameters: $config,
                startedAt: $startedAt,
                finishedAt: now(),
            );
        } catch (Throwable $exception) {
            Log::warning('workflow.execution.failed', [
                'workflow_id' => $workflow->id,
                'action' => $action,
                'branch' => $branch,
            ]);

            return new WorkflowExecutionOutcome(
                status: WorkflowExecution::STATUS_FAILED,
                branch: $branch,
                action: $action,
                conditionPassed: $hasCondition ? $useThen : null,
                resultSummary: null,
                errorSummary: $exception->getMessage(),
                actionParameters: $config,
                startedAt: $startedAt,
                finishedAt: now(),
            );
        }
    }

    private function conditionPasses(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): bool
    {
        return $workflow->compare($this->leftValue($workspace, $workflow, $contact, $deal, $ticket));
    }

    private function leftValue(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): mixed
    {
        $field = (string) $workflow->condition_field;

        if ($field === Workflow::CONDITION_DEAL_AMOUNT) {
            return $deal?->amountDzd();
        }

        if ($field === Workflow::CONDITION_DEAL_STAGE) {
            return $this->dealStageLeft($deal, (string) ($workflow->condition_value ?? ''));
        }

        if ($field === Workflow::CONDITION_TICKET_STATUS) {
            return $ticket?->status;
        }

        if (str_starts_with($field, 'contact.attr.')) {
            if (! $contact) {
                return null;
            }

            $key = substr($field, strlen('contact.attr.'));
            $values = $this->attributes->valuesFor($workspace, 'contact', $contact->id);

            return $values[$key] ?? null;
        }

        if (str_starts_with($field, 'contact.')) {
            $property = substr($field, strlen('contact.'));

            if (in_array($property, ['wilaya', 'city', 'source', 'email', 'phone', 'first_name', 'last_name'], true)) {
                return $contact?->getAttribute($property);
            }
        }

        return null;
    }

    private function dealStageLeft(?Deal $deal, string $expected): ?string
    {
        if (! $deal) {
            return null;
        }

        $stage = Stage::query()->find($deal->stage_id);

        $candidates = array_values(array_filter([
            $stage?->slug,
            $stage?->name,
            (string) $deal->stage_id,
        ], fn (?string $value): bool => is_string($value) && $value !== ''));

        foreach ($candidates as $candidate) {
            if (strcasecmp($candidate, $expected) === 0) {
                return $expected;
            }
        }

        return $stage?->slug;
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function createTask(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal, array $config, ?Ticket $ticket = null): array
    {
        $dueInDays = (int) ($config['due_in_days'] ?? 1);

        $this->activities->record($workspace, [
            'type' => 'task',
            'subject' => $this->interpolate(
                (string) ($config['subject'] ?? $this->defaultTaskSubject($contact, $deal, $ticket)),
                $contact,
                $deal,
                $ticket,
            ),
            'body' => $this->interpolate(
                isset($config['body']) ? (string) $config['body'] : null,
                $contact,
                $deal,
                $ticket,
            ),
            'due_at' => now()->addDays(max($dueInDays, 0)),
            'owner_id' => $ticket?->owner_id ?? ($deal !== null ? $deal->owner_id : $contact?->owner_id),
            'contact_id' => $contact?->id,
            'deal_id' => $deal?->id,
            'company_id' => $deal !== null ? $deal->company_id : ($ticket?->company_id ?? $contact?->company_id),
            'meta' => array_filter([
                'workflow_id' => $workflow->id,
                'source' => 'workflow',
                'ticket_id' => $ticket?->id,
            ]),
        ]);

        return [
            'outcome' => 'created_task',
            'summary' => 'Created a task.',
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function enrollSequence(Workspace $workspace, array $config, ?Contact $contact): array
    {
        if (! $contact) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'No contact was available to enroll.',
            ];
        }

        $sequenceId = $config['sequence_id'] ?? null;

        $sequence = filled($sequenceId)
            ? Sequence::query()->forWorkspace($workspace)->whereKey($sequenceId)->first()
            : Sequence::query()->forWorkspace($workspace)->orderBy('id')->first();

        if (! $sequence) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'No sequence was available.',
            ];
        }

        $this->enrollment->enroll($workspace, $sequence, $contact);

        return [
            'outcome' => 'enrolled_sequence',
            'summary' => 'Enrolled the contact in a sequence.',
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function sendWebhook(Workflow $workflow, array $config, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): array
    {
        $url = trim((string) ($config['url'] ?? ''));

        $request = $this->websiteFetcher->publicRequestOptions($url);

        if ($request === false) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'Webhook URL was not allowed.',
            ];
        }

        $response = Http::timeout(8)
            ->acceptJson()
            ->asJson()
            ->withOptions($request['options'])
            ->post($request['url'], [
                'source' => 'evosales',
                'workflow_id' => $workflow->id,
                'workflow' => $workflow->name,
                'trigger' => $workflow->trigger,
                'contact' => $contact ? [
                    'id' => $contact->id,
                    'name' => $contact->displayName(),
                    'email' => $contact->email,
                    'phone' => $contact->phone_e164 ?: $contact->phone,
                    'wilaya' => $contact->wilaya,
                    'city' => $contact->city,
                ] : null,
                'deal' => $deal ? [
                    'id' => $deal->id,
                    'title' => $deal->title,
                    'amount_dzd' => $deal->amountDzd(),
                    'currency' => $deal->currency,
                    'stage_id' => $deal->stage_id,
                ] : null,
                'ticket' => $ticket ? [
                    'id' => $ticket->id,
                    'number' => $ticket->number,
                    'subject' => $ticket->subject,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                ] : null,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Webhook returned HTTP '.$response->status().'.');
        }

        return [
            'outcome' => 'webhook_sent',
            'summary' => 'Webhook accepted (HTTP '.$response->status().').',
        ];
    }

    private function defaultTaskSubject(?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): string
    {
        if ($ticket) {
            return 'Follow up on '.$ticket->number;
        }

        if ($deal) {
            return 'Follow up on Evotechly deal';
        }

        if ($contact) {
            return 'Follow up with new Evotechly contact';
        }

        return 'Evotechly follow-up';
    }

    private function interpolate(?string $text, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): ?string
    {
        if ($text === null || $text === '') {
            return $text;
        }

        return strtr($text, [
            '{{contact}}' => $contact?->displayName() ?: 'contact',
            '{{deal}}' => $deal?->title ?: 'deal',
            '{{ticket}}' => $ticket?->number ?: 'ticket',
        ]);
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function setProperty(Workspace $workspace, array $config, ?Contact $contact, ?Deal $deal): array
    {
        $entity = (string) ($config['entity'] ?? 'contact');
        $field = (string) ($config['field'] ?? '');
        $value = $config['value'] ?? null;

        if ($field === '' || $value === null) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'Property field or value was missing.',
            ];
        }

        if (str_starts_with($field, 'attr.')) {
            $key = substr($field, 5);
            $record = match ($entity) {
                'deal' => $deal,
                'contact' => $contact,
                default => null,
            };

            if (! $record) {
                return [
                    'outcome' => 'action_did_not_apply',
                    'summary' => 'Target record was missing.',
                ];
            }

            $this->attributes->saveValues($workspace, $entity, $record->id, [$key => $value]);

            return [
                'outcome' => 'set_property',
                'summary' => 'Updated a custom property.',
            ];
        }

        if ($entity === 'contact' && $contact && in_array($field, ['city', 'wilaya', 'source'], true)) {
            $contact->forceFill([$field => $value])->save();

            return [
                'outcome' => 'set_property',
                'summary' => 'Updated the contact property.',
            ];
        }

        if ($entity === 'deal' && $deal && $field === 'title') {
            $deal->forceFill(['title' => $value])->save();

            return [
                'outcome' => 'set_property',
                'summary' => 'Updated the deal title.',
            ];
        }

        return [
            'outcome' => 'action_did_not_apply',
            'summary' => 'Property target was not writable.',
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function assignOwner(array $config, ?Contact $contact, ?Deal $deal): array
    {
        $ownerId = isset($config['owner_id']) ? (int) $config['owner_id'] : null;

        if (! $ownerId) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'No owner was configured.',
            ];
        }

        $entity = (string) ($config['entity'] ?? 'contact');

        if ($entity === 'deal' && $deal) {
            $deal->forceFill(['owner_id' => $ownerId])->save();

            return [
                'outcome' => 'assigned_owner',
                'summary' => 'Assigned the deal owner.',
            ];
        }

        if ($contact) {
            $contact->forceFill(['owner_id' => $ownerId])->save();

            return [
                'outcome' => 'assigned_owner',
                'summary' => 'Assigned the contact owner.',
            ];
        }

        return [
            'outcome' => 'action_did_not_apply',
            'summary' => 'No record was available to assign.',
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function createDeal(Workspace $workspace, array $config, ?Contact $contact): array
    {
        if (! $contact) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'No contact was available to create a deal.',
            ];
        }

        $pipeline = $workspace->defaultPipeline();
        $stage = $pipeline->stageBySlug((string) ($config['stage_slug'] ?? 'new')) ?? $pipeline->stages->first();

        Deal::query()->create([
            'workspace_id' => $workspace->id,
            'contact_id' => $contact->id,
            'company_id' => $contact->company_id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage?->id,
            'owner_id' => $contact->owner_id,
            'title' => (string) ($config['title'] ?? 'New deal · '.$contact->displayName()),
            'amount_cents' => (int) ($config['amount_cents'] ?? 0),
            'currency' => 'DZD',
        ]);

        return [
            'outcome' => 'created_deal',
            'summary' => 'Created a deal.',
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function sendEmail(Workspace $workspace, array $config, ?Contact $contact): array
    {
        if (! $contact?->email) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'Contact had no email address.',
            ];
        }

        $mailbox = Mailbox::query()
            ->forWorkspace($workspace)
            ->where('enabled', true)
            ->orderByDesc('is_default')
            ->first();

        if (! $mailbox) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'No enabled mailbox was available.',
            ];
        }

        Mail::raw(
            (string) ($config['body'] ?? 'Follow up from EvoSales'),
            fn ($message) => $message
                ->to($contact->email)
                ->subject((string) ($config['subject'] ?? 'EvoSales follow-up'))
                ->from($mailbox->from_address, $mailbox->from_name ?? 'EvoSales'),
        );

        return [
            'outcome' => 'email_sent',
            'summary' => 'Queued a follow-up email.',
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{outcome: string, summary: string}
     */
    private function notifyUser(Workspace $workspace, array $config, ?Contact $contact, ?Deal $deal, ?Ticket $ticket = null): array
    {
        $userId = isset($config['user_id']) ? (int) $config['user_id'] : ($ticket?->owner_id ?? $deal?->owner_id ?? $contact?->owner_id);

        if (! $userId) {
            return [
                'outcome' => 'action_did_not_apply',
                'summary' => 'No user was available to notify.',
            ];
        }

        $this->activities->record($workspace, [
            'type' => 'notification',
            'subject' => (string) ($config['subject'] ?? 'Workflow notification'),
            'body' => (string) ($config['body'] ?? ''),
            'owner_id' => $userId,
            'contact_id' => $contact?->id,
            'deal_id' => $deal?->id,
            'company_id' => $deal?->company_id ?? $ticket?->company_id ?? $contact?->company_id,
            'meta' => array_filter([
                'source' => 'workflow',
                'ticket_id' => $ticket?->id,
            ]),
        ]);

        return [
            'outcome' => 'notified_user',
            'summary' => 'Created a user notification.',
        ];
    }
}
