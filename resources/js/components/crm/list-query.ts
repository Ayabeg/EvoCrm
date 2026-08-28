export type ListFilters = Record<string, unknown>;

export function crmListHref(
    base: string,
    filters: ListFilters,
    patch: ListFilters = {},
): string {
    const params = new URLSearchParams();
    const merged: ListFilters = { ...filters, ...patch };

    for (const [key, value] of Object.entries(merged)) {
        if (value === null || value === undefined || value === '' || value === false) {
            continue;
        }

        if (key === 'filter_groups' && typeof value === 'object') {
            params.set(key, JSON.stringify(value));
            continue;
        }

        if (value === true) {
            params.set(key, '1');
        } else {
            params.set(key, String(value));
        }
    }

    const query = params.toString();

    return query ? `${base}?${query}` : base;
}

export function filterFields(filters: ListFilters): ListFilters {
    return {
        view: filters.view,
        owner: filters.owner,
        created: filters.created,
        last_activity: filters.last_activity,
        status: filters.status,
        stage: filters.stage,
        city: filters.city,
        wilaya: filters.wilaya,
        unanswered: filters.unanswered,
        unassigned: filters.unassigned,
        filter_id: filters.filter_id,
        filter_groups: filters.filter_groups,
    };
}

const CREATED_LABELS: Record<string, string> = {
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
};

const ACTIVITY_LABELS: Record<string, string> = {
    '7d': '7 days',
    '30d': '30 days',
    none: 'None',
};

export function hasActiveListFilters(filters: ListFilters): boolean {
    return listFilterChips(filters).length > 0 || (filters.view != null && filters.view !== 'all');
}

export function listFilterChips(
    filters: ListFilters,
    members: { id: number; name: string }[] = [],
): { key: string; label: string; value: string }[] {
    const fields = filterFields(filters);
    const chips: { key: string; label: string; value: string }[] = [];
    const owner = fields.owner == null ? '' : String(fields.owner);

    if (owner === 'unassigned') {
        chips.push({ key: 'owner', label: 'Owner', value: 'Unassigned' });
    } else if (owner) {
        const member = members.find((row) => String(row.id) === owner);
        chips.push({
            key: 'owner',
            label: 'Owner',
            value: member?.name ?? owner,
        });
    }

    if (fields.created) {
        const key = String(fields.created);
        chips.push({
            key: 'created',
            label: 'Created',
            value: CREATED_LABELS[key] ?? key,
        });
    }

    if (fields.last_activity) {
        const key = String(fields.last_activity);
        chips.push({
            key: 'last_activity',
            label: 'Last activity',
            value: ACTIVITY_LABELS[key] ?? key,
        });
    }

    if (fields.status) {
        chips.push({
            key: 'status',
            label: 'Status',
            value: String(fields.status).replace(/_/g, ' '),
        });
    }

    if (fields.stage) {
        chips.push({ key: 'stage', label: 'Stage', value: String(fields.stage) });
    }

    if (fields.city) {
        chips.push({ key: 'city', label: 'City', value: String(fields.city) });
    }

    if (fields.wilaya) {
        chips.push({ key: 'wilaya', label: 'Wilaya', value: String(fields.wilaya) });
    }

    if (fields.unanswered) {
        chips.push({ key: 'unanswered', label: 'Unanswered', value: 'Yes' });
    }

    if (fields.unassigned) {
        chips.push({ key: 'unassigned', label: 'Unassigned', value: 'Yes' });
    }

    return chips;
}
