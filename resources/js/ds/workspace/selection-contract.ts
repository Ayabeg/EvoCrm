import {
    derivePageSelection,
    togglePageSelectedIds,
    toggleSelectedId,
} from './selection';

/**
 * Compile + value lock for P03B selection reducers.
 * Live list pages keep numeric ids; the contract also accepts string ids.
 */

export const P03B_TOGGLE_ONE = toggleSelectedId<number>([], 11);
export const P03B_DESELECT = toggleSelectedId<number>([11], 11);
export const P03B_UNSELECTABLE = toggleSelectedId<number>([], 11, {
    isRowSelectable: (id) => id !== 11,
});
export const P03B_SELECTABLE_OFF = toggleSelectedId<number>([], 3, {
    selectable: false,
});
export const P03B_STRING_ID = toggleSelectedId<string>([], 'lead-uuid');
export const P03B_PAGE_ACCUMULATE = togglePageSelectedIds<number>([99], [1, 2]);
export const P03B_PAGE_CLEAR = togglePageSelectedIds<number>([1, 2, 99], [1, 2]);
export const P03B_INDETERMINATE = derivePageSelection([1], [1, 2]);
export const P03B_ALL_PAGE = derivePageSelection([1, 2], [1, 2]);
export const P03B_NONE_PAGE = derivePageSelection([], [1, 2]);

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function runP03BSelectionProofs(): void {
    assert(P03B_TOGGLE_ONE.length === 1 && P03B_TOGGLE_ONE[0] === 11, 'select one');
    assert(P03B_DESELECT.length === 0, 'deselect one');
    assert(P03B_UNSELECTABLE.length === 0, 'unselectable protected');
    assert(P03B_SELECTABLE_OFF.length === 0, 'selectable false is a no-op');
    assert(P03B_STRING_ID[0] === 'lead-uuid', 'string row ids');
    assert(
        P03B_PAGE_ACCUMULATE.includes(99) &&
            P03B_PAGE_ACCUMULATE.includes(1) &&
            P03B_PAGE_ACCUMULATE.includes(2),
        'select-all is current page and keeps other pages',
    );
    assert(
        P03B_PAGE_CLEAR.length === 1 && P03B_PAGE_CLEAR[0] === 99,
        'select-all off clears the current page only',
    );
    assert(
        P03B_INDETERMINATE.somePageSelected && !P03B_INDETERMINATE.allPageSelected,
        'indeterminate',
    );
    assert(P03B_ALL_PAGE.allPageSelected && !P03B_ALL_PAGE.somePageSelected, 'all page');
    assert(!P03B_NONE_PAGE.allPageSelected && !P03B_NONE_PAGE.somePageSelected, 'none page');
    assert(P03B_TOGGLE_ONE.length > 0, 'bulk activates only with selection');
}

runP03BSelectionProofs();
