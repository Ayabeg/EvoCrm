import { useCallback, useEffect, useState } from 'react';
import {
    defaultLayout,
    normalizeLayout,
    readRecordLayout,
    type RecordLayoutState,
    type RecordObjectType,
    writeRecordLayout,
} from '@/lib/record-layout';

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

async function fetchServerLayout(objectType: RecordObjectType): Promise<RecordLayoutState | null> {
    const response = await fetch(`/crm/record-layouts/${objectType}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as { layout?: RecordLayoutState | null };

    return payload.layout ? normalizeLayout(objectType, payload.layout) : null;
}

async function saveServerLayout(objectType: RecordObjectType, layout: RecordLayoutState): Promise<void> {
    await fetch(`/crm/record-layouts/${objectType}`, {
        method: 'PUT',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ layout }),
    });
}

export function useRecordLayout(objectType: RecordObjectType) {
    const [layout, setLayout] = useState<RecordLayoutState>(() => defaultLayout(objectType));
    const [editorOpen, setEditorOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void fetchServerLayout(objectType).then((server) => {
            if (cancelled) {
                return;
            }

            if (server) {
                setLayout(server);
                writeRecordLayout(objectType, server);

                return;
            }

            setLayout(readRecordLayout(objectType));
        });

        return () => {
            cancelled = true;
        };
    }, [objectType]);

    const persist = useCallback(
        (next: RecordLayoutState) => {
            const normalized = normalizeLayout(objectType, next);
            setLayout(normalized);
            writeRecordLayout(objectType, normalized);
            void saveServerLayout(objectType, normalized);
        },
        [objectType],
    );

    const setCardVisible = useCallback(
        (cardId: string, visible: boolean) => {
            persist({
                cards: layout.cards.map((card) => (card.id === cardId ? { ...card, visible } : card)),
            });
        },
        [layout.cards, persist],
    );

    const moveCard = useCallback(
        (cardId: string, direction: 'up' | 'down') => {
            const defs = normalizeLayout(objectType, layout).cards;
            const index = defs.findIndex((card) => card.id === cardId);
            if (index < 0) {
                return;
            }

            const swapWith = direction === 'up' ? index - 1 : index + 1;
            if (swapWith < 0 || swapWith >= defs.length) {
                return;
            }

            const next = [...defs];
            const currentOrder = next[index].order;
            next[index] = { ...next[index], order: next[swapWith].order };
            next[swapWith] = { ...next[swapWith], order: currentOrder };

            persist({ cards: next });
        },
        [layout, objectType, persist],
    );

    const resetLayout = useCallback(() => {
        persist(defaultLayout(objectType));
    }, [objectType, persist]);

    return {
        layout,
        editorOpen,
        setEditorOpen,
        setCardVisible,
        moveCard,
        resetLayout,
    };
}
