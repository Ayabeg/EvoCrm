<?php

namespace App\Services\Ai;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Message;
use App\Models\Quote;
use App\Models\Stage;
use App\Models\Thread;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Models\Workspace;
use App\Services\Activation\WorkspaceActivationService;
use App\Services\Crm\ActivityWorkQueueQuery;
use App\Services\Crm\CommandSearch;
use App\Services\Crm\DealAttentionEvaluator;
use App\Services\Crm\DealBoardForecast;
use App\Services\Crm\WorkflowExecutionRedactor;
use App\Support\Integrations;
use Illuminate\Support\Facades\Gate;

/**
 * Authorize first, then project bounded facts. Frontend dumps are never read.
 *
 * Query strategy: workspace-scoped `select` of allowlisted columns, `limit` on
 * latest rows, `EXISTS` / `COUNT` for workspace flags. No full CRM preload,
 * no N+1 loops over workspace collections.
 */
class AskEvoContextResolver
{
    public const MESSAGE_LIMIT = 5;

    public const MESSAGE_CHARS = 240;

    public const EXECUTION_LIMIT = 3;

    public const ATTENTION_LIMIT = 3;

    public const SEARCH_HITS = 6;

    public function __construct(
        private AskEvoSecretRedactor $redactor,
        private AskEvoSuggestions $suggestions,
        private WorkspaceActivationService $activation,
        private DealAttentionEvaluator $attention,
        private ActivityWorkQueueQuery $workQueue,
        private CommandSearch $search,
        private WorkflowExecutionRedactor $workflowRedactor,
    ) {}

    public function resolve(User $user, AskEvoContextRequest $request): AskEvoContext
    {
        $workspace = $user->workspace;

        if (! $workspace instanceof Workspace) {
            return $this->unavailable(AskEvoContextKind::Workspace, 'unauthorized', 'No workspace is available.');
        }

        $kind = $request->resolvedKind();

        return match ($kind) {
            AskEvoContextKind::Contact => $this->contact($user, $workspace, $request->entityId),
            AskEvoContextKind::Company => $this->company($user, $workspace, $request->entityId),
            AskEvoContextKind::Deal => $this->deal($user, $workspace, $request->entityId),
            AskEvoContextKind::Quote => $this->quote($user, $workspace, $request->entityId),
            AskEvoContextKind::InboxConversation => $this->inbox($user, $workspace, $request->entityId),
            AskEvoContextKind::Activity => $this->activity($user, $workspace, $request->entityId),
            AskEvoContextKind::Automation => $this->automation($user, $workspace, $request->entityId),
            AskEvoContextKind::Dashboard => $this->dashboard($user, $workspace),
            AskEvoContextKind::Activation => $this->activation($user, $workspace),
            AskEvoContextKind::Workspace => $this->workspace($user, $workspace, $request),
        };
    }

    /**
     * @param  list<array{type: string, id: int, label: string, href: string, recordRef?: array{type: string, id: int}}>  $hits
     */
    public function withSearchHits(AskEvoContext $context, array $hits): AskEvoContext
    {
        if ($hits === [] || $context->kind !== AskEvoContextKind::Workspace) {
            return $context;
        }

        $facts = $context->facts;
        $labels = [];

        foreach (array_slice($hits, 0, self::SEARCH_HITS) as $hit) {
            $labels[] = ($hit['type'] ?? 'record').': '.($hit['label'] ?? '');
        }

        $facts[] = [
            'label' => 'Matching records',
            'value' => implode('; ', array_filter($labels)),
        ];

        return new AskEvoContext(
            $context->kind,
            $context->label,
            $context->scopeKey,
            $context->entityType,
            $context->entityId,
            $this->redactor->facts($facts),
            $context->suggestions,
            $context->actions,
            $context->groundingNote,
            $context->unavailableCode,
            $context->note,
        );
    }

