import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, PageHeaderAction } from '@/ds/chrome/PageHeader';
import { AdvancedFilterDrawer } from '@/ds/workspace/AdvancedFilterDrawer';
import { ListDataTable } from '@/ds/workspace/DataTable';
import { FilterBar } from '@/ds/workspace/FilterBar';
import { SavedViews } from '@/ds/workspace/SavedViews';
import { useWorkspaceSelection } from '@/ds/workspace/selection';
import type { RowId, WorkspaceSelection } from '@/ds/workspace/selection';
import { resolveWorkspaceBoardSlot } from '@/ds/workspace/surface';
import type {
    DataWorkspaceProps,
    DataWorkspaceSharedTableProps,
} from '@/ds/workspace/types';
import { WorkspaceEmpty, workspaceEmptyAction } from '@/ds/workspace/WorkspaceEmpty';
import { WorkspacePaginator } from '@/ds/workspace/WorkspacePaginator';
import { t } from '@/lib/i18n';
import {
    applyBuiltInView,
    applySavedFilter,
    fromActiveFilters,
    listQueryAdapter,
    listQueryHref,
} from '@/lib/list-query';
import type { ListQueryObject } from '@/lib/list-query';
import { filterGroupsFromActive } from '@/lib/list-view-config';
import { cn } from '@/lib/utils';

function renderSharedTableSurface<Row extends { id: RowId }>(
    props: DataWorkspaceSharedTableProps<Row>,
    selection: WorkspaceSelection,
): ReactNode {
    // onRowPeek is reserved for P09 QuickRecordDrawer. P10 activates the seam.

    if (props.loading) {
        return (
            <div className="space-y-2 px-4 py-4 md:px-8" aria-busy="true">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    if (props.rows.length === 0) {
        return (
            <WorkspaceEmpty
                empty={props.empty}
                action={workspaceEmptyAction(
                    props.empty.actionLabel,
                    props.primaryAction.onClick,
                )}
            />
        );
    }

    return (
        <ListDataTable
            object={props.object}
            rows={props.rows}
            columnDefs={props.columnDefs}
            columns={props.columns}
            basePath={props.basePath}
            rowHref={props.rowHref}
            onRowPeek={props.onRowPeek}
            selectable={props.selection?.selectable ?? false}
            selectedIds={selection.selectedIds}
            onToggle={selection.toggleOne}
            onTogglePage={selection.togglePage}
            isRowSelectable={props.selection?.isRowSelectable}
        />
    );
}

export function DataWorkspace<Row extends { id: RowId }>(
    props: DataWorkspaceProps<Row>,
) {
    const {
        object,
        title,
        description,
        primaryAction,
        views,
        activeViewId,
        onViewChange,
        onViewSave,
        filters,
        onFiltersChange,
        filterFields: fieldDefs,
        chips = [],
        columns,
        columnDefs,
        onColumnsChange,
        bulk,
        exportHref,
        mode = 'list',
        onModeChange,
        extraQuery = {},
        basePath,
        filterContext,
        secondaryActions,
        banner,
        filterExtra,
        toolbarExtra,
        className,
        contentClassName,
        resultMode,
    } = props;
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const canManageSettings = ['owner', 'admin'].includes(auth.user.role);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const queryEnabled = listQueryAdapter(object as ListQueryObject).supportsQuery;
    const filterRecord = filters as Record<string, unknown>;
    const sharedRows = resultMode === 'shared-table' ? props.rows : undefined;
    const paginator = resultMode === 'shared-table' ? props.paginator : undefined;
    const selectionInput = props.selection ?? { mode: 'uncontrolled' as const };
    const selection = useWorkspaceSelection({
        ...selectionInput,
        pageIds:
            selectionInput.pageIds ??
            (sharedRows ? sharedRows.map((row) => row.id) : []),
    });
    const boardSurface = resolveWorkspaceBoardSlot({
        mode,
        board: props.board,
    });
    const resultSurface =
        boardSurface ??
        (resultMode === 'domain'
            ? typeof props.renderResults === 'function'
                ? props.renderResults({ columns, selection })
                : props.renderResults
            : renderSharedTableSurface(props, selection));

    return (
        <div
            className={cn(
                'flex h-full min-h-0 flex-col bg-canvas text-ui text-ink',
                className,
            )}
            data-crm="list-workspace"
            data-ds="data-workspace"
            data-object={object}
            data-mode={mode}
            data-result-mode={resultMode}
            data-bulk-active={selection.bulkActive ? 'true' : 'false'}
            data-selected-count={selection.selectedCount}
        >
            <PageHeader
                title={title}
                description={description}
                secondaryActions={secondaryActions}
                primaryAction={
                    <PageHeaderAction
                        label={primaryAction.label}
                        onClick={primaryAction.onClick}
                    />
                }
            />
            {banner}
            {queryEnabled ? (
                <SavedViews
                    object={object}
                    basePath={basePath}
                    views={views}
                    activeViewId={activeViewId}
                    onViewChange={onViewChange}
                    onViewSave={onViewSave}
                    filters={filterRecord}
                    columns={columns}
                    extraQuery={extraQuery}
                    canManageSettings={canManageSettings}
                />
            ) : null}
            <FilterBar
                object={object as ListQueryObject}
                basePath={basePath}
                filters={filterRecord}
                filterFields={fieldDefs}
                filterContext={filterContext}
                extraQuery={extraQuery}
                chips={chips}
                columns={columns}
                columnDefs={columnDefs}
                onColumnsChange={onColumnsChange}
                onAdvanced={() => setAdvancedOpen(true)}
                extra={
                    <>
                        {onModeChange ? (
                            <div className="inline-flex h-9 overflow-hidden rounded-md border border-hairline">
                                <button
                                    type="button"
                                    className={cn(
                                        'h-9 px-3 text-[13px]',
                                        mode === 'list'
                                            ? 'bg-sidebar-accent font-medium text-ink'
                                            : 'text-mute hover:text-ink',
                                    )}
                                    onClick={() => onModeChange('list')}
                                >
                                    {t('List')}
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        'h-9 px-3 text-[13px]',
                                        mode === 'board'
                                            ? 'bg-sidebar-accent font-medium text-ink'
                                            : 'text-mute hover:text-ink',
                                    )}
                                    onClick={() => onModeChange('board')}
                                >
                                    {t('Board')}
                                </button>
                            </div>
                        ) : null}
                        {filterExtra}
                    </>
                }
            />
            {toolbarExtra}
            {queryEnabled ? (
                <AdvancedFilterDrawer
                    open={advancedOpen}
                    onOpenChange={setAdvancedOpen}
                    object={object}
                    basePath={basePath}
                    filters={filterRecord}
                    filterFields={fieldDefs}
                    filterContext={filterContext}
                    extraQuery={extraQuery}
                    onFiltersChange={onFiltersChange}
                />
            ) : null}
            {selection.bulkActive && bulk
                ? typeof bulk === 'function'
                    ? bulk(selection)
                    : bulk
                : null}
            <div className={cn('flex min-h-0 flex-1 flex-col bg-canvas', contentClassName)}>
                {resultSurface}
                {resultMode === 'shared-table' && paginator && !boardSurface ? (
                    <WorkspacePaginator
                        object={object}
                        basePath={basePath}
                        filters={filterRecord}
                        extraQuery={extraQuery}
                        pageCount={sharedRows?.length ?? 0}
                        paginator={paginator}
                        exportHref={exportHref}
                    />
                ) : null}
            </div>
        </div>
    );
}

