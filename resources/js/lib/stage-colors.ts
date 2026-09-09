/**
 * Canonical pipeline stage colors — brand tokens only.
 *
 * Semantic mapping (default deal pipeline slugs):
 * - new       → mark      — entry / active pipeline start
 * - qualified → mark/70   — progressing (mark at reduced emphasis)
 * - demo      → mute      — mid-funnel evaluation
 * - proposal  → ink/60    — late stage before close
 * - won       → ink       — closed-won terminal
 * - lost      → hairline  — closed-lost / inactive terminal
 * - default   → mute      — unknown custom stages
 *
 * Pill backgrounds cycle muted surfaces + mark accent — no invented hex ramps.
 */
export const STAGE_COLOR_VARS = {
    mark: 'var(--evosales-mark)',
    ink: 'var(--evosales-ink)',
    mute: 'var(--evosales-mute)',
    hairline: 'var(--evosales-hairline)',
    canvasSoft: 'var(--evosales-canvas-soft)',
} as const;

/** Underline / border accent for kanban column headers. */
export function stageUnderlineColor(slug: string): string {
    switch (slug) {
        case 'new':
            return STAGE_COLOR_VARS.mark;
        case 'waiting_on_contact':
            return STAGE_COLOR_VARS.mute;
        case 'waiting_on_us':
            return STAGE_COLOR_VARS.mark;
        case 'closed':
            return STAGE_COLOR_VARS.hairline;
        case 'qualified':
            return STAGE_COLOR_VARS.mark;
        case 'demo':
            return STAGE_COLOR_VARS.mute;
        case 'proposal':
            return STAGE_COLOR_VARS.mute;
        case 'won':
            return STAGE_COLOR_VARS.ink;
        case 'lost':
            return STAGE_COLOR_VARS.hairline;
        default:
            return STAGE_COLOR_VARS.mute;
    }
}

/** Tailwind classes for stage filter pills (index cycles for custom stages). */
export const STAGE_PILL_CLASSES = [
    'bg-brand/15 text-ink',
    'bg-brand text-primary-foreground',
    'bg-muted text-ink',
    'bg-canvas-soft text-ink ring-1 ring-hairline',
    'bg-ink text-canvas',
    'bg-canvas-soft text-mute ring-1 ring-hairline',
] as const;

export function stagePillClass(index: number): string {
    return STAGE_PILL_CLASSES[index % STAGE_PILL_CLASSES.length];
}
