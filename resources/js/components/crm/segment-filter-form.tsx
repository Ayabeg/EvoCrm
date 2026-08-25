import FilterBuilder from '@/components/crm/filter-builder';
import { Label } from '@/components/ui/label';
import type { ListFieldDef, ListViewFilters } from '@/lib/list-view-config';
import { defaultFilterGroups } from '@/lib/list-view-config';

export type SegmentFilters = {
    stage?: string;
    owner?: string;
    city?: string;
    wilaya?: string;
    last_activity?: string;
    created?: string;
    status?: string;
    unanswered?: boolean;
    unassigned?: boolean;
    enrolled_in_sequence?: string;
    email_replied?: boolean;
    email_opened?: boolean;
    filter_groups?: unknown;
};

type Member = { id: number; name: string };
type Stage = { id: number; name: string; slug: string };

export default function SegmentFilterForm({
    entity,
    filters,
    onChange,
    members,
    cities,
    wilayas,
    stages,
    filterFields = [],
}: {
    entity: 'contact' | 'deal';
    filters: SegmentFilters;
    onChange: (next: SegmentFilters) => void;
    members: Member[];
    cities: string[];
    wilayas: string[];
    stages: Stage[];
    filterFields?: ListFieldDef[];
}) {
    const setField = (key: keyof SegmentFilters, value: string | boolean | undefined) => {
        onChange({ ...filters, [key]: value === '' ? undefined : value });
    };

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {entity === 'deal' ? (
                <div>
                    <Label>Stage</Label>
                    <select
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                        value={filters.stage ?? ''}
                        onChange={(event) => setField('stage', event.target.value)}
                    >
                        <option value="">Any stage</option>
                        {stages.map((stage) => (
                            <option key={stage.id} value={stage.slug}>
                                {stage.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}
            <div>
                <Label>Owner</Label>
                <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={filters.owner ?? ''}
                    onChange={(event) => setField('owner', event.target.value)}
                >
                    <option value="">Any owner</option>
                    <option value="unassigned">Unassigned</option>
                    {members.map((member) => (
                        <option key={member.id} value={String(member.id)}>
                            {member.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <Label>City</Label>
                <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={filters.city ?? ''}
                    onChange={(event) => setField('city', event.target.value)}
                >
                    <option value="">Any city</option>
                    {cities.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <Label>Wilaya</Label>
                <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={filters.wilaya ?? ''}
                    onChange={(event) => setField('wilaya', event.target.value)}
                >
                    <option value="">Any wilaya</option>
                    {wilayas.map((wilaya) => (
                        <option key={wilaya} value={wilaya}>
                            {wilaya}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <Label>Last activity</Label>
                <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={filters.last_activity ?? ''}
                    onChange={(event) => setField('last_activity', event.target.value)}
                >
                    <option value="">Any time</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="none">No activity</option>
                </select>
            </div>
            <div>
                <Label>Created</Label>
                <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={filters.created ?? ''}
                    onChange={(event) => setField('created', event.target.value)}
                >
                    <option value="">Any time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                </select>
            </div>
            <div>
                <Label>Status</Label>
                <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    value={filters.status ?? ''}
                    onChange={(event) => setField('status', event.target.value)}
                >
                    <option value="">Any status</option>
                    <option value="open">Open</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                </select>
            </div>
            <div className="flex flex-col justify-end gap-2 text-sm">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={!!filters.unanswered}
                        onChange={(event) => setField('unanswered', event.target.checked)}
                    />
                    Unanswered only
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={!!filters.unassigned}
                        onChange={(event) => setField('unassigned', event.target.checked)}
                    />
                    Unassigned only
                </label>
                {entity === 'contact' ? (
                    <>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!filters.email_replied}
                                onChange={(event) => setField('email_replied', event.target.checked)}
                            />
                            Replied to email
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={!!filters.email_opened}
                                onChange={(event) => setField('email_opened', event.target.checked)}
                            />
                            Opened email
                        </label>
                    </>
                ) : null}
            </div>
            {filterFields.length > 0 ? (
                <div className="md:col-span-2">
                    <Label>Advanced filter groups</Label>
                    <FilterBuilder
                        entity={entity}
                        fields={filterFields}
                        value={(filters.filter_groups as ListViewFilters | undefined) ?? defaultFilterGroups()}
                        members={members}
                        cities={cities}
                        wilayas={wilayas}
                        stages={stages}
                        onChange={(groups) => onChange({ ...filters, filter_groups: groups })}
                    />
                </div>
            ) : null}
        </div>
    );
}
