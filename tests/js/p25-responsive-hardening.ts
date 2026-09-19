/**
 * Test-only P25 overflow proofs. Never import from an Inertia page.
 */
import {
    DASHBOARD_TIMEZONE,
    HOME_KPI_STRIP_TRACK_CLASS,
    HOME_KPI_VALUE_CLASS,
} from '../../resources/js/lib/dashboard-operating-home';
import { QUOTE_MONEY_CLASS } from '../../resources/js/lib/quote-builder';
import {
    DROPDOWN_VIEWPORT_CLASS,
    FILTER_SEARCH_CLASS,
    isRequiredViewport,
    LOCAL_SCROLL_X_CLASS,
    LONG_TEXT_CLASS,
    LONG_TEXT_WRAP_CLASS,
    MONEY_NEVER_CLIP_CLASS,
    OVERLAY_VIEWPORT_CLASS,
    P25_VIEWPORTS,
    PAGE_OVERFLOW_CLASS,
} from '../../resources/js/lib/responsive';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function expectTrue(value: boolean, label: string): void {
    if (!value) {
        throw new Error(label);
    }
}

expectEqual(P25_VIEWPORTS, [1440, 1280, 1024, 768], 'required viewports');
expectTrue(isRequiredViewport(768), '768 is required');
expectTrue(!isRequiredViewport(375), 'phone widths are not P25 required');

expectTrue(PAGE_OVERFLOW_CLASS.includes('min-w-0'), 'page overflow shrinks flex items');
expectTrue(PAGE_OVERFLOW_CLASS.includes('overflow-x-hidden'), 'page overflow clips H-scroll');
expectTrue(LOCAL_SCROLL_X_CLASS.includes('overflow-x-auto'), 'tables/boards may scroll locally');
expectTrue(LONG_TEXT_CLASS.includes('truncate'), 'long names truncate');
expectTrue(LONG_TEXT_WRAP_CLASS.includes('break-words'), 'long copy wraps');
expectTrue(!LONG_TEXT_CLASS.includes('text-['), 'do not shrink fonts to fit');
expectTrue(MONEY_NEVER_CLIP_CLASS.includes('break-words'), 'money wraps');
expectTrue(!MONEY_NEVER_CLIP_CLASS.includes('truncate'), 'money is never truncated');
expectTrue(!MONEY_NEVER_CLIP_CLASS.includes('overflow-hidden'), 'money is never clipped');
expectTrue(OVERLAY_VIEWPORT_CLASS.includes('100vw'), 'overlays cap to viewport');
expectTrue(DROPDOWN_VIEWPORT_CLASS.includes('100vw'), 'menus cap to viewport');
expectTrue(FILTER_SEARCH_CLASS.includes('min-w-0'), 'filter search can shrink');
expectTrue(!FILTER_SEARCH_CLASS.includes('min-w-[12rem]'), 'filter search has no 12rem floor');

expectEqual(DASHBOARD_TIMEZONE, 'Africa/Algiers', 'P17 timezone frozen');
expectTrue(HOME_KPI_STRIP_TRACK_CLASS.includes('grid-cols-2'), 'P17 KPI 2×2 at 768');
expectTrue(HOME_KPI_STRIP_TRACK_CLASS.includes('md:grid-cols-4'), 'P17 KPI 4-col at md+');
expectTrue(!HOME_KPI_STRIP_TRACK_CLASS.includes('overflow-x-auto'), 'P17 KPI is not a scroller');
expectTrue(HOME_KPI_VALUE_CLASS.includes('break-words'), 'P17 KPI values wrap');
expectTrue(QUOTE_MONEY_CLASS.includes('break-words'), 'quote builder money wraps');
expectTrue(
    LOCAL_SCROLL_X_CLASS === 'min-w-0 overflow-x-auto',
    'local scroll is min-w-0 overflow-x-auto',
);

console.log('P25 responsive hardening JS proofs passed');
