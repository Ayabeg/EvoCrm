export type ListObjectType = 'contact' | 'deal' | 'company';

export type ListViewColumn = {
    id: string;
    visible: boolean;
    order: number;
};

export type FilterRule = {
    field: string;
    operator:
        | 'eq'
        | 'neq'
        | 'contains'
        | 'gt'
        | 'gte'
        | 'lt'
        | 'lte'
        | 'is_true'
        | 'is_false'
        | 'is_set'
        | 'is_not_set'
        | 'in'
        | 'before'
        | 'after';
    value?: string | number | boolean | null;
};

export type FilterGroup = {
    logic: 'and' | 'or';
    rules: FilterRule[];
};

export type ListViewFilters = {
    logic: 'and' | 'or';
    groups: FilterGroup[];
};

export type ListColumnDef = {
    id: string;
    label: string;
    defaultVisible: boolean;
};

export type ListFieldDef = {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean';
    options?: string[];
};

export type SavedView = {
    id: number;
    name: string;
    entity: ListObjectType;
    filters: Record<string, unknown>;
    columns: ListViewColumn[];
    sort: { field: string; direction: 'asc' | 'desc' };
    is_default: boolean;
    is_workspace_default?: boolean;
    visibility?: 'private' | 'team' | 'workspace';
    record_count?: number;
};

export type ListViewMeta = {
    columnDefs: ListColumnDef[];
    filterFields: ListFieldDef[];
    columns: ListViewColumn[];
    sort: { field: string; direction: 'asc' | 'desc' };
};

export function defaultFilterGroups(): ListViewFilters {
    return {
        logic: 'and',
        groups: [{ logic: 'and', rules: [] }],
    };
}

export function filterGroupsFromActive(activeFilters: Record<string, unknown>): ListViewFilters {
    const stored = activeFilters.filter_groups as ListViewFilters | undefined;

    if (stored?.groups?.length) {
        return stored;
    }

    const rules: FilterRule[] = [];
    const pushEq = (field: string, value: unknown) => {
        if (value !== null && value !== undefined && value !== '') {
            rules.push({ field, operator: 'eq', value: String(value) });
        }
    };

    pushEq('owner', activeFilters.owner);
    pushEq('city', activeFilters.city);
    pushEq('wilaya', activeFilters.wilaya);
    pushEq('created', activeFilters.created);
    pushEq('last_activity', activeFilters.last_activity);
    pushEq('status', activeFilters.status);
    pushEq('stage', activeFilters.stage);
    pushEq('deal_stage', activeFilters.deal_stage);

    if (activeFilters.has_open_deal) {
        rules.push({ field: 'has_open_deal', operator: 'is_true' });
    }

    if (activeFilters.unanswered) {
        rules.push({ field: 'unanswered', operator: 'is_true' });
    }

    if (activeFilters.unassigned) {
        rules.push({ field: 'unassigned', operator: 'is_true' });
    }

    return {
        logic: 'and',
        groups: [{ logic: 'and', rules }],
    };
}

export function columnLabel(columnDefs: ListColumnDef[], id: string): string {
    return columnDefs.find((column) => column.id === id)?.label ?? id;
}

export function visibleColumns(meta: ListViewMeta): ListViewColumn[] {
    return [...meta.columns]
        .filter((column) => column.visible)
        .sort((a, b) => a.order - b.order);
}
