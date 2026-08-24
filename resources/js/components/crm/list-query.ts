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
    };
}
