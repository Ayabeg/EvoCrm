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
