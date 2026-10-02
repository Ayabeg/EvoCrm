import { Link, router } from '@inertiajs/react';

import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmListFooter } from '@/components/crm/list-chrome';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';
import { triggerLabel } from '@/lib/workflow-authoring';
import {
    branchLabel,
    executionBadgeVariant,
    executionHistoryHref,
    executionRecordLabel,
    formatExecutionDuration,
    formatExecutionTimestamp,
} from '@/lib/workflow-execution';
import type { WorkflowExecutionPage, WorkflowExecutionRow } from '@/lib/workflow-execution';

function RecordLink({ item }: { item: WorkflowExecutionRow['record']['contact'] }) {
    if (!item.id) {
        return null;
    }

    if (!item.visible || !item.href) {
        return <span className="text-[var(--evo-ink-muted)]">{item.label ?? t('Record hidden')}</span>;
    }

    return (
        <Link href={item.href} className="text-[var(--evo-ink)] underline-offset-2 hover:underline">
            {item.label}
        </Link>
    );
}

export function ExecutionHistory({
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

    const columns: EvoDataGridColumn<WorkflowExecutionRow>[] = [
        {
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => row.status_label,
            cell: ({ row }) => (
                <Badge variant={executionBadgeVariant(row.original.status)}>{row.original.status_label}</Badge>
            ),
        },
        {
            id: 'workflow',
            header: t('Workflow'),
            accessorFn: (row) => row.workflow_name,
        },
        {
            id: 'trigger',
            header: t('Trigger / record'),
            accessorFn: (row) => executionRecordLabel(row),
            cell: ({ row }) => (
                <div>
                    <div className="text-[var(--evo-ink)]">
                        {row.original.trigger ? t(triggerLabel(row.original.trigger)) : t('Unknown')}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[var(--evo-ink-muted)]">
                        {executionRecordLabel(row.original)}
                    </div>
                </div>
            ),
        },
        {
            id: 'branch',
            header: t('Branch'),
            accessorFn: (row) => branchLabel(row.branch),
        },
        {
            id: 'action',
            header: t('Action'),
            accessorFn: (row) => row.action ?? t('None'),
        },
        {
            id: 'started',
            header: t('Started'),
            accessorFn: (row) => row.started_at ?? row.run_at,
            cell: ({ row }) => formatExecutionTimestamp(row.original.started_at ?? row.original.run_at),
        },
        {
            id: 'finished',
            header: t('Finished'),
            accessorFn: (row) => row.finished_at ?? '',
            cell: ({ row }) =>
                row.original.finished_at
                    ? formatExecutionTimestamp(row.original.finished_at)
                    : row.original.is_delayed && row.original.status === 'pending'
                      ? t('Scheduled :when', {
                            when: formatExecutionTimestamp(row.original.run_at),
                        })
                      : t('Unknown'),
        },
        {
            id: 'failure',
            header: t('Failure'),
            accessorFn: (row) => row.failure ?? '',
            cell: ({ row }) =>
                row.original.failure ? (
                    <span className="max-w-[18rem] truncate">{row.original.failure}</span>
                ) : (
                    <span className="text-[var(--evo-ink-muted)]">-</span>
                ),
        },
    ];

    return (
        <>
            <div
                data-workflow="history"
                className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)]"
            >
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--evo-hairline)] px-4 py-3">
                    <div className="min-w-0">
                        <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">{t('Execution history')}</h2>
                        <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                            {t(
                                'Runs the engine actually recorded. Turning a workflow off cancels pending delayed runs. Past executions stay as they were.',
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <label className="text-[12px] text-[var(--evo-ink-muted)]">
                            {t('Workflow')}
                            <NativeSelect
                                className="ml-2 h-8 w-auto"
                                value={filters.workflow_id ?? ''}
                                onChange={(event) =>
                                    applyFilter({
                                        workflowId: event.target.value ? Number(event.target.value) : null,
                                        status: filters.status,
                                    })
                                }
                            >
                                <option value="">{t('All')}</option>
                                {workflows.map((workflow) => (
                                    <option key={workflow.id} value={workflow.id}>
                                        {workflow.name}
                                    </option>
                                ))}
                            </NativeSelect>
                        </label>
                        <label className="text-[12px] text-[var(--evo-ink-muted)]">
                            {t('Status')}
                            <NativeSelect
                                className="ml-2 h-8 w-auto"
                                value={filters.status ?? ''}
                                onChange={(event) =>
                                    applyFilter({
                                        workflowId: filters.workflow_id,
                                        status: event.target.value || null,
                                    })
                                }
                            >
                                <option value="">{t('All')}</option>
                                {executions.contract.states.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </NativeSelect>
                        </label>
                    </div>
                </div>

                <DataGrid
                    columns={columns}
                    data={executions.data}
                    getRowId={(row) => String(row.id)}
                    density="compact"
                    enableSelection={false}
                    pagination="none"
                    hideColumnPicker
                    embedded
                    enableSorting={false}
                    emptyTitle={t('No executions yet')}
                    emptyDescription={t(
                        'History appears when an active workflow runs or is scheduled. Draft workflows stay inspectable after they have run.',
                    )}
                    onRowClick={openDetail}
                />

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
            </div>

            <CreateDrawer
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDetail();
                    }
                }}
                title={selected ? selected.workflow_name : t('Execution')}
                description={t('Recorded execution. This is not a test run.')}
                showFormLink={false}
                className="sm:max-w-lg"
            >
                {selected ? (
                    <div className="space-y-4 text-[13px]" data-workflow="execution-detail">
                        <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2">
                            <dt className="text-[var(--evo-ink-muted)]">{t('Status')}</dt>
                            <dd>
                                <Badge variant={executionBadgeVariant(selected.status)}>
                                    {selected.status_label}
                                </Badge>
                            </dd>
                            <dt className="text-[var(--evo-ink-muted)]">{t('Trigger')}</dt>
                            <dd className="text-[var(--evo-ink)]">
                                {selected.trigger ? t(triggerLabel(selected.trigger)) : t('Unknown')}
                            </dd>
                            <dt className="text-[var(--evo-ink-muted)]">{t('Branch')}</dt>
                            <dd className="text-[var(--evo-ink)]">{branchLabel(selected.branch)}</dd>
                            <dt className="text-[var(--evo-ink-muted)]">{t('Condition')}</dt>
                            <dd className="text-[var(--evo-ink)]">
                                {selected.condition_passed === null
                                    ? t('No condition')
                                    : selected.condition_passed
                                      ? t('Passed')
                                      : t('Did not pass')}
                            </dd>
                            <dt className="text-[var(--evo-ink-muted)]">{t('Action')}</dt>
                            <dd className="text-[var(--evo-ink)]">{selected.action ?? t('None')}</dd>
                            <dt className="text-[var(--evo-ink-muted)]">{t('Started')}</dt>
                            <dd className="text-[var(--evo-ink)]">
                                {formatExecutionTimestamp(selected.started_at ?? selected.run_at)}
                            </dd>
                            <dt className="text-[var(--evo-ink-muted)]">{t('Finished')}</dt>
                            <dd className="text-[var(--evo-ink)]">
                                {formatExecutionTimestamp(selected.finished_at)}
                            </dd>
                            <dt className="text-[var(--evo-ink-muted)]">{t('Duration')}</dt>
                            <dd className="text-[var(--evo-ink)]">
                                {formatExecutionDuration(selected.duration_seconds)}
                            </dd>
                        </dl>

                        <div>
                            <h3 className="text-[12px] font-medium text-[var(--evo-ink)]">{t('Records')}</h3>
                            <ul className="mt-1 space-y-1 text-[var(--evo-ink-muted)]">
                                <li>
                                    {t('Contact')}: <RecordLink item={selected.record.contact} />
                                    {!selected.record.contact.id ? ` ${t('None')}` : null}
                                </li>
                                <li>
                                    {t('Deal')}: <RecordLink item={selected.record.deal} />
                                    {!selected.record.deal.id ? ` ${t('None')}` : null}
                                </li>
                                <li>
                                    {t('Ticket')}: <RecordLink item={selected.record.ticket} />
                                    {!selected.record.ticket.id ? ` ${t('None')}` : null}
                                </li>
                            </ul>
                        </div>

                        {selected.action_parameters && Object.keys(selected.action_parameters).length > 0 ? (
                            <div>
                                <h3 className="text-[12px] font-medium text-[var(--evo-ink)]">
                                    {t('Safe action parameters')}
                                </h3>
                                <pre className="mt-1 max-h-40 overflow-auto rounded-[var(--evo-radius-compact)] border border-[var(--evo-hairline)] bg-[var(--evo-surface-subtle)] px-3 py-2 text-[12px] text-[var(--evo-ink)]">
                                    {JSON.stringify(selected.action_parameters, null, 2)}
                                </pre>
                            </div>
                        ) : null}

                        {selected.result ? (
                            <div>
                                <h3 className="text-[12px] font-medium text-[var(--evo-ink)]">{t('Result')}</h3>
                                <p className="mt-1 text-[var(--evo-ink)]">
                                    {typeof selected.result.summary === 'string'
                                        ? selected.result.summary
                                        : t('Recorded')}
                                </p>
                            </div>
                        ) : null}

                        {selected.error ? (
                            <div role="alert">
                                <h3 className="text-[12px] font-medium text-[var(--evo-ink)]">{t('Error')}</h3>
                                <p className="mt-1 text-[var(--evo-ink)]">{selected.error}</p>
                            </div>
                        ) : null}

                        <p className="text-[12px] text-[var(--evo-ink-muted)]">
                            {t('Retry is not available. Re-running would risk duplicate side effects.')}
                        </p>

                        <div className="flex justify-end">
                            <Button type="button" variant="outline" size="sm" onClick={closeDetail}>
                                {t('Close')}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CreateDrawer>
        </>
    );
}