    private function contact(User $user, Workspace $workspace, ?int $id): AskEvoContext
    {
        $contact = $this->findAuthorized(
            Contact::query()->forWorkspace($workspace)->select([
                'id', 'workspace_id', 'company_id', 'owner_id',
                'first_name', 'last_name', 'email', 'phone', 'phone_e164',
                'city', 'wilaya', 'last_activity_at',
            ]),
            $id,
            $user,
        );

        if (! $contact instanceof Contact) {
            return $this->unavailable(AskEvoContextKind::Contact, 'unauthorized', 'This contact is not available.');
        }

        $contact->load([
            'company:id,workspace_id,name',
            'owner:id,name',
        ]);

        $openDeals = Deal::query()
            ->forWorkspace($workspace)
            ->where('contact_id', $contact->id)
            ->whereHas('stage', fn ($stage) => $stage->where('is_won', false)->where('is_lost', false))
            ->count();

        $latestDeal = Deal::query()
            ->forWorkspace($workspace)
            ->where('contact_id', $contact->id)
            ->orderByDesc('id')
            ->value('title');

        $lastActivity = $this->latestActivityLine($workspace, 'contact_id', (int) $contact->id);

        return $this->ok(
            $user,
            AskEvoContextKind::Contact,
            $contact->displayName(),
            (int) $contact->id,
            array_filter([
                $this->fact('Name', $contact->displayName()),
                $this->fact('Email', $contact->email),
                $this->fact('Phone', $contact->phone_e164 ?? $contact->phone),
                $this->fact('City', $contact->city),
                $this->fact('Wilaya', $contact->wilaya),
                $this->fact('Company', $contact->company?->name),
                $this->fact('Owner', $contact->owner?->name),
                $this->fact('Open deals', (string) $openDeals),
                $this->fact('Latest deal', is_string($latestDeal) ? $latestDeal : null),
                $this->fact('Last activity', $lastActivity),
            ]),
            $this->recordActions('contact', (int) $contact->id, $user),
        );
    }

    private function company(User $user, Workspace $workspace, ?int $id): AskEvoContext
    {
        $company = $this->findAuthorized(
            Company::query()->forWorkspace($workspace)->select([
                'id', 'workspace_id', 'owner_id', 'name', 'domain',
                'industry', 'phone', 'city', 'wilaya',
            ]),
            $id,
            $user,
        );

        if (! $company instanceof Company) {
            return $this->unavailable(AskEvoContextKind::Company, 'unauthorized', 'This company is not available.');
        }

        $company->load(['owner:id,name']);

        $contactCount = Contact::query()->forWorkspace($workspace)->where('company_id', $company->id)->count();
        $openDeals = Deal::query()
            ->forWorkspace($workspace)
            ->where('company_id', $company->id)
            ->whereHas('stage', fn ($stage) => $stage->where('is_won', false)->where('is_lost', false))
            ->count();
        $latestDeal = Deal::query()
            ->forWorkspace($workspace)
            ->where('company_id', $company->id)
            ->orderByDesc('id')
            ->value('title');

        return $this->ok(
            $user,
            AskEvoContextKind::Company,
            (string) $company->name,
            (int) $company->id,
            array_filter([
                $this->fact('Name', $company->name),
                $this->fact('Domain', $company->domain),
                $this->fact('Industry', $company->industry),
                $this->fact('Phone', $company->phone),
                $this->fact('City', $company->city),
                $this->fact('Wilaya', $company->wilaya),
                $this->fact('Owner', $company->owner?->name),
                $this->fact('Contacts', (string) $contactCount),
                $this->fact('Open deals', (string) $openDeals),
                $this->fact('Latest deal', is_string($latestDeal) ? $latestDeal : null),
                $this->fact('Last activity', $this->latestActivityLine($workspace, 'company_id', (int) $company->id)),
            ]),
            $this->recordActions('company', (int) $company->id, $user),
        );
    }

