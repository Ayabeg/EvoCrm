import {
    createWorkspaceSelection,
    derivePageSelection,
    hasRowId,
    sameRowId,
    togglePageSelectedIds,
    toggleSelectedId,
} from './selection';
import type { RowId } from './selection';

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

/** Page1 [1,2] → Page2 select-all → keep 1,2 and add 11,12,13. */
export const P03B_PAGE2_SELECT = togglePageSelectedIds<number>([1, 2], [11, 12, 13]);
/** Deselect-all Page2 must return [1,2], not []. */
export const P03B_PAGE2_DESELECT = togglePageSelectedIds<number>(
    P03B_PAGE2_SELECT,
    [11, 12, 13],
);

/** Other-page ids do not make the current-page header mixed or checked. */
export const P03B_INDETERMINATE_OTHER_PAGE_ONLY = derivePageSelection(
    [1, 2],
    [11, 12, 13],
);
/** Mixed against CURRENT PAGE ids only. */
export const P03B_INDETERMINATE_CURRENT_PAGE = derivePageSelection(
    [1, 2, 11],
    [11, 12, 13],
);
export const P03B_INDETERMINATE = derivePageSelection([1], [1, 2]);
export const P03B_ALL_PAGE = derivePageSelection([1, 2], [1, 2]);
export const P03B_NONE_PAGE = derivePageSelection([], [1, 2]);

export const P03B_NUMBER_NOT_STRING = toggleSelectedId<RowId>([1], '1');
export const P03B_STRING_NOT_NUMBER = toggleSelectedId<RowId>(['1'], 1);
export const P03B_PAGE_SKIPS_DISABLED = togglePageSelectedIds<number>([], [1, 2, 3], {
    isRowSelectable: (id) => id !== 3,
});
export const P03B_PAGE_DESELECT_KEEPS_DISABLED = togglePageSelectedIds<number>(
    [1, 2, 3],
    [1, 2, 3],
    { isRowSelectable: (id) => id !== 3 },
);

export const P03B_BULK_EMPTY = createWorkspaceSelection<number>(
    [],
    [1, 2],
    () => undefined,
    {},
);
export const P03B_BULK_OTHER_PAGE = createWorkspaceSelection<number>(
    [1, 2],
    [11, 12, 13],
    () => undefined,
    {},
);
export const P03B_BULK_CLEARED = createWorkspaceSelection<number>(
    [],
    [11, 12, 13],
    () => undefined,
    {},
);

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
        P03B_PAGE2_SELECT.length === 5 &&
            P03B_PAGE2_SELECT[0] === 1 &&
            P03B_PAGE2_SELECT[1] === 2 &&
            P03B_PAGE2_SELECT[2] === 11 &&
            P03B_PAGE2_SELECT[3] === 12 &&
            P03B_PAGE2_SELECT[4] === 13,
        'page2 select-all accumulates page1 ids',
    );
    assert(
        P03B_PAGE2_DESELECT.length === 2 &&
            P03B_PAGE2_DESELECT[0] === 1 &&
            P03B_PAGE2_DESELECT[1] === 2,
        'page2 deselect-all returns [1,2] not []',
    );
    assert(
        !P03B_INDETERMINATE_OTHER_PAGE_ONLY.allPageSelected &&
            !P03B_INDETERMINATE_OTHER_PAGE_ONLY.somePageSelected,
        'indeterminate ignores other-page ids',
    );
    assert(
        P03B_INDETERMINATE_CURRENT_PAGE.somePageSelected &&
            !P03B_INDETERMINATE_CURRENT_PAGE.allPageSelected,
        'indeterminate is current page only',
    );
    assert(
        P03B_INDETERMINATE.somePageSelected && !P03B_INDETERMINATE.allPageSelected,
        'indeterminate',
    );
    assert(P03B_ALL_PAGE.allPageSelected && !P03B_ALL_PAGE.somePageSelected, 'all page');
    assert(!P03B_NONE_PAGE.allPageSelected && !P03B_NONE_PAGE.somePageSelected, 'none page');
    assert(
        P03B_NUMBER_NOT_STRING.length === 2 &&
            hasRowId(P03B_NUMBER_NOT_STRING, 1) &&
            hasRowId(P03B_NUMBER_NOT_STRING, '1') &&
            !sameRowId(1, '1'),
        'number 1 is not string 1',
    );
    assert(
        P03B_STRING_NOT_NUMBER.length === 2 &&
            hasRowId(P03B_STRING_NOT_NUMBER, '1') &&
            hasRowId(P03B_STRING_NOT_NUMBER, 1),
        'string 1 is not number 1',
    );
    assert(
        P03B_PAGE_SKIPS_DISABLED.length === 2 &&
            P03B_PAGE_SKIPS_DISABLED[0] === 1 &&
            P03B_PAGE_SKIPS_DISABLED[1] === 2,
        'select-all excludes non-selectable rows',
    );
    assert(
        P03B_PAGE_DESELECT_KEEPS_DISABLED.length === 1 &&
            P03B_PAGE_DESELECT_KEEPS_DISABLED[0] === 3,
        'deselect-all does not drop non-selectable leftover ids',
    );
    assert(!P03B_BULK_EMPTY.bulkActive && P03B_BULK_EMPTY.selectedCount === 0, 'clear → bulk false');
    assert(
        P03B_BULK_OTHER_PAGE.bulkActive && P03B_BULK_OTHER_PAGE.selectedCount === 2,
        'other-page ids keep bulkActive true',
    );
    assert(!P03B_BULK_CLEARED.bulkActive, 'empty set is not bulk-active');
    assert(P03B_TOGGLE_ONE.length > 0, 'bulk activates only with selection');
}

runP03BSelectionProofs();
