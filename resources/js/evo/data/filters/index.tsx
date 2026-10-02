/**
 * Evo filters — ReUI-inspired, two-level AND/OR only.
 */

import * as React from 'react';

import { fieldLabel, shouldOfferFilterGroups } from '@/evo/data/adapters/filter-adapter';
import type { ListPageResource } from '@/evo/data/adapters/filter-adapter';
import { Funnel, X } from '@/evo/icons';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { SearchInput } from '@/evo/ui/search-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/evo/ui/select';
import { filtersFr } from '@/evo/vendor/reui/filters/i18n';
import type { FilterGroup, FilterRule, ListFieldDef, ListViewFilters } from '@/lib/list-view-config';
import { defaultFilterGroups } from '@/lib/list-view-config';

export { SearchInput as SearchField };

export type FilterBarProps = {
    search?: string;
    onSearchChange?: (value: string) => void;
    chips?: { id: string; label: string; onRemove: () => void }[];
    onAdvanced?: () => void;
    onClear?: () => void;
    extra?: React.ReactNode;
};

function FilterBar({ search = '', onSearchChange, chips = [], onAdvanced, onClear, extra }: FilterBarProps) {
    return (
        <div data-ds="filter-bar" className="flex flex-wrap items-center gap-2">
            {onSearchChange ? (
                <div className="min-w-48 flex-1">
                    <SearchInput value={search} onChange={(event) => onSearchChange(event.target.value)} />
                </div>
            ) : null}
            {chips.map((chip) => (
                <ActiveFilterChip key={chip.id} label={chip.label} onRemove={chip.onRemove} />
            ))}
            {onAdvanced ? (
                <Button variant="outline" size="sm" onClick={onAdvanced}>
                    <Funnel className="size-3.5" aria-hidden />
                    {filtersFr.advanced}
                </Button>
            ) : null}
            {chips.length > 0 && onClear ? (
                <Button variant="ghost" size="sm" onClick={onClear}>
                    {filtersFr.clear}
                </Button>
            ) : null}
            {extra}
        </div>
    );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <Badge variant="secondary" className="gap-1">
            {label}
            <button type="button" aria-label={`${filtersFr.clear} ${label}`} onClick={onRemove}>
                <X className="size-3" aria-hidden />
            </button>
        </Badge>
    );
}

