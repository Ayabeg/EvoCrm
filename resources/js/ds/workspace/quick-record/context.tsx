import { router } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
} from 'react';
import type { ReactNode } from 'react';
import {
    initialQuickRecordState,
    parseOpenInput,
    reduceQuickRecord,
} from '@/ds/workspace/quick-record/controller';
import type { QuickRecordControllerState } from '@/ds/workspace/quick-record/controller';
import { hydrateQuickRecord } from '@/ds/workspace/quick-record/hydrate';
import type { DrawerError, RecordRef } from '@/ds/workspace/quick-record/types';

type OpenRecordInput = { type: RecordRef['type'] | string; id: number | string };

export type QuickRecordApi = {
    state: QuickRecordControllerState;
    openRecord: (input: OpenRecordInput, options?: { opener?: HTMLElement | null }) => void;
    replace: (input: OpenRecordInput) => void;
    close: () => void;
    back: () => void;
    retry: () => void;
    openFull: () => void;
    pin: () => void;
};

const QuickRecordContext = createContext<QuickRecordApi | null>(null);

export function QuickRecordProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reduceQuickRecord, undefined, initialQuickRecordState);
    const abortRef = useRef<AbortController | null>(null);
    const { open, current, requestId, status } = state;

    useEffect(() => {
        if (!open || !current || status !== 'loading') {
            return;
        }

        const ref = current;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        void hydrateQuickRecord(ref, controller.signal)
            .then((payload) => {
                dispatch({ type: 'hydrate-success', requestId, payload });
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }

                dispatch({
                    type: 'hydrate-failure',
                    requestId,
                    error:
                        error && typeof error === 'object' && 'code' in error
                            ? (error as DrawerError)
                            : {
                                  code: 'network',
                                  message: 'The record could not be loaded.',
                              },
                });
            });

        return () => {
            controller.abort();
        };
    }, [open, current, requestId, status]);

    const openRecord = useCallback((input: OpenRecordInput, options?: { opener?: HTMLElement | null }) => {
        const ref = parseOpenInput(input);

        if (!ref) {
            dispatch({ type: 'malformed', opener: options?.opener });

            return;
        }

        dispatch({ type: 'open', ref, opener: options?.opener });
    }, []);

    const replace = useCallback((input: OpenRecordInput) => {
        const ref = parseOpenInput(input);

        if (!ref) {
            dispatch({ type: 'malformed' });

            return;
        }

        dispatch({ type: 'replace', ref });
    }, []);

    const close = useCallback(() => {
        abortRef.current?.abort();
        dispatch({ type: 'close' });
    }, []);

    const back = useCallback(() => {
        dispatch({ type: 'back' });
    }, []);

    const retry = useCallback(() => {
        dispatch({ type: 'retry' });
    }, []);

    const openFull = useCallback(() => {
        const href = state.descriptor?.fullRecordHref ?? state.error?.fullRecordHref;

        if (!href) {
            return;
        }

        dispatch({ type: 'close' });
        router.visit(href);
    }, [state.descriptor?.fullRecordHref, state.error?.fullRecordHref]);

    const pin = useCallback(() => {
        // Reserved. P09 does not persist a pinned peek.
    }, []);

    const api = useMemo<QuickRecordApi>(
        () => ({
            state,
            openRecord,
            replace,
            close,
            back,
            retry,
            openFull,
            pin,
        }),
        [state, openRecord, replace, close, back, retry, openFull, pin],
    );

    return <QuickRecordContext.Provider value={api}>{children}</QuickRecordContext.Provider>;
}

export function useQuickRecord(): QuickRecordApi {
    const value = useContext(QuickRecordContext);

    if (!value) {
        throw new Error('useQuickRecord must be used inside QuickRecordProvider');
    }

    return value;
}
