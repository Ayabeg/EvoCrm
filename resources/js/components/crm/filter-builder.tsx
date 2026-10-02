import { useState } from 'react';
import { Button } from '@/evo/ui/button';
import type { FilterGroup, FilterRule, ListFieldDef, ListObjectType, ListViewFilters } from '@/lib/list-view-config';
import { defaultFilterGroups } from '@/lib/list-view-config';

type Member = { id: number; name: string };

export default function FilterBuilder({
    fields,
    value,
    members = [],
    cities = [],
    wilayas = [],
    stages = [],
    onChange,
}: {
    entity: ListObjectType;
    fields: ListFieldDef[];
    value?: ListViewFilters | null;
    members?: Member[];
    cities?: string[];
    wilayas?: string[];
    stages?: { id: number; name: string; slug: string }[];
    onChange?: (value: ListViewFilters) => void;
}) {
    const [filters, setFilters] = useState<ListViewFilters>(value ?? defaultFilterGroups());

    const update = (next: ListViewFilters) => {
        setFilters(next);
        onChange?.(next);
    };

    const updateGroup = (groupIndex: number, patch: Partial<FilterGroup>) => {
        const groups = filters.groups.map((group, index) =>
            index === groupIndex ? { ...group, ...patch } : group,
        );
        update({ ...filters, groups });
    };

    const updateRule = (groupIndex: number, ruleIndex: number, patch: Partial<FilterRule>) => {
        const groups = filters.groups.map((group, gi) => {
            if (gi !== groupIndex) {
                return group;
            }

            const rules = group.rules.map((rule, ri) => (ri === ruleIndex ? { ...rule, ...patch } : rule));

            return { ...group, rules };
        });
        update({ ...filters, groups });
    };

    const addRule = (groupIndex: number) => {
        const field = fields[0]?.id ?? 'owner';
        updateGroup(groupIndex, {
            rules: [...filters.groups[groupIndex].rules, { field, operator: 'eq', value: '' }],
        });
    };

    const removeRule = (groupIndex: number, ruleIndex: number) => {
        updateGroup(groupIndex, {
            rules: filters.groups[groupIndex].rules.filter((_, index) => index !== ruleIndex),
        });
    };

    const addGroup = () => {
        update({
            ...filters,
            groups: [...filters.groups, { logic: 'and', rules: [] }],
        });
    };

    const optionsForField = (fieldId: string): { value: string; label: string }[] => {
        const field = fields.find((item) => item.id === fieldId);

        if (!field) {
            return [];
        }

        if (field.type === 'boolean') {
            return [
                { value: 'is_true', label: 'Yes' },
                { value: 'is_false', label: 'No' },
            ];
        }

        if (fieldId === 'owner') {
            return [
                { value: 'unassigned', label: 'Unassigned' },
                ...members.map((member) => ({ value: String(member.id), label: member.name })),
            ];
        }

        if (fieldId === 'city') {
            return cities.map((city) => ({ value: city, label: city }));
        }

        if (fieldId === 'wilaya') {
            return wilayas.map((wilaya) => ({ value: wilaya, label: wilaya }));
        }

        if (fieldId === 'stage') {
            return stages.map((stage) => ({ value: stage.slug, label: stage.name }));
        }

        if (field.options?.length) {
            return field.options.map((option) => ({ value: option, label: option }));
        }

        return [];
    };

    return (
        <div className="space-y-2 rounded border border-hairline bg-canvas p-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-ink">Advanced filters</span>
                <select
                    value={filters.logic}
                    onChange={(event) => update({ ...filters, logic: event.target.value as 'and' | 'or' })}
                    className="h-7 rounded border bg-background px-1 text-[11px]"
                >
                    <option value="and">Match all groups</option>
                    <option value="or">Match any group</option>
                </select>
            </div>

            {filters.groups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-1 rounded bg-canvas-soft p-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-mute">Group {groupIndex + 1}</span>
                        <select
                            value={group.logic}
                            onChange={(event) =>
                                updateGroup(groupIndex, { logic: event.target.value as 'and' | 'or' })
                            }
                            className="h-6 rounded border bg-background px-1 text-[10px]"
                        >
                            <option value="and">AND</option>
                            <option value="or">OR</option>
                        </select>
                    </div>

                    {group.rules.map((rule, ruleIndex) => {
                        const field = fields.find((item) => item.id === rule.field);
                        const isBoolean = field?.type === 'boolean';

                        return (
                            <div key={ruleIndex} className="flex flex-wrap items-center gap-1">
                                <select
                                    value={rule.field}
                                    onChange={(event) =>
                                        updateRule(groupIndex, ruleIndex, {
                                            field: event.target.value,
                                            operator: 'eq',
                                            value: '',
                                        })
                                    }
                                    className="h-7 min-w-[7rem] rounded border bg-background px-1 text-[11px]"
                                >
                                    {fields.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>

                                {!isBoolean ? (
                                    <>
                                        <select
                                            value={rule.operator}
                                            onChange={(event) =>
                                                updateRule(groupIndex, ruleIndex, {
                                                    operator: event.target.value as FilterRule['operator'],
                                                })
                                            }
                                            className="h-7 rounded border bg-background px-1 text-[11px]"
                                        >
                                            <option value="eq">equals</option>
                                            <option value="neq">not equals</option>
                                            <option value="contains">contains</option>
                                            <option value="in">in list</option>
                                            <option value="gt">&gt;</option>
                                            <option value="gte">&gt;=</option>
                                            <option value="lt">&lt;</option>
                                            <option value="lte">&lt;=</option>
                                            <option value="before">before</option>
                                            <option value="after">after</option>
                                            <option value="is_set">is set</option>
                                            <option value="is_not_set">is not set</option>
                                        </select>
                                        {!['is_set', 'is_not_set'].includes(rule.operator) ? (
                                            rule.operator === 'in' ? (
                                                <input
                                                    type="text"
                                                    value={String(rule.value ?? '')}
                                                    onChange={(event) =>
                                                        updateRule(groupIndex, ruleIndex, { value: event.target.value })
                                                    }
                                                    className="h-7 min-w-[6rem] flex-1 rounded border bg-background px-2 text-[11px]"
                                                    placeholder="a, b, c"
                                                />
                                            ) : ['before', 'after'].includes(rule.operator) || field?.type === 'date' ? (
                                                <input
                                                    type="date"
                                                    value={String(rule.value ?? '')}
                                                    onChange={(event) =>
                                                        updateRule(groupIndex, ruleIndex, { value: event.target.value })
                                                    }
                                                    className="h-7 min-w-[6rem] flex-1 rounded border bg-background px-2 text-[11px]"
                                                />
                                            ) : optionsForField(rule.field).length > 0 ? (
                                                <select
                                                    value={String(rule.value ?? '')}
                                                    onChange={(event) =>
                                                        updateRule(groupIndex, ruleIndex, { value: event.target.value })
                                                    }
                                                    className="h-7 min-w-[6rem] flex-1 rounded border bg-background px-1 text-[11px]"
                                                >
                                                    <option value="">Select…</option>
                                                    {optionsForField(rule.field).map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={String(rule.value ?? '')}
                                                    onChange={(event) =>
                                                        updateRule(groupIndex, ruleIndex, { value: event.target.value })
                                                    }
                                                    className="h-7 min-w-[6rem] flex-1 rounded border bg-background px-2 text-[11px]"
                                                    placeholder="Value"
                                                />
                                            )
                                        ) : null}
                                    </>
                                ) : (
                                    <select
                                        value={rule.operator}
                                        onChange={(event) =>
                                            updateRule(groupIndex, ruleIndex, {
                                                operator: event.target.value as FilterRule['operator'],
                                            })
                                        }
                                        className="h-7 rounded border bg-background px-1 text-[11px]"
                                    >
                                        <option value="is_true">is true</option>
                                        <option value="is_false">is false</option>
                                    </select>
                                )}

                                <button
                                    type="button"
                                    onClick={() => removeRule(groupIndex, ruleIndex)}
                                    className="text-[11px] text-mute hover:text-ink"
                                >
                                    Remove
                                </button>
                            </div>
                        );
                    })}

                    <Button type="button" variant="secondary" className="h-7 px-2 text-[11px]" onClick={() => addRule(groupIndex)}>
                        Add rule
                    </Button>
                </div>
            ))}

            <Button type="button" variant="secondary" className="h-7 px-2 text-[11px]" onClick={addGroup}>
                Add group
            </Button>

            <input type="hidden" name="filter_groups" value={JSON.stringify(filters)} />
        </div>
    );
}