    private function deal(User $user, Workspace $workspace, ?int $id): AskEvoContext
    {
        $deal = $this->findAuthorized(
            Deal::query()->forWorkspace($workspace)->select([
                'id', 'workspace_id', 'contact_id', 'company_id', 'owner_id',
                'stage_id', 'title', 'amount_cents', 'currency', 'next_step',
                'close_date', 'last_activity_at',
            ]),
            $id,
            $user,
        );

        if (! $deal instanceof Deal) {
            return $this->unavailable(AskEvoContextKind::Deal, 'unauthorized', 'This deal is not available.');
        }

        $deal->load([
            'stage:id,name,slug,is_won,is_lost',
            'contact:id,workspace_id,first_name,last_name',
            'company:id,workspace_id,name',
            'owner:id,name',
        ]);

        $stage = $deal->stage instanceof Stage ? $deal->stage : null;
        $amount = (int) $deal->amount_cents > 0
            ? number_format(((int) $deal->amount_cents) / 100, 0, ',', ' ').' '.($deal->currency ?: 'DZD')
            : null;

        return $this->ok(
            $user,
            AskEvoContextKind::Deal,
            (string) $deal->title,
            (int) $deal->id,
            array_filter([
                $this->fact('Title', $deal->title),
                $this->fact('Stage', $stage?->name),
                $this->fact('Amount', $amount),
                $this->fact('Probability', $stage ? DealBoardForecast::probabilityFor($stage).'%' : null),
                $this->fact('Contact', $deal->contact instanceof Contact ? $deal->contact->displayName() : null),
                $this->fact('Company', $deal->company?->name),
                $this->fact('Owner', $deal->owner?->name),
                $this->fact('Next step', $deal->next_step),
                $this->fact('Close date', $deal->close_date?->toDateString()),
                $this->fact('Last activity', $this->latestActivityLine($workspace, 'deal_id', (int) $deal->id)),
            ]),
            $this->recordActions('deal', (int) $deal->id, $user),
        );
    }

    private function quote(User $user, Workspace $workspace, ?int $id): AskEvoContext
    {
        $quote = $this->findAuthorized(
            Quote::query()->forWorkspace($workspace)->select([
                'id', 'workspace_id', 'deal_id', 'status', 'currency',
                'total_cents', 'expires_at', 'sent_at', 'accepted_at', 'revoked_at',
            ]),
            $id,
            $user,
        );

        if (! $quote instanceof Quote) {
            return $this->unavailable(AskEvoContextKind::Quote, 'unauthorized', 'This quote is not available.');
        }

        $quote->load(['deal:id,workspace_id,title']);
        $itemCount = $quote->items()->count();
        $total = number_format(((int) $quote->total_cents) / 100, 0, ',', ' ').' '.($quote->currency ?: 'DZD');

        return $this->ok(
            $user,
            AskEvoContextKind::Quote,
            $quote->deal?->title ? 'Quote · '.$quote->deal->title : 'Quote #'.$quote->id,
            (int) $quote->id,
            array_filter([
                $this->fact('Status', (string) $quote->status),
                $this->fact('Total', $total),
                $this->fact('Currency', (string) ($quote->currency ?: 'DZD')),
                $this->fact('Deal', $quote->deal?->title),
                $this->fact('Line items', (string) $itemCount),
                $this->fact('Sent at', $quote->sent_at?->toDateString()),
                $this->fact('Accepted at', $quote->accepted_at?->toDateString()),
                $this->fact('Expires at', $quote->expires_at?->toDateString()),
                $this->fact('Revoked', $quote->revoked_at ? 'yes' : 'no'),
            ]),
            [[
                'id' => 'open-quote',
                'label' => 'Open quote',
                'href' => '/crm/quotes/'.$quote->id,
            ]],
            'Totals are the stored quote totals. Do not recalculate.',
        );
    }

