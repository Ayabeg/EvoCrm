import {
    DEAL_BOARD_PATH,
    DEAL_LIST_PATH,
    dealLayoutHref,
    dealLayoutQuery,
} from '@/lib/list-query/deal-layout';
import { emptyCanonicalListQuery } from '@/lib/list-query/empty';
import { applyPipeline, patchListQuery } from '@/lib/list-query/patch';
import { fromActiveFilters, listQueryHref } from '@/lib/list-query/serialize';
import type { CanonicalListQuery } from '@/lib/list-query/types';

function query(partial: Partial<CanonicalListQuery> = {}): CanonicalListQuery {
    const base = emptyCanonicalListQuery();

    return {
        ...base,
        ...partial,
        filters: { ...base.filters, ...partial.filters },
        extras: { ...base.extras, ...partial.extras },
    };
}

const LIST_STATE = query({
    search: 'clinic',
    page: 2,
    view: 'my',
    savedViewId: 12,
    filters: {
        ...emptyCanonicalListQuery().filters,
        owner: '7',
        created: '7d',
        status: 'open',
        stage: 'qualified',
    },
    sort: { field: 'amount', direction: 'desc' },
    extras: { pipeline: 4 },
});

export const P11_LIST_TO_BOARD = dealLayoutHref(LIST_STATE, 'board');
export const P11_BOARD_TO_LIST = dealLayoutHref(
    dealLayoutQuery(LIST_STATE, 'board'),
    'list',
);
export const P11_LIST_ROUND_TRIP = dealLayoutHref(
    fromActiveFilters({
        q: 'clinic',
        view: 'my',
        filter_id: 12,
        owner: '7',
        created: '7d',
        status: 'open',
        stage: 'qualified',
        sort: 'amount',
        direction: 'desc',
        pipeline: 4,
    }),
    'list',
);

export const P11_BOARD_PIPELINE = listQueryHref(
    DEAL_BOARD_PATH,
    applyPipeline(LIST_STATE, 9),
    'deal',
);

export const P11_EMPTY_BOARD_PIPELINE = listQueryHref(
    DEAL_BOARD_PATH,
    applyPipeline(
        { ...emptyCanonicalListQuery(), view: null, extras: { pipeline: 4 } },
        9,
    ),
    'deal',
);

export const P11_SEARCH_ON_BOARD = listQueryHref(
    DEAL_BOARD_PATH,
    patchListQuery(dealLayoutQuery(LIST_STATE, 'board'), { search: 'atlas' }),
    'deal',
);

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function runP11DealLayoutProofs(): void {
    assert(DEAL_LIST_PATH === '/crm/deals', 'list path is /crm/deals');
    assert(DEAL_BOARD_PATH === '/crm/deals/board', 'board path is /crm/deals/board');
    assert(
        P11_LIST_TO_BOARD.startsWith('/crm/deals/board?') &&
            P11_LIST_TO_BOARD.includes('q=clinic') &&
            P11_LIST_TO_BOARD.includes('owner=7') &&
            P11_LIST_TO_BOARD.includes('created=7d') &&
            P11_LIST_TO_BOARD.includes('status=open') &&
            P11_LIST_TO_BOARD.includes('stage=qualified') &&
            P11_LIST_TO_BOARD.includes('view=my') &&
            P11_LIST_TO_BOARD.includes('filter_id=12') &&
            P11_LIST_TO_BOARD.includes('sort=amount') &&
            P11_LIST_TO_BOARD.includes('direction=desc') &&
            P11_LIST_TO_BOARD.includes('pipeline=4') &&
            !P11_LIST_TO_BOARD.includes('page=') &&
            !P11_LIST_TO_BOARD.includes('peek=') &&
            !P11_LIST_TO_BOARD.includes('mode='),
        '1 list→board preserves compatible query and drops page',
    );
    assert(
        P11_BOARD_TO_LIST.startsWith('/crm/deals?') &&
            P11_BOARD_TO_LIST.includes('q=clinic') &&
            P11_BOARD_TO_LIST.includes('owner=7') &&
            P11_BOARD_TO_LIST.includes('stage=qualified') &&
            P11_BOARD_TO_LIST.includes('filter_id=12') &&
            P11_BOARD_TO_LIST.includes('pipeline=4') &&
            !P11_BOARD_TO_LIST.includes('page=') &&
            !P11_BOARD_TO_LIST.includes('peek='),
        '2 board→list restores compatible query; page stays reset',
    );
    assert(
        P11_LIST_ROUND_TRIP.includes('q=clinic') &&
            P11_LIST_ROUND_TRIP.includes('filter_id=12') &&
            P11_LIST_ROUND_TRIP.includes('pipeline=4'),
        '3 reconstructed board query writes back to list',
    );
    assert(
        P11_BOARD_PIPELINE.includes('q=clinic') &&
            P11_BOARD_PIPELINE.includes('pipeline=9') &&
            !P11_BOARD_PIPELINE.includes('stage=') &&
            !P11_BOARD_PIPELINE.includes('page='),
        '4 board pipeline switch preserves siblings and drops stage',
    );
    assert(
        P11_EMPTY_BOARD_PIPELINE === '/crm/deals/board?pipeline=9',
        '5 empty board pipeline still emits only pipeline',
    );
    assert(
        P11_SEARCH_ON_BOARD.includes('q=atlas') &&
            P11_SEARCH_ON_BOARD.includes('owner=7') &&
            P11_SEARCH_ON_BOARD.startsWith('/crm/deals/board?'),
        '6 board search stays on the board path and keeps siblings',
    );
    assert(
        dealLayoutQuery(LIST_STATE, 'board').page === null &&
            dealLayoutQuery(LIST_STATE, 'list').page === 2,
        '7 page reset is board-only',
    );
}

runP11DealLayoutProofs();
