import { workflowTriggerLabel } from '@/evo/automation/labels';
import { DataGrid } from '@/evo/data/data-grid';
import type { EvoDataGridColumn } from '@/evo/data/data-grid';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';
import {
    formatWorkflowTimestamp,
    summarizeWorkflowRow,
    workflowStatusLabel,
} from '@/lib/workflow-authoring';
import type {
    WorkflowConditionField,
    WorkflowRow,
    WorkflowStage,
    WorkflowTemplate,
    WorkflowVersionRow,
} from '@/lib/workflow-authoring';

export function WorkflowList({
    workflows,
    templates,
    conditionFields,
    stages,
    canManage,
    mutating,
    onEdit,
    onToggle,
    onTest,
    onDelete,
    onRestore,
    onUseTemplate,
}: {
    workflows: WorkflowRow[];
    templates: WorkflowTemplate[];
    conditionFields: WorkflowConditionField[];
    stages: WorkflowStage[];
    canManage: boolean;
    mutating: boolean;
    onEdit: (workflow: WorkflowRow) => void;
    onToggle: (workflow: WorkflowRow) => void;
    onTest?: (workflow: WorkflowRow) => void;
    onDelete: (workflow: WorkflowRow) => void;
    onRestore: (workflow: WorkflowRow, version: WorkflowVersionRow) => void;
    onUseTemplate: (key: string) => void;
}) {
    const versionsFor = (workflow: WorkflowRow): WorkflowVersionRow[] =>
        workflow.versions ?? [];

    const columns: EvoDataGridColumn<WorkflowRow>[] = [
        {
            id: 'name',
            header: t('Name'),
            accessorFn: (row) => row.name,
            cell: ({ row }) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--evo-ink)]">
                        {row.original.name}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-4 text-[var(--evo-ink-muted)]">
                        {summarizeWorkflowRow(
                            row.original,
                            conditionFields,
                            stages,
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'trigger',
            header: t('Trigger'),
            accessorFn: (row) => row.trigger,
            cell: ({ row }) => (
                <div className="text-[13px] text-[var(--evo-ink)]">
                    {workflowTriggerLabel(row.original.trigger)}
                    {row.original.trigger_stage
                        ? ` → ${row.original.trigger_stage}`
                        : ''}
                    {row.original.trigger_status_label
                        ? ` → ${row.original.trigger_status_label}`
                        : ''}
                </div>
            ),
        },
        {
            id: 'status',
            header: t('Status'),
            accessorFn: (row) => workflowStatusLabel(row.active),
            cell: ({ row }) => (
                <Badge variant={row.original.active ? 'default' : 'outline'}>
                    {t(workflowStatusLabel(row.original.active))}
                </Badge>
            ),
        },
        {
            id: 'updated',
            header: t('Last modified'),
            accessorFn: (row) => row.updated_at ?? '',
            cell: ({ row }) => formatWorkflowTimestamp(row.original.updated_at),
        },
        {
            id: 'versions',
            header: t('Versions'),
            accessorFn: (row) => versionsFor(row).length,
            cell: ({ row }) => (
                <details className="text-[12px]">
                    <summary className="cursor-pointer text-[var(--evo-ink-muted)] hover:text-[var(--evo-ink)]">
                        {versionsFor(row.original).length} {t('saved')}
                    </summary>
                    <div className="mt-2 min-w-48 space-y-1 rounded border border-[var(--evo-hairline)] bg-[var(--evo-surface)] p-2">
                        {versionsFor(row.original).map((version) => (
                            <div
                                key={version.id}
                                className="flex items-center justify-between gap-2"
                            >
                                <span className="text-[var(--evo-ink-muted)]">
                                    v{version.version}
                                    {version.created_by
                                        ? ` · ${version.created_by}`
                                        : ''}
                                </span>
                                {canManage ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={mutating}
                                        onClick={() =>
                                            onRestore(row.original, version)
                                        }
                                    >
                                        {t('Restore')}
                                    </Button>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </details>
            ),
        },
    ];

    return (
        <div className="space-y-5">
            <section className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] bg-[var(--evo-surface)]">
                <div className="border-b border-[var(--evo-hairline)] px-4 py-3">
                    <h2 className="text-[13px] font-medium text-[var(--evo-ink)]">
                        {t('Evo templates')}
                    </h2>
                    <p className="mt-1 text-[12px] text-[var(--evo-ink-muted)]">
                        {t(
                            'Starters that write a valid workflow into this workspace.',
                        )}
                    </p>
                </div>
                <ul className="divide-y divide-[var(--evo-hairline)]">
                    {templates.map((template) => (
                        <li
                            key={template.key}
                            className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-[var(--evo-ink)]">
                                    {template.name}
                                </p>
                                <p className="mt-0.5 text-[12px] text-[var(--evo-ink-muted)]">
                                    {template.description}
                                </p>
                            </div>
                            {canManage ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    disabled={mutating}
                                    onClick={() => onUseTemplate(template.key)}
                                >
                                    {t('Use template')}
                                </Button>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </section>

            <p className="px-1 text-[12px] text-[var(--evo-ink-muted)]">
                {t(
                    'Workflow versions keep configuration changes recoverable. Turning a workflow off cancels pending delayed runs and does not rewrite execution history.',
                )}
            </p>

            <div data-workflow="list">
                <DataGrid
                    columns={columns}
                    data={workflows}
                    getRowId={(row) => String(row.id)}
                    density="standard"
                    enableSelection={false}
                    pagination="none"
                    hideColumnPicker
                    embedded
                    enableSorting={false}
                    emptyTitle={t(
                        'No workflows yet. Use an Evo template or create one.',
                    )}
                    rowActions={
                        canManage
                            ? (workflow) => (
                                  <div className="flex flex-wrap gap-2">
                                      <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={mutating}
                                          onClick={() => onEdit(workflow)}
                                      >
                                          {t('Edit')}
                                      </Button>
                                      <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={mutating}
                                          onClick={() => onToggle(workflow)}
                                      >
                                          {workflow.active
                                              ? t('Turn off')
                                              : t('Turn on')}
                                      </Button>
                                      {onTest ? (
                                          <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              disabled={mutating}
                                              onClick={() => onTest(workflow)}
                                          >
                                              {t('Dry run')}
                                          </Button>
                                      ) : null}
                                      <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={mutating}
                                          onClick={() => onDelete(workflow)}
                                      >
                                          {t('Delete')}
                                      </Button>
                                  </div>
                              )
                            : undefined
                    }
                />
            </div>
        </div>
    );
}