    private function inbox(User $user, Workspace $workspace, ?int $id): AskEvoContext
    {
        if (! $id) {
            return $this->ok(
                $user,
                AskEvoContextKind::Workspace,
                $workspace->name ?: 'Workspace',
                null,
                $this->workspaceFlags($workspace),
                [],
                'Facts from this workspace only.',
                null,
                'Inbox embed has no thread identity. Open a native conversation to ask about a thread.',
            );
        }

        $thread = Thread::query()
            ->forWorkspace($workspace)
            ->select(['id', 'workspace_id', 'contact_id', 'channel_id', 'subject', 'status', 'last_message_at'])
            ->find($id);

        if (! $thread instanceof Thread || (int) $thread->workspace_id !== (int) $workspace->id) {
            return $this->unavailable(AskEvoContextKind::InboxConversation, 'unauthorized', 'This conversation is not available.');
        }

        $thread->load([
            'channel:id,workspace_id,name,type,status',
            'contact:id,workspace_id,first_name,last_name',
        ]);

        if ($thread->channel && (int) $thread->channel->workspace_id !== (int) $workspace->id) {
            return $this->unavailable(AskEvoContextKind::InboxConversation, 'unauthorized', 'This conversation is not available.');
        }

        $contact = $thread->contact;
        $contactLabel = null;
        if ($contact instanceof Contact && Gate::forUser($user)->allows('view', $contact)) {
            $contactLabel = $contact->displayName();
        }

        $messages = Message::query()
            ->forWorkspace($workspace)
            ->where('thread_id', $thread->id)
            ->orderByDesc('id')
            ->limit(self::MESSAGE_LIMIT)
            ->get(['id', 'workspace_id', 'direction', 'type', 'body', 'created_at', 'status']);

        $lines = $messages
            ->reverse()
            ->values()
            ->map(function (Message $message): string {
                $body = $this->redactor->redactText(mb_substr(trim((string) $message->body), 0, self::MESSAGE_CHARS));

                return trim(($message->created_at?->toDateTimeString() ?? '').' '.$message->direction.' '.$body);
            })
            ->filter()
            ->implode(' | ');

        $channelType = $thread->channel?->type;
        $channelName = $thread->channel?->name;

        return $this->ok(
            $user,
            AskEvoContextKind::InboxConversation,
            (string) ($thread->subject ?: ($contactLabel ?: 'Conversation #'.$thread->id)),
            (int) $thread->id,
            array_filter([
                $this->fact('Subject', $thread->subject),
                $this->fact('Status', $thread->status),
                $this->fact('Channel', $channelName),
                $this->fact('Channel type', $channelType instanceof \App\Enums\ChannelType
                    ? $channelType->value
                    : (is_string($channelType) ? $channelType : null)),
                $this->fact('Contact', $contactLabel),
                $this->fact('Recent messages', $lines !== '' ? $lines : 'none'),
            ]),
            [[
                'id' => 'open-inbox',
                'label' => 'Open conversation',
                'href' => '/inbox?thread='.$thread->id,
            ]],
            'Messages are bounded and channel credentials are omitted.',
        );
    }

    private function activity(User $user, Workspace $workspace, ?int $id): AskEvoContext
    {
        $activity = $this->findAuthorized(
            Activity::query()->forWorkspace($workspace)->select([
                'id', 'workspace_id', 'type', 'subject', 'due_at', 'done',
                'completed_at', 'owner_id', 'contact_id', 'deal_id', 'company_id',
            ]),
            $id,
            $user,
        );

        if (! $activity instanceof Activity) {
            return $this->unavailable(AskEvoContextKind::Activity, 'unauthorized', 'This activity is not available.');
        }

        $activity->load([
            'owner:id,name',
            'contact:id,workspace_id,first_name,last_name',
            'deal:id,workspace_id,title',
            'company:id,workspace_id,name',
        ]);

        $label = trim((string) ($activity->subject ?: $activity->type));

        return $this->ok(
            $user,
            AskEvoContextKind::Activity,
            $label !== '' ? $label : 'Activity #'.$activity->id,
            (int) $activity->id,
            array_filter([
                $this->fact('Type', (string) $activity->type),
                $this->fact('Subject', $activity->subject),
                $this->fact('Due', $activity->due_at?->toDateTimeString()),
                $this->fact('Done', $activity->done ? 'yes' : 'no'),
                $this->fact('Owner', $activity->owner?->name),
                $this->fact('Contact', $activity->contact instanceof Contact ? $activity->contact->displayName() : null),
                $this->fact('Deal', $activity->deal?->title),
                $this->fact('Company', $activity->company?->name),
            ]),
            [[
                'id' => 'open-activity',
                'label' => 'Open activities',
                'href' => '/crm/activities',
            ]],
        );
    }

