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

async function saveWorkspaceDefaultLayout(objectType: RecordObjectType, layout: RecordLayoutState): Promise<void> {
    await fetch(`/crm/record-layouts/${objectType}/workspace-default`, {
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

export type RecordLayoutMode = 'user' | 'workspace';

export function useRecordLayout(
    objectType: RecordObjectType,
    options?: { mode?: RecordLayoutMode; seedLayout?: RecordLayoutState | null },
) {
    const mode = options?.mode ?? 'user';
    const [layout, setLayout] = useState<RecordLayoutState>(() =>
        options?.seedLayout ? normalizeLayout(objectType, options.seedLayout) : defaultLayout(objectType),
    );
    const [editorOpen, setEditorOpen] = useState(false);
    const [savingDefault, setSavingDefault] = useState(false);

    useEffect(() => {
        if (mode === 'workspace') {
            setLayout(
                options?.seedLayout
                    ? normalizeLayout(objectType, options.seedLayout)
                    : defaultLayout(objectType),
            );

            return;
        }

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
    }, [objectType, mode, options?.seedLayout]);

    const persist = useCallback(
        (next: RecordLayoutState) => {
            const normalized = normalizeLayout(objectType, next);
            setLayout(normalized);

            if (mode === 'user') {
                writeRecordLayout(objectType, normalized);
                void saveServerLayout(objectType, normalized);
            }
        },
        [objectType, mode],
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

    const saveWorkspaceDefault = useCallback(async () => {
        setSavingDefault(true);
        try {
            await saveWorkspaceDefaultLayout(objectType, layout);
        } finally {
            setSavingDefault(false);
        }
    }, [objectType, layout]);

    return {
        layout,
        editorOpen,
        setEditorOpen,
        setCardVisible,
        moveCard,
        resetLayout,
        saveWorkspaceDefault,
        savingDefault,
        mode,
    };
}
