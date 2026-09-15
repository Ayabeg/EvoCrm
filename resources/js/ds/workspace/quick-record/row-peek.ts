import { parseRecordRef } from '@/ds/workspace/quick-record/ref';
import type { RecordRef } from '@/ds/workspace/quick-record/types';

/**
 * Same nested-control guard P04–P08 lock on ListViewTable.
 * Checkbox / identity link / mailto / tel / button / menu must not peek.
 */
export const NESTED_INTERACTIVE_SELECTOR = 'a, input, button, label';

export type RowPeekContext = {
    opener?: HTMLElement | null;
};

export type RowActivation = 'ignore' | 'peek' | 'visit' | 'new-tab';

export function isNestedInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest(NESTED_INTERACTIVE_SELECTOR));
}

export function recordRefFromRow(type: string, row: { id: number | string }): RecordRef | null {
    return parseRecordRef(type, row.id);
}

export function resolveRowActivation(input: {
    peekEnabled: boolean;
    nestedInteractive: boolean;
    metaOrCtrl: boolean;
    shiftOrAlt: boolean;
    middle: boolean;
}): RowActivation {
    if (input.nestedInteractive) {
        return 'ignore';
    }

    if (input.metaOrCtrl || input.middle) {
        return 'new-tab';
    }

    if (input.shiftOrAlt) {
        return 'visit';
    }

    return input.peekEnabled ? 'peek' : 'visit';
}
