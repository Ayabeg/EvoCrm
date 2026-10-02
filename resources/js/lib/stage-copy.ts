import { t } from '@/lib/i18n';

/** Display order: proposal before demo. Slugs stay English. */
export const STAGE_DISPLAY_ORDER = [
    'new',
    'qualified',
    'proposal',
    'demo',
    'won',
    'lost',
] as const;

const STAGE_KEYS: Record<string, string> = {
    new: 'New',
    qualified: 'Qualification',
    proposal: 'Proposal',
    demo: 'Demo',
    won: 'Won',
    lost: 'Lost',
};

export function stageLabel(
    slug?: string | null,
    fallback?: string | null,
): string {
    if (slug && STAGE_KEYS[slug]) {
        return t(STAGE_KEYS[slug]);
    }

    return fallback ? t(fallback) : '—';
}

export function sortStages<T extends { slug?: string | null }>(stages: T[]): T[] {
    return [...stages].sort((a, b) => {
        const left = STAGE_DISPLAY_ORDER.indexOf(
            (a.slug ?? '') as (typeof STAGE_DISPLAY_ORDER)[number],
        );
        const right = STAGE_DISPLAY_ORDER.indexOf(
            (b.slug ?? '') as (typeof STAGE_DISPLAY_ORDER)[number],
        );

        return (left === -1 ? 99 : left) - (right === -1 ? 99 : right);
    });
}
