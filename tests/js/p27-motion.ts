/**
 * Test-only P27 motion proofs. Never import from an Inertia page.
 */
import {
    isContractDuration,
    MOTION_DRAWER_CLASS,
    MOTION_DROPDOWN_CLASS,
    MOTION_HOVER_CLASS,
    MOTION_MODAL_CLASS,
    MOTION_PAGE_CLASS,
    MOTION_REDUCE_CLASS,
    P27_DRAWER_MS,
    P27_DROPDOWN_MS,
    P27_EASE,
    P27_HOVER_MS,
    P27_MODAL_MS,
    P27_PAGE_MS,
} from '../../resources/js/lib/motion';

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

expectEqual(P27_HOVER_MS, 120, 'hover is ~120ms');
expectEqual(P27_DROPDOWN_MS, 150, 'dropdown is ~150ms');
expectEqual(P27_PAGE_MS, 150, 'page is ~150ms');
expectEqual(P27_MODAL_MS, 180, 'modal is ~180ms');
expectEqual(P27_DRAWER_MS, 200, 'drawer is 180–220ms (200)');
expectEqual(P27_EASE, 'cubic-bezier(.2,.8,.2,1)', 'easing is contract ease');

expectTrue(isContractDuration(120), '120 is a contract duration');
expectTrue(isContractDuration(200), '200 is a contract duration');
expectTrue(!isContractDuration(300), '300ms is outside the contract');
expectTrue(!isContractDuration(360), '360ms is outside the contract');

expectTrue(MOTION_HOVER_CLASS.includes('--motion-duration-hover'), 'hover class uses the token');
expectTrue(MOTION_DROPDOWN_CLASS.includes('--motion-duration-dropdown'), 'dropdown class uses the token');
expectTrue(MOTION_PAGE_CLASS.includes('--motion-duration-page'), 'page class uses the token');
expectTrue(MOTION_MODAL_CLASS.includes('--motion-duration-modal'), 'modal class uses the token');
expectTrue(MOTION_DRAWER_CLASS.includes('--motion-duration-drawer'), 'drawer class uses the token');
expectTrue(MOTION_REDUCE_CLASS.includes('motion-reduce:animate-none'), 'reduce kills decorative animate');
expectTrue(MOTION_HOVER_CLASS.includes('motion-reduce:transition-none'), 'hover dies under reduced-motion');
expectTrue(!MOTION_HOVER_CLASS.includes('bounce'), 'hover has no bounce');
expectTrue(!P27_EASE.includes('spring'), 'ease is not a spring');

console.log('P27 motion JS proofs passed');
