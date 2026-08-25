import ListToolbar from '@/components/crm/list-toolbar';
import { CrmListHeader } from '@/components/crm/list-chrome';
import type { ListViewColumn, ListViewMeta, SavedView } from '@/lib/list-view-config';
import type { StagePill } from '@/components/crm/stage-pills';
import { useEffect, useState, type ReactNode } from 'react';

type Member = { id: number; name: string };
type Company = { id: number; name: string };
type Contact = { id: number; first_name: string; last_name?: string | null };
type Stage = { id: number; name: string; slug: string };

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
    exportHref,
    banner,
    children,
}: {
    title: string;
    entity: 'contact' | 'company' | 'deal';
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
    banner?: ReactNode;
    children: ReactNode | ((columns: ListViewColumn[]) => ReactNode);
}) {
    const [columns, setColumns] = useState<ListViewColumn[]>(listView?.columns ?? []);

    useEffect(() => {
        setColumns(listView?.columns ?? []);
    }, [listView?.columns]);

    return (
        <div className="flex h-full min-h-0 flex-col bg-canvas text-ui text-ink">
            <CrmListHeader
                title={title}
                views={[]}
                activeView=""
                primaryLabel={primaryLabel}
                onPrimary={() => {
                    window.location.href = `${basePath}?create=1`;
                }}
            />
            {banner}
            <ListToolbar
                entity={entity}
                basePath={basePath}
                activeFilters={activeFilters}
                savedFilters={savedFilters}
                listView={listView}
                recordCount={recordCount}
                members={members}
                cities={cities}
                wilayas={wilayas}
                companies={companies}
                contacts={contacts}
                stages={stages}
                stagePills={stagePills}
                exportHref={exportHref}
                columns={columns}
                onColumnsChange={setColumns}
            />
            {typeof children === 'function' ? children(columns) : children}
        </div>
    );
}
