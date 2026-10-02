const CURRENCY_SUFFIX = 'DA';

function groupFrDz(value: number): string {
    return new Intl.NumberFormat('fr-DZ', {
        maximumFractionDigits: 0,
        numberingSystem: 'latn',
    }).format(value);
}

/**
 * Full DA amount. Same output in every UI locale — never Intl `DZD`.
 * 128_000_000 cents → "1 280 000 DA".
 */
export function formatDzd(cents: number | null | undefined): string {
    const value = Math.round((cents ?? 0) / 100);

    return `${groupFrDz(value)}\u00A0${CURRENCY_SUFFIX}`;
}

/**
 * Compact DA for cockpit strips. Same FR compact style in every locale.
 * 228_500_000 cents → "2,3 M DA". Never `DZD`.
 */
export function formatCompactDzd(cents: number | null | undefined): string {
    const value = Math.round((cents ?? 0) / 100);
    const compact = new Intl.NumberFormat('fr-DZ', {
        notation: 'compact',
        maximumFractionDigits: 1,
        numberingSystem: 'latn',
    }).format(value);

    return `${compact}\u00A0${CURRENCY_SUFFIX}`;
}
