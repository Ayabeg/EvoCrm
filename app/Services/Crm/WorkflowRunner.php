<?php

namespace App\Services\Crm;

use App\Models\Contact;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Mailbox;
use App\Models\SavedFilter;
use App\Models\Sequence;
use App\Models\Stage;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Models\Workspace;
use App\Services\Outbound\QuietHoursGuard;
use App\Services\Outbound\SequenceEnrollment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Throwable;

class WorkflowRunner
{
    public function __construct(
        private ActivityRecorder $activities,
        private SequenceEnrollment $enrollment,
        private CustomAttributes $attributes,
        private QuietHoursGuard $quietHours,
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
        $workspace = $contact->workspace ?? Workspace::query()->find($contact->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $workflows = Workflow::query()
            ->forWorkspace($workspace)
            ->where('active', true)
            ->where('trigger', Workflow::TRIGGER_SEGMENT_ENTERED)
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
                    $this->execute($workspace, $workflow, $contact, null);
                }
            } catch (Throwable) {
            }
        }
    }

    public function handleEnrollmentReplied(Contact $contact, Enrollment $enrollment): void
    {
        $workspace = $contact->workspace ?? Workspace::query()->find($contact->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $this->run($workspace, Workflow::TRIGGER_ENROLLMENT_REPLIED, $contact, null);
    }

    /**
     * Execute a scheduled workflow action (called by workflow:run).
     */
    public function executeScheduled(Workflow $workflow, ?Contact $contact, ?Deal $deal): void
    {
        $workspace = $workflow->workspace ?? Workspace::query()->find($workflow->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $this->execute($workspace, $workflow, $contact, $deal);
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
                if ((int) ($workflow->delay_minutes ?? 0) > 0) {
                    $this->schedule($workspace, $workflow, $contact, $deal);

                    continue;
                }

                $this->execute($workspace, $workflow, $contact, $deal);
            } catch (Throwable) {
                // Record writes must not fail because a workflow action could not run.
            }
        }
    }

    private function schedule(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal): void
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
            'contact_id' => $contact?->id,
            'deal_id' => $deal?->id,
            'run_at' => $runAt,
            'status' => WorkflowExecution::STATUS_PENDING,
        ]);
    }

    private function execute(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal): void
    {
        $useThen = ! $workflow->hasCondition() || $this->conditionPasses($workspace, $workflow, $contact, $deal);
        $action = $useThen ? $workflow->action : $workflow->else_action;
        $config = $useThen ? $workflow->config() : $workflow->elseConfig();

        if (! filled($action)) {
            return;
        }

        match ($action) {
            Workflow::ACTION_CREATE_TASK => $this->createTask($workspace, $workflow, $contact, $deal, $config),
            Workflow::ACTION_ENROLL_SEQUENCE => $this->enrollSequence($workspace, $config, $contact),
            Workflow::ACTION_SEND_WEBHOOK => $this->sendWebhook($workflow, $config, $contact, $deal),
            Workflow::ACTION_SET_PROPERTY => $this->setProperty($workspace, $config, $contact, $deal),
            Workflow::ACTION_ASSIGN_OWNER => $this->assignOwner($config, $contact, $deal),
            Workflow::ACTION_CREATE_DEAL => $this->createDeal($workspace, $config, $contact),
            Workflow::ACTION_SEND_EMAIL => $this->sendEmail($workspace, $config, $contact),
            Workflow::ACTION_NOTIFY_USER => $this->notifyUser($workspace, $config, $contact, $deal),
            default => null,
        };
    }

    private function conditionPasses(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal): bool
    {
        return $workflow->compare($this->leftValue($workspace, $workflow, $contact, $deal));
    }

    private function leftValue(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal): mixed
    {
        $field = (string) $workflow->condition_field;

        if ($field === Workflow::CONDITION_DEAL_AMOUNT) {
            return $deal?->amountDzd();
        }

        if ($field === Workflow::CONDITION_DEAL_STAGE) {
            return $this->dealStageLeft($deal, (string) ($workflow->condition_value ?? ''));
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
     */
    private function createTask(Workspace $workspace, Workflow $workflow, ?Contact $contact, ?Deal $deal, array $config): void
    {
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

    /**
     * @param  array<string, mixed>  $config
     */
    private function enrollSequence(Workspace $workspace, array $config, ?Contact $contact): void
    {
        if (! $contact) {
            return;
        }

        $sequenceId = $config['sequence_id'] ?? null;

        $sequence = filled($sequenceId)
            ? Sequence::query()->forWorkspace($workspace)->whereKey($sequenceId)->first()
            : Sequence::query()->forWorkspace($workspace)->orderBy('id')->first();

        if (! $sequence) {
            return;
        }

        $this->enrollment->enroll($workspace, $sequence, $contact);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function sendWebhook(Workflow $workflow, array $config, ?Contact $contact, ?Deal $deal): void
    {
        $url = trim((string) ($config['url'] ?? ''));

        if (! $this->webhookUrlAllowed($url)) {
            return;
        }

        Http::timeout(8)
            ->acceptJson()
            ->asJson()
            ->post($url, [
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
            ]);
    }

    private function webhookUrlAllowed(string $url): bool
    {
        if ($url === '' || filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true);
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

    /**
     * @param  array<string, mixed>  $config
     */
    private function setProperty(Workspace $workspace, array $config, ?Contact $contact, ?Deal $deal): void
    {
        $entity = (string) ($config['entity'] ?? 'contact');
        $field = (string) ($config['field'] ?? '');
        $value = $config['value'] ?? null;

        if ($field === '' || $value === null) {
            return;
        }

        if (str_starts_with($field, 'attr.')) {
            $key = substr($field, 5);
            $record = match ($entity) {
                'deal' => $deal,
                'contact' => $contact,
                default => null,
            };

            if (! $record) {
                return;
            }

            $this->attributes->saveValues($workspace, $entity, $record->id, [$key => $value]);

            return;
        }

        if ($entity === 'contact' && $contact && in_array($field, ['city', 'wilaya', 'source'], true)) {
            $contact->forceFill([$field => $value])->save();
        }

        if ($entity === 'deal' && $deal && $field === 'title') {
            $deal->forceFill(['title' => $value])->save();
        }
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function assignOwner(array $config, ?Contact $contact, ?Deal $deal): void
    {
        $ownerId = isset($config['owner_id']) ? (int) $config['owner_id'] : null;

        if (! $ownerId) {
            return;
        }

        $entity = (string) ($config['entity'] ?? 'contact');

        if ($entity === 'deal' && $deal) {
            $deal->forceFill(['owner_id' => $ownerId])->save();

            return;
        }

        if ($contact) {
            $contact->forceFill(['owner_id' => $ownerId])->save();
        }
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function createDeal(Workspace $workspace, array $config, ?Contact $contact): void
    {
        if (! $contact) {
            return;
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
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function sendEmail(Workspace $workspace, array $config, ?Contact $contact): void
    {
        if (! $contact?->email) {
            return;
        }

        $mailbox = Mailbox::query()
            ->forWorkspace($workspace)
            ->where('enabled', true)
            ->orderByDesc('is_default')
            ->first();

        if (! $mailbox) {
            return;
        }

        Mail::raw(
            (string) ($config['body'] ?? 'Follow up from EvoSales'),
            fn ($message) => $message
                ->to($contact->email)
                ->subject((string) ($config['subject'] ?? 'EvoSales follow-up'))
                ->from($mailbox->from_address, $mailbox->from_name ?? 'EvoSales'),
        );
    }

    /**
     * @param  array<string, mixed>  $config
     */
    private function notifyUser(Workspace $workspace, array $config, ?Contact $contact, ?Deal $deal): void
    {
        $userId = isset($config['user_id']) ? (int) $config['user_id'] : ($deal?->owner_id ?? $contact?->owner_id);

        if (! $userId) {
            return;
        }

        $this->activities->record($workspace, [
            'type' => 'notification',
            'subject' => (string) ($config['subject'] ?? 'Workflow notification'),
            'body' => (string) ($config['body'] ?? ''),
            'owner_id' => $userId,
            'contact_id' => $contact?->id,
            'deal_id' => $deal?->id,
            'company_id' => $deal?->company_id ?? $contact?->company_id,
            'meta' => ['source' => 'workflow'],
        ]);
    }
}
