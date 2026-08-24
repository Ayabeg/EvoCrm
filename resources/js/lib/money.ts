export function formatDzd(cents: number | null | undefined): string {
    const value = Math.round((cents ?? 0) / 100);

    return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD',
        maximumFractionDigits: 0,
    }).format(value);
}
