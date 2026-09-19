import { Funnel, MagnifyingGlass } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import ColumnChooser from '@/components/crm/column-chooser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DataWorkspaceChip, DataWorkspaceFilterContext } from '@/ds/workspace/types';
import { t } from '@/lib/i18n';
import {
    clearQuickFilters,
    fromActiveFilters,
    listQueryAdapter,
    navigateListQuery,
} from '@/lib/list-query';
import type { ListQueryFilterKey, ListQueryObject } from '@/lib/list-query';
import type { ListColumnDef, ListFieldDef, ListViewColumn } from '@/lib/list-view-config';
import { FILTER_SEARCH_CLASS, PAGE_OVERFLOW_CLASS } from '@/lib/responsive';
import { cn } from '@/lib/utils';

const QUICK_FIELD_IDS = ['owner', 'created', 'status', 'priority'] as const;
const COMPANY_QUICK_FIELD_IDS = ['owner', 'created', 'city', 'wilaya'] as const;
const DEAL_QUICK_FIELD_IDS = ['owner', 'created', 'status', 'attention'] as const;

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
    needs_attention: 'Needs attention',
    overdue: 'Overdue',
    no_next_action: 'No next action',
};

function optionLabel(value: string): string {
    return t(PRESET_LABELS[value] ?? value.replace(/_/g, ' '));
}

export function FilterBar({
    object,
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
    object: ListQueryObject;
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
    const current = fromActiveFilters(filters, extraQuery);
    const members = filterContext?.members ?? [];
    const cities = filterContext?.cities ?? [];
    const wilayas = filterContext?.wilayas ?? [];
    const queryEnabled = listQueryAdapter(object).supportsQuery;
    const quickIds: readonly string[] = object === 'company' ? COMPANY_QUICK_FIELD_IDS
        : object === 'deal' ? DEAL_QUICK_FIELD_IDS
        : QUICK_FIELD_IDS;
    const quick = fieldDefs
        .filter((field) => quickIds.includes(field.id))
        .slice(0, 4);
    const searchKey = String(current.search ?? '');
    const searchPlaceholder =
        object === 'company'
            ? t('Search companies…')
            : object === 'deal'
              ? t('Search deals…')
              : object === 'quote'
                ? t('Search quotes…')
                : t('Search');
    const searchLabel =
        object === 'company'
            ? t('Search companies')
            : object === 'deal'
              ? t('Search deals')
              : object === 'quote'
                ? t('Search quotes')
                : t('Search list');
    const applyFilter = (key: ListQueryFilterKey, value: string | null) => {
        navigateListQuery(basePath, current, { filters: { [key]: value } }, object);
    };

    const columnChooser =
        columnDefs && columns ? (
            <ColumnChooser
                columnDefs={columnDefs}
                columns={columns}
                onChange={onColumnsChange}
            />
        ) : null;

    const quickFilters = !queryEnabled ? null : (
        <>
            {quick.map((field) => {
                const options =
                    field.id === 'owner'
                        ? [
                              { value: 'unassigned', label: t('Unassigned') },
                              ...members.map((member) => ({
                                  value: String(member.id),
                                  label: member.name,
                              })),
                          ]
                        : field.id === 'city'
                          ? cities.map((city) => ({ value: city, label: city }))
                          : field.id === 'wilaya'
                            ? wilayas.map((wilaya) => ({ value: wilaya, label: wilaya }))
                            : (field.options ?? []).map((value) => ({
                                  value,
                                  label: optionLabel(value),
                              }));

                return (
                    <label
                        key={field.id}
                        className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-hairline bg-canvas px-3 text-[13px] text-ink"
                    >
                        <span className="text-mute">{t(field.label)}</span>
                        <select
                            name={field.id}
                            value={String(current.filters[field.id as ListQueryFilterKey] ?? '')}
                            className="max-w-[9rem] bg-transparent text-[13px] text-ink outline-none"
                            onChange={(event) =>
                                applyFilter(
                                    field.id as ListQueryFilterKey,
                                    event.target.value || null,
                                )
                            }
                        >
                            <option value="">
                                {field.id === 'attention' ? t('All') : t('Any')}
                            </option>
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
                className="h-9 shrink-0"
                aria-label={t('Advanced')}
                onClick={onAdvanced}
            >
                <Funnel className="size-4" weight="bold" />
                {t('Advanced')}
            </Button>
        </>
    );

    return (
        <div className={cn('border-b border-hairline bg-canvas', PAGE_OVERFLOW_CLASS)} data-crm="list-toolbar" data-ds="filter-bar">
            <div className="flex min-w-0 flex-wrap items-center gap-2 px-4 py-3 md:px-8">
                {extra}
                {queryEnabled ? (
                    <form
                        className={cn(
                            FILTER_SEARCH_CLASS,
                            (object === 'company' || object === 'deal') && 'max-w-md basis-[16rem]',
                        )}
                        onSubmit={(event) => {
                            event.preventDefault();
                            const q = String(new FormData(event.currentTarget).get('q') ?? '');
                            navigateListQuery(basePath, current, { search: q || null }, object);
                        }}
                    >
                        <MagnifyingGlass
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mute"
                            weight="bold"
                        />
                        <Input
                            key={`q:${searchKey}`}
                            name="q"
                            defaultValue={searchKey}
                            placeholder={searchPlaceholder}
                            className="h-9 pl-9"
                            aria-label={searchLabel}
                        />
                    </form>
                ) : null}
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {quickFilters}
                    {columnChooser}
                </div>
            </div>
            {queryEnabled && chips.length > 0 ? (
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
                            title={t('Clear :label', { label: t(chip.label) })}
                        >
                            <span className="truncate">{t(chip.label)}</span>
                            <span aria-hidden className="text-mute">
                                ×
                            </span>
                        </button>
                    ))}
                    <button
                        type="button"
                        className="text-[12px] text-mute hover:text-ink"
                        onClick={() =>
                            navigateListQuery(
                                basePath,
                                clearQuickFilters(current),
                                {},
                                object,
                            )
                        }
                    >
                        {t('Clear all')}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