function FilterMenu({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col gap-2">{children}</div>;
}

const OPERATORS = Object.entries(filtersFr.operators) as [FilterRule['operator'], string][];

function FilterCondition({
    rule,
    fields,
    onChange,
    onRemove,
}: {
    rule: FilterRule;
    fields: ListFieldDef[];
    onChange: (rule: FilterRule) => void;
    onRemove: () => void;
}) {
    const field = fields.find((item) => item.id === rule.field);

    return (
        <div className="grid grid-cols-[1fr_8rem_1fr_auto] items-center gap-2">
            <Select value={rule.field} onValueChange={(value) => onChange({ ...rule, field: value })}>
                <SelectTrigger aria-label={filtersFr.field}>
                    <SelectValue placeholder={filtersFr.field} />
                </SelectTrigger>
                <SelectContent>
                    {fields.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={rule.operator}
                onValueChange={(value) => onChange({ ...rule, operator: value as FilterRule['operator'] })}
            >
                <SelectTrigger aria-label={filtersFr.operator}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {OPERATORS.map(([id, label]) => (
                        <SelectItem key={id} value={id}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {rule.operator === 'is_set' || rule.operator === 'is_not_set' || rule.operator === 'is_true' || rule.operator === 'is_false' ? (
                <span className="text-[12px] text-[var(--evo-ink-muted)]">—</span>
            ) : (
                <Input
                    aria-label={filtersFr.value}
                    value={rule.value == null ? '' : String(rule.value)}
                    onChange={(event) => onChange({ ...rule, value: event.target.value })}
                />
            )}
            <Button variant="ghost" size="icon" aria-label={filtersFr.clear} onClick={onRemove}>
                <X className="size-3.5" aria-hidden />
            </Button>
            {field ? <span className="sr-only">{fieldLabel(fields, field.id)}</span> : null}
        </div>
    );
}

function FilterGroupCard({
    group,
    fields,
    onChange,
    onRemove,
}: {
    group: FilterGroup;
    fields: ListFieldDef[];
    onChange: (group: FilterGroup) => void;
    onRemove: () => void;
}) {
    return (
        <div className="rounded-[var(--evo-radius-standard)] border border-[var(--evo-hairline)] p-3">
            <div className="mb-2 flex items-center justify-between">
                <Select
                    value={group.logic}
                    onValueChange={(value) => onChange({ ...group, logic: value as 'and' | 'or' })}
                >
                    <SelectTrigger className="w-24" aria-label={group.logic === 'and' ? filtersFr.and : filtersFr.or}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="and">{filtersFr.and}</SelectItem>
                        <SelectItem value="or">{filtersFr.or}</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={onRemove}>
                    {filtersFr.clear}
                </Button>
            </div>
            <div className="flex flex-col gap-2">
                {group.rules.map((rule, index) => (
                    <FilterCondition
                        key={`${rule.field}-${index}`}
                        rule={rule}
                        fields={fields}
                        onChange={(next) => {
                            const rules = group.rules.slice();
                            rules[index] = next;
                            onChange({ ...group, rules });
                        }}
                        onRemove={() => onChange({ ...group, rules: group.rules.filter((_, i) => i !== index) })}
                    />
                ))}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() =>
                    onChange({
                        ...group,
                        rules: [...group.rules, { field: fields[0]?.id ?? '', operator: 'eq', value: '' }],
                    })
                }
            >
                {filtersFr.addCondition}
            </Button>
        </div>
    );
}

export type FilterBuilderProps = {
    value?: ListViewFilters;
    fields: ListFieldDef[];
    onChange: (value: ListViewFilters) => void;
    onApply?: (value: ListViewFilters) => void;
    resource?: ListPageResource;
    allowGroups?: boolean;
};

function FilterBuilder({ value, fields, onChange, onApply, resource, allowGroups }: FilterBuilderProps) {
    const filters = value ?? defaultFilterGroups();
    const offerGroups = allowGroups ?? (resource ? shouldOfferFilterGroups(resource) : false);

    if (!offerGroups) {
        const group = {
            logic: 'and' as const,
            rules: filters.groups.flatMap((item) => item.rules),
        };

        const commit = (next: FilterGroup) => {
            onChange({ logic: 'and', groups: [next] });
        };

        return (
            <div className="flex flex-col gap-3" data-slot="filter-builder" data-filter-groups="off">
                <div className="flex flex-col gap-2">
                    {group.rules.map((rule, index) => (
                        <FilterCondition
                            key={`${rule.field}-${index}`}
                            rule={rule}
                            fields={fields}
                            onChange={(next) => {
                                const rules = group.rules.slice();
                                rules[index] = next;
                                commit({ ...group, rules });
                            }}
                            onRemove={() => commit({ ...group, rules: group.rules.filter((_, i) => i !== index) })}
                        />
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            commit({
                                ...group,
                                rules: [...group.rules, { field: fields[0]?.id ?? '', operator: 'eq', value: '' }],
                            })
                        }
                    >
                        {filtersFr.addCondition}
                    </Button>
                    {onApply ? (
                        <Button size="sm" onClick={() => onApply({ logic: 'and', groups: [group] })}>
                            {filtersFr.apply}
                        </Button>
                    ) : null}
                </div>
                <p className="text-[11px] text-[var(--evo-ink-muted)]">
                    Les groupes de filtres ne sont pas proposés ici — le backend ne les exécute pas
                    sur cet index.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3" data-slot="filter-builder" data-filter-groups="on">
            <div className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--evo-ink-muted)]">Groupes</span>
                <Select
                    value={filters.logic}
                    onValueChange={(logic) => onChange({ ...filters, logic: logic as 'and' | 'or' })}
                >
                    <SelectTrigger className="w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="and">{filtersFr.and}</SelectItem>
                        <SelectItem value="or">{filtersFr.or}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {filters.groups.map((group, index) => (
                <FilterGroupCard
                    key={index}
                    group={group}
                    fields={fields}
                    onChange={(next) => {
                        const groups = filters.groups.slice();
                        groups[index] = next;
                        onChange({ ...filters, groups });
                    }}
                    onRemove={() => onChange({ ...filters, groups: filters.groups.filter((_, i) => i !== index) })}
                />
            ))}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        onChange({
                            ...filters,
                            groups: [...filters.groups, { logic: 'and', rules: [] }],
                        })
                    }
                >
                    {filtersFr.addGroup}
                </Button>
                {onApply ? (
                    <Button size="sm" onClick={() => onApply(filters)}>
                        {filtersFr.apply}
                    </Button>
                ) : null}
            </div>
            <p className="text-[11px] text-[var(--evo-ink-muted)]">
                Le backend n’exécute que deux niveaux (groupe + conditions). Les groupes imbriqués ne sont pas exposés.
            </p>
        </div>
    );
}

export {
    ActiveFilterChip,
    FilterBar,
    FilterBuilder,
    FilterCondition,
    FilterGroupCard as FilterGroup,
    FilterMenu,
};
