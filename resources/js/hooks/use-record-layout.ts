import { useCallback, useEffect, useState } from 'react';
import {
    defaultLayout,
    normalizeLayout,
    readRecordLayout,
    type RecordLayoutState,
    type RecordObjectType,
    writeRecordLayout,
} from '@/lib/record-layout';

export function useRecordLayout(objectType: RecordObjectType) {
    const [layout, setLayout] = useState<RecordLayoutState>(() => defaultLayout(objectType));
    const [editorOpen, setEditorOpen] = useState(false);

    useEffect(() => {
        setLayout(readRecordLayout(objectType));
    }, [objectType]);

    const persist = useCallback(
        (next: RecordLayoutState) => {
            const normalized = normalizeLayout(objectType, next);
            setLayout(normalized);
            writeRecordLayout(objectType, normalized);
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
