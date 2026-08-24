import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useRecordLayout } from '@/hooks/use-record-layout';
import { orderedVisibleIds, type RecordColumn, type RecordObjectType } from '@/lib/record-layout';

type RecordLayoutContextValue = ReturnType<typeof useRecordLayout> & {
    objectType: RecordObjectType;
    orderedVisibleIds: (column: RecordColumn) => string[];
    isVisible: (cardId: string) => boolean;
};

const RecordLayoutContext = createContext<RecordLayoutContextValue | null>(null);

export function RecordLayoutProvider({
    objectType,
    children,
}: {
    objectType: RecordObjectType;
    children: ReactNode;
}) {
    const recordLayout = useRecordLayout(objectType);

    const value = useMemo(
        () => ({
            ...recordLayout,
            objectType,
            orderedVisibleIds: (column: RecordColumn) => orderedVisibleIds(objectType, recordLayout.layout, column),
            isVisible: (cardId: string) => recordLayout.layout.cards.find((card) => card.id === cardId)?.visible ?? true,
        }),
        [objectType, recordLayout],
    );

    return <RecordLayoutContext.Provider value={value}>{children}</RecordLayoutContext.Provider>;
}

export function useRecordLayoutContext() {
    const context = useContext(RecordLayoutContext);
    if (!context) {
        throw new Error('useRecordLayoutContext must be used within RecordLayoutProvider');
    }

    return context;
}

export function RecordLayoutColumn({
    column,
    cards,
}: {
    column: RecordColumn;
    cards: Record<string, ReactNode>;
}) {
    const { orderedVisibleIds } = useRecordLayoutContext();

    return (
        <>
            {orderedVisibleIds(column).map((id) => (
                <div key={id}>{cards[id] ?? null}</div>
            ))}
        </>
    );
}
