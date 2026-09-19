/**
 * P25 overflow contract. Product hardening only — no visual redesign.
 *
 * Page H-overflow is a defect. Table / board local scroll is intentional.
 * Long text uses min-w-0 + truncate or wrap. Do not shrink fonts to fit.
 * Money may wrap; it must never be clipped.
 */

export const P25_VIEWPORTS = [1440, 1280, 1024, 768] as const;

export const PAGE_OVERFLOW_CLASS = 'min-w-0 overflow-x-hidden';

export const LOCAL_SCROLL_X_CLASS = 'min-w-0 overflow-x-auto';

export const LONG_TEXT_CLASS = 'min-w-0 truncate';

export const LONG_TEXT_WRAP_CLASS = 'min-w-0 break-words';

/** Quote builder + money facts. Never truncate or overflow-hidden. */
export const MONEY_NEVER_CLIP_CLASS =
    'money min-w-0 max-w-full break-words tabular-nums';

export const OVERLAY_VIEWPORT_CLASS = 'max-w-[min(100%,calc(100vw-2rem))]';

export const DROPDOWN_VIEWPORT_CLASS = 'max-w-[min(24rem,calc(100vw-1rem))]';

export const FILTER_SEARCH_CLASS = 'relative min-w-0 flex-1';

export function isRequiredViewport(width: number): boolean {

    return (P25_VIEWPORTS as readonly number[]).includes(width);
}

