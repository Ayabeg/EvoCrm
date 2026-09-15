import { parsePeekToken, serializePeekRef } from '@/ds/workspace/quick-record/ref';
import type { RecordRef } from '@/ds/workspace/quick-record/types';

/**
 * Reserved list-query sibling. Classified unsafe in P03C keys so chrome
 * never treats it as a filter. P09 does not sync it on production lists.
 * P10 defers URL sync (decision B): context preservation > clever URLs.
 * Helpers stay; production lists do not write `peek`.
 */
export const PEEK_QUERY_KEY = 'peek';

export function peekTokenFromSearch(search: string): RecordRef | null {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

    return parsePeekToken(params.get(PEEK_QUERY_KEY));
}

export function writePeekSearch(search: string, ref: RecordRef | null): string {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

    if (ref) {
        params.set(PEEK_QUERY_KEY, serializePeekRef(ref));
    } else {
        params.delete(PEEK_QUERY_KEY);
    }

    const next = params.toString();

    return next === '' ? '' : `?${next}`;
}
