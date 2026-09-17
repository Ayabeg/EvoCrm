import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { listFilterChips } from '@/components/crm/list-query';
import type { StagePill } from '@/components/crm/stage-pills';
import { StagePills } from '@/components/crm/stage-pills';
import { DataWorkspace, viewHref } from '@/ds/workspace/DataWorkspace';
import { useQuickRecord } from '@/ds/workspace/quick-record';
import { isRecordType } from '@/ds/workspace/quick-record/ref';
import type { RowPeekContext } from '@/ds/workspace/quick-record/row-peek';
import type { RowId, WorkspaceSelection, WorkspaceSelectionInput } from '@/ds/workspace/selection';
import type {
    DataWorkspaceEmpty,
    DataWorkspacePaginator,
} from '@/ds/workspace/types';
import {
    applyStageFilter,
    fromActiveFilters,
    listQueryHref,
    navigateListQuery,
} from '@/lib/list-query';
import type { ListQueryFilterKey, ListQueryObject } from '@/lib/list-query';
import type {
    ListObjectType,
    ListViewColumn,
    ListViewMeta,
    SavedView,
} from '@/lib/list-view-config';
import { applyCompanyColumnContract } from '@/pages/crm/companies/company-columns';
import { applyContactColumnContract } from '@/pages/crm/contacts/contact-columns';
import { applyDealColumnContract } from '@/pages/crm/deals/deal-columns';
import { applyLeadColumnContract } from '@/pages/crm/leads/lead-columns';
import { applyQuoteColumnContract } from '@/pages/crm/quotes/quote-columns';

type Member = { id: number; name: string };
type Company = { id: number; name: string };
type Contact = { id: number; first_name: string; last_name?: string | null };
type Stage = { id: number; name: string; slug: string };

const OBJECT_NOUNS: Record<ListObjectType, string> = {
    contact: 'contacts',
    company: 'companies',
    deal: 'deals',
    ticket: 'tickets',
    quote: 'quotes',
    lead: 'leads',
};

type InertiaPaginator = {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
};

function toWorkspacePaginator(
    paginator?: DataWorkspacePaginator | InertiaPaginator,
): DataWorkspacePaginator | undefined {
    if (!paginator) {
        return undefined;
    }

    if ('perPage' in paginator) {
        return paginator;
    }

    return {
        page: paginator.page,
        perPage: paginator.per_page,
        total: paginator.total,
        lastPage: paginator.last_page,
    };
}

/**
 * Thin Inertia mapper. Domain result mode remains the default for
 * Tickets (CrmEmptyState + CrmListFooter in children until later).
 * Contacts, Companies, Leads, Deals, and Quotes use resultMode="shared-table".
 * Optional `board` is the P11 slot — Deals list does not pass it.
 * The deals board page passes `mode="board"` and the kanban node.
 */
