<?php

namespace App\Services\Crm;

use App\Enums\WorkspaceRole;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WorkflowExecution;
use App\Models\Workspace;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class WorkflowExecutionPresenter
{
    public const PER_PAGE = 25;

    public function __construct(
        private WorkflowExecutionRedactor $redactor,
    ) {}

    /**
     * @return array{
     *     data: list<array<string, mixed>>,
     *     paginator: array{page: int, last_page: int, per_page: int, total: int, prev_href: string|null, next_href: string|null},
     *     filters: array{workflow_id: int|null, status: string|null},
     *     metrics: array{pending: int, running: int, completed: int, failed: int, cancelled: int},
     *     selected: array<string, mixed>|null,
     *     contract: array<string, mixed>
     * }
     */
    public function page(Workspace $workspace, User $user, Request $request): array
    {
        $workflowId = $request->filled('history_workflow_id')
            ? $request->integer('history_workflow_id')
            : null;
        $status = $request->string('history_status')->toString();
        $status = in_array($status, WorkflowExecution::STATUSES, true) ? $status : null;
        $page = max(1, $request->integer('history_page', 1));

        $query = WorkflowExecution::query()
            ->forWorkspace($workspace)
            ->with([
                'workflow:id,name,active',
                'contact:id,first_name,last_name,email,owner_id,workspace_id',
                'deal:id,title,owner_id,workspace_id',
                'ticket:id,number,subject,workspace_id',
            ])
            ->latest('run_at')
            ->latest('id');

        if ($workflowId) {
            $query->where('workflow_id', $workflowId);
        }

        if ($status !== null) {
            $query->where('status', $status);
        }

        $statusCounts = WorkflowExecution::query()
            ->forWorkspace($workspace)
            ->selectRaw('status, COUNT(*) as execution_count')
            ->groupBy('status')
            ->pluck('execution_count', 'status');

        /** @var LengthAwarePaginator<int, WorkflowExecution> $paginator */
        $paginator = $query->paginate(self::PER_PAGE, ['*'], 'history_page', $page);

        $rows = collect($paginator->items())
            ->map(fn (WorkflowExecution $execution): array => $this->present($execution, $user, false))
            ->values()
            ->all();

        $selectedId = $request->integer('execution');
        $selected = null;

        if ($selectedId > 0) {
            $onPage = collect($paginator->items())->firstWhere('id', $selectedId);
            $model = $onPage instanceof WorkflowExecution
                ? $onPage
                : WorkflowExecution::query()
                    ->forWorkspace($workspace)
                    ->with(['workflow', 'contact', 'deal', 'ticket'])
                    ->whereKey($selectedId)
                    ->first();

            $selected = $model instanceof WorkflowExecution
                ? $this->present($model, $user, true)
                : null;
        }

        return [
            'data' => $rows,
            'paginator' => [
                'page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'prev_href' => $paginator->currentPage() > 1
                    ? $this->historyHrefFromIds(
                        $selectedId ?: null,
                        $workflowId,
                        $status,
                        $paginator->currentPage() - 1,
                    )
                    : null,
                'next_href' => $paginator->currentPage() < $paginator->lastPage()
                    ? $this->historyHrefFromIds(
                        $selectedId ?: null,
                        $workflowId,
                        $status,
                        $paginator->currentPage() + 1,
                    )
                    : null,
            ],
            'filters' => [
                'workflow_id' => $workflowId ?: null,
                'status' => $status,
            ],
            'metrics' => collect(WorkflowExecution::STATUSES)
                ->mapWithKeys(fn (string $state) => [$state => (int) ($statusCounts[$state] ?? 0)])
                ->all(),
            'selected' => $selected,
            'contract' => $this->contract(),
        ];
    }

    /**
     * Structured facts P24 can consume later. No AI summary.
     *
     * @return array<string, mixed>
     */
    public function present(WorkflowExecution $execution, User $user, bool $detail): array
    {
        $canViewCrm = $user->canPermission('crm.view');
        $contact = $this->presentContact($execution->contact, $canViewCrm);
        $deal = $this->presentDeal($execution->deal, $user, $canViewCrm);
        $ticket = $this->presentTicket($execution->ticket, $canViewCrm);

        $parameters = $this->redactor->redactParameters(
            is_array($execution->action_parameters) ? $execution->action_parameters : []
        );
        $result = $this->redactor->redactResult(
            is_array($execution->result_summary) ? $execution->result_summary : null
        );
        $error = $this->redactor->redactError($execution->error_summary);

        if (! $canViewCrm) {
            $parameters = $this->stripPiiParameters($parameters);
            $result = $result === null ? null : $this->stripPiiParameters($result);
            $error = is_string($error) ? $this->redactor->hideRecordPii($error) : null;
        }

        $startedAt = $execution->started_at;
        $finishedAt = $execution->finished_at;
        $durationSeconds = ($startedAt && $finishedAt)
            ? $startedAt->diffInSeconds($finishedAt)
            : null;

        $row = [
            'id' => $execution->id,
            'workflow_id' => $execution->workflow_id,
            'workflow_name' => $execution->workflow_name ?: ($execution->workflow?->name ?? 'Workflow'),
            'workflow_active' => (bool) ($execution->workflow?->active),
            'status' => $execution->status,
            'status_label' => $this->statusLabel($execution),
            'is_delayed' => ((int) $execution->delay_minutes) > 0,
            'is_terminal' => $execution->isTerminal(),
            'can_retry' => $execution->status === WorkflowExecution::STATUS_FAILED
                && $user->canPermission('automation.manage'),
            'trigger' => $execution->trigger ?: $execution->workflow?->trigger,
            'branch' => $execution->branch,
            'action' => $execution->action,
            'condition_passed' => $execution->condition_passed,
            'delay_minutes' => (int) $execution->delay_minutes,
            'run_at' => $execution->run_at?->toIso8601String(),
            'started_at' => $startedAt?->toIso8601String(),
            'finished_at' => $finishedAt?->toIso8601String(),
            'duration_seconds' => $durationSeconds,
            'failure' => $execution->status === WorkflowExecution::STATUS_FAILED
                ? $this->truncateForList((string) $error)
                : null,
            'record' => [
                'contact' => $contact,
                'deal' => $deal,
                'ticket' => $ticket,
            ],
        ];

        if (! $detail) {
            return $row;
        }

        $row['error'] = $error;
        $row['result'] = $result;
        $row['action_parameters'] = $parameters;
        $row['inspect_href'] = $this->historyHrefFromIds(
            $execution->id,
            $execution->workflow_id,
            $execution->status,
            1,
        );

        return $row;
    }

    /**
     * @return array<string, mixed>
     */
    public function contract(): array
    {
        return [
            'retry_available' => true,
            'test_available' => false,
            'review_is_not_a_run' => true,
            'disable_cancels_pending' => true,
            'disable_does_not_rewrite_history' => true,
            'delete_removes_history' => true,
            'states' => WorkflowExecution::STATUSES,
            'secret_redaction' => WorkflowExecutionRedactor::SECRET_KEYS,
        ];
    }

    /**
     * @return array{visible: bool, kind: string, id: int|null, label: string|null, href: string|null}
     */
    private function presentContact(?Contact $contact, bool $canViewCrm): array
    {
        if (! $contact) {
            return ['visible' => false, 'kind' => 'contact', 'id' => null, 'label' => null, 'href' => null];
        }

        if (! $canViewCrm) {
            return ['visible' => false, 'kind' => 'contact', 'id' => $contact->id, 'label' => 'Record hidden', 'href' => null];
        }

        return [
            'visible' => true,
            'kind' => 'contact',
            'id' => $contact->id,
            'label' => $contact->displayName(),
            'href' => '/crm/contacts/'.$contact->id,
        ];
    }

    /**
     * @return array{visible: bool, kind: string, id: int|null, label: string|null, href: string|null}
     */
    private function presentDeal(?Deal $deal, User $user, bool $canViewCrm): array
    {
        if (! $deal) {
            return ['visible' => false, 'kind' => 'deal', 'id' => null, 'label' => null, 'href' => null];
        }

        $teamOnly = $user->role === WorkspaceRole::Member
            && $user->canPermission('deals.team_only');

        if (! $canViewCrm || ($teamOnly && (int) $deal->owner_id !== (int) $user->id)) {
            return ['visible' => false, 'kind' => 'deal', 'id' => $deal->id, 'label' => 'Record hidden', 'href' => null];
        }

        return [
            'visible' => true,
            'kind' => 'deal',
            'id' => $deal->id,
            'label' => $deal->title,
            'href' => '/crm/deals/'.$deal->id,
        ];
    }

    /**
     * @return array{visible: bool, kind: string, id: int|null, label: string|null, href: string|null}
     */
    private function presentTicket(?Ticket $ticket, bool $canViewCrm): array
    {
        if (! $ticket) {
            return ['visible' => false, 'kind' => 'ticket', 'id' => null, 'label' => null, 'href' => null];
        }

        if (! $canViewCrm) {
            return ['visible' => false, 'kind' => 'ticket', 'id' => $ticket->id, 'label' => 'Record hidden', 'href' => null];
        }

        return [
            'visible' => true,
            'kind' => 'ticket',
            'id' => $ticket->id,
            'label' => $ticket->number,
            'href' => '/crm/tickets/'.$ticket->id,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function stripPiiParameters(array $payload): array
    {
        foreach (['body', 'value', 'subject', 'title'] as $key) {
            if (isset($payload[$key]) && is_string($payload[$key])) {
                $payload[$key] = $this->redactor->hideRecordPii($payload[$key]);
            }
        }

        return $payload;
    }

    private function statusLabel(WorkflowExecution $execution): string
    {
        return match ($execution->status) {
            WorkflowExecution::STATUS_PENDING => $execution->run_at?->isFuture()
                ? 'Scheduled'
                : 'Due',
            WorkflowExecution::STATUS_RUNNING => 'Running',
            WorkflowExecution::STATUS_COMPLETED => 'Completed',
            WorkflowExecution::STATUS_FAILED => 'Failed',
            WorkflowExecution::STATUS_CANCELLED => 'Cancelled',
            default => $execution->status,
        };
    }

    private function truncateForList(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (mb_strlen($value) <= 80) {
            return $value;
        }

        return rtrim(mb_substr($value, 0, 79)).'…';
    }

    private function historyHrefFromIds(?int $executionId, ?int $workflowId, ?string $status, int $page): string
    {
        $query = ['view' => 'history'];

        if ($page > 1) {
            $query['history_page'] = $page;
        }

        if ($workflowId) {
            $query['history_workflow_id'] = $workflowId;
        }

        if ($status && in_array($status, WorkflowExecution::STATUSES, true)) {
            $query['history_status'] = $status;
        }

        if ($executionId) {
            $query['execution'] = $executionId;
        }

        return '/crm/workflows?'.http_build_query($query);
    }
}
