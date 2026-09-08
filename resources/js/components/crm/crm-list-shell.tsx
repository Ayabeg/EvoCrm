import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CrmObjectHeader } from '@/components/crm/crm-object-header';
import ListToolbar from '@/components/crm/list-toolbar';
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

const OBJECT_NOUNS: Record<'contact' | 'company' | 'deal', string> = {
    contact: 'contacts',
    company: 'companies',
    deal: 'deals',
};

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
    banner,
    headerActions,
    layoutToggle,
    pipelineSwitcher,
    extraQuery,
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
    headerActions?: ReactNode;
    layoutToggle?: ReactNode;
    pipelineSwitcher?: ReactNode;
    extraQuery?: Record<string, string | number | null | undefined>;
    children: ReactNode | ((columns: ListViewColumn[]) => ReactNode);
}) {
    const [columns, setColumns] = useState<ListViewColumn[]>(
        listView?.columns ?? [],
    );
    const noun = OBJECT_NOUNS[entity];
    const description =
        typeof recordCount === 'number'
            ? `${recordCount.toLocaleString()} ${noun}`
            : undefined;

    useEffect(() => {
        // Inertia can replace the active saved view without remounting this shell.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColumns(listView?.columns ?? []);
    }, [listView?.columns]);

    return (
        <div
            className="flex h-full min-h-0 flex-col bg-canvas-soft text-ui text-ink"
            data-crm="list-workspace"
        >
            <CrmObjectHeader
                title={title}
                description={description}
                primaryLabel={primaryLabel}
                onPrimary={() => {
                    window.location.href = createHref ?? `${basePath}?create=1`;
                }}
                secondary={headerActions}
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
                columns={columns}
                onColumnsChange={setColumns}
                layoutToggle={layoutToggle}
                pipelineSwitcher={pipelineSwitcher}
                extraQuery={extraQuery}
            />
            <div className="flex min-h-0 flex-1 flex-col bg-canvas">
                {typeof children === 'function' ? children(columns) : children}
            </div>
        </div>
    );
}
