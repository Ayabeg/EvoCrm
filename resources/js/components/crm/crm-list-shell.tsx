import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { crmListHref, filterFields, listFilterChips } from '@/components/crm/list-query';
import type { StagePill } from '@/components/crm/stage-pills';
import { StagePills } from '@/components/crm/stage-pills';
import { DataWorkspace, viewHref } from '@/ds/workspace/DataWorkspace';
import type { WorkspaceSelection, WorkspaceSelectionInput } from '@/ds/workspace/selection';
import {
    fromActiveFilters,
    navigateListQuery,
} from '@/lib/list-query';
import type { ListQueryFilterKey, ListQueryObject } from '@/lib/list-query';
import type {
    ListObjectType,
    ListViewColumn,
    ListViewMeta,
    SavedView,
} from '@/lib/list-view-config';

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
};

/** Thin Inertia mapper. Domain result mode; selection is a workspace capability. */
export function CrmListShell({
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
    createHref,
    onCreate,
    banner,
    headerActions,
    layoutToggle,
    pipelineSwitcher,
    extraQuery,
    primaryClassName,
    className,
    contentClassName,
    selection,
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
    banner?: ReactNode;
    headerActions?: ReactNode;
    layoutToggle?: ReactNode;
    pipelineSwitcher?: ReactNode;
    extraQuery?: Record<string, string | number | null | undefined>;
    primaryClassName?: string;
    className?: string;
    contentClassName?: string;
    selection?: WorkspaceSelectionInput;
    children:
        | ReactNode
        | ((
              columns: ListViewColumn[],
              selection: WorkspaceSelection,
          ) => ReactNode);
}) {
    const { auth } = usePage().props as { auth: { user: { id: number } } };
    const [columns, setColumns] = useState<ListViewColumn[]>(listView?.columns ?? []);
    const noun = OBJECT_NOUNS[entity];
    const description =
        typeof recordCount === 'number'
            ? `${recordCount.toLocaleString()} ${noun}`
            : undefined;
    const query = extraQuery ?? {};

    useEffect(() => {
        // Inertia can replace the active saved view without remounting this shell.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColumns(listView?.columns ?? []);
    }, [listView?.columns]);

    void companies;
    void contacts;
    void primaryClassName;

    return (
        <DataWorkspace
            resultMode="domain"
            object={entity}
            title={title}
            description={description}
            primaryAction={{
                label: primaryLabel,
                onClick: () => {
                    if (onCreate) {
                        onCreate();

                        return;
                    }

                    window.location.href = createHref ?? `${basePath}?create=1`;
                },
            }}
            views={savedFilters ?? []}
            activeViewId={
                activeFilters.filter_id
                    ? String(activeFilters.filter_id)
                    : String(activeFilters.view ?? 'all')
            }
            onViewChange={(id) => {
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
            }}
            filters={activeFilters}
            onFiltersChange={() => {
                // AdvancedFilterDrawer applies via GET + list-query. Do not
                // invent a second filter write path here.
            }}
            filterFields={listView?.filterFields ?? []}
            chips={listFilterChips(activeFilters, members).map((chip) => ({
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
            }))}
            columns={columns}
            columnDefs={listView?.columnDefs ?? []}
            onColumnsChange={setColumns}
            sort={
                listView?.sort
                    ? { id: listView.sort.field, dir: listView.sort.direction }
                    : undefined
            }
            extraQuery={query}
            basePath={basePath}
            selection={selection}
            filterContext={{ members, cities, wilayas, stages }}
            secondaryActions={headerActions}
            banner={banner}
            filterExtra={
                <>
                    {layoutToggle}
                    {pipelineSwitcher}
                </>
            }
            mode={entity === 'deal' ? 'list' : undefined}
            className={className}
            contentClassName={contentClassName}
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
                                crmListHref(basePath, filterFields(activeFilters), {
                                    [entity === 'ticket' ? 'status' : 'stage']: slug,
                                })
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
