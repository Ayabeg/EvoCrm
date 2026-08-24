import { Form, Link } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { crmListHref, filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';

type Member = { id: number; name: string };

export default function ColumnFilterRow({
    action,
    entity,
    activeFilters,
    members = [],
    cities = [],
    wilayas = [],
    exportHref,
    columns = [],
    filterGroups,
    filterBuilder,
}: {
    action: string;
    entity: 'contact' | 'company' | 'deal';
    activeFilters: Record<string, unknown>;
    members?: Member[];
    cities?: string[];
    wilayas?: string[];
    exportHref?: string;
    columns?: { id: string; visible: boolean; order: number }[];
    filterGroups?: import('@/lib/list-view-config').ListViewFilters;
    filterBuilder?: React.ReactNode;
}) {
    const [advanced, setAdvanced] = useState(false);
    const fields = filterFields(activeFilters);
    const statusOptions =
        entity === 'deal' || entity === 'company'
            ? [
                  { value: 'open', label: 'Open' },
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' },
              ]
            : [
                  { value: 'new', label: 'New lead' },
                  { value: 'working', label: 'Working' },
                  { value: 'qualified', label: 'Qualified' },
                  { value: 'disqualified', label: 'Disqualified' },
              ];

    return (
        <div className="border-b border-hairline bg-canvas px-3 py-2">
            <Form action={action} method="get" className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="view" value={String(fields.view ?? 'all')} />
                {fields.filter_id ? <input type="hidden" name="filter_id" value={String(fields.filter_id)} /> : null}
                {fields.stage ? <input type="hidden" name="stage" value={String(fields.stage)} /> : null}
                {filterGroups ? (
                    <input type="hidden" name="filter_groups" value={JSON.stringify(filterGroups)} />
                ) : null}
                <label className="grid gap-0.5 text-[10px] text-mute">
                    Owner
                    <select
                        name="owner"
                        defaultValue={String(fields.owner ?? '')}
                        className="h-7 rounded border border-hairline bg-background px-1 text-[11px] text-ink"
                    >
                        <option value="">Anyone</option>
                        <option value="unassigned">Unassigned</option>
                        {members.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="grid gap-0.5 text-[10px] text-mute">
                    Create date
                    <select
                        name="created"
                        defaultValue={String(fields.created ?? '')}
                        className="h-7 rounded border border-hairline bg-background px-1 text-[11px] text-ink"
                    >
                        <option value="">Any time</option>
                        <option value="today">Today</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </label>
                <label className="grid gap-0.5 text-[10px] text-mute">
                    Last activity
                    <select
                        name="last_activity"
                        defaultValue={String(fields.last_activity ?? '')}
                        className="h-7 rounded border border-hairline bg-background px-1 text-[11px] text-ink"
                    >
                        <option value="">Any</option>
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                        <option value="none">None</option>
                    </select>
                </label>
                <label className="grid gap-0.5 text-[10px] text-mute">
                    {entity === 'contact' ? 'Lead status' : 'Deal status'}
                    <select
                        name="status"
                        defaultValue={String(fields.status ?? '')}
                        className="h-7 rounded border border-hairline bg-background px-1 text-[11px] text-ink"
                    >
                        <option value="">Any</option>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <Button className="h-7 px-2 text-[11px]">Apply</Button>
                <Link href={action} className="text-[11px] text-mute hover:text-ink">
                    Clear
                </Link>
                <button
                    type="button"
                    onClick={() => setAdvanced((open) => !open)}
                    className="text-[11px] text-ink underline-offset-2 hover:underline"
                >
                    {advanced ? 'Hide advanced filters' : 'Advanced filters'}
                </button>
                {exportHref ? (
                    <a href={crmListHref(exportHref, fields)} className="ml-auto text-[11px] text-brand">
                        Export CSV
                    </a>
                ) : null}
                {advanced && filterBuilder ? (
                    <div className="w-full border-t border-hairline pt-2">{filterBuilder}</div>
                ) : null}
                {advanced ? (
                    <div className="flex w-full flex-wrap items-end gap-2 border-t border-hairline pt-2">
                        {cities.length > 0 ? (
                            <label className="grid gap-0.5 text-[10px] text-mute">
                                City
                                <select
                                    name="city"
                                    defaultValue={String(fields.city ?? '')}
                                    className="h-7 rounded border border-hairline bg-background px-1 text-[11px] text-ink"
                                >
                                    <option value="">Any</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        {wilayas.length > 0 ? (
                            <label className="grid gap-0.5 text-[10px] text-mute">
                                Wilaya
                                <select
                                    name="wilaya"
                                    defaultValue={String(fields.wilaya ?? '')}
                                    className="h-7 rounded border border-hairline bg-background px-1 text-[11px] text-ink"
                                >
                                    <option value="">Any</option>
                                    {wilayas.map((wilaya) => (
                                        <option key={wilaya} value={wilaya}>
                                            {wilaya}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : null}
                        {entity !== 'company' ? (
                            <label className="flex items-center gap-1 text-[11px] text-ink">
                                <input type="checkbox" name="unanswered" value="1" defaultChecked={!!fields.unanswered} />
                                Unanswered
                            </label>
                        ) : null}
                        <label className="flex items-center gap-1 text-[11px] text-ink">
                            <input type="checkbox" name="unassigned" value="1" defaultChecked={!!fields.unassigned} />
                            Unassigned
                        </label>
                    </div>
                ) : (
                    <>
                        {fields.city ? <input type="hidden" name="city" value={String(fields.city)} /> : null}
                        {fields.wilaya ? <input type="hidden" name="wilaya" value={String(fields.wilaya)} /> : null}
                        {fields.unanswered ? <input type="hidden" name="unanswered" value="1" /> : null}
                        {fields.unassigned ? <input type="hidden" name="unassigned" value="1" /> : null}
                        {columns.length ? <input type="hidden" name="columns" value={JSON.stringify(columns)} /> : null}
                    </>
                )}
            </Form>
        </div>
    );
}
