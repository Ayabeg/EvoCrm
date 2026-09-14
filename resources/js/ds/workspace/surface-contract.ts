import { workspacePageHref, resolveRowHref, resolveWorkspaceBoardSlot } from '@/ds/workspace/surface';

/**
 * Compile + value lock for P03D empty / pagination / board helpers.
 * Shared-table path is usable without domain children.
 */

const ROW = { id: 42 as const };

/** rowHref wins over basePath fallback. */
export const P03D_ROW_HREF = resolveRowHref(
    ROW,
    (row) => `/crm/contacts/${row.id}/show`,
    '/crm/contacts',
);

/** Domain-style fallback when ListViewTable omits rowHref. */
export const P03D_ROW_HREF_FALLBACK = resolveRowHref(ROW, undefined, '/crm/contacts');

/** Trailing slash on basePath must not double. */
export const P03D_ROW_HREF_SLASH = resolveRowHref({ id: 7 }, undefined, '/crm/deals/');

/** String row ids stay string — no Number() coercion. */
export const P03D_ROW_HREF_STRING = resolveRowHref(
    { id: 'uuid-row' },
    undefined,
    '/crm/contacts',
);

const PAGE_FILTERS = {
    q: 'amel',
    view: 'my',
    owner: '9',
    page: 4,
};

/** Page 1 omits `page` (same as listPageHref / CrmListFooter). */
export const P03D_PAGE_ONE = workspacePageHref('/crm/contacts', PAGE_FILTERS, 1);

/** Page 2 keeps search, view, owner. Contacts have no pipeline extra. */
export const P03D_PAGE_TWO = workspacePageHref('/crm/contacts', PAGE_FILTERS, 2);

/** Deals extras.pipeline survives pagination. */
export const P03D_PAGE_DEALS = workspacePageHref(
    '/crm/deals',
    { q: 'clinic', view: 'all', stage: 'new' },
    3,
    { pipeline: 8 },
);

const BOARD = 'pipeline-kanban-slot';

/** mode=board + board node → slot. */
export const P03D_BOARD_READY = resolveWorkspaceBoardSlot({
    mode: 'board',
    board: BOARD,
});

/** mode=list never mounts the board, even if a node is passed. */
export const P03D_BOARD_LIST = resolveWorkspaceBoardSlot({
    mode: 'list',
    board: BOARD,
});

/** mode=board without a node is a no-op (P11 supplies PipelineKanban). */
export const P03D_BOARD_EMPTY = resolveWorkspaceBoardSlot({
    mode: 'board',
});

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function runP03DSurfaceProofs(): void {
    assert(
        P03D_ROW_HREF === '/crm/contacts/42/show',
        'rowHref is consumed instead of being voided',
    );
    assert(
        P03D_ROW_HREF_FALLBACK === '/crm/contacts/42',
        'rowHref fallback is basePath/id',
    );
    assert(
        P03D_ROW_HREF_SLASH === '/crm/deals/7',
        'trailing slash does not double',
    );
    assert(
        P03D_ROW_HREF_STRING === '/crm/contacts/uuid-row',
        'string row ids are not coerced',
    );
    assert(
        P03D_PAGE_ONE === '/crm/contacts?q=amel&view=my&owner=9',
        'page 1 omits page and keeps siblings',
    );
    assert(
        P03D_PAGE_TWO === '/crm/contacts?q=amel&view=my&page=2&owner=9',
        'page 2 keeps search/view/owner/extras',
    );
    assert(
        P03D_PAGE_DEALS.includes('q=clinic') &&
            P03D_PAGE_DEALS.includes('view=all') &&
            P03D_PAGE_DEALS.includes('stage=new') &&
            P03D_PAGE_DEALS.includes('page=3') &&
            P03D_PAGE_DEALS.includes('pipeline=8'),
        'deal page nav preserves search/filters/pipeline',
    );
    assert(P03D_BOARD_READY === BOARD, 'board slot ready for P11');
    assert(P03D_BOARD_LIST === null, 'list mode ignores board');
    assert(P03D_BOARD_EMPTY === null, 'board mode without a node is empty');
}

runP03DSurfaceProofs();
