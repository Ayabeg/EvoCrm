import { Link, router } from '@inertiajs/react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmEmptyState, CrmListFooter } from '@/components/crm/list-chrome';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { triggerLabel } from '@/lib/workflow-authoring';
import {
    branchLabel,
    executionBadgeVariant,
    executionHistoryHref,
    executionRecordLabel,
    formatExecutionDuration,
    formatExecutionTimestamp,
    type WorkflowExecutionPage,
    type WorkflowExecutionRow,
} from '@/lib/workflow-execution';

function RecordLink({
    item,
}: {
    item: WorkflowExecutionRow['record']['contact'];
}) {
    if (!item.id) {
        return null;
    }

    if (!item.visible || !item.href) {
        return <span className="text-mute">{item.label ?? 'Record hidden'}</span>;
    }

    return (
        <Link href={item.href} className="text-ink underline-offset-2 hover:underline">
            {item.label}
        </Link>
    );
}

function TruncatedInspect({
    value,
    onInspect,
}: {
    value: string | null;
    onInspect: () => void;
}) {
    if (!value) {
        return <span className="text-mute">-</span>;
    }

    return (
        <button
            type="button"
            className="max-w-[18rem] truncate text-left text-[13px] text-ink underline-offset-2 hover:underline"
            onClick={onInspect}
        >
            {value}
        </button>
    );
}

