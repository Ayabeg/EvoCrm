import {
    CARD_DRAG_THRESHOLD_PX,
    pointerMovedPastThreshold,
} from '@/components/crm/pipeline-card-interaction';
import { dealStageColumnAccent } from '@/lib/stage-colors';
import { resolveRowActivation } from '@/ds/workspace/quick-record/row-peek';
import { dealLayoutHref } from '@/lib/list-query/deal-layout';
import { emptyCanonicalListQuery } from '@/lib/list-query/empty';
import { UNSAFE_QUERY_KEYS } from '@/lib/list-query/keys';

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

export function runP11DealBoardProofs(): void {
    assert(CARD_DRAG_THRESHOLD_PX === 6, '1 click/drag threshold is 6px');
    assert(
        !pointerMovedPastThreshold({ x: 0, y: 0 }, { x: 3, y: 4 }),
        '2 sub-threshold motion is a click',
    );
    assert(
        pointerMovedPastThreshold({ x: 0, y: 0 }, { x: 6, y: 0 }),
        '3 threshold motion is a drag',
    );
    assert(
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: false,
            metaOrCtrl: false,
            shiftOrAlt: false,
            middle: false,
        }) === 'peek',
        '4 card background peeks',
    );
    assert(
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: true,
            metaOrCtrl: false,
            shiftOrAlt: false,
            middle: false,
        }) === 'ignore',
        '5 nested controls do not peek',
    );
    assert(
        resolveRowActivation({
            peekEnabled: true,
            nestedInteractive: false,
            metaOrCtrl: true,
            shiftOrAlt: false,
            middle: false,
        }) === 'new-tab',
        '6 modifier click is new-tab',
    );
    assert(
        dealStageColumnAccent({ slug: 'new', is_won: false, is_lost: false }) ===
            'var(--evosales-hairline)',
        '7 open stages are neutral',
    );
    assert(
        dealStageColumnAccent({ slug: 'won', is_won: true, is_lost: false }) ===
            'var(--color-success)',
        '8 won is quiet success',
    );
    assert(
        dealStageColumnAccent({ slug: 'lost', is_won: false, is_lost: true }) ===
            'var(--color-danger)',
        '9 lost is quiet destructive',
    );
    assert(UNSAFE_QUERY_KEYS.includes('peek'), '10 peek stays unsafe');
    assert(UNSAFE_QUERY_KEYS.includes('mode'), '11 mode stays unsafe');
    assert(
        !dealLayoutHref(emptyCanonicalListQuery(), 'board').includes('peek='),
        '12 layout href never writes peek',
    );
}

runP11DealBoardProofs();