    private function automation(User $user, Workspace $workspace, ?int $id): AskEvoContext
    {
        if (! $id) {
            return $this->unavailable(AskEvoContextKind::Automation, 'empty', 'No workflow is selected.');
        }

        $workflow = Workflow::query()
            ->forWorkspace($workspace)
            ->select([
                'id', 'workspace_id', 'name', 'trigger', 'action', 'active',
                'condition_field', 'condition_operator', 'condition_value',
                'else_action', 'delay_minutes',
            ])
            ->find($id);

        if (! $workflow instanceof Workflow || (int) $workflow->workspace_id !== (int) $workspace->id) {
            return $this->unavailable(AskEvoContextKind::Automation, 'unauthorized', 'This workflow is not available.');
        }

        $runs = WorkflowExecution::query()
            ->forWorkspace($workspace)
            ->where('workflow_id', $workflow->id)
            ->orderByDesc('id')
            ->limit(self::EXECUTION_LIMIT)
            ->get(['id', 'workspace_id', 'status', 'run_at', 'action', 'error_summary']);

        $history = $runs->map(function (WorkflowExecution $execution): string {
            $error = $this->workflowRedactor->redactError($execution->error_summary);

            return trim(
                ($execution->run_at?->toDateTimeString() ?? '').
                ' '.$execution->status.
                ($error ? ' '.$error : ''),
            );
        })->implode(' | ');

        $condition = filled($workflow->condition_field)
            ? trim((string) $workflow->condition_field.' '.(string) $workflow->condition_operator.' '.(string) $workflow->condition_value)
            : null;

        return $this->ok(
            $user,
            AskEvoContextKind::Automation,
            (string) $workflow->name,
            (int) $workflow->id,
            array_filter([
                $this->fact('Name', $workflow->name),
                $this->fact('Active', $workflow->active ? 'yes' : 'no'),
                $this->fact('Trigger', (string) $workflow->trigger),
                $this->fact('Action', (string) $workflow->action),
                $this->fact('Condition', $condition),
                $this->fact('Else action', $workflow->else_action),
                $this->fact('Delay minutes', $workflow->delay_minutes !== null ? (string) $workflow->delay_minutes : null),
                $this->fact('Recent runs', $history !== '' ? $history : 'none'),
            ]),
            $user->canPermission('automation.manage') ? [[
                'id' => 'open-workflow',
                'label' => 'Open automation',
                'href' => '/crm/workflows',
            ]] : [],
            'Explain structure and history only. Do not retry or edit the workflow.',
        );
    }

    private function dashboard(User $user, Workspace $workspace): AskEvoContext
    {
        $pipeline = $workspace->defaultPipeline();
        $activation = $this->activation->getState($user, $pipeline, Integrations::forWorkspace($workspace));
        $attention = $this->attention->queue(
            Deal::query()->forWorkspace($workspace)->where('pipeline_id', $pipeline->id),
            self::ATTENTION_LIMIT,
        );
        $work = $this->workQueue->dashboardWork($user, 0, DealAttentionEvaluator::now());
        $openDeals = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->whereHas('stage', fn ($stage) => $stage->where('is_won', false)->where('is_lost', false))
            ->count();

        $attentionLabels = collect($attention)
            ->take(self::ATTENTION_LIMIT)
            ->map(function (mixed $item): string {
                if (! is_array($item)) {
                    return '';
                }

                $title = isset($item['title']) && is_string($item['title']) ? $item['title'] : '';
                $label = is_array($item['primary'] ?? null) && isset($item['primary']['label'])
                    ? (string) $item['primary']['label']
                    : '';

                return trim($title.($label !== '' ? ' ('.$label.')' : ''));
            })
            ->filter()
            ->implode('; ');

        $first = trim(explode(' ', (string) $user->name, 2)[0]);
        $counts = is_array($work['counts'] ?? null) ? $work['counts'] : [];

        return $this->ok(
            $user,
            AskEvoContextKind::Dashboard,
            'Home',
            null,
            array_filter([
                $this->fact('Greeting name', $first !== '' ? $first : null),
                $this->fact('Open deals', (string) $openDeals),
                $this->fact('Attention', $attentionLabels !== '' ? $attentionLabels : 'none'),
                $this->fact('Overdue activities', (string) ($counts['overdue'] ?? 0)),
                $this->fact('Today activities', (string) ($counts['today'] ?? 0)),
                $this->fact('Upcoming activities', (string) ($counts['upcoming'] ?? 0)),
                $this->fact('Activation complete', ! empty($activation['activated']) ? 'yes' : 'no'),
                $this->fact('Activation progress', $this->activationProgress($activation)),
            ]),
            [
                ['id' => 'open-home', 'label' => 'Open Home', 'href' => '/dashboard'],
                ['id' => 'open-overdue', 'label' => 'Overdue activities', 'href' => '/crm/activities?group=overdue'],
            ],
            'Home facts only. No forecasts or invented analytics.',
        );
    }

