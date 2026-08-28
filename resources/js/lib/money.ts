export function formatDzd(cents: number | null | undefined): string {
    const value = Math.round((cents ?? 0) / 100);

    return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        maximumFractionDigits: 0,
    }).format(value);
}

/** Compact DZD for cockpit strips. 62000000 cents -> "620K DZD". */
export function formatCompactDzd(cents: number | null | undefined): string {
    const value = Math.round((cents ?? 0) / 100);
    const abs = Math.abs(value);
    const digits = abs >= 1_000_000 ? 3 : abs >= 1_000 ? 1 : 0;
    const compact = new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: digits,
    }).format(value);

    return `${compact} DZD`;
}