export function CrmListShell<Row extends { id: RowId }>({
    title,
    entity,
    basePath,
    primaryLabel,
    activeFilters,
    savedFilters,
    listView,
    recordCount,
    members = [],
    cities = [],
    wilayas = [],
    companies = [],
    contacts = [],
    stages = [],
    stagePills = [],
    exportHref,
    createHref,
    onCreate,
    canCreate = true,
    banner,
    headerActions,
    layoutToggle,
    pipelineSwitcher,
    extraQuery,
    primaryClassName,
    className,
    contentClassName,
    selection,
    mode,
    onModeChange,
    board,
    resultMode = 'domain',
    rows,
    rowHref,
    empty,
    paginator,
    loading,
    bulk,
    children,
}: {
    title: string;
    entity: ListObjectType;
    basePath: string;
    primaryLabel: string;
    activeFilters: Record<string, unknown>;
    savedFilters?: SavedView[];
    listView?: ListViewMeta;
    recordCount?: number;
    members?: Member[];
    cities?: string[];
    wilayas?: string[];
    companies?: Company[];
    contacts?: Contact[];
    stages?: Stage[];
    stagePills?: StagePill[];
    exportHref?: string;
    createHref?: string;
    onCreate?: () => void;
    canCreate?: boolean;
    banner?: ReactNode;
    headerActions?: ReactNode;
    layoutToggle?: ReactNode;
    pipelineSwitcher?: ReactNode;
    extraQuery?: Record<string, string | number | null | undefined>;
    primaryClassName?: string;
    className?: string;
    contentClassName?: string;
    selection?: WorkspaceSelectionInput;
    mode?: 'list' | 'board';
    onModeChange?: (mode: 'list' | 'board') => void;
    board?: ReactNode;
    resultMode?: 'domain' | 'shared-table';
    rows?: Row[];
    rowHref?: (row: Row) => string;
    empty?: DataWorkspaceEmpty;
    paginator?: DataWorkspacePaginator | InertiaPaginator;
    loading?: boolean;
    bulk?: ReactNode | ((selection: WorkspaceSelection) => ReactNode);
    children?:
        | ReactNode
        | ((
              columns: ListViewColumn[],
              selection: WorkspaceSelection,
          ) => ReactNode);
}) {
    const { auth } = usePage().props as { auth: { user: { id: number } } };
    const { openRecord } = useQuickRecord();
    const [columns, setColumns] = useState<ListViewColumn[]>(listView?.columns ?? []);
    // Shared P10 seam. List pages do not pass per-object peek callbacks.
    // Row background → drawer. Identity Link / mailto / tel / checkbox → nested only.
    const onRowPeek = useCallback(
        (row: Row, context?: RowPeekContext) => {
            if (!isRecordType(entity)) {
                return;
            }

            openRecord({ type: entity, id: row.id }, { opener: context?.opener ?? null });
        },
        [entity, openRecord],
    );
    const noun = OBJECT_NOUNS[entity];
    const description =
        typeof recordCount === 'number'
            ? `${recordCount.toLocaleString()} ${noun}`
            : undefined;
    const query = extraQuery ?? {};
    const columnDefs =
        entity === 'contact'
            ? applyContactColumnContract(listView?.columnDefs ?? [])
            : entity === 'company'
              ? applyCompanyColumnContract(listView?.columnDefs ?? [])
              : entity === 'lead'
                ? applyLeadColumnContract(listView?.columnDefs ?? [])
                : entity === 'deal'
                  ? applyDealColumnContract(listView?.columnDefs ?? [])
                  : entity === 'quote'
                    ? applyQuoteColumnContract(listView?.columnDefs ?? [])
                    : (listView?.columnDefs ?? []);
    const sharedPaginator = toWorkspacePaginator(paginator);

    useEffect(() => {
        // Inertia can replace the active saved view without remounting this shell.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColumns(listView?.columns ?? []);
    }, [listView?.columns]);

    void companies;
    void contacts;
    void primaryClassName;

    const chrome = {
        object: entity,
        title,
        description,
        ...(canCreate
            ? {
                  primaryAction: {
                      label: primaryLabel,
                      onClick: () => {
                          if (onCreate) {
                              onCreate();

                              return;
                          }

                          window.location.href =
                              createHref ?? `${basePath}?create=1`;
                      },
                  },
              }
            : {}),
        views: savedFilters ?? [],
        activeViewId: activeFilters.filter_id
            ? String(activeFilters.filter_id)
            : String(activeFilters.view ?? 'all'),
        onViewChange: (id: string | null) => {
            // SavedViews <Link href={viewHref(...)}> owns the visit.
            // Do not router.get here — that was a double navigation.
            void viewHref(
                basePath,
                activeFilters,
                id,
                query,
                auth.user.id,
                entity as ListQueryObject,
            );
        },
        filters: activeFilters,
        onFiltersChange: () => {
            // AdvancedFilterDrawer applies via GET + list-query. Do not
            // invent a second filter write path here.
        },
        filterFields: listView?.filterFields ?? [],
        chips: listFilterChips(activeFilters, members).map((chip) => ({
            id: chip.key,
            label: `${chip.label}: ${chip.value}`,
            onRemove: () => {
                navigateListQuery(
                    basePath,
                    fromActiveFilters(activeFilters, query),
                    { filters: { [chip.key as ListQueryFilterKey]: null } },
                    entity as ListQueryObject,
                    { preserveState: true },
                );
            },
        })),
        columns,
        columnDefs,
        onColumnsChange: setColumns,
        sort: listView?.sort
            ? { id: listView.sort.field, dir: listView.sort.direction as 'asc' | 'desc' }
            : undefined,
        extraQuery: query,
        basePath,
        selection,
        filterContext: { members, cities, wilayas, stages },
        secondaryActions: headerActions,
        banner,
        filterExtra: (
            <>
                {layoutToggle}
                {pipelineSwitcher}
            </>
        ),
        toolbarExtra:
            resultMode === 'shared-table' && entity === 'deal' && stagePills.length > 0 ? (
                <StagePills
                    stages={stagePills}
                    activeSlug={
                        typeof activeFilters.stage === 'string'
                            ? activeFilters.stage
                            : null
                    }
                    hrefFor={(slug) =>
                        listQueryHref(
                            basePath,
                            applyStageFilter(
                                fromActiveFilters(activeFilters, query),
                                slug,
                                'stage',
                            ),
                            entity as ListQueryObject,
                        )
                    }
                />
            ) : undefined,
        mode: mode ?? (entity === 'deal' ? 'list' as const : undefined),
        onModeChange,
        board,
        className,
        contentClassName,
        exportHref,
        bulk,
    };

    if (resultMode === 'shared-table') {
        if (!rows || !rowHref || !empty) {
            throw new Error('shared-table CrmListShell requires rows, rowHref, and empty');
        }

        return (
            <DataWorkspace
                {...chrome}
                resultMode="shared-table"
                rows={rows}
                rowHref={rowHref}
                onRowPeek={onRowPeek}
                empty={empty}
                paginator={sharedPaginator}
                loading={loading}
            />
        );
    }

    return (
        <DataWorkspace
            {...chrome}
            resultMode="domain"
            renderResults={({ columns: nextColumns, selection: workspaceSelection }) => (
                <>
                    {entity === 'deal' || entity === 'ticket' ? (
                        <StagePills
                            stages={stagePills}
                            activeSlug={
                                entity === 'ticket'
                                    ? typeof activeFilters.status === 'string'
                                        ? activeFilters.status
                                        : null
                                    : typeof activeFilters.stage === 'string'
                                      ? activeFilters.stage
                                      : null
                            }
                            hrefFor={(slug) =>
                                listQueryHref(
                                    basePath,
                                    applyStageFilter(
                                        fromActiveFilters(activeFilters, query),
                                        slug,
                                        entity === 'ticket' ? 'status' : 'stage',
                                    ),
                                    entity as ListQueryObject,
                                )
                            }
                        />
                    ) : null}
                    {typeof children === 'function'
                        ? children(nextColumns, workspaceSelection)
                        : children}
                </>
            )}
        />
    );
}
