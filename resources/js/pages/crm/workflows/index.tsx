import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmShell } from '@/components/crm/crm-shell';
import { WorkflowBuilder } from '@/components/crm/workflow-builder';
import { WorkflowExecutionHistory } from '@/components/crm/workflow-execution-history';
import { WorkflowList } from '@/evo/automation';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';
import {
    beginExclusiveAction,
    draftFromWorkflow,
    draftsEqual,
    emptyWorkflowDraft,
    releaseExclusiveAction,
    summarizeWorkflow,
    validateWorkflowDraft,
    workflowFormPayload,
} from '@/lib/workflow-authoring';
import type {
    WorkflowCapabilities,
    WorkflowConditionField,
    WorkflowDraft,
    WorkflowMember,
    WorkflowRow,
    WorkflowSequence,
    WorkflowStage,
    WorkflowTemplate,
    WorkflowTicketStatus,
    WorkflowVersionRow,
} from '@/lib/workflow-authoring';
import { EMPTY_EXECUTION_PAGE } from '@/lib/workflow-execution';
import type { WorkflowExecutionPage } from '@/lib/workflow-execution';

type Segment = { id: number; name: string };

const DEFAULT_CAPABILITIES: WorkflowCapabilities = {
    can_manage: false,
    has_mailbox: false,
    has_sequences: false,
};

function flattenErrors(
    errors: Record<string, string | string[]>,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(errors).map(([key, value]) => [
            key,
            Array.isArray(value) ? (value[0] ?? '') : value,
        ]),
    );
}

