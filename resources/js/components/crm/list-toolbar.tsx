import { router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import ColumnChooser from '@/components/crm/column-chooser';
import ColumnFilterRow from '@/components/crm/column-filter-row';
import { CrmActiveFilters } from '@/components/crm/crm-active-filters';
import FilterBuilder from '@/components/crm/filter-builder';
import { crmListHref, filterFields, listFilterChips } from '@/components/crm/list-query';
import SavedViewTabs from '@/components/crm/saved-view-tabs';
import { StagePills } from '@/components/crm/stage-pills';
import type { StagePill } from '@/components/crm/stage-pills';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/evo/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type {
    ListObjectType,
    ListViewColumn,
    ListViewFilters,
    ListViewMeta,
    SavedView,
} from '@/lib/list-view-config';
import { filterGroupsFromActive } from '@/lib/list-view-config';

type Member = { id: number; name: string };
type Company = { id: number; name: string };
type Contact = { id: number; first_name: string; last_name?: string | null };
type Stage = { id: number; name: string; slug: string };

export default function ListToolbar({
    entity,
    basePath,
    activeFilters = {},
    savedFilters = [],
    listView,
    recordCount,
    members = [],
    cities = [],
    wilayas = [],
    stages = [],
    stagePills = [],
    columns: controlledColumns,
    onColumnsChange,
    layoutToggle,
    pipelineSwitcher,
    extraQuery = {},
}: {
    entity: ListObjectType;
    basePath: string;
    activeFilters?: Record<string, unknown>;
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
    columns?: ListViewColumn[];
    onColumnsChange?: (columns: ListViewColumn[]) => void;
    layoutToggle?: ReactNode;
    pipelineSwitcher?: ReactNode;
    extraQuery?: Record<string, string | number | null | undefined>;
}) {
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const canManageSettings = ['owner', 'admin'].includes(auth.user.role);
    const isMobile = useIsMobile();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [internalColumns, setInternalColumns] = useState<ListViewColumn[]>(
        listView?.columns ?? [],
    );
    const columns = controlledColumns ?? internalColumns;
    const setColumns = onColumnsChange ?? setInternalColumns;
    const [filterGroups, setFilterGroups] = useState<ListViewFilters>(() =>
        filterGroupsFromActive(activeFilters),
    );
    const activeCount = listFilterChips(activeFilters, members).length;

    useEffect(() => {
        // Server-provided filters can change during an Inertia partial reload.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFilterGroups(filterGroupsFromActive(activeFilters));
    }, [activeFilters]);

    useEffect(() => {
        if (controlledColumns === undefined) {
            // Keep uncontrolled columns aligned with the selected saved view.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInternalColumns(listView?.columns ?? []);
        }
    }, [controlledColumns, listView?.columns]);

    const filterPanel = (
        <ColumnFilterRow
            action={basePath}
            entity={entity}
            activeFilters={activeFilters}
            members={members}
            cities={cities}
            wilayas={wilayas}
            columns={columns}
            filterGroups={filterGroups}
            extraQuery={extraQuery}
            filterBuilder={
                listView ? (
                    <FilterBuilder
                        entity={entity}
                        fields={listView.filterFields}
                        value={filterGroups}
                        onChange={setFilterGroups}
                        members={members}
                        cities={cities}
                        wilayas={wilayas}
                        stages={stages}
                    />
                ) : null
            }
        />
    );

    const searchPlaceholder =
        entity === 'deal'
            ? 'Search name or description'
            : entity === 'company'
              ? 'Search companies'
              : entity === 'ticket'
                ? 'Search number or subject'
                : entity === 'quote'
                  ? 'Search quote or deal'
                  : 'Search name, email, or phone';

    return (
        <div className="border-b border-hairline bg-canvas" data-crm="list-toolbar">
            <div className="px-4 pt-2 sm:px-6">
                <SavedViewTabs
                    basePath={basePath}
                    entity={entity}
                    activeFilters={activeFilters}
                    savedFilters={savedFilters}
                    columns={columns}
                    listView={listView}
                    recordCount={recordCount}
                    filterGroups={filterGroups}
                    canManageSettings={canManageSettings}
                    extraQuery={extraQuery}
                />
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
                {layoutToggle}
                {pipelineSwitcher}
                {isMobile ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-[12px]"
                        aria-expanded={filtersOpen}
                        aria-controls="crm-list-filters"
                        onClick={() => setFiltersOpen((open) => !open)}
                    >
                        Advanced filters{activeCount > 0 ? ` ${activeCount}` : ''}
                    </Button>
                ) : (
                    <div id="crm-list-filters" className="min-w-0 flex-1">
                        {filterPanel}
                    </div>
                )}
                <form
                    className="ms-auto flex min-w-0 max-w-xs flex-1 items-center"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const q = String(new FormData(event.currentTarget).get('q') ?? '');
                        router.get(
                            crmListHref(
                                basePath,
                                { ...filterFields(activeFilters), ...extraQuery },
                                { q: q || null },
                            ),
                            {},
                            { preserveState: true },
                        );
                    }}
                >
                    <Input
                        name="q"
                        defaultValue={String(activeFilters.q ?? '')}
                        placeholder={searchPlaceholder}
                        className="h-7 rounded-sm text-[12px]"
                        aria-label="Search list"
                    />
                </form>
                {listView ? (
                    <ColumnChooser
                        columnDefs={listView.columnDefs}
                        columns={columns}
                        onChange={setColumns}
                    />
                ) : null}
            </div>
            <CrmActiveFilters
                basePath={basePath}
                activeFilters={activeFilters}
                members={members}
            />
            {isMobile ? (
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Advanced filters</SheetTitle>
                        </SheetHeader>
                        <div id="crm-list-filters-mobile">{filterPanel}</div>
                    </SheetContent>
                </Sheet>
            ) : null}
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
        </div>
    );
}
