import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ColumnChooser from '@/components/crm/column-chooser';
import ColumnFilterRow from '@/components/crm/column-filter-row';
import { CrmActiveFilters } from '@/components/crm/crm-active-filters';
import FilterBuilder from '@/components/crm/filter-builder';
import { crmListHref, filterFields, listFilterChips } from '@/components/crm/list-query';
import SavedViewTabs from '@/components/crm/saved-view-tabs';
import { StagePills } from '@/components/crm/stage-pills';
import type { StagePill } from '@/components/crm/stage-pills';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type {
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
}: {
    entity: 'contact' | 'company' | 'deal';
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

    return (
        <div className="border-b border-hairline bg-canvas" data-crm="list-toolbar">
            <div className="flex items-center gap-2 px-4 py-1.5 sm:px-6">
                <div className="min-w-0 flex-1">
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
                />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-[12px]"
                    aria-expanded={filtersOpen}
                    aria-controls="crm-list-filters"
                    onClick={() => setFiltersOpen((open) => !open)}
                >
                    Filter{activeCount > 0 ? ` ${activeCount}` : ''}
                </Button>
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
                            <SheetTitle>
                                Filter{' '}
                                {entity === 'deal'
                                    ? 'deals'
                                    : entity === 'company'
                                      ? 'companies'
                                      : 'contacts'}
                            </SheetTitle>
                        </SheetHeader>
                        <div id="crm-list-filters">{filterPanel}</div>
                    </SheetContent>
                </Sheet>
            ) : filtersOpen ? (
                <div id="crm-list-filters">{filterPanel}</div>
            ) : null}
            {entity === 'deal' ? (
                <StagePills
                    stages={stagePills}
                    activeSlug={
                        typeof activeFilters.stage === 'string'
                            ? activeFilters.stage
                            : null
                    }
                    hrefFor={(slug) =>
                        crmListHref(basePath, filterFields(activeFilters), {
                            stage: slug,
                        })
                    }
                />
            ) : null}
        </div>
    );
}