    private function activation(User $user, Workspace $workspace): AskEvoContext
    {
        $state = $this->activation->getState($user, $workspace->defaultPipeline(), Integrations::forWorkspace($workspace));
        $integrations = Integrations::forWorkspace($workspace)['activation'] ?? [];
        $steps = collect(is_array($state['steps'] ?? null) ? $state['steps'] : [])
            ->map(function (mixed $step): string {
                if (! is_array($step)) {
                    return '';
                }

                $id = isset($step['id']) ? (string) $step['id'] : '';
                $complete = ! empty($step['complete']) ? 'complete' : 'open';

                return $id !== '' ? $id.':'.$complete : '';
            })
            ->filter()
            ->implode(', ');

        return $this->ok(
            $user,
            AskEvoContextKind::Activation,
            'Workspace activation',
            null,
            array_filter([
                $this->fact('Activated', ! empty($state['activated']) ? 'yes' : 'no'),
                $this->fact('Dismissed', ! empty($state['dismissed']) ? 'yes' : 'no'),
                $this->fact('Progress', $this->activationProgress($state)),
                $this->fact('Steps', $steps !== '' ? $steps : null),
                $this->fact('Mailbox connected', ! empty($integrations['has_mailbox']) ? 'yes' : 'no'),
                $this->fact('Meta connected', ! empty($integrations['has_meta_configured']) ? 'yes' : 'no'),
                $this->fact('Communication channel', ! empty($integrations['has_connected_communication_channel']) ? 'yes' : 'no'),
                $this->fact('Any integration', ! empty($integrations['has_configured_integration']) ? 'yes' : 'no'),
            ]),
            [[
                'id' => 'open-activation',
                'label' => 'Open Home checklist',
                'href' => '/dashboard',
            ]],
            'Activation booleans and step IDs only. Ask Evo cannot mark steps complete.',
        );
    }

    private function workspace(User $user, Workspace $workspace, AskEvoContextRequest $request): AskEvoContext
    {
        $note = null;
        if ($request->page === 'inbox' && ! $request->entityId) {
            $note = 'Inbox embed is not a supported Ask Evo context. Open a native conversation.';
        }

        if ($request->page === 'qrd' && $request->entityType && ! AskEvoContextKind::tryFrom((string) $request->entityType)?->isSupportedRecord()) {
            $note = 'This peek is not a supported Ask Evo record. Using workspace facts.';
        }

        return $this->ok(
            $user,
            AskEvoContextKind::Workspace,
            $workspace->name ?: 'Workspace',
            null,
            $this->workspaceFlags($workspace),
            $user->canPermission('crm.edit') ? [
                ['id' => 'create-contact', 'label' => 'Create contact', 'href' => '/crm/contacts?create=1'],
            ] : [],
            'Workspace flags only. Search uses authorized Command search — not a CRM dump.',
            null,
            $note,
        );
    }

