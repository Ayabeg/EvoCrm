/**
 * P27 motion contract. Product hardening only — no visual redesign.
 *
 * Hover ~120ms, dropdown ~150ms, page ~150ms, modal ~180ms, drawer 200ms.
 * Easing cubic-bezier(.2,.8,.2,1). No bounce / overshoot.
 * Focus rings stay P26. Reduced-motion kills decorative motion only.
 */

export const P27_EASE = 'cubic-bezier(.2,.8,.2,1)';

export const P27_HOVER_MS = 120;
export const P27_DROPDOWN_MS = 150;
export const P27_PAGE_MS = 150;
export const P27_MODAL_MS = 180;
export const P27_DRAWER_MS = 200;

export const MOTION_REDUCE_CLASS =
    'motion-reduce:animate-none motion-reduce:transition-none motion-reduce:duration-0';

export const MOTION_HOVER_CLASS =
    'transition-colors duration-[var(--motion-duration-hover)] ease-[var(--motion-ease-out)] motion-reduce:transition-none';

export const MOTION_DROPDOWN_CLASS =
    `duration-[var(--motion-duration-dropdown)] ease-[var(--motion-ease-out)] ${MOTION_REDUCE_CLASS}`;

export const MOTION_PAGE_CLASS =
    'duration-[var(--motion-duration-page)] ease-[var(--motion-ease-out)] motion-reduce:transition-none';

export const MOTION_MODAL_CLASS =
    `duration-[var(--motion-duration-modal)] ease-[var(--motion-ease-out)] ${MOTION_REDUCE_CLASS}`;

export const MOTION_DRAWER_CLASS =
    `duration-[var(--motion-duration-drawer)] ease-[var(--motion-ease-out)] ${MOTION_REDUCE_CLASS}`;

export function isContractDuration(ms: number): boolean {
    return (
        ms === P27_HOVER_MS ||
        ms === P27_DROPDOWN_MS ||
        ms === P27_PAGE_MS ||
        ms === P27_MODAL_MS ||
        ms === P27_DRAWER_MS
    );
}
