import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { crmListHref, filterFields, listPageHref } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, PageHeaderAction } from '@/ds/chrome/PageHeader';
import { AdvancedFilterDrawer } from '@/ds/workspace/AdvancedFilterDrawer';
import { ListDataTable } from '@/ds/workspace/DataTable';
import { FilterBar } from '@/ds/workspace/FilterBar';
import { SavedViews } from '@/ds/workspace/SavedViews';
import type {
    DataWorkspaceProps,
    DataWorkspaceSharedTableProps,
} from '@/ds/workspace/types';
import { t } from '@/lib/i18n';
import { filterGroupsFromActive } from '@/lib/list-view-config';
import { cn } from '@/lib/utils';

const OBJECT_NOUNS = {
    contact: 'records',
    company: 'records',
    deal: 'records',
    ticket: 'records',
    quote: 'records',
} as const;

function renderSharedTableSurface<Row extends { id: number }>(
    props: DataWorkspaceSharedTableProps<Row>,
    selectedIds: number[],
    toggleRow: (id: number) => void,
    togglePage: () => void,
): ReactNode {
    void props.rowHref;
    void props.onRowPeek;

    if (props.mode === 'board' && props.board) {
        return props.board;
    }

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
            <div className="grid flex-1 place-items-center px-4 py-8 md:px-8">
                <EmptyState
                    density="page"
                    title={props.empty.title}
                    description={props.empty.body}
                    as="h2"
                    className="w-full max-w-md"
                    action={
                        props.empty.actionLabel ? (
                            <Button
                                type="button"
                                className="h-9"
                                onClick={props.primaryAction.onClick}
                            >
                                {props.empty.actionLabel}
                            </Button>
                        ) : undefined
                    }
                />
            </div>
        );
    }

    return (
        <ListDataTable
            object={props.object}
            rows={props.rows}
            columnDefs={props.columnDefs}
            columns={props.columns}
            basePath={props.basePath}
            selectable={props.selectable ?? false}
            selectedIds={selectedIds}
            onToggle={toggleRow}
            onTogglePage={togglePage}
        />
    );
}

export function DataWorkspace<Row extends { id: number }>(
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
    const filterRecord = filters as Record<string, unknown>;
    const sharedRows = resultMode === 'shared-table' ? props.rows : undefined;
    const selectedIds =
        resultMode === 'shared-table' ? (props.selectedIds ?? []) : [];
    const onSelectedIdsChange =
        resultMode === 'shared-table' ? props.onSelectedIdsChange : undefined;
    const selected = selectedIds.length > 0;
    const paginator = resultMode === 'shared-table' ? props.paginator : undefined;
    const resultSurface =
        resultMode === 'domain'
            ? typeof props.renderResults === 'function'
                ? props.renderResults(columns)
                : props.renderResults
            : renderSharedTableSurface(
                  props,
                  selectedIds,
                  (id) => {
                      if (!onSelectedIdsChange) {
                          return;
                      }

                      onSelectedIdsChange(
                          selectedIds.includes(id)
                              ? selectedIds.filter((value) => value !== id)
                              : [...selectedIds, id],
                      );
                  },
                  () => {
                      if (!onSelectedIdsChange || !sharedRows) {
                          return;
                      }

                      const pageIds = sharedRows.map((row) => row.id);
                      const allSelected = pageIds.every((id) =>
                          selectedIds.includes(id),
                      );

                      onSelectedIdsChange(
                          allSelected
                              ? selectedIds.filter((id) => !pageIds.includes(id))
                              : [...new Set([...selectedIds, ...pageIds])],
                      );
                  },
              );

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
            <FilterBar
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
            {selected && bulk ? bulk : null}
            <div className={cn('flex min-h-0 flex-1 flex-col bg-canvas', contentClassName)}>
                {resultSurface}
                {resultMode === 'shared-table' && paginator ? (
                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-canvas px-4 py-2 text-[12px] text-mute md:px-8">
                        <span>
                            {t('Showing :count of :total :noun', {
                                count: (sharedRows?.length ?? 0).toLocaleString(),
                                total: paginator.total.toLocaleString(),
                                noun: t(OBJECT_NOUNS[object]),
                            })}
                        </span>
                        <nav className="flex items-center gap-2" aria-label={t('Pagination')}>
                            {paginator.page > 1 ? (
                                <Link
                                    href={listPageHref(
                                        basePath,
                                        filterRecord,
                                        paginator.page - 1,
                                        extraQuery,
                                    )}
                                    className="hover:text-ink"
                                >
                                    {t('Prev')}
                                </Link>
                            ) : (
                                <span className="opacity-40">{t('Prev')}</span>
                            )}
                            <span>
                                {paginator.page} / {paginator.lastPage}
                            </span>
                            {paginator.page < paginator.lastPage ? (
                                <Link
                                    href={listPageHref(
                                        basePath,
                                        filterRecord,
                                        paginator.page + 1,
                                        extraQuery,
                                    )}
                                    className="hover:text-ink"
                                >
                                    {t('Next')}
                                </Link>
                            ) : (
                                <span className="opacity-40">{t('Next')}</span>
                            )}
                        </nav>
                    </footer>
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
): string {
    const fields = filterFields(filters);

    if (id && /^\d+$/.test(id)) {
        return crmListHref(basePath, { ...extraQuery, filter_id: Number(id) });
    }

    const patch: Record<string, unknown> = {
        view: id ?? 'all',
        filter_id: null,
        owner: id === 'my' && ownerId ? ownerId : null,
    };

    return crmListHref(basePath, { ...fields, ...extraQuery }, patch);
}

export type { DataWorkspaceProps } from '@/ds/workspace/types';
