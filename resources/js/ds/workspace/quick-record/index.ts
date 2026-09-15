export { QuickRecordDrawer } from '@/ds/workspace/QuickRecordDrawer';
export { QuickRecordProvider, useQuickRecord } from '@/ds/workspace/quick-record/context';
export { RecordLink, recordLinkHref } from '@/ds/workspace/quick-record/RecordLink';
export { parseRecordRef, fullRecordHref, serializePeekRef, parsePeekToken } from '@/ds/workspace/quick-record/ref';
export { PEEK_QUERY_KEY, peekTokenFromSearch, writePeekSearch } from '@/ds/workspace/quick-record/url';
export { isStaleHydration, nextRequestId } from '@/ds/workspace/quick-record/stale';
export type { QuickRecordApi } from '@/ds/workspace/quick-record/context';
export type {
    RecordAction,
    RecordAssociation,
    RecordCapabilities,
    RecordDescriptor,
    RecordRef,
    RecordType,
} from '@/ds/workspace/quick-record/types';