export function WorkflowExecutionHistory({
    executions,
    workflows,
}: {
    executions: WorkflowExecutionPage;
    workflows: Array<{ id: number; name: string }>;
}) {
    const selected = executions.selected;
    const filters = executions.filters;

    const closeDetail = () => {
        router.get(
            executionHistoryHref({
                page: executions.paginator.page,
                workflowId: filters.workflow_id,
                status: filters.status,
            }),
            {},
            { preserveScroll: true },
        );
    };

    const openDetail = (row: WorkflowExecutionRow) => {
        router.get(
            executionHistoryHref({
                page: executions.paginator.page,
                workflowId: filters.workflow_id,
                status: filters.status,
                execution: row.id,
            }),
            {},
            { preserveScroll: true },
        );
    };

    const applyFilter = (next: { workflowId?: number | null; status?: string | null }) => {
        router.get(
            executionHistoryHref({
                workflowId: next.workflowId ?? filters.workflow_id,
                status: next.status ?? filters.status,
            }),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <>
            <HairlinePanel data-workflow="history">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline px-4 py-3">
                    <div className="min-w-0">
                        <h2 className="aurora-text-ui font-medium text-ink">Execution history</h2>
                        <p className="aurora-text-caption mt-1 text-mute">
                            Runs the engine actually recorded. Turning a workflow off
                            cancels pending delayed runs. Past executions stay as they
                            were.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <label className="text-[12px] text-mute">
                            Workflow
                            <select
                                className="ml-2 rounded-md border border-hairline bg-canvas px-2 py-1 text-[13px] text-ink"
                                value={filters.workflow_id ?? ''}
                                onChange={(event) =>
                                    applyFilter({
                                        workflowId: event.target.value
                                            ? Number(event.target.value)
                                            : null,
                                        status: filters.status,
                                    })
                                }
                            >
                                <option value="">All</option>
                                {workflows.map((workflow) => (
                                    <option key={workflow.id} value={workflow.id}>
                                        {workflow.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-[12px] text-mute">
                            Status
                            <select
                                className="ml-2 rounded-md border border-hairline bg-canvas px-2 py-1 text-[13px] text-ink"
                                value={filters.status ?? ''}
                                onChange={(event) =>
                                    applyFilter({
                                        workflowId: filters.workflow_id,
                                        status: event.target.value || null,
                                    })
                                }
                            >
                                <option value="">All</option>
                                {executions.contract.states.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                {executions.data.length === 0 ? (
                    <div className="px-4 py-8">
                        <CrmEmptyState
                            title="No executions yet"
                            line="History appears when an active workflow runs or is scheduled. Draft workflows stay inspectable after they have run."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[720px] w-full text-left text-[13px]">
                            <thead className="border-b border-hairline text-[11px] text-mute">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Status</th>
                                    <th className="px-4 py-2 font-medium">Workflow</th>
                                    <th className="px-4 py-2 font-medium">Trigger / record</th>
                                    <th className="px-4 py-2 font-medium">Branch</th>
                                    <th className="px-4 py-2 font-medium">Action</th>
                                    <th className="px-4 py-2 font-medium">Started</th>
                                    <th className="px-4 py-2 font-medium">Finished</th>
                                    <th className="px-4 py-2 font-medium">Failure</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {executions.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="cursor-pointer hover:bg-canvas-soft"
                                        onClick={() => openDetail(row)}
                                    >
                                        <td className="px-4 py-3">
                                            <Badge variant={executionBadgeVariant(row.status)}>
                                                {row.status_label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-ink">{row.workflow_name}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-ink">
                                                {row.trigger ? triggerLabel(row.trigger) : 'Unknown'}
                                            </div>
                                            <div className="mt-0.5 text-[12px] text-mute">
                                                {executionRecordLabel(row)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-ink">{branchLabel(row.branch)}</td>
                                        <td className="px-4 py-3 text-ink">{row.action ?? 'None'}</td>
                                        <td className="px-4 py-3 text-mute">
                                            {formatExecutionTimestamp(row.started_at ?? row.run_at)}
                                        </td>
                                        <td className="px-4 py-3 text-mute">
                                            {row.finished_at
                                                ? formatExecutionTimestamp(row.finished_at)
                                                : row.is_delayed && row.status === 'pending'
                                                  ? `Scheduled ${formatExecutionTimestamp(row.run_at)}`
                                                  : 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <TruncatedInspect
                                                value={row.failure}
                                                onInspect={() => openDetail(row)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <CrmListFooter
                    count={executions.data.length}
                    noun="executions"
                    total={executions.paginator.total}
                    page={executions.paginator.page}
                    lastPage={executions.paginator.last_page}
                    perPage={executions.paginator.per_page}
                    prevHref={executions.paginator.prev_href}
                    nextHref={executions.paginator.next_href}
                />
            </HairlinePanel>

            <CreateDrawer
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDetail();
                    }
                }}
                title={selected ? selected.workflow_name : 'Execution'}
                description="Recorded execution. This is not a test run."
                showFormLink={false}
                className="sm:max-w-lg"
            >
                {selected ? (
                    <div className="space-y-4 text-[13px]" data-workflow="execution-detail">
                        <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2">
                            <dt className="text-mute">Status</dt>
                            <dd>
                                <Badge variant={executionBadgeVariant(selected.status)}>
                                    {selected.status_label}
                                </Badge>
                            </dd>
                            <dt className="text-mute">Trigger</dt>
                            <dd className="text-ink">
                                {selected.trigger ? triggerLabel(selected.trigger) : 'Unknown'}
                            </dd>
                            <dt className="text-mute">Branch</dt>
                            <dd className="text-ink">{branchLabel(selected.branch)}</dd>
                            <dt className="text-mute">Condition</dt>
                            <dd className="text-ink">
                                {selected.condition_passed === null
                                    ? 'No condition'
                                    : selected.condition_passed
                                      ? 'Passed'
                                      : 'Did not pass'}
                            </dd>
                            <dt className="text-mute">Action</dt>
                            <dd className="text-ink">{selected.action ?? 'None'}</dd>
                            <dt className="text-mute">Started</dt>
                            <dd className="text-ink">
                                {formatExecutionTimestamp(selected.started_at ?? selected.run_at)}
                            </dd>
                            <dt className="text-mute">Finished</dt>
                            <dd className="text-ink">
                                {formatExecutionTimestamp(selected.finished_at)}
                            </dd>
                            <dt className="text-mute">Duration</dt>
                            <dd className="text-ink">
                                {formatExecutionDuration(selected.duration_seconds)}
                            </dd>
                            {selected.is_delayed ? (
                                <>
                                    <dt className="text-mute">Delay</dt>
                                    <dd className="text-ink">
                                        {selected.delay_minutes} min, due{' '}
                                        {formatExecutionTimestamp(selected.run_at)}
                                    </dd>
                                </>
                            ) : null}
                        </dl>

                        <div>
                            <h3 className="text-[12px] font-medium text-ink">Records</h3>
                            <ul className="mt-1 space-y-1 text-mute">
                                <li>
                                    Contact: <RecordLink item={selected.record.contact} />
                                    {!selected.record.contact.id ? ' None' : null}
                                </li>
                                <li>
                                    Deal: <RecordLink item={selected.record.deal} />
                                    {!selected.record.deal.id ? ' None' : null}
                                </li>
                                <li>
                                    Ticket: <RecordLink item={selected.record.ticket} />
                                    {!selected.record.ticket.id ? ' None' : null}
                                </li>
                            </ul>
                        </div>

                        {selected.action_parameters &&
                        Object.keys(selected.action_parameters).length > 0 ? (
                            <div>
                                <h3 className="text-[12px] font-medium text-ink">
                                    Safe action parameters
                                </h3>
                                <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-hairline bg-canvas-soft px-3 py-2 text-[12px] text-ink">
                                    {JSON.stringify(selected.action_parameters, null, 2)}
                                </pre>
                            </div>
                        ) : null}

                        {selected.result ? (
                            <div>
                                <h3 className="text-[12px] font-medium text-ink">Result</h3>
                                <p className="mt-1 text-ink">
                                    {typeof selected.result.summary === 'string'
                                        ? selected.result.summary
                                        : 'Recorded'}
                                </p>
                            </div>
                        ) : null}

                        {selected.error ? (
                            <div role="alert">
                                <h3 className="text-[12px] font-medium text-ink">Error</h3>
                                <p className="mt-1 text-ink">{selected.error}</p>
                            </div>
                        ) : null}

                        <p className="text-[12px] text-mute">
                            Retry is not available. Re-running would risk duplicate
                            side effects.
                        </p>

                        <div className="flex justify-end">
                            <Button type="button" variant="outline" size="sm" onClick={closeDetail}>
                                Close
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CreateDrawer>
        </>
    );
}
