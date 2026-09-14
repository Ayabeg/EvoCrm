import { useCallback, useMemo, useState } from 'react';

/**
 * Row identity for workspace selection.
 * Live CRM objects use numeric ids today. The contract stays open to
 * string ids (UUID / ULID) so DataWorkspace never hardcodes `number`.
 */
export type RowId = string | number;

/**
 * Strict row-id identity. `1` and `"1"` are different ids.
 * No String()/Number() coercion, no ==, no array-index ids.
 */
export function sameRowId(left: RowId, right: RowId): boolean {
    return Object.is(left, right);
}

export function hasRowId<Id extends RowId>(ids: readonly Id[], id: Id): boolean {
    return ids.some((value) => sameRowId(value, id));
}

export type WorkspaceSelection<Id extends RowId = RowId> = {
    selectedIds: Id[];
    selectedCount: number;
    isSelected: (id: Id) => boolean;
    toggleOne: (id: Id) => void;
    togglePage: () => void;
    clearSelection: () => void;
    allPageSelected: boolean;
    somePageSelected: boolean;
    /** Derived: selectedCount > 0. Not independent state. Other-page ids count. */
    bulkActive: boolean;
};

type SelectionGuard<Id extends RowId> = {
    /**
     * Page-level participation, not a permanent object ban.
     * `false` = this surface does not select rows *now*.
     * Flip to `true` later (e.g. Companies/Quotes bulk) without a DW API change.
     */
    selectable?: boolean;
    isRowSelectable?: (id: Id) => boolean;
};

/**
 * Uncontrolled: DataWorkspace owns the selected id set.
 * Controlled: parent owns the set and must pass both value + change.
 * ONE OWNER AT A TIME — do not mix `selectedIds` / `onSelectedIdsChange`
 * with `defaultSelectedIds`, and do not omit the controlled pair.
 */
export type WorkspaceSelectionInput<Id extends RowId = RowId> =
    | {
          mode?: 'uncontrolled';
          selectable?: boolean;
          pageIds?: Id[];
          isRowSelectable?: (id: Id) => boolean;
          defaultSelectedIds?: Id[];
      }
    | {
          mode: 'controlled';
          selectable?: boolean;
          pageIds?: Id[];
          isRowSelectable?: (id: Id) => boolean;
          selectedIds: Id[];
          onSelectedIdsChange: (ids: Id[]) => void;
      };

function rowAllowed<Id extends RowId>(id: Id, guard: SelectionGuard<Id>): boolean {
    if (guard.selectable === false) {
        return false;
    }

    return guard.isRowSelectable?.(id) ?? true;
}

export function toggleSelectedId<Id extends RowId>(
    selectedIds: readonly Id[],
    id: Id,
    guard: SelectionGuard<Id> = {},
): Id[] {
    if (!rowAllowed(id, guard)) {
        return [...selectedIds];
    }

    return hasRowId(selectedIds, id)
        ? selectedIds.filter((value) => !sameRowId(value, id))
        : [...selectedIds, id];
}

/**
 * Select-all = current rendered page only.
 * Already-selected ids on other pages stay selected (cross-page accumulate).
 * Dataset-wide select-all does not exist.
 */
export function togglePageSelectedIds<Id extends RowId>(
    selectedIds: readonly Id[],
    pageIds: readonly Id[],
    guard: SelectionGuard<Id> = {},
): Id[] {
    if (guard.selectable === false) {
        return [...selectedIds];
    }

    const selectablePageIds = pageIds.filter((id) => rowAllowed(id, guard));
    const allSelected =
        selectablePageIds.length > 0 &&
        selectablePageIds.every((id) => hasRowId(selectedIds, id));

    if (allSelected) {
        return selectedIds.filter((id) => !hasRowId(selectablePageIds, id));
    }

    const next = [...selectedIds];

    selectablePageIds.forEach((id) => {
        if (!hasRowId(next, id)) {
            next.push(id);
        }
    });

    return next;
}

/**
 * Header flags are computed against CURRENT PAGE ids only.
 * Other-page ids in the selected set do not force checked or mixed.
 */
export function derivePageSelection<Id extends RowId>(
    selectedIds: readonly Id[],
    pageIds: readonly Id[],
    guard: SelectionGuard<Id> = {},
): { allPageSelected: boolean; somePageSelected: boolean } {
    const selectablePageIds = pageIds.filter((id) =>
        guard.selectable === false ? false : rowAllowed(id, guard),
    );
    const selectedOnPage = selectablePageIds.filter((id) =>
        hasRowId(selectedIds, id),
    );

    return {
        allPageSelected:
            selectablePageIds.length > 0 &&
            selectedOnPage.length === selectablePageIds.length,
        somePageSelected:
            selectedOnPage.length > 0 &&
            selectedOnPage.length < selectablePageIds.length,
    };
}

export function createWorkspaceSelection<Id extends RowId>(
    selectedIds: Id[],
    pageIds: readonly Id[],
    setIds: (ids: Id[]) => void,
    guard: SelectionGuard<Id>,
): WorkspaceSelection<Id> {
    const flags = derivePageSelection(selectedIds, pageIds, guard);

    return {
        selectedIds,
        selectedCount: selectedIds.length,
        isSelected: (id) => hasRowId(selectedIds, id),
        toggleOne: (id) => setIds(toggleSelectedId(selectedIds, id, guard)),
        togglePage: () => setIds(togglePageSelectedIds(selectedIds, pageIds, guard)),
        clearSelection: () => setIds([]),
        allPageSelected: flags.allPageSelected,
        somePageSelected: flags.somePageSelected,
        bulkActive: selectedIds.length > 0,
    };
}

export function useWorkspaceSelection<Id extends RowId = RowId>(
    input: WorkspaceSelectionInput<Id> = { mode: 'uncontrolled' },
): WorkspaceSelection<Id> {
    const mode = input.mode ?? 'uncontrolled';
    const selectable = input.selectable;
    const isRowSelectable = input.isRowSelectable;
    const defaultSelectedIds =
        mode === 'uncontrolled' && 'defaultSelectedIds' in input
            ? (input.defaultSelectedIds ?? [])
            : [];
    const [internalIds, setInternalIds] = useState<Id[]>(defaultSelectedIds);
    const selectedIds =
        mode === 'controlled' && input.mode === 'controlled'
            ? input.selectedIds
            : internalIds;
    const onSelectedIdsChange =
        mode === 'controlled' && input.mode === 'controlled'
            ? input.onSelectedIdsChange
            : undefined;

    const setIds = useCallback(
        (ids: Id[]) => {
            if (onSelectedIdsChange) {
                onSelectedIdsChange(ids);

                return;
            }

            setInternalIds(ids);
        },
        [onSelectedIdsChange],
    );

    return useMemo(
        () =>
            createWorkspaceSelection(selectedIds, input.pageIds ?? [], setIds, {
                selectable,
                isRowSelectable,
            }),
        [selectedIds, input.pageIds, setIds, selectable, isRowSelectable],
    );
}
