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
    onUseTemplate: (key: string) => void;
}) {
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
                    'History stays inspectable when a workflow is Draft. Turning a workflow off cancels pending delayed runs and does not rewrite completed or failed history.',
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
