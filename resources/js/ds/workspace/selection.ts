import { useCallback, useMemo, useState } from 'react';

/**
 * Row identity for workspace selection.
 * Live CRM objects use numeric ids today. The contract stays open to
 * string ids (UUID / ULID) so DataWorkspace never hardcodes `number`.
 */
export type RowId = string | number;

export type WorkspaceSelection<Id extends RowId = RowId> = {
    selectedIds: Id[];
    selectedCount: number;
    isSelected: (id: Id) => boolean;
    toggleOne: (id: Id) => void;
    togglePage: () => void;
    clearSelection: () => void;
    allPageSelected: boolean;
    somePageSelected: boolean;
    /** True when at least one id is selected. Independent of action verbs. */
    bulkActive: boolean;
};

type SelectionGuard<Id extends RowId> = {
    selectable?: boolean;
    isRowSelectable?: (id: Id) => boolean;
};

/**
 * Uncontrolled: DataWorkspace owns the selected id set.
 * Controlled: parent owns the set and must pass both value + change.
 * Modes are explicit — do not mix `selectedIds?` with an inferred mode.
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

    return selectedIds.includes(id)
        ? selectedIds.filter((value) => value !== id)
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
        selectablePageIds.every((id) => selectedIds.includes(id));

    return allSelected
        ? selectedIds.filter((id) => !selectablePageIds.includes(id))
        : [...new Set([...selectedIds, ...selectablePageIds])];
}

export function derivePageSelection<Id extends RowId>(
    selectedIds: readonly Id[],
    pageIds: readonly Id[],
    guard: SelectionGuard<Id> = {},
): { allPageSelected: boolean; somePageSelected: boolean } {
    const selectablePageIds = pageIds.filter((id) =>
        guard.selectable === false ? false : rowAllowed(id, guard),
    );
    const selectedOnPage = selectablePageIds.filter((id) =>
        selectedIds.includes(id),
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
        isSelected: (id) => selectedIds.includes(id),
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