    /**
     * @return list<array{label: string, value: string}>
     */
    private function workspaceFlags(Workspace $workspace): array
    {
        return array_values(array_filter([
            $this->fact('Workspace', $workspace->name),
            $this->fact('Has contacts', Contact::query()->forWorkspace($workspace)->exists() ? 'yes' : 'no'),
            $this->fact('Has companies', Company::query()->forWorkspace($workspace)->exists() ? 'yes' : 'no'),
            $this->fact('Has deals', Deal::query()->forWorkspace($workspace)->exists() ? 'yes' : 'no'),
            $this->fact('Has activities', Activity::query()->forWorkspace($workspace)->exists() ? 'yes' : 'no'),
        ]));
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function activationProgress(array $state): ?string
    {
        $progress = is_array($state['progress'] ?? null) ? $state['progress'] : [];
        $completed = $progress['completed'] ?? $progress['core_completed'] ?? null;
        $total = $progress['total'] ?? $progress['core_total'] ?? null;

        if ($completed === null || $total === null) {
            return null;
        }

        return $completed.'/'.$total;
    }

    /**
     * @return list<array{id: string, label: string, href: string}>
     */
    private function recordActions(string $type, int $id, User $user): array
    {
        $hrefs = [
            'contact' => '/crm/contacts/'.$id,
            'company' => '/crm/companies/'.$id,
            'deal' => '/crm/deals/'.$id,
        ];

        $actions = [[
            'id' => 'open-'.$type,
            'label' => 'Open record',
            'href' => $hrefs[$type] ?? '/dashboard',
        ]];

        if ($type === 'contact' && $user->canPermission('crm.edit')) {
            $actions[] = [
                'id' => 'draft-email',
                'label' => 'Draft email (confirm)',
                'href' => '/crm/contacts/'.$id,
            ];
        }

        return $actions;
    }

    private function latestActivityLine(Workspace $workspace, string $column, int $id): ?string
    {
        $activity = Activity::query()
            ->forWorkspace($workspace)
            ->where($column, $id)
            ->orderByDesc('id')
            ->first(['id', 'workspace_id', 'type', 'subject', 'created_at']);

        if (! $activity instanceof Activity) {
            return 'none';
        }

        $label = trim((string) ($activity->subject ?: $activity->type));

        return trim(($activity->created_at?->diffForHumans() ?? '').' '.$activity->type.' '.$label);
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  \Illuminate\Database\Eloquent\Builder<TModel>  $query
     * @return TModel|null
     */
    private function findAuthorized(\Illuminate\Database\Eloquent\Builder $query, ?int $id, User $user): mixed
    {
        if (! $id) {
            return null;
        }

        $record = $query->find($id);

        if (! $record) {
            return null;
        }

        if ((int) $record->getAttribute('workspace_id') !== (int) $user->workspace_id) {
            return null;
        }

        if (! Gate::forUser($user)->allows('view', $record)) {
            return null;
        }

        return $record;
    }

    /**
     * @return array{label: string, value: string}|null
     */
    private function fact(string $label, mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);

        if ($text === '') {
            return null;
        }

        return ['label' => $label, 'value' => $text];
    }

    /**
     * @param  list<array{label: string, value: string}>  $facts
     * @param  list<array{id: string, label: string, href: string}>  $actions
     */
    private function ok(
        User $user,
        AskEvoContextKind $kind,
        string $label,
        ?int $entityId,
        array $facts,
        array $actions,
        string $grounding = 'Answer only from these authorized facts.',
        ?string $unavailable = null,
        ?string $note = null,
    ): AskEvoContext {
        $capabilities = collect(array_keys(config('permissions.capabilities', [])))
            ->filter(fn (string $permission): bool => $user->canPermission($permission))
            ->values()
            ->all();

        return new AskEvoContext(
            $kind,
            $label,
            $this->scopeKey($kind, $entityId),
            $kind->requiresEntityId() ? $kind->value : null,
            $entityId,
            $this->redactor->facts(array_values($facts)),
            $this->suggestions->for($kind, $capabilities),
            $actions,
            $grounding,
            $unavailable,
            $note,
        );
    }

    private function unavailable(AskEvoContextKind $kind, string $code, string $message): AskEvoContext
    {
        return new AskEvoContext(
            $kind,
            'Unavailable',
            $this->scopeKey($kind, null),
            $kind->requiresEntityId() ? $kind->value : null,
            null,
            [],
            [],
            [],
            $message,
            $code,
            null,
        );
    }

    private function scopeKey(AskEvoContextKind $kind, ?int $entityId): string
    {
        return $entityId ? $kind->value.':'.$entityId : $kind->value;
    }
}
