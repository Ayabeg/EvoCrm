import { Form, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CreateDrawer } from '@/components/crm/create-drawer';
import { CrmShell } from '@/components/crm/crm-shell';
import { WorkflowBuilder } from '@/components/crm/workflow-builder';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import { SurfaceHeader } from '@/components/surface/surface-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    draftFromWorkflow,
    draftsEqual,
    emptyWorkflowDraft,
    formatWorkflowTimestamp,
    summarizeWorkflowRow,
    triggerLabel,
    validateWorkflowDraft,
    workflowFormPayload,
    workflowStatusLabel,
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
} from '@/lib/workflow-authoring';

type Segment = { id: number; name: string };

const DEFAULT_CAPABILITIES: WorkflowCapabilities = {
    can_manage: false,
    has_mailbox: false,
    has_sequences: false,
};

function flattenErrors(errors: Record<string, string | string[]>): Record<string, string> {
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
}) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<WorkflowDraft>(emptyWorkflowDraft);
    const [baseline, setBaseline] = useState<WorkflowDraft>(emptyWorkflowDraft);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const ignoreDirtyClose = useRef(false);
    const submittingRef = useRef(false);
    const page = usePage<{ errors?: Record<string, string | string[]> }>();

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
            const confirmed = window.confirm('Discard unsaved changes?');

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
                Object.fromEntries(issues.map((issue) => [issue.field, issue.message])),
            );

            return;
        }

        if (submitting) {
            return;
        }

        submittingRef.current = true;
        setSubmitting(true);
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
            onFinish: () => {
                submittingRef.current = false;
                setSubmitting(false);
            },
        };

        if (editing) {
            router.put(`/crm/workflows/${editingId}`, payload, visit);

            return;
        }

        router.post('/crm/workflows', payload, visit);
    };

    const toggleWorkflow = (workflow: WorkflowRow) => {
        if (togglingId !== null) {
            return;
        }

        setTogglingId(workflow.id);
        router.post(
            `/crm/workflows/${workflow.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setTogglingId(null),
            },
        );
    };

    useEffect(() => {
        if (!editorOpen || !dirty) {
            return;
        }

        const onBefore = (event: { preventDefault: () => void }) => {
            if (submittingRef.current) {
                return;
            }

            if (!window.confirm('You have unsaved changes. Leave anyway?')) {
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
                      { value: 'waiting_on_contact', label: 'Waiting on contact' },
                      { value: 'waiting_on_us', label: 'Waiting on us' },
                      { value: 'closed', label: 'Closed' },
                  ],
        [ticket_statuses],
    );

    return (
        <CrmShell title="Automation">
            <div className="h-full overflow-y-auto overflow-x-hidden" data-workflow="page">
                <div className="flex-1 space-y-5 p-4 md:p-6">
                    <SurfaceHeader
                        title="Automation"
                        description="Structured workflows the runner can execute: when, if, then, else."
                    >
                        {canManage ? (
                            <Button size="sm" onClick={openCreate} data-workflow="create">
                                Create workflow
                            </Button>
                        ) : null}
                    </SurfaceHeader>

                    <HairlinePanel>
                        <div className="border-b border-hairline px-4 py-3">
                            <h2 className="aurora-text-ui font-medium text-ink">
                                Evo templates
                            </h2>
                            <p className="aurora-text-caption mt-1 text-mute">
                                Starters that write a valid workflow into this workspace.
                            </p>
                        </div>
                        <ul className="divide-y divide-hairline">
                            {templates.map((template) => (
                                <li
                                    key={template.key}
                                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="aurora-text-body-sm font-medium text-ink">
                                            {template.name}
                                        </p>
                                        <p className="aurora-text-caption mt-0.5 text-mute">
                                            {template.description}
                                        </p>
                                    </div>
                                    {canManage ? (
                                        <Form
                                            action="/crm/workflows/templates"
                                            method="post"
                                        >
                                            <input
                                                type="hidden"
                                                name="template_key"
                                                value={template.key}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0"
                                            >
                                                Use template
                                            </Button>
                                        </Form>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </HairlinePanel>

                    <HairlinePanel data-workflow="list">
                        <div className="hidden border-b border-hairline px-4 py-2 text-[12px] text-mute md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_7rem_auto] md:gap-3">
                            <span>Name</span>
                            <span>Trigger</span>
                            <span>Status</span>
                            <span>Last modified</span>
                            <span className="text-right"> </span>
                        </div>
                        <ul className="divide-y divide-hairline">
                            {workflows.map((workflow) => (
                                <li
                                    key={workflow.id}
                                    className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_7rem_auto] md:items-center md:gap-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-ink">
                                            {workflow.name}
                                        </p>
                                        <p className="mt-0.5 text-[12px] leading-4 text-mute">
                                            {summarizeWorkflowRow(
                                                workflow,
                                                condition_fields,
                                                stages,
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-[13px] text-ink">
                                        {triggerLabel(workflow.trigger)}
                                        {workflow.trigger_stage
                                            ? ` → ${workflow.trigger_stage}`
                                            : ''}
                                        {workflow.trigger_status_label
                                            ? ` → ${workflow.trigger_status_label}`
                                            : ''}
                                    </div>
                                    <div>
                                        <Badge
                                            variant={workflow.active ? 'default' : 'outline'}
                                        >
                                            {workflowStatusLabel(workflow.active)}
                                        </Badge>
                                    </div>
                                    <div className="text-[13px] text-mute">
                                        {formatWorkflowTimestamp(workflow.updated_at)}
                                    </div>
                                    <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                                        {canManage ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEdit(workflow)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={togglingId === workflow.id}
                                                    onClick={() => toggleWorkflow(workflow)}
                                                >
                                                    {workflow.active ? 'Turn off' : 'Turn on'}
                                                </Button>
                                                <Form
                                                    action={`/crm/workflows/${workflow.id}`}
                                                    method="delete"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-brand"
                                                    >
                                                        Delete
                                                    </Button>
                                                </Form>
                                            </>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                            {workflows.length === 0 ? (
                                <li className="px-4 py-6 text-mute">
                                    No workflows yet. Use an Evo template or create one.
                                </li>
                            ) : null}
                        </ul>
                    </HairlinePanel>
                </div>
            </div>

            <CreateDrawer
                open={editorOpen}
                onOpenChange={requestClose}
                title={editorTitle}
                description="Save writes the structure. Enable is a separate action."
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
                        disabled={!canManage || submitting}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => requestClose(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!canManage || submitting}>
                            {submitting ? 'Saving…' : 'Save'}
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
