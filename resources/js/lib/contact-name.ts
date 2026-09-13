/** Mirrors Contact::displayName() — avoids duplicated first/last in UI. */
export function formatContactName(
    firstName: string,
    lastName?: string | null,
): string {
    const first = firstName.trim();
    const last = (lastName ?? '').trim();

    if (last === '' || last.localeCompare(first, undefined, { sensitivity: 'accent' }) === 0) {
        return first;
    }

    if (first !== '' && first.toLowerCase().includes(last.toLowerCase())) {
        return first;
    }

    return `${first} ${last}`.trim();
}

export function contactInitials(
    firstName: string,
    lastName?: string | null,
): string {
    return formatContactName(firstName, lastName)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}
