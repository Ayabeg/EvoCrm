import { Form, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { crmListHref, filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
    ListViewColumn,
    ListViewFilters,
    ListViewMeta,
    SavedView,
} from '@/lib/list-view-config';
import { filterGroupsFromActive } from '@/lib/list-view-config';

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

    const chip = (active: boolean) =>
        `rounded-xl border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            active
                ? 'border-brand bg-brand text-primary-foreground'
                : 'border-hairline text-ink hover:bg-canvas-soft'
        }`;

    const badge = (count?: number) =>
        typeof count === 'number' ? (
            <span className="ml-1 text-[9px] opacity-80">{count}</span>
        ) : null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline bg-canvas px-3 py-2">
            <Link href={allHref} className={chip(view === 'all' && !filterId)}>
                All{badge(recordCount)}
            </Link>
            <Link href={myHref} className={chip(view === 'my' && !filterId)}>
                My
            </Link>
            {savedFilters.map((filter) => (
                <Link
                    key={filter.id}
                    href={crmListHref(basePath, { filter_id: filter.id })}
                    className={chip(filterId === filter.id)}
                    title={
                        filter.visibility === 'workspace'
                            ? 'Shared with workspace'
                            : filter.visibility === 'team'
                              ? 'Shared with team'
                              : 'Private view'
                    }
                >
                    {filter.visibility === 'workspace'
                        ? '◆ '
                        : filter.visibility === 'team'
                          ? '◇ '
                          : ''}
                    {filter.name}
                    {filter.is_workspace_default ? ' ★' : ''}
                    {badge(filter.record_count)}
                </Link>
            ))}
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
                        className="h-7 w-32 text-[11px]"
                    />
                    {canManageSettings ? (
                        <select
                            name="visibility"
                            value={visibility}
                            onChange={(event) =>
                                setVisibility(
                                    event.target.value as
                                        'private' | 'team' | 'workspace',
                                )
                            }
                            className="h-7 rounded border bg-background px-1 text-[11px]"
                        >
                            <option value="private">Private</option>
                            <option value="team">Team</option>
                            <option value="workspace">Workspace</option>
                        </select>
                    ) : null}
                    <label className="flex items-center gap-1 text-[10px] text-mute">
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
                    <Button className="h-7 px-2 text-[11px]">Save</Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => setNaming(false)}
                    >
                        Cancel
                    </Button>
                </Form>
            ) : (
                <button
                    type="button"
                    onClick={() => setNaming(true)}
                    className="rounded-xl border border-hairline px-2.5 py-1 text-[11px] text-ink hover:bg-canvas-soft"
                    aria-label="Save view"
                >
                    +
                </button>
            )}
        </div>
    );
}
