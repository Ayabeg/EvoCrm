import { parseRecordRef, sameRecordRef } from '@/ds/workspace/quick-record/ref';
import { isStaleHydration, nextRequestId } from '@/ds/workspace/quick-record/stale';
import type {
    DrawerError,
    DrawerStatus,
    QuickRecordPeekPayload,
    RecordDescriptor,
    RecordRef,
} from '@/ds/workspace/quick-record/types';
import { adaptRecord } from '@/ds/workspace/record-adapters';

export type QuickRecordControllerState = {
    open: boolean;
    current: RecordRef | null;
    history: RecordRef[];
    requestId: number;
    status: DrawerStatus;
    error: DrawerError | null;
    payload: QuickRecordPeekPayload | null;
    descriptor: RecordDescriptor | null;
    opener: HTMLElement | null;
};

export type QuickRecordControllerAction =
    | { type: 'open'; ref: RecordRef; opener?: HTMLElement | null }
    | { type: 'replace'; ref: RecordRef }
    | { type: 'back' }
    | { type: 'close' }
    | { type: 'retry' }
    | { type: 'malformed'; opener?: HTMLElement | null }
    | { type: 'hydrate-start'; requestId: number; ref: RecordRef }
    | { type: 'hydrate-success'; requestId: number; payload: QuickRecordPeekPayload }
    | { type: 'hydrate-failure'; requestId: number; error: DrawerError }
    | { type: 'restore-focus-cleared' };

export function initialQuickRecordState(): QuickRecordControllerState {
    return {
        open: false,
        current: null,
        history: [],
        requestId: 0,
        status: 'idle',
        error: null,
        payload: null,
        descriptor: null,
        opener: null,
    };
}

export function reduceQuickRecord(
    state: QuickRecordControllerState,
    action: QuickRecordControllerAction,
): QuickRecordControllerState {
    switch (action.type) {
        case 'open': {
            if (state.open && sameRecordRef(state.current, action.ref)) {
                return state;
            }

            return {
                ...state,
                open: true,
                current: action.ref,
                history: [],
                requestId: nextRequestId(state.requestId),
                status: 'loading',
                error: null,
                payload: null,
                descriptor: null,
                opener: action.opener ?? state.opener,
            };
        }
        case 'replace': {
            if (!state.open || sameRecordRef(state.current, action.ref)) {
                return state.open ? state : reduceQuickRecord(state, { type: 'open', ref: action.ref });
            }

            return {
                ...state,
                current: action.ref,
                history: state.current ? [...state.history, state.current] : state.history,
                requestId: nextRequestId(state.requestId),
                status: 'loading',
                error: null,
                payload: null,
                descriptor: null,
            };
        }
        case 'back': {
            const previous = state.history[state.history.length - 1];

            if (!previous) {
                return reduceQuickRecord(state, { type: 'close' });
            }

            return {
                ...state,
                current: previous,
                history: state.history.slice(0, -1),
                requestId: nextRequestId(state.requestId),
                status: 'loading',
                error: null,
                payload: null,
                descriptor: null,
            };
        }
        case 'close':
            return {
                ...initialQuickRecordState(),
                requestId: nextRequestId(state.requestId),
                opener: state.opener,
            };
        case 'retry': {
            if (!state.current) {
                return state;
            }

            return {
                ...state,
                requestId: nextRequestId(state.requestId),
                status: 'loading',
                error: null,
                payload: null,
                descriptor: null,
            };
        }
        case 'malformed':
            return {
                ...state,
                open: true,
                current: null,
                history: [],
                requestId: nextRequestId(state.requestId),
                status: 'error',
                error: {
                    code: 'malformed',
                    message: 'That record reference is not valid.',
                },
                payload: null,
                descriptor: null,
                opener: action.opener ?? state.opener,
            };
        case 'hydrate-start': {
            if (isStaleHydration(state.requestId, action.requestId)) {
                return state;
            }

            return {
                ...state,
                current: action.ref,
                status: 'loading',
                error: null,
            };
        }
        case 'hydrate-success': {
            if (isStaleHydration(state.requestId, action.requestId)) {
                return state;
            }

            return {
                ...state,
                status: 'ready',
                error: null,
                payload: action.payload,
                descriptor: adaptRecord(action.payload),
            };
        }
        case 'hydrate-failure': {
            if (isStaleHydration(state.requestId, action.requestId)) {
                return state;
            }

            return {
                ...state,
                status: 'error',
                error: action.error,
                payload: null,
                descriptor: null,
            };
        }
        case 'restore-focus-cleared':
            return { ...state, opener: null };
    }
}

export function parseOpenInput(input: { type: string; id: number | string }): RecordRef | null {
    return parseRecordRef(input.type, input.id);
}
