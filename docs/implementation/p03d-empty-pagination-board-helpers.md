# P03D — Empty, pagination, board slot helpers

**PR:** Make DataWorkspace empty / paginator / board paths usable without domain children. `rowHref` is consumed. Board slot is ready for P11.  
**Baseline:** `main` @ `c45fe881` (P03C #209).  
**Date:** 2026-09-14.

Helper-ownership PR. Zero intentional visual change on live list pages. P04 object migrations are not started.

---

## Before

Shared-table mode already rendered empty / loading / an inline footer, but:

| Gap | Effect |
|---|---|
| `void props.rowHref` | The required shared-table contract was discarded. ListDataTable always used `basePath/${id}`. |
| Empty / paginator inlined in `DataWorkspace` | Helpers were not importable without mounting the whole workspace. |
| Board only inside `renderSharedTableSurface` | Domain mode (every live page) could not slot a board. |
| Footer wrote `listPageHref` inline | Same writer as `CrmListFooter`, but not a named shared-table helper. |

Domain pages (Contacts, Companies, Deals, Quotes, Tickets) still owned empty + `CrmListFooter` inside `renderResults` children. That stays.

---

## After

Helpers live next to DataWorkspace and work **without children**:

| Helper | File | Job |
|---|---|---|
| `resolveRowHref` | `ds/workspace/surface.ts` | `rowHref(row)` or `${basePath}/${id}` |
| `workspacePageHref` | `ds/workspace/surface.ts` | `listPageHref` — canonical query, page ≤ 1 omitted |
| `resolveWorkspaceBoardSlot` | `ds/workspace/surface.ts` | `mode === 'board' && board` → node, else `null` |
| `WorkspaceEmpty` | `ds/workspace/WorkspaceEmpty.tsx` | Page empty + **h2** title |
| `WorkspacePaginator` | `ds/workspace/WorkspacePaginator.tsx` | Shared-table footer, pad-x 32 at `md` |

```
resultMode: 'shared-table'
        │
        ├─ resolveWorkspaceBoardSlot(mode, board)  → board node (no list footer)
        ├─ loading                                 → skeletons
        ├─ rows.length === 0                       → WorkspaceEmpty (h2)
        └─ rows                                    → ListDataTable(rowHref)
                                                    + WorkspacePaginator(listPageHref)
```

`CrmListShell` stays `resultMode="domain"`. It now **forwards** optional `mode` / `onModeChange` / `board` so P11 can slot a board without a shell rewrite. Live pages do not pass those props. Deals still default `mode="list"` and keep `DealLayoutToggle`.

---

## rowHref

`DataWorkspaceSharedTableProps.rowHref` is required and is passed to `ListDataTable`.

`ListViewTable` accepts optional `rowHref`. Domain pages omit it, so links stay `${basePath}/${id}` (same as the old `recordHref` helper).

`onRowPeek` remains reserved for P09. It is still unused. This PR does not invent peek.

---

## Board slot (ready for P11, not used yet)

`resolveWorkspaceBoardSlot` is checked **before** domain `renderResults` and before the shared table. Either result mode can show a board.

P11 is expected to pass `board={<PipelineKanban … />}` and `mode="board"`. This PR does **not**:

- move `/crm/deals/board` onto DataWorkspace
- wire `onModeChange` on live deals
- change `DealLayoutToggle` routes
- reimplement kanban, forecast, or board filters

---

## Pagination

Shared-table footer is the live paginator: `workspacePageHref` → `listPageHref` → P03C canonical query.

| Action | Page | Siblings |
|---|---|---|
| Prev / Next | keep / set | search, view, filters, extras (`pipeline`) |
| Page ≤ 1 | omitted | same |

Domain pages still use `CrmListFooter` + page-local `listPageHref`. That is intentional until P04–P08.

---

## Empty

`WorkspaceEmpty` always renders the title as `h2` (`role="status"` comes from Aurora `EmptyState`). Copy still comes from `empty.title` / `empty.body` / `empty.actionLabel`. No filtered-empty heuristic — domain supplies copy.

Contacts, Companies, and Leads use `WorkspaceEmpty`. Other live pages keep `CrmEmptyState`.

---

## Preserved behavior

- Contacts / Companies / Leads shared-table empty + paginator (P04 / P05 / P06)
- Deals / Quotes / Tickets domain result surfaces
- `CrmListFooter` / `CrmEmptyState` on remaining domain pages
- P03A `resultMode` union
- P03B selection / `data-bulk-active`
- P03C query sibling preservation, PipelineSwitcher, stage pills
- Deal board route and `PipelineKanban`
- Backend / Inertia contracts

---

## Deferred (not this PR)

| Item | Phase |
|---|---|
| Contacts onto `shared-table` | **Done in P04** — see `p04-contacts-workspace.md` |
| Companies onto `shared-table` | **Done in P05** — see `p05-companies-workspace.md` |
| Leads onto `shared-table` | **Done in P06** — see `p06-leads-workspace.md` |
| Deals / Quotes onto `shared-table` | P07–P08 |
| `sort` / `columns` on the URL | later (needs a backend read path) |
| BulkActionBar redesign / moving the bar into chrome | later |
| PipelineBoard on `mode="board"` / moving deals board | **P11** |
| `onRowPeek` / QuickRecordDrawer | P09 |

---

## Tests

New lock: `tests/Feature/P03DEmptyPaginationBoardTest.php`.  
Proofs: `resources/js/ds/workspace/surface-contract.ts`.

| Proof | How |
|---|---|
| Helpers usable without children | exported `resolve*` / `Workspace*` |
| `rowHref` consumed | DataWorkspace passes it; ListDataTable requires it; `resolveRowHref` prefers it |
| Fallback `basePath/id` | domain ListViewTable omits `rowHref` |
| Paginator is `listPageHref` | `workspacePageHref` wrapper + page 1 omit / page 2 siblings |
| Empty heading | `as="h2"` |
| Pad-x 32 | `md:px-8` on `WorkspacePaginator` |
| Board slot ready | `mode=board` + node → slot; list mode ignores node |
| Domain pages unchanged | still `CrmEmptyState` + `CrmListFooter`; deals board not `mode="board"` |
| No second query writer | paginator calls `listPageHref` only |

---

## Tests run

| Command | Result |
|---|---|
| `npx vite-node resources/js/ds/workspace/surface-contract.ts` | pass |
| `php artisan test --filter='P03A\|P03B\|P03C\|P03D\|P05\|CrmListWorkspace\|CrmBulkActions'` | pass (37 tests, 790 assertions) |
| `php artisan test --filter='P01\|P02\|P03A\|P03B\|P03C\|P03D\|P05\|Wave1\|Wave2\|Wave4\|CrmListWorkspace\|CrmBulkActions\|Contact\|Compan\|Deal\|Quote\|Lead'` | pass (309 tests, 3724 assertions) |
| `php artisan test` (CI `ci:check`) | pass (863 tests, 8930 assertions) |
| `npm run types:check` | pass |
| `npx eslint` on P03D-touched TS files | pass |
| `npm run build` | pass |

New lock: `tests/Feature/P03DEmptyPaginationBoardTest.php`.

---

## Risks

| Risk | Mitigation |
|---|---|
| Hoisting the board slot changes a live page | No live page passes `board` |
| ListViewTable `rowHref` changes domain links | Optional; omitted → same `${basePath}/${id}` |
| Footer markup drift vs `CrmListFooter` | Same classes and `listPageHref`; no page uses the workspace footer yet |
| Shell `onModeChange` shows a second list/board toggle | Only if a page passes it; deals keep `DealLayoutToggle` |
