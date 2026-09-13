import { Form, Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { crmListHref, filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type {
    ListObjectType,
    ListViewColumn,
    ListViewFilters,
    ListViewMeta,
    SavedView,
} from '@/lib/list-view-config';
import { filterGroupsFromActive } from '@/lib/list-view-config';
import { cn } from '@/lib/utils';

const OBJECT_NOUNS: Record<ListObjectType, string> = {
    contact: 'contacts',
    company: 'companies',
    deal: 'deals',
    ticket: 'tickets',
    quote: 'quotes',
};

export default function SavedViewTabs({
    basePath,
    entity,
    activeFilters,
    savedFilters = [],
    columns = [],
    listView,
    filterGroups,
    canManageSettings = false,
    extraQuery = {},
}: {
    basePath: string;
    entity: ListObjectType;
    activeFilters: Record<string, unknown>;
    savedFilters?: SavedView[];
    columns?: ListViewColumn[];
    listView?: ListViewMeta;
    recordCount?: number;
    filterGroups?: ListViewFilters;
    canManageSettings?: boolean;
    extraQuery?: Record<string, string | number | null | undefined>;
}) {
    const { auth } = usePage().props;
    const [naming, setNaming] = useState(false);
    const [visibility, setVisibility] = useState<'private' | 'team' | 'workspace'>('private');
    const view = String(activeFilters.view ?? 'all');
    const filterId = Number(activeFilters.filter_id ?? 0) || null;
    const fields = filterFields(activeFilters);
    const groups = filterGroups ?? filterGroupsFromActive(activeFilters);
    const nouns = OBJECT_NOUNS[entity];

    const allHref = crmListHref(basePath, { ...fields, ...extraQuery }, {
        view: 'all',
        owner: null,
        filter_id: null,
    });
    const myHref = crmListHref(basePath, { ...fields, ...extraQuery }, {
        view: 'my',
        owner: entity === 'ticket' ? null : auth.user.id,
        filter_id: null,
    });
    const unassignedHref = crmListHref(basePath, { ...fields, ...extraQuery }, {
        view: 'unassigned',
        owner: null,
        filter_id: null,
    });
    const closedHref = crmListHref(basePath, { ...fields, ...extraQuery }, {
        view: 'closed',
        owner: null,
        status: null,
        filter_id: null,
    });

    const pinned = savedFilters.slice(0, 3);
    const overflow = savedFilters.slice(3);
    const tabClass = (active: boolean) =>
        cn(
            'shrink-0 border-b-2 pb-2 text-[13px] whitespace-nowrap',
            active
                ? 'border-brand font-medium text-ink'
                : 'border-transparent text-mute hover:text-ink',
        );

    return (
        <div className="flex min-w-0 flex-col gap-2" data-crm="views">
            <div className="flex min-w-0 items-end gap-4 overflow-x-auto">
                {entity === 'ticket' ? (
                    <>
                        <Link href={allHref} className={tabClass(view === 'all' && !filterId)}>
                            All open
                        </Link>
                        <Link href={myHref} className={tabClass(view === 'my' && !filterId)}>
                            Assigned to me
                        </Link>
                        <Link
                            href={unassignedHref}
                            className={tabClass(view === 'unassigned' && !filterId)}
                        >
                            Unassigned
                        </Link>
                        <Link href={closedHref} className={tabClass(view === 'closed' && !filterId)}>
                            Closed
                        </Link>
                    </>
                ) : (
                    <>
                        <Link href={allHref} className={tabClass(view === 'all' && !filterId)}>
                            All {nouns}
                        </Link>
                        <Link href={myHref} className={tabClass(view === 'my' && !filterId)}>
                            My {nouns}
                        </Link>
                    </>
                )}
                {pinned.map((filter) => (
                    <Link
                        key={filter.id}
                        href={crmListHref(basePath, { ...extraQuery, filter_id: filter.id })}
                        className={tabClass(filter.id === filterId)}
                        title={
                            filter.visibility === 'workspace'
                                ? 'Shared with workspace'
                                : filter.visibility === 'team'
                                  ? 'Shared with team'
                                  : 'Private view'
                        }
                    >
                        {filter.name}
                        {filter.is_workspace_default ? ' ★' : ''}
                    </Link>
                ))}
                {overflow.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={tabClass(overflow.some((filter) => filter.id === filterId))}
                            >
                                All views
                                <ChevronDown className="ms-0.5 inline size-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            {overflow.map((filter) => (
                                <DropdownMenuItem key={filter.id} asChild>
                                    <Link href={crmListHref(basePath, { filter_id: filter.id })}>
                                        {filter.name}
                                        {typeof filter.record_count === 'number'
                                            ? ` · ${filter.record_count}`
                                            : ''}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
                {entity === 'ticket' || entity === 'quote' ? null : (
                <button
                    type="button"
                    onClick={() => setNaming(true)}
                    className="mb-2 inline-flex shrink-0 items-center gap-1 text-[13px] text-mute hover:text-ink"
                >
                    + Add view
                    {savedFilters.length > 0 ? ` (${savedFilters.length}/5)` : ''}
                </button>
                )}
            </div>
            {naming ? (
                <Form
                    action="/crm/filters"
                    method="post"
                    className="flex flex-wrap items-center gap-1"
                    onSuccess={() => setNaming(false)}
                >
                    <input type="hidden" name="entity" value={entity} />
                    <input type="hidden" name="view" value={view} />
                    <input type="hidden" name="owner" value={String(fields.owner ?? '')} />
                    <input type="hidden" name="created" value={String(fields.created ?? '')} />
                    <input type="hidden" name="last_activity" value={String(fields.last_activity ?? '')} />
                    <input type="hidden" name="status" value={String(fields.status ?? '')} />
                    <input type="hidden" name="stage" value={String(fields.stage ?? '')} />
                    <input type="hidden" name="city" value={String(fields.city ?? '')} />
                    <input type="hidden" name="wilaya" value={String(fields.wilaya ?? '')} />
                    {fields.unanswered ? <input type="hidden" name="unanswered" value="1" /> : null}
                    {fields.unassigned ? <input type="hidden" name="unassigned" value="1" /> : null}
                    <input type="hidden" name="filter_groups" value={JSON.stringify(groups)} />
                    <input
                        type="hidden"
                        name="columns"
                        value={JSON.stringify(columns.length ? columns : (listView?.columns ?? []))}
                    />
                    <input
                        type="hidden"
                        name="sort"
                        value={JSON.stringify(
                            listView?.sort ?? { field: 'created_at', direction: 'desc' },
                        )}
                    />
                    <Input name="name" placeholder="View name" required className="h-8 w-32 text-[12px]" />
                    {canManageSettings ? (
                        <select
                            name="visibility"
                            value={visibility}
                            onChange={(event) =>
                                setVisibility(event.target.value as 'private' | 'team' | 'workspace')
                            }
                            className="h-8 rounded border border-hairline bg-background px-1 text-[12px]"
                        >
                            <option value="private">Private</option>
                            <option value="team">Team</option>
                            <option value="workspace">Workspace</option>
                        </select>
                    ) : null}
                    <label className="flex items-center gap-1 text-[11px] text-mute">
                        <input
                            type="checkbox"
                            name="is_workspace_default"
                            value="1"
                            disabled={!canManageSettings || visibility !== 'workspace'}
                        />
                        Team default
                    </label>
                    <Button type="submit" variant="outline" size="sm" className="h-8 px-2 text-[12px]">
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[12px]"
                        onClick={() => setNaming(false)}
                    >
                        Cancel
                    </Button>
                </Form>
            ) : null}
        </div>
    );
}
