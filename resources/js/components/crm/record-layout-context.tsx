import { createContext, useContext, useMemo  } from 'react';
import type {ReactNode} from 'react';
import { useRecordLayout } from '@/hooks/use-record-layout';
import {
    orderedVisibleIds
    
    
    
} from '@/lib/record-layout';
import type {RecordColumn, RecordLayoutState, RecordObjectType} from '@/lib/record-layout';

type RecordLayoutContextValue = ReturnType<typeof useRecordLayout> & {
    objectType: RecordObjectType;
    orderedVisibleIds: (column: RecordColumn) => string[];
    isVisible: (cardId: string) => boolean;
};

const RecordLayoutContext = createContext<RecordLayoutContextValue | null>(null);

export function RecordLayoutProvider({
    objectType,
    children,
    mode = 'user',
    seedLayout,
}: {
    objectType: RecordObjectType;
    children: ReactNode;
    mode?: 'user' | 'workspace';
    seedLayout?: RecordLayoutState | null;
}) {
    const recordLayout = useRecordLayout(objectType, { mode, seedLayout });

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
