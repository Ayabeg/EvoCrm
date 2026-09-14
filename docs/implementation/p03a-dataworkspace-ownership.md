# P03A — DataWorkspace ownership contract

**PR:** Make DataWorkspace a truthful list orchestrator. Two explicit result modes. No fake `rows={[]}`.  
**Baseline:** `main` @ `2d7ad807` (P02 #206).  
**Date:** 2026-09-14.

Architecture truthfulness only. Zero intentional visual or behavior change. No Contacts migration, selection hoist, URL/query rewrite, or backend/Inertia change.

---

## Previous ownership

| Concern | Contacts | Companies | Leads | Deals list | Quotes |
|---|---|---|---|---|---|
| Title / count | DataWorkspace via shell | DataWorkspace via shell | `CrmObjectHeader` | DataWorkspace via shell | DataWorkspace via shell |
| Saved views | DataWorkspace | DataWorkspace | None | DataWorkspace | DataWorkspace |
| Search / quick filters | FilterBar | FilterBar | None | FilterBar | FilterBar |
| Advanced filters | AdvancedFilterDrawer + `list-query` | same | None | same | same |
| Columns | FilterBar chooser; domain `columnDefs` | same | Hardcoded `<th>` | same + stage pills | same |
| Result renderer | Page `ListViewTable` via shell children | same | Raw `<table>` | same | same |
| Selection | Page `useState` | None | None | Page `useState` | None |
| Bulk | Domain bar inside children | None | None | Domain bar inside children | None |
| Pagination | `CrmListFooter` | `CrmListFooter` | `CrmListFooter` | `CrmListFooter` | `CrmListFooter` |
| Loading / empty / error | Page `SkeletonList` / `CrmEmptyState` | same | `CrmEmptyState` | same | same |
| Board / list toggle | — | — | — | `DealLayoutToggle` (not workspace `onModeChange`) | — |
| URL query | `list-query` + Inertia GET | same | No list query | same + `pipeline` | same |

`CrmListShell` satisfied the old `DataWorkspaceProps` by stubbing `rows={[]}`, `selectedIds={[]}`, `onSelectedIdsChange={() => undefined}`, and `empty={{ title: '', body: '' }}`. DataWorkspace treated `children` as a silent bypass of its own table.

---

## Canonical ownership (P03A)

| Concern | DataWorkspace | Domain page / lib | P03A? | Deferred |
|---|---|---|---|---|
| Title, count, primary CTA | chrome | copy strings | Yes — already mapped | — |
| Saved views | SavedViews | `/crm/filters` write path | Yes | — |
| Search / chips / quick filters | FilterBar | `listView.filterFields` | Yes | — |
| Advanced filters | AdvancedFilterDrawer | `list-query` GET | Yes | — |
| Columns entry | FilterBar chooser | `columnDefs` + cell renderers | Yes | — |
| Result renderer | `shared-table` only | `domain` `renderResults` | **Yes — modes locked** | Object migrations P04–P08 |
| Selection | optional on `shared-table` | page state today | Interface only | **P03B** |
| Bulk slot | optional chrome `bulk` | domain bar inside results | Unchanged | **P03C** |
| Pagination | `shared-table` footer | `CrmListFooter` in domain | Unchanged | **P03D** / page migrate |
| Loading / empty / error | `shared-table` only | page states in domain | Unchanged | **P03D** |
| Board / list toggle | `mode` / `onModeChange` / `board` | Deals `DealLayoutToggle` | Unchanged | **P11** |
| URL query | consumes `list-query` | page `extraQuery` | Unchanged | **P03C** (if any param work) |

---

## Prop / API changes

`DataWorkspaceProps` is a discriminated union:

```
resultMode: 'shared-table'   // MODE A — workspace owns rows + shared table
  rows, rowHref, empty
  selectedIds?, onSelectedIdsChange?, onRowPeek?, loading?, paginator?
  renderResults?: never
  children?: never

resultMode: 'domain'         // MODE B — domain owns the result surface
  renderResults
  rows?: never
  selectedIds?: never
  children?: never
```

- `children` is no longer a DataWorkspace slot. It was an ambiguous bypass.
- CrmListShell still exposes `children` to pages and maps that slot to `renderResults`.
- `onRowPeek?` exists on shared-table only. Not wired. Future peek (P09) / row contract.
- Selection callbacks are optional on shared-table so P03B can hoist without a sentinel `[]`.

Compile lock: `resources/js/ds/workspace/data-workspace-contract.ts` (`@ts-expect-error` on fake rows, dual surfaces, missing `rows` / `renderResults`).

---

## Compatibility mode

Until P04–P08, every live list that uses the shell is **MODE B**:

`CrmListShell` → `resultMode="domain"` → `renderResults` wraps stage pills + page children.

Pages do not import `DataWorkspace`. They do not pass `resultMode`. Visual tree is the same chrome + the same domain table / empty / footer.

MODE A is real and typed. No page uses it yet.

---

## CrmListShell role

Thin Inertia → DataWorkspace mapper. Maps title, views, filters, chips, columns, create, banners, and deal/ticket extras. Does **not** own a UI system. Does **not** stub rows or selection. Kept through P04–P08.

---

## Deferred

| Item | Phase |
|---|---|
| Hoist selection + bulk state (not full `rows`) | **Done in P03B** — see `p03b-selection-ownership.md` |
| URL / query authority | **P03C** (user phase map) |
| Empty / pagination / board helpers without domain surface | P03D |
| Contacts / Companies / Leads / Deals / Quotes onto shared-table | P04–P08 |
| URL/query authority move | not this wave unless a later AC says so |
| QuickRecordDrawer, Pipeline board on `mode="board"` | P09 / P11 |

---

## Tests

New lock: `tests/Feature/P03ADataWorkspaceOwnershipTest.php`.

| Proof | How |
|---|---|
| Domain mode works without fake rows | Types + `data-workspace-contract.ts` + workspace source |
| Shell no longer passes `rows={[]}` | Shell source lock |
| Contacts / Companies / Deals / Quotes / Leads unchanged | Page source owners + Inertia GET contracts |
| Selection unchanged | Page `useState`; shell has no `selectedIds` |
| URL / backend unchanged | `list-query` keys; Inertia props |

---

## Tests run

| Command | Result |
|---|---|
| `php artisan test --filter='P01\|P02\|P03A\|P05\|Wave1\|Wave2\|Wave4\|CrmListWorkspace\|LeadPath\|LeadConversion\|EvoCrmP9'` | pass (48 tests, 943 assertions) |
| `php artisan test --filter='LeadPath\|LeadConversion\|LeadQualify\|LeadCapture\|EvoCrmP9\|CrmListWorkspace\|P05\|P03A'` | pass (47 tests, 589 assertions) |
| `npm run types:check` | pass (after `php artisan wayfinder:generate --with-form`) |
| `npx eslint` on P03A-touched TS files | pass |
| `npm run build` | pass |

New lock: `tests/Feature/P03ADataWorkspaceOwnershipTest.php`.

---

## Risks

| Risk | Mitigation |
|---|---|
| Union too loose (spread bypasses `never`) | Object-literal `@ts-expect-error` cases in the contract file |
| Visual drift from JSX reshuffle | Same chrome order, classes, and domain children; no page edits |
| P05 still required `selectedIds: number[]` | Updated to optional shared-table field + resultMode locks |
