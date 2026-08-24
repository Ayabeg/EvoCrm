import ColumnFilterRow from '@/components/crm/column-filter-row';
import ColumnChooser from '@/components/crm/column-chooser';
import FilterBuilder from '@/components/crm/filter-builder';
import SavedViewTabs from '@/components/crm/saved-view-tabs';
import { StagePills, type StagePill } from '@/components/crm/stage-pills';
import type { ListViewColumn, ListViewFilters, ListViewMeta, SavedView } from '@/lib/list-view-config';
import { filterGroupsFromActive } from '@/lib/list-view-config';
import { Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

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
    companies = [],
    contacts = [],
    stages = [],
    stagePills = [],
    exportHref,
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
}) {
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const canManageSettings = ['owner', 'admin'].includes(auth.user.role);
    const [columns, setColumns] = useState<ListViewColumn[]>(listView?.columns ?? []);
    const [filterGroups, setFilterGroups] = useState<ListViewFilters>(() => filterGroupsFromActive(activeFilters));

    useEffect(() => {
        setFilterGroups(filterGroupsFromActive(activeFilters));
    }, [activeFilters]);

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
                        <ColumnChooser columnDefs={listView.columnDefs} columns={columns} onChange={setColumns} />
                    ) : null}
                    <Button asChild className="h-7 rounded-sm bg-ink px-2 text-[11px] text-canvas hover:bg-ink/90">
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
                    pills={stagePills}
                    activeStage={typeof activeFilters.stage === 'string' ? activeFilters.stage : null}
                    basePath={basePath}
                    activeFilters={activeFilters}
                />
            ) : null}
        </div>
    );
}
