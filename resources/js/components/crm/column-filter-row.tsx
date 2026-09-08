import { Form } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import type { ListViewFilters } from '@/lib/list-view-config';

type Member = { id: number; name: string };

export default function ColumnFilterRow({
    action,
    entity,
    activeFilters,
    members = [],
    cities = [],
    wilayas = [],
    columns = [],
    filterGroups,
    filterBuilder,
    extraQuery = {},
}: {
    action: string;
    entity: 'contact' | 'company' | 'deal';
    activeFilters: Record<string, unknown>;
    members?: Member[];
    cities?: string[];
    wilayas?: string[];
    exportHref?: string;
    columns?: { id: string; visible: boolean; order: number }[];
    filterGroups?: ListViewFilters;
    filterBuilder?: ReactNode;
    extraQuery?: Record<string, string | number | null | undefined>;
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

    const chip =
        'inline-flex h-7 max-w-full items-center gap-1 rounded-sm border border-hairline bg-canvas px-2 text-[12px] text-ink';
    const selectClass = 'max-w-[9rem] bg-transparent text-[12px] text-ink outline-none';
    const ownerLabel = entity === 'deal' ? 'Deal owner' : entity === 'company' ? 'Company owner' : 'Contact owner';

    return (
        <div className="min-w-0 flex-1">
            <Form action={action} method="get" className="flex flex-wrap items-center gap-2">
                {Object.entries(extraQuery).map(([key, value]) =>
                    value === null || value === undefined || value === '' ? null : (
                        <input key={key} type="hidden" name={key} value={String(value)} />
                    ),
                )}
                <input type="hidden" name="view" value={String(fields.view ?? 'all')} />
                {fields.filter_id ? <input type="hidden" name="filter_id" value={String(fields.filter_id)} /> : null}
                {fields.stage ? <input type="hidden" name="stage" value={String(fields.stage)} /> : null}
                {fields.q ? <input type="hidden" name="q" value={String(fields.q)} /> : null}
                {filterGroups ? (
                    <input type="hidden" name="filter_groups" value={JSON.stringify(filterGroups)} />
                ) : null}
                <label className={chip}>
                    {ownerLabel}
                    <select
                        name="owner"
                        defaultValue={String(fields.owner ?? '')}
                        className={selectClass}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
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
                <label className={chip}>
                    Create date
                    <select
                        name="created"
                        defaultValue={String(fields.created ?? '')}
                        className={selectClass}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    >
                        <option value="">Any time</option>
                        <option value="today">Today</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                </label>
                <label className={chip}>
                    Last activity date
                    <select
                        name="last_activity"
                        defaultValue={String(fields.last_activity ?? '')}
                        className={selectClass}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    >
                        <option value="">Any</option>
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                        <option value="none">None</option>
                    </select>
                </label>
                <label className={chip}>
                    {entity === 'contact' ? 'Lead status' : entity === 'deal' ? 'Deal status' : 'Status'}
                    <select
                        name="status"
                        defaultValue={String(fields.status ?? '')}
                        className={selectClass}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                    >
                        <option value="">Any</option>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    onClick={() => setAdvanced((open) => !open)}
                    className={chip + ' text-mute'}
                >
                    {advanced ? 'Hide advanced filters' : 'Advanced filters'}
                </button>
                {advanced && filterBuilder ? (
                    <div className="w-full border-t border-hairline pt-2">{filterBuilder}</div>
                ) : null}
                {advanced ? (
                    <div className="flex w-full flex-wrap items-end gap-2 border-t border-hairline pt-2">
                        {cities.length > 0 ? (
                            <label className="grid gap-0.5 text-[11px] text-mute">
                                City
                                <select
                                    name="city"
                                    defaultValue={String(fields.city ?? '')}
                                    className="h-8 rounded border border-hairline bg-background px-1.5 text-[12px] text-ink"
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
                            <label className="grid gap-0.5 text-[11px] text-mute">
                                Wilaya
                                <select
                                    name="wilaya"
                                    defaultValue={String(fields.wilaya ?? '')}
                                    className="h-8 rounded border border-hairline bg-background px-1.5 text-[12px] text-ink"
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
                            <label className="flex items-center gap-1 text-[12px] text-ink">
                                <input type="checkbox" name="unanswered" value="1" defaultChecked={!!fields.unanswered} />
                                Unanswered
                            </label>
                        ) : null}
                        <label className="flex items-center gap-1 text-[12px] text-ink">
                            <input type="checkbox" name="unassigned" value="1" defaultChecked={!!fields.unassigned} />
                            Unassigned
                        </label>
                        <Button type="submit" variant="outline" size="sm" className="h-8 px-2.5 text-[12px]">
                            Apply
                        </Button>
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
