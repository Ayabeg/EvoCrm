import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ListView } from '@/components/crm/list-chrome';
import ListToolbar from '@/components/crm/list-toolbar';
import { RecordHubHeader, RecordHubPanel } from '@/components/crm/record-hub';
import type { StagePill } from '@/components/crm/stage-pills';
import type {
    ListViewColumn,
    ListViewMeta,
    SavedView,
} from '@/lib/list-view-config';

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
    createHref,
    banner,
    views = [],
    activeView = '',
    headerActions,
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
    createHref?: string;
    banner?: ReactNode;
    views?: ListView[];
    activeView?: string;
    headerActions?: ReactNode;
    children: ReactNode | ((columns: ListViewColumn[]) => ReactNode);
}) {
    const [columns, setColumns] = useState<ListViewColumn[]>(
        listView?.columns ?? [],
    );

    useEffect(() => {
        // Inertia can replace the active saved view without remounting this shell.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColumns(listView?.columns ?? []);
    }, [listView?.columns]);

    return (
        <div className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink">
            <RecordHubHeader
                title={title}
                views={views}
                activeView={activeView}
                primaryLabel={primaryLabel}
                onPrimary={() => {
                    window.location.href = createHref ?? `${basePath}?create=1`;
                }}
                headerActions={headerActions}
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
            <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
                <RecordHubPanel>
                    {typeof children === 'function'
                        ? children(columns)
                        : children}
                </RecordHubPanel>
            </div>
        </div>
    );
}
