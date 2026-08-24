export type RecordObjectType = 'contact' | 'company' | 'deal';

export type RecordColumn = 'main' | 'side';

export type RecordLayoutCard = {
    id: string;
    label: string;
    column: RecordColumn;
    defaultVisible: boolean;
    order: number;
};

export type RecordLayoutState = {
    cards: Array<{ id: string; visible: boolean; order: number }>;
};

const STORAGE_PREFIX = 'evosales.recordLayout.';

const CONTACT_CARDS: RecordLayoutCard[] = [
    { id: 'key-info', label: 'Key information', column: 'main', defaultVisible: true, order: 0 },
    { id: 'actions', label: 'Quick actions', column: 'main', defaultVisible: true, order: 1 },
    { id: 'ask-evo', label: 'Ask Evo', column: 'main', defaultVisible: true, order: 2 },
    { id: 'catchup', label: 'Catch-up', column: 'main', defaultVisible: true, order: 3 },
    { id: 'associations-main', label: 'Associations', column: 'main', defaultVisible: true, order: 4 },
    { id: 'edit-form', label: 'Edit record', column: 'main', defaultVisible: true, order: 5 },
    { id: 'attributes', label: 'Custom properties', column: 'main', defaultVisible: true, order: 6 },
    { id: 'timeline', label: 'Activity timeline', column: 'main', defaultVisible: true, order: 7 },
    { id: 'log-activity', label: 'Log activity', column: 'side', defaultVisible: true, order: 0 },
    { id: 'associations-side', label: 'Associations', column: 'side', defaultVisible: true, order: 1 },
    { id: 'save-filter', label: 'Save list filter', column: 'side', defaultVisible: true, order: 2 },
];

const COMPANY_CARDS: RecordLayoutCard[] = [
    { id: 'key-info', label: 'Key information', column: 'main', defaultVisible: true, order: 0 },
    { id: 'associations-main', label: 'Associations', column: 'main', defaultVisible: true, order: 1 },
    { id: 'edit-form', label: 'Edit record', column: 'main', defaultVisible: true, order: 2 },
    { id: 'attributes', label: 'Custom properties', column: 'main', defaultVisible: true, order: 3 },
    { id: 'timeline', label: 'Activity timeline', column: 'main', defaultVisible: true, order: 4 },
    { id: 'associations-side', label: 'Associations', column: 'side', defaultVisible: true, order: 0 },
    { id: 'log-note', label: 'Add note', column: 'side', defaultVisible: true, order: 1 },
];

const DEAL_CARDS: RecordLayoutCard[] = [
    { id: 'key-info', label: 'Key information', column: 'main', defaultVisible: true, order: 0 },
    { id: 'actions', label: 'Quick actions', column: 'main', defaultVisible: true, order: 1 },
    { id: 'deal-health', label: 'Deal health', column: 'main', defaultVisible: true, order: 2 },
    { id: 'ask-evo', label: 'Ask Evo', column: 'main', defaultVisible: true, order: 3 },
    { id: 'catchup', label: 'Catch-up', column: 'main', defaultVisible: true, order: 4 },
    { id: 'associations-main', label: 'Associations', column: 'main', defaultVisible: true, order: 5 },
    { id: 'stage-board', label: 'Pipeline snapshot', column: 'main', defaultVisible: true, order: 6 },
    { id: 'edit-form', label: 'Edit deal', column: 'main', defaultVisible: true, order: 7 },
    { id: 'line-items', label: 'Line items', column: 'main', defaultVisible: true, order: 8 },
    { id: 'attributes', label: 'Custom properties', column: 'main', defaultVisible: true, order: 9 },
    { id: 'stage-move', label: 'Move stage', column: 'main', defaultVisible: true, order: 10 },
    { id: 'timeline', label: 'Activity timeline', column: 'main', defaultVisible: true, order: 11 },
    { id: 'log-activity', label: 'Log activity', column: 'side', defaultVisible: true, order: 0 },
    { id: 'associations-side', label: 'Associations', column: 'side', defaultVisible: true, order: 1 },
    { id: 'quotes', label: 'Quotes', column: 'side', defaultVisible: true, order: 2 },
    { id: 'save-filter', label: 'Save list filter', column: 'side', defaultVisible: true, order: 3 },
];

export function cardsForObject(objectType: RecordObjectType): RecordLayoutCard[] {
    if (objectType === 'company') {
        return COMPANY_CARDS;
    }

    if (objectType === 'deal') {
        return DEAL_CARDS;
    }

    return CONTACT_CARDS;
}

export function defaultLayout(objectType: RecordObjectType): RecordLayoutState {
    return {
        cards: cardsForObject(objectType).map((card) => ({
            id: card.id,
            visible: card.defaultVisible,
            order: card.order,
        })),
    };
}

function storageKey(objectType: RecordObjectType) {
    return `${STORAGE_PREFIX}${objectType}`;
}

export function readRecordLayout(objectType: RecordObjectType): RecordLayoutState {
    if (typeof window === 'undefined') {
        return defaultLayout(objectType);
    }

    const raw = localStorage.getItem(storageKey(objectType));
    if (!raw) {
        return defaultLayout(objectType);
    }

    try {
        return normalizeLayout(objectType, JSON.parse(raw) as RecordLayoutState);
    } catch {
        return defaultLayout(objectType);
    }
}

export function writeRecordLayout(objectType: RecordObjectType, layout: RecordLayoutState) {
    localStorage.setItem(storageKey(objectType), JSON.stringify(normalizeLayout(objectType, layout)));
}

export function normalizeLayout(objectType: RecordObjectType, layout: RecordLayoutState): RecordLayoutState {
    const defs = cardsForObject(objectType);

    return {
        cards: defs.map((def, index) => {
            const match = layout.cards.find((card) => card.id === def.id);

            return {
                id: def.id,
                visible: match?.visible ?? def.defaultVisible,
                order: match?.order ?? index,
            };
        }),
    };
}

export function orderedVisibleIds(objectType: RecordObjectType, layout: RecordLayoutState, column: RecordColumn): string[] {
    const defs = cardsForObject(objectType);

    return normalizeLayout(objectType, layout)
        .cards.filter((card) => card.visible)
        .sort((a, b) => a.order - b.order)
        .map((card) => defs.find((def) => def.id === card.id))
        .filter((def): def is RecordLayoutCard => !!def && def.column === column)
        .map((def) => def.id);
}

export function isCardVisible(layout: RecordLayoutState, cardId: string) {
    return layout.cards.find((card) => card.id === cardId)?.visible ?? true;
}