export function workspaceViewId(filters: Record<string, unknown>): string {
    if (filters.filter_id) {
        return String(filters.filter_id);
    }

    return String(filters.view ?? 'all');
}

export function workspaceFilterRecord(
    filters: DataWorkspaceProps['filters'],
): Record<string, unknown> {
    if ('groups' in (filters as object) && (filters as { groups?: unknown }).groups) {
        return { filter_groups: filters };
    }

    return filters as Record<string, unknown>;
}

export function defaultWorkspaceFilters(
    filters: DataWorkspaceProps['filters'],
) {
    return filterGroupsFromActive(workspaceFilterRecord(filters));
}

export function viewHref(
    basePath: string,
    filters: Record<string, unknown>,
    id: string | null,
    extraQuery: Record<string, string | number | null | undefined> = {},
    ownerId?: number,
    object: ListQueryObject = 'contact',
): string {
    const current = fromActiveFilters(filters, extraQuery);

    if (id && /^\d+$/.test(id)) {
        return listQueryHref(basePath, applySavedFilter(current, Number(id)), object);
    }

    return listQueryHref(
        basePath,
        applyBuiltInView(
            current,
            id ?? 'all',
            id === 'my' && ownerId ? ownerId : null,
        ),
        object,
    );
}

export type { DataWorkspaceProps } from '@/ds/workspace/types';