export default function WorkflowsIndex({
    workflows,
    templates,
    stages,
    sequences,
    segments = [],
    condition_fields = [],
    members = [],
    ticket_statuses = [],
    capabilities = DEFAULT_CAPABILITIES,
    view = 'workflows',
    executions = EMPTY_EXECUTION_PAGE,
}: {
    workflows: WorkflowRow[];
    templates: WorkflowTemplate[];
    stages: WorkflowStage[];
    sequences: WorkflowSequence[];
    segments?: Segment[];
    condition_fields?: WorkflowConditionField[];
    members?: WorkflowMember[];
    ticket_statuses?: WorkflowTicketStatus[];
    capabilities?: WorkflowCapabilities;
    view?: 'workflows' | 'history';
    executions?: WorkflowExecutionPage;
}) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<WorkflowDraft>(emptyWorkflowDraft);
    const [baseline, setBaseline] = useState<WorkflowDraft>(emptyWorkflowDraft);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>(
        {},
    );
    const [mutating, setMutating] = useState(false);
    const ignoreDirtyClose = useRef(false);
    const mutatingRef = useRef(false);
    const page = usePage<{ errors?: Record<string, string | string[]> }>();

    const releaseMutation = (): void => {
        releaseExclusiveAction(mutatingRef);
        setMutating(false);
    };

    const dirty = !draftsEqual(draft, baseline);
    const canManage = capabilities.can_manage;
    const editing = editingId !== null;
    const serverErrors = flattenErrors(page.props.errors ?? {});
    const errors = { ...clientErrors, ...serverErrors };

    const editorTitle = editing ? 'Edit workflow' : 'Create workflow';

    const openCreate = () => {
        const next = emptyWorkflowDraft();
        setEditingId(null);
        setDraft(next);
        setBaseline(next);
        setClientErrors({});
        setEditorOpen(true);
    };

    const openEdit = (workflow: WorkflowRow) => {
        const next = draftFromWorkflow(workflow);
        setEditingId(workflow.id);
        setDraft(next);
        setBaseline(next);
        setClientErrors({});
        setEditorOpen(true);
    };

    const requestClose = (open: boolean) => {
        if (open) {
            setEditorOpen(true);

            return;
        }

        if (!ignoreDirtyClose.current && dirty) {
            const confirmed = window.confirm(t('Discard unsaved changes?'));

            if (!confirmed) {
                return;
            }
        }

        ignoreDirtyClose.current = false;
        setEditorOpen(false);
        setEditingId(null);
        setClientErrors({});
    };

    const patchDraft = (patch: Partial<WorkflowDraft>) => {
        setDraft((current) => ({ ...current, ...patch }));
        setClientErrors({});
    };

    const submitEditor = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const issues = validateWorkflowDraft(draft);

        if (issues.length > 0) {
            setClientErrors(
                Object.fromEntries(
                    issues.map((issue) => [issue.field, issue.message]),
                ),
            );

            return;
        }

        if (!beginExclusiveAction(mutatingRef)) {
            return;
        }

        setMutating(true);
        const payload = workflowFormPayload(draft, {
            includeActive: !editing,
            active: false,
        });

        const visit = {
            preserveScroll: true,
            onSuccess: () => {
                ignoreDirtyClose.current = true;
                setEditorOpen(false);
                setEditingId(null);
                setBaseline(draft);
            },
            onError: () => {
                ignoreDirtyClose.current = false;
            },
            onFinish: () => {
                releaseExclusiveAction(mutatingRef);
                setMutating(false);
            },
        };

        if (editing) {
            router.put(`/crm/workflows/${editingId}`, payload, visit);

            return;
        }

        router.post('/crm/workflows', payload, visit);
    };

    const toggleWorkflow = (workflow: WorkflowRow) => {
        const confirmed = window.confirm(
            workflow.active
                ? t(
                      'Turn off this workflow? Pending delayed runs will be cancelled and will not execute. Historical executions stay as they were.',
                  )
                : t(
                      'Turn on this workflow? New matching events will run. Existing history is unchanged.',
                  ),
        );

        if (!confirmed) {
            return;
        }

        if (!beginExclusiveAction(mutatingRef)) {
            return;
        }

        setMutating(true);
        router.post(
            `/crm/workflows/${workflow.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onFinish: releaseMutation,
            },
        );
    };

    const testWorkflow = (workflow: WorkflowRow) => {
        if (!beginExclusiveAction(mutatingRef)) {
            return;
        }

        setMutating(true);
        router.post(
            '/crm/workflows/' + workflow.id + '/test',
            {},
            {
                preserveScroll: true,
                onFinish: releaseMutation,
            },
        );
    };

    const applyTemplate = (templateKey: string) => {
        if (!beginExclusiveAction(mutatingRef)) {
            return;
        }

        setMutating(true);
        router.post(
            '/crm/workflows/templates',
            { template_key: templateKey },
            {
                preserveScroll: true,
                onFinish: releaseMutation,
            },
        );
    };

    const restoreVersion = (
        workflow: WorkflowRow,
        version: WorkflowVersionRow,
    ) => {
        if (
            !window.confirm(
                t(
                    'Restore this workflow version? The current configuration will be saved as a new version first.',
                ) + `\n\n${workflow.name}`,
            )
        ) {
            return;
        }

        if (!beginExclusiveAction(mutatingRef)) {
            return;
        }

        setMutating(true);
        router.post(
            `/crm/workflows/versions/${version.id}/restore`,
            {},
            {
                preserveScroll: true,
                onFinish: releaseMutation,
            },
        );
    };

    const deleteWorkflow = (workflow: WorkflowRow) => {
        const confirmed = window.confirm(
            t(
                'Delete this workflow? Its execution history is removed with it.',
            ),
        );

        if (!confirmed) {
            return;
        }

        if (!beginExclusiveAction(mutatingRef)) {
            return;
        }

        setMutating(true);
        router.delete(`/crm/workflows/${workflow.id}`, {
            preserveScroll: true,
            onFinish: releaseMutation,
        });
    };

    const replayExecution = (executionId: number) => {
        if (!beginExclusiveAction(mutatingRef)) {
            return;
        }

        setMutating(true);
        router.post(
            '/crm/workflows/executions/' + executionId + '/replay',
            {},
            {
                preserveScroll: true,
                onFinish: releaseMutation,
            },
        );
    };

    useEffect(() => {
        if (!editorOpen || !dirty) {
            return;
        }

        const onBefore = (event: { preventDefault: () => void }) => {
            if (mutatingRef.current) {
                return;
            }

            if (!window.confirm(t('You have unsaved changes. Leave anyway?'))) {
                event.preventDefault();
            }
        };
        const remove = router.on('before', onBefore);
        const onUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
        };
        window.addEventListener('beforeunload', onUnload);

        return () => {
            remove();
            window.removeEventListener('beforeunload', onUnload);
        };
    }, [dirty, editorOpen]);

    const ticketStatuses = useMemo(
        () =>
            ticket_statuses.length > 0
                ? ticket_statuses
                : [
                      { value: 'new', label: 'New' },
                      {
                          value: 'waiting_on_contact',
                          label: 'Waiting on contact',
                      },
                      { value: 'waiting_on_us', label: 'Waiting on us' },
                      { value: 'closed', label: 'Closed' },
                  ],
        [ticket_statuses],
    );

    return (
        <CrmShell title="Automation">
            <div
                className="h-full overflow-x-hidden overflow-y-auto bg-[var(--evo-canvas)]"
                data-workflow="page"
            >
                <div className="flex-1 space-y-5 p-4 md:p-6">
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-[20px] font-semibold tracking-tight text-[var(--evo-ink)]">
                                {t('Automation')}
                            </h1>
                            <p className="mt-1 text-[13px] text-[var(--evo-ink-secondary)]">
                                {t(
                                    'Structured workflows the runner can execute: when, if, then, else.',
                                )}
                            </p>
                        </div>
                        {canManage && view !== 'history' ? (
                            <Button
                                size="sm"
                                onClick={openCreate}
                                disabled={mutating}
                                data-workflow="create"
                            >
                                {t('Create workflow')}
                            </Button>
                        ) : null}
                    </header>

                    <nav
                        className="flex gap-4 border-b border-hairline text-[13px]"
                        aria-label={t('Automation sections')}
                    >
                        <Link
                            href="/crm/workflows"
                            className={
                                view === 'history'
                                    ? 'pb-2 text-[var(--evo-ink-muted)]'
                                    : 'border-b-2 border-[var(--evo-teal)] pb-2 font-medium text-[var(--evo-ink)]'
                            }
                        >
                            {t('Workflows')}
                        </Link>
                        <Link
                            href="/crm/workflows?view=history"
                            className={
                                view === 'history'
                                    ? 'border-b-2 border-[var(--evo-teal)] pb-2 font-medium text-[var(--evo-ink)]'
                                    : 'pb-2 text-[var(--evo-ink-muted)]'
                            }
                        >
                            {t('History')}
                        </Link>
                    </nav>

                    {view === 'history' ? (
                        <WorkflowExecutionHistory
                            executions={executions}
                            workflows={workflows}
                            onReplay={replayExecution}
                        />
                    ) : (
                        <WorkflowList
                            workflows={workflows}
                            templates={templates}
                            conditionFields={condition_fields}
                            stages={stages}
                            canManage={canManage}
                            mutating={mutating}
                            onEdit={openEdit}
                            onToggle={toggleWorkflow}
                            onTest={testWorkflow}
                            onDelete={deleteWorkflow}
                            onRestore={restoreVersion}
                            onUseTemplate={applyTemplate}
                        />
                    )}
                </div>
            </div>

            <CreateDrawer
                open={editorOpen}
                onOpenChange={requestClose}
                title={t(editorTitle)}
                description={t(
                    'Save writes the structure. Enable is a separate action.',
                )}
                showFormLink={false}
                className="sm:max-w-2xl"
            >
                <form
                    onSubmit={submitEditor}
                    className="space-y-4"
                    data-workflow="editor-form"
                >
                    <WorkflowBuilder
                        draft={draft}
                        onChange={patchDraft}
                        stages={stages}
                        sequences={sequences}
                        segments={segments}
                        members={members}
                        conditionFields={condition_fields}
                        ticketStatuses={ticketStatuses}
                        capabilities={capabilities}
                        errors={errors}
                        disabled={!canManage || mutating}
                    />
                    <div
                        className="rounded-md border border-hairline bg-[var(--evo-surface-subtle)] px-3 py-2"
                        data-workflow="review-configuration"
                    >
                        <p className="text-[12px] font-medium text-[var(--evo-ink)]">
                            Review configuration
                        </p>
                        <p className="mt-1 text-[13px] text-[var(--evo-ink)]">
                            {summarizeWorkflow(draft, condition_fields, stages)}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                            This reviews the structure. It does not run the
                            workflow.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => requestClose(false)}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={!canManage || mutating}>
                            {mutating ? t('Saving…') : t('Save')}
                        </Button>
                    </div>
                </form>
            </CreateDrawer>
        </CrmShell>
    );
}

WorkflowsIndex.layout = {
    breadcrumbs: [{ title: 'Automation', href: '/crm/workflows' }],
};
