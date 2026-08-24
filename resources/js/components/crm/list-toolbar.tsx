import ColumnFilterRow from '@/components/crm/column-filter-row';
import CreateDrawer from '@/components/crm/create-drawer';
import SavedViewTabs from '@/components/crm/saved-view-tabs';
import StagePills, { type StagePill } from '@/components/crm/stage-pills';

type Member = { id: number; name: string };
type Company = { id: number; name: string };
type Contact = { id: number; first_name: string; last_name?: string | null };
type Stage = { id: number; name: string };

export default function ListToolbar({
    entity,
    basePath,
    activeFilters = {},
    savedFilters = [],
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
    savedFilters?: { id: number; name: string }[];
    members?: Member[];
    cities?: string[];
    wilayas?: string[];
    companies?: Company[];
    contacts?: Contact[];
    stages?: Stage[];
    stagePills?: StagePill[];
    exportHref?: string;
}) {
    return (
        <div className="border-b border-hairline bg-canvas">
            <div className="flex items-center justify-between gap-2 pr-3">
                <div className="min-w-0 flex-1">
                    <SavedViewTabs
                        basePath={basePath}
                        entity={entity}
                        activeFilters={activeFilters}
                        savedFilters={savedFilters}
                    />
                </div>
                <CreateDrawer
                    entity={entity}
                    companies={companies}
                    contacts={contacts}
                    members={members}
                    stages={stages}
                />
            </div>
            <ColumnFilterRow
                action={basePath}
                entity={entity}
                activeFilters={activeFilters}
                members={members}
                cities={cities}
                wilayas={wilayas}
                exportHref={exportHref}
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
