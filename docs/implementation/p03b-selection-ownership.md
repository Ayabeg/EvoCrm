# P03B — Selection ownership + bulk state

**PR:** Normalize row selection as a shared DataWorkspace capability. Domain tables consume it. No URL work, no bulk-bar redesign, no backend change.  
**Baseline:** `main` @ `d445bc35` (P03A #207).  
**Date:** 2026-09-14.

State-ownership PR. Near-zero visual change. P03C (URL/query) and P03D (empty/pagination/board helpers) are not started.

---

## Current models (before)

| Object | Ids live | Id type | Row key | Checkbox owner | Select-all | Clear | Page vs dataset | Bulk UI | Survives page/filter? | Permissions | Confirm |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Contacts | Page `useState<number[]>` | `number` | `row.id` | `ListViewTable` when `bulk.enabled` | Current rendered page (accumulate) | Domain bar `onClear` → `setSelectedIds([])` | Page toggle; set can hold other pages | Domain `BulkActionBar` (wraps DS bar) inside results | Yes — React state + Inertia `preserveState` | `bulk.enabled` gates checkboxes + bar | Existing DS bar only |
| Companies | None | `number` | `row.id` | None | — | — | — | None (no bulk API) | — | — | — |
| Leads | None | `number` | `lead.id` | None (raw `<table>`) | — | — | — | None | — | — | — |
| Deals list | Page `useState<number[]>` | `number` | `row.id` | `ListViewTable` when `bulk.enabled` | Current rendered page (accumulate) | Domain bar `onClear` | Same as contacts | Domain `BulkActionBar` inside results | Yes | `bulk.enabled` | Existing DS bar only |
| Quotes | None | `number` | `row.id` | None | — | — | — | None | — | — | — |

No live object uses UUID/ULID row ids. Tickets stay out of this PR (shell children adapter still accepts `(columns) =>`).

---

## Shared contract

`resources/js/ds/workspace/selection.ts`

```
RowId = string | number

WorkspaceSelection
  selectedIds, selectedCount, isSelected
  toggleOne, togglePage, clearSelection
  allPageSelected, somePageSelected, bulkActive

WorkspaceSelectionInput
  uncontrolled: mode?: 'uncontrolled', pageIds?, selectable?, isRowSelectable?, defaultSelectedIds?
  controlled:   mode: 'controlled', selectedIds, onSelectedIdsChange, pageIds?, selectable?, isRowSelectable?
```

- Selection is a **workspace** capability. Action verbs, POSTs, and permissions stay **domain**.
- DataWorkspace always materializes a `WorkspaceSelection` and exposes `data-bulk-active` / `data-selected-count`.
- Domain `renderResults` is `{ columns, selection }`. `CrmListShell` adapts to `children(columns, selection)` so tickets/existing `(columns) =>` keep compiling.
- No object-specific fields inside DataWorkspace. No giant global context.

---

## Controlled vs uncontrolled

Least surprising default: **uncontrolled**. DataWorkspace owns the id set.

| Mode | When | Required props | Forbidden |
|---|---|---|---|
| `uncontrolled` (default) | Live Contacts / Companies / Deals / Quotes | `pageIds`, `selectable?` | `selectedIds`, `onSelectedIdsChange` |
| `controlled` | Parent must own the set | `mode: 'controlled'`, `selectedIds`, `onSelectedIdsChange` | `defaultSelectedIds` |

Compile lock: `data-workspace-contract.ts` `@ts-expect-error` on mixed modes.

---

## Select-all semantics

**Select all = current rendered page.** Documented in `togglePageSelectedIds`. Dataset-wide select-all does not exist and was not invented.

Page toggle **accumulates**: other-page ids stay selected. Unchecking select-all removes only the current page’s selectable ids.

Header checkbox is indeterminate when `somePageSelected` (partial page). `aria-checked="mixed"`.

---

## Pagination / filter / view / search / sort

Preserved from before (no URL work):

- Selection is React state inside DataWorkspace (same lifetime as the old page `useState`).
- Inertia list navigations use `preserveState: true` on views/chips. The workspace typically does **not** remount, so the selected set **survives page, filter, view, search, and sort**.
- That can include ids not on the current page. That is existing multi-page bulk behavior, not an impossible state. Bulk POST still sends those ids.
- Changing filters does **not** auto-clear. Same as P03A pages.

---

## Domain adapters

| Surface | Adapter | Selectable? | Notes |
|---|---|---|---|
| Contacts | `CrmListShell selection=` + `children(columns, selection)` | `canBulk` | Canary. Bar still domain wrapper, same place, same POSTs. |
| Deals list | Same | `canBulk` | Same as contacts. |
| Companies | `selection={{ mode: 'uncontrolled', selectable: false, pageIds }}` | No | Contract only. No checkboxes. No bar. |
| Quotes | Same inert wiring | No | Contract only. |
| Leads | **Deferred** | — | Raw table, no `CrmListShell` / `ListViewTable`. Forcing checkboxes would be a visual + P06 migration. |
| Tickets | Unchanged children `(columns) =>` | No | Out of scope; adapter keeps working. |
| Shared-table mode | `selection` chrome + default `pageIds` from `rows` | `selection.selectable` | No page uses MODE A yet (P04–P08). |

---

## Bulk state (not bar redesign)

DataWorkspace now knows: count, `bulkActive`, `clearSelection`, and still has the chrome `bulk` slot (`bulkActive && bulk`).

Contacts/Deals **keep** rendering the existing domain `BulkActionBar` inside results so the bar does not jump out of the white content region. DS `BulkActionBar` classes, labels, and POST body (`action`, `ids`, `owner_id`, `sequence_id`, `stage_id`) are unchanged.

`selectable: false` or `isRowSelectable === false` blocks toggle. Unselectable row checkboxes are `disabled`.

---

## Preserved behavior

- Filters, saved views, import, merge, create, export, deal layout toggle / pipeline switcher
- Contact/deal bulk permission gate
- Row click → show page
- `list-query` keys and GET write path
- Inertia page names and props
- Leads raw table
- Companies `CrmShell` double chrome

---

## Deferred

| Item | Phase |
|---|---|
| URL / query authority (`q`, filters, view, sort, page, columns) | **P03C** |
| Empty / pagination / board helpers without domain surface | **P03D** |
| Contacts/Companies/Leads/Deals/Quotes onto `shared-table` | P04–P08 |
| Leads selection UI | P06 (needs workspace table first) |
| DS bulk bar visual swap / moving the bar into the chrome slot | later (not P03C in the user phase map) |
| QuickRecordDrawer, board `mode="board"` | P09 / P11 |
| Company/quote/lead bulk APIs | do not invent |

---

## Tests

New lock: `tests/Feature/P03BDataWorkspaceSelectionTest.php`.  
Reducer proofs: `resources/js/ds/workspace/selection-contract.ts`.

| Proof | How |
|---|---|
| Select one / deselect | `toggleSelectedId` + contract file |
| Select-all page + accumulate | `togglePageSelectedIds` |
| Indeterminate | `derivePageSelection` + ListViewTable / DataTable `indeterminate` + `aria-checked="mixed"` |
| Clear / accurate count / bulk only with selection | `clearSelection`, `selectedCount`, `bulkActive` |
| Row id types | `RowId = string \| number`; string-id shared-table accept case |
| Unselectable protected | reducer no-op + disabled checkbox |
| No backend shape change | DS bar POST keys + `CrmBulkActionsTest` |
| No URL/query change | `list-query` keys + no `searchParams` / `history.replaceState` |

---

## Risks

| Risk | Mitigation |
|---|---|
| Moving the bulk bar into the chrome slot shifts layout | Left the bar in domain results |
| Cross-page leftover ids surprise operators after a filter change | Preserved pre-P03B behavior; documented |
| Leads forced onto checkboxes | Deferred |
| Ambiguous controlled/uncontrolled | Explicit `mode`; compile errors on mixed props |
| P03A source locks for page `useState` | Updated in-PR |
