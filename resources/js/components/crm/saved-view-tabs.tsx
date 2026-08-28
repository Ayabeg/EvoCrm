import { Form, Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { crmListHref, filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type {
    ListViewColumn,
    ListViewFilters,
    ListViewMeta,
    SavedView,
} from '@/lib/list-view-config';
import { filterGroupsFromActive } from '@/lib/list-view-config';

const OBJECT_NOUNS: Record<'contact' | 'company' | 'deal', string> = {
    contact: 'contacts',
    company: 'companies',
    deal: 'deals',
};

export default function SavedViewTabs({
    basePath,
    entity,
    activeFilters,
    savedFilters = [],
    columns = [],
    listView,
    recordCount,
    filterGroups,
    canManageSettings = false,
}: {
    basePath: string;
    entity: 'contact' | 'company' | 'deal';
    activeFilters: Record<string, unknown>;
    savedFilters?: SavedView[];
    columns?: ListViewColumn[];
    listView?: ListViewMeta;
    recordCount?: number;
    filterGroups?: ListViewFilters;
    canManageSettings?: boolean;
}) {
    const { auth } = usePage().props;
    const [naming, setNaming] = useState(false);
    const [visibility, setVisibility] = useState<
        'private' | 'team' | 'workspace'
    >('private');
    const view = String(activeFilters.view ?? 'all');
    const filterId = Number(activeFilters.filter_id ?? 0) || null;
    const fields = filterFields(activeFilters);
    const groups = filterGroups ?? filterGroupsFromActive(activeFilters);
    const nouns = OBJECT_NOUNS[entity];

    const allHref = crmListHref(basePath, fields, {
        view: 'all',
        owner: null,
        filter_id: null,
    });
    const myHref = crmListHref(basePath, fields, {
        view: 'my',
        owner: auth.user.id,
        filter_id: null,
    });

    const saved = savedFilters.find((filter) => filter.id === filterId);
    const currentLabel = saved
        ? saved.name
        : view === 'my'
          ? `My ${nouns}`
          : `All ${nouns}`;

    return (
        <div className="flex min-w-0 items-center gap-1.5" data-crm="views">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-full min-w-0 justify-between gap-1 px-2.5 text-[12px] sm:max-w-[12rem]"
                        aria-label="Saved view"
                    >
                        <span className="truncate">{currentLabel}</span>
                        <ChevronDown className="size-3 shrink-0 text-mute" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem asChild>
                        <Link href={allHref}>
                            All {nouns}
                            {typeof recordCount === 'number' && view === 'all' && !filterId
                                ? ` · ${recordCount}`
                                : ''}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={myHref}>My {nouns}</Link>
                    </DropdownMenuItem>
                    {savedFilters.length > 0 ? <DropdownMenuSeparator /> : null}
                    {savedFilters.map((filter) => (
                        <DropdownMenuItem key={filter.id} asChild>
                            <Link
                                href={crmListHref(basePath, { filter_id: filter.id })}
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
                                {typeof filter.record_count === 'number'
                                    ? ` · ${filter.record_count}`
                                    : ''}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={(event) => {
                            event.preventDefault();
                            setNaming(true);
                        }}
                    >
                        Save current view
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {naming ? (
                <Form
                    action="/crm/filters"
                    method="post"
                    className="flex flex-wrap items-center gap-1"
                    onSuccess={() => setNaming(false)}
                >
                    <input type="hidden" name="entity" value={entity} />
                    <input type="hidden" name="view" value={view} />
                    <input
                        type="hidden"
                        name="owner"
                        value={String(fields.owner ?? '')}
                    />
                    <input
                        type="hidden"
                        name="created"
                        value={String(fields.created ?? '')}
                    />
                    <input
                        type="hidden"
                        name="last_activity"
                        value={String(fields.last_activity ?? '')}
                    />
                    <input
                        type="hidden"
                        name="status"
                        value={String(fields.status ?? '')}
                    />
                    <input
                        type="hidden"
                        name="stage"
                        value={String(fields.stage ?? '')}
                    />
                    <input
                        type="hidden"
                        name="city"
                        value={String(fields.city ?? '')}
                    />
                    <input
                        type="hidden"
                        name="wilaya"
                        value={String(fields.wilaya ?? '')}
                    />
                    {fields.unanswered ? (
                        <input type="hidden" name="unanswered" value="1" />
                    ) : null}
                    {fields.unassigned ? (
                        <input type="hidden" name="unassigned" value="1" />
                    ) : null}
                    <input
                        type="hidden"
                        name="filter_groups"
                        value={JSON.stringify(groups)}
                    />
                    <input
                        type="hidden"
                        name="columns"
                        value={JSON.stringify(
                            columns.length
                                ? columns
                                : (listView?.columns ?? []),
                        )}
                    />
                    <input
                        type="hidden"
                        name="sort"
                        value={JSON.stringify(
                            listView?.sort ?? {
                                field: 'created_at',
                                direction: 'desc',
                            },
                        )}
                    />
                    <Input
                        name="name"
                        placeholder="View name"
                        required
                        className="h-8 w-32 text-[12px]"
                    />
                    {canManageSettings ? (
                        <select
                            name="visibility"
                            value={visibility}
                            onChange={(event) =>
                                setVisibility(
                                    event.target.value as
                                        | 'private'
                                        | 'team'
                                        | 'workspace',
                                )
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
                            disabled={
                                !canManageSettings || visibility !== 'workspace'
                            }
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
