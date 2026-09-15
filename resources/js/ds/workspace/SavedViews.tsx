import { Form, Link, usePage } from '@inertiajs/react';
import { CaretDown, Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { DataWorkspaceEntity } from '@/ds/workspace/types';
import { t } from '@/lib/i18n';
import {
    applyBuiltInView,
    applySavedFilter,
    fromActiveFilters,
    listQueryHref,
    patchListQuery,
} from '@/lib/list-query';
import type { ListQueryObject } from '@/lib/list-query';
import type {
    ListViewColumn,
    ListViewFilters,
    SavedView,
} from '@/lib/list-view-config';
import { filterGroupsFromActive } from '@/lib/list-view-config';
import { cn } from '@/lib/utils';

const OBJECT_NOUNS: Record<DataWorkspaceEntity, string> = {
    contact: 'contacts',
    company: 'companies',
    deal: 'deals',
    ticket: 'tickets',
    quote: 'quotes',
    lead: 'leads',
};

const pillClass = (active: boolean) =>
    cn(
        'inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px] whitespace-nowrap',
        active
            ? 'border-brand bg-sidebar-accent font-medium text-ink'
            : 'border-hairline bg-canvas text-mute hover:text-ink',
    );

export function SavedViews({
    object,
    basePath,
    views,
    activeViewId,
    onViewChange,
    onViewSave,
    filters,
    columns,
    extraQuery = {},
    canManageSettings = false,
}: {
    object: DataWorkspaceEntity;
    basePath: string;
    views: SavedView[];
    activeViewId?: string;
    onViewChange: (id: string | null) => void;
    onViewSave?: (input: {
        name: string;
        filters: ListViewFilters;
        columns: ListViewColumn[];
    }) => void;
    filters: Record<string, unknown>;
    columns: ListViewColumn[];
    extraQuery?: Record<string, string | number | null | undefined>;
    canManageSettings?: boolean;
}) {
    const { auth } = usePage().props;
    void onViewChange;
    const [naming, setNaming] = useState(false);
    const [visibility, setVisibility] = useState<'private' | 'team' | 'workspace'>(
        'private',
    );
    const fields = filterFields(filters);
    const groups = filterGroupsFromActive(filters);
    const nouns = OBJECT_NOUNS[object];
    const userId = auth.user.id;
    const current = fromActiveFilters(filters, extraQuery);
    const queryObject = object as ListQueryObject;

    const hrefFor = (id: string, owner: number | null = null) =>
        listQueryHref(basePath, applyBuiltInView(current, id, owner), queryObject);

    const savedHref = (id: number) =>
        listQueryHref(basePath, applySavedFilter(current, id), queryObject);

    const builtIn: Array<{ id: string; label: string; href: string }> =
        object === 'ticket'
            ? [
                  { id: 'all', label: t('All open'), href: hrefFor('all') },
                  {
                      id: 'my',
                      label: t('Assigned to me'),
                      href: hrefFor('my', userId),
                  },
                  {
                      id: 'unassigned',
                      label: t('Unassigned'),
                      href: hrefFor('unassigned'),
                  },
                  {
                      id: 'closed',
                      label: t('Closed'),
                      href: listQueryHref(
                          basePath,
                          patchListQuery(applyBuiltInView(current, 'closed'), {
                              filters: { status: null },
                          }),
                          queryObject,
                      ),
                  },
              ]
            : [
                  {
                      id: 'all',
                      label: t('All :noun', { noun: t(nouns) }),
                      href: hrefFor('all'),
                  },
                  {
                      id: 'my',
                      label: t('My :noun', { noun: t(nouns) }),
                      href: hrefFor('my', userId),
                  },
              ];

    const pinned = views.slice(0, 3);
    const overflow = views.slice(3);
    const filterId = String(fields.filter_id ?? '');

    return (
        <div className="px-4 pt-3 md:px-8" data-crm="views" data-ds="saved-views">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                {builtIn.map((view) => {
                    const active = activeViewId === view.id && !filterId;

                    return (
                        <Link
                            key={view.id}
                            href={view.href}
                            className={pillClass(active)}
                        >
                            {view.label}
                        </Link>
                    );
                })}
                {pinned.map((view) => (
                    <Link
                        key={view.id}
                        href={savedHref(view.id)}
                        className={pillClass(String(view.id) === activeViewId)}
                        title={
                            view.visibility === 'workspace'
                                ? 'Shared with workspace'
                                : view.visibility === 'team'
                                  ? 'Shared with team'
                                  : 'Private view'
                        }
                    >
                        {view.name}
                        {view.is_workspace_default ? ' ★' : ''}
                    </Link>
                ))}
                {overflow.length > 0 ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={pillClass(
                                    overflow.some((view) => String(view.id) === activeViewId),
                                )}
                            >
                                {t('All views')}
                                <CaretDown className="ms-1 size-3" weight="bold" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            {overflow.map((view) => (
                                <DropdownMenuItem key={view.id} asChild>
                                    <Link
                                        href={savedHref(view.id)}
                                    >
                                        {view.name}
                                        {typeof view.record_count === 'number'
                                            ? ` · ${view.record_count}`
                                            : ''}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
                {object === 'ticket' || object === 'quote' ? null : (
                    <button
                        type="button"
                        onClick={() => setNaming(true)}
                        className="inline-flex h-9 shrink-0 items-center gap-1 px-2 text-[13px] text-mute hover:text-ink"
                    >
                        <Plus className="size-3.5" weight="bold" />
                        {t('Add view')}
                        {views.length > 0 ? ` (${views.length}/5)` : ''}
                    </button>
                )}
            </div>
            {naming ? (
                <Form
                    action="/crm/filters"
                    method="post"
                    className="mt-3 flex flex-wrap items-center gap-2"
                    onSuccess={() => {
                        setNaming(false);
                        onViewSave?.({
                            name: '',
                            filters: groups,
                            columns,
                        });
                    }}
                >
                    <input type="hidden" name="entity" value={object} />
                    <input type="hidden" name="view" value={String(fields.view ?? 'all')} />
                    <input type="hidden" name="owner" value={String(fields.owner ?? '')} />
                    <input type="hidden" name="created" value={String(fields.created ?? '')} />
                    <input
                        type="hidden"
                        name="last_activity"
                        value={String(fields.last_activity ?? '')}
                    />
                    <input type="hidden" name="status" value={String(fields.status ?? '')} />
                    <input type="hidden" name="stage" value={String(fields.stage ?? '')} />
                    <input type="hidden" name="city" value={String(fields.city ?? '')} />
                    <input type="hidden" name="wilaya" value={String(fields.wilaya ?? '')} />
                    {fields.unanswered ? (
                        <input type="hidden" name="unanswered" value="1" />
                    ) : null}
                    {fields.unassigned ? (
                        <input type="hidden" name="unassigned" value="1" />
                    ) : null}
                    <input type="hidden" name="filter_groups" value={JSON.stringify(groups)} />
                    <input type="hidden" name="columns" value={JSON.stringify(columns)} />
                    <input
                        type="hidden"
                        name="sort"
                        value={JSON.stringify({ field: 'created_at', direction: 'desc' })}
                    />
                    <Input
                        name="name"
                        placeholder="View name"
                        required
                        className="h-9 w-40"
                    />
                    {canManageSettings ? (
                        <select
                            name="visibility"
                            value={visibility}
                            onChange={(event) =>
                                setVisibility(
                                    event.target.value as 'private' | 'team' | 'workspace',
                                )
                            }
                            className="h-9 rounded-md border border-hairline bg-canvas px-2 text-[13px]"
                        >
                            <option value="private">Private</option>
                            <option value="team">Team</option>
                            <option value="workspace">Workspace</option>
                        </select>
                    ) : null}
                    <label className="flex h-9 items-center gap-1 text-[12px] text-mute">
                        <input
                            type="checkbox"
                            name="is_workspace_default"
                            value="1"
                            disabled={!canManageSettings || visibility !== 'workspace'}
                        />
                        Team default
                    </label>
                    <Button type="submit" variant="outline" className="h-9">
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-9"
                        onClick={() => setNaming(false)}
                    >
                        Cancel
                    </Button>
                </Form>
            ) : null}
        </div>
    );
}
