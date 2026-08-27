import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import ColumnChooser from '@/components/crm/column-chooser';
import ColumnFilterRow from '@/components/crm/column-filter-row';
import FilterBuilder from '@/components/crm/filter-builder';
import { crmListHref, filterFields } from '@/components/crm/list-query';
import SavedViewTabs from '@/components/crm/saved-view-tabs';
import { StagePills } from '@/components/crm/stage-pills';
import type { StagePill } from '@/components/crm/stage-pills';
import { Button } from '@/components/ui/button';
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
    exportHref,
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
    const [internalColumns, setInternalColumns] = useState<ListViewColumn[]>(
        listView?.columns ?? [],
    );
    const columns = controlledColumns ?? internalColumns;
    const setColumns = onColumnsChange ?? setInternalColumns;
    const [filterGroups, setFilterGroups] = useState<ListViewFilters>(() =>
        filterGroupsFromActive(activeFilters),
    );

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

    return (
        <div className="border-b border-hairline bg-canvas">
            <div className="flex items-center justify-between gap-2 pr-3">
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
                <div className="flex items-center gap-1">
                    {listView ? (
                        <ColumnChooser
                            columnDefs={listView.columnDefs}
                            columns={columns}
                            onChange={setColumns}
                        />
                    ) : null}
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                    >
                        <Link href={`${basePath}?create=1`}>
                            <Plus className="mr-1 size-3" />
                            Create
                        </Link>
                    </Button>
                </div>
            </div>
            <ColumnFilterRow
                action={basePath}
                entity={entity}
                activeFilters={activeFilters}
                members={members}
                cities={cities}
                wilayas={wilayas}
                exportHref={exportHref}
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
