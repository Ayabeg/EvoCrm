import { router } from '@inertiajs/react';
import { Funnel, MagnifyingGlass } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import ColumnChooser from '@/components/crm/column-chooser';
import { crmListHref, filterFields } from '@/components/crm/list-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ListColumnDef, ListFieldDef, ListViewColumn } from '@/lib/list-view-config';
import type { DataWorkspaceChip, DataWorkspaceFilterContext } from '@/ds/workspace/types';

const QUICK_FIELD_IDS = ['owner', 'created', 'status', 'priority'] as const;

const PRESET_LABELS: Record<string, string> = {
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    none: 'None',
    new: 'New',
    working: 'Working',
    qualified: 'Qualified',
    disqualified: 'Disqualified',
    open: 'Open',
    won: 'Won',
    lost: 'Lost',
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    waiting_on_contact: 'Waiting on contact',
    waiting_on_us: 'Waiting on us',
    closed: 'Closed',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

function optionLabel(value: string): string {
    return PRESET_LABELS[value] ?? value.replace(/_/g, ' ');
}

export function FilterBar({
    basePath,
    filters,
    filterFields: fieldDefs,
    filterContext,
    extraQuery = {},
    chips = [],
    columns,
    columnDefs,
    onColumnsChange,
    onAdvanced,
    extra,
}: {
    basePath: string;
    filters: Record<string, unknown>;
    filterFields: ListFieldDef[];
    filterContext?: DataWorkspaceFilterContext;
    extraQuery?: Record<string, string | number | null | undefined>;
    chips?: DataWorkspaceChip[];
    columns?: ListViewColumn[];
    columnDefs?: ListColumnDef[];
    onColumnsChange?: (columns: ListViewColumn[]) => void;
    onAdvanced: () => void;
    extra?: ReactNode;
}) {
    const fields = filterFields(filters);
    const members = filterContext?.members ?? [];
    const quick = fieldDefs
        .filter((field) => QUICK_FIELD_IDS.includes(field.id as (typeof QUICK_FIELD_IDS)[number]))
        .slice(0, 4);

    const apply = (patch: Record<string, unknown>) => {
        router.get(
            crmListHref(basePath, { ...fields, ...extraQuery }, patch),
            {},
            { preserveState: true },
        );
    };

    return (
        <div className="border-b border-hairline bg-canvas" data-crm="list-toolbar" data-ds="filter-bar">
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-8">
                {extra}
                <form
                    className="relative min-w-[12rem] flex-1"
                    onSubmit={(event) => {
                        event.preventDefault();
                        const q = String(new FormData(event.currentTarget).get('q') ?? '');
                        apply({ q: q || null });
                    }}
                >
                    <MagnifyingGlass
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mute"
                        weight="bold"
                    />
                    <Input
                        name="q"
                        defaultValue={String(fields.q ?? '')}
                        placeholder="Search"
                        className="h-9 pl-9"
                        aria-label="Search list"
                    />
                </form>
                {quick.map((field) => {
                    const options =
                        field.id === 'owner'
                            ? [
                                  { value: 'unassigned', label: 'Unassigned' },
                                  ...members.map((member) => ({
                                      value: String(member.id),
                                      label: member.name,
                                  })),
                              ]
                            : (field.options ?? []).map((value) => ({
                                  value,
                                  label: optionLabel(value),
                              }));

                    return (
                        <label
                            key={field.id}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-hairline bg-canvas px-3 text-[13px] text-ink"
                        >
                            <span className="text-mute">{field.label}</span>
                            <select
                                name={field.id}
                                defaultValue={String(fields[field.id] ?? '')}
                                className="max-w-[9rem] bg-transparent text-[13px] text-ink outline-none"
                                onChange={(event) =>
                                    apply({ [field.id]: event.target.value || null })
                                }
                            >
                                <option value="">Any</option>
                                {options.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    );
                })}
                <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    aria-label="Advanced filters"
                    onClick={onAdvanced}
                >
                    <Funnel className="size-4" weight="bold" />
                    Advanced
                </Button>
                {columnDefs && columns ? (
                    <ColumnChooser
                        columnDefs={columnDefs}
                        columns={columns}
                        onChange={onColumnsChange}
                    />
                ) : null}
            </div>
            {chips.length > 0 ? (
                <div
                    className="flex flex-wrap items-center gap-1.5 px-4 pb-3 md:px-8"
                    data-crm="active-filters"
                >
                    {chips.map((chip) => (
                        <button
                            key={chip.id}
                            type="button"
                            onClick={chip.onRemove}
                            className="inline-flex max-w-full items-center gap-1 rounded-md border border-hairline bg-canvas-soft px-2 py-0.5 text-[12px] text-ink"
                            title={`Clear ${chip.label}`}
                        >
                            <span className="truncate">{chip.label}</span>
                            <span aria-hidden className="text-mute">
                                ×
                            </span>
                        </button>
                    ))}
                    <button
                        type="button"
                        className="text-[12px] text-mute hover:text-ink"
                        onClick={() => apply({
                            owner: null,
                            created: null,
                            last_activity: null,
                            status: null,
                            stage: null,
                            city: null,
                            wilaya: null,
                            unanswered: null,
                            unassigned: null,
                            priority: null,
                            channel: null,
                            filter_groups: null,
                        })}
                    >
                        Clear all
                    </button>
                </div>
            ) : null}
        </div>
    );
}
