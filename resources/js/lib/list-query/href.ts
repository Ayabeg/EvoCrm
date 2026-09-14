/**
 * Low-level URL writer. Domain bags only — canonical query goes
 * through `listQueryHref` / adapters first.
 */
export function writeListHref(
    base: string,
    bag: Record<string, unknown>,
): string {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(bag)) {
        if (value === null || value === undefined || value === '' || value === false) {
            continue;
        }

        if (Array.isArray(value) && value.length === 0) {
            continue;
        }

        if (key === 'filter_groups' && typeof value === 'object') {
            const groups = value as { groups?: unknown[] };

            if (!groups.groups?.length) {
                continue;
            }

            params.set(key, JSON.stringify(value));
            continue;
        }

        if (typeof value === 'object') {
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
