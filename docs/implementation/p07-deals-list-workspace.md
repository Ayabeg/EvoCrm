# P07 — Deals list workspace migration

**PR:** Move the production Deals **list** (`/crm/deals`) onto DataWorkspace `resultMode="shared-table"`. Fourth live object on the canonical shared-table path.  
**Baseline:** `main` @ `cddd017` (P06 #215).  
**Date:** 2026-09-15.

Structural list-surface migration only. Zero deal-engine / board / pipeline / forecast / stage-model / bulk-API / saved-view / filter-contract changes. P03C query adapter is mapped, not replaced. Quotes, QuickRecordDrawer, and the deal board are not started.

---

## BEFORE

Deals list was a domain-result consumer. The board was a separate route and stayed that way.

| Concern | Owner |
|---|---|
| Page composition | `pages/crm/deals/index.tsx` → `CrmListShell` default `resultMode="domain"` |
| Result renderer | Domain children → `ListViewTable` + `CrmEmptyState` + `CrmListFooter` |
| Columns | Backend `ListViewConfig::columns('deal')` + page `listView.columnDefs` |
| Identity cell | Page-local `DealNameCell` — title only, no secondary, no initials |
| Selection | P03B `WorkspaceSelection` (uncontrolled). `selectable: canBulk` |
| Row href | Domain fallback `${basePath}/${id}` (no `rowHref` passed) |
| Empty | Domain `CrmEmptyState` (true empty vs filtered) |
| Pagination | Domain `CrmListFooter` + page-local `listPageHref(..., { pipeline })` |
| Bulk | Real `/crm/deals/bulk` via `BulkActionBar` when `crm.bulk` |
| Filters / query | P03C `DEAL_ADAPTER` (`q`, `view`, `owner`, `stage`, `pipeline`, `sort`, `direction`, `filter_id`, `filter_groups`) |
| Saved views | Existing `/crm/filters` entity `deal` |
| Header | Title + count, Import (permission), Create deal |
| List ↔ Board | `DealLayoutToggle` links `/crm/deals` ↔ `/crm/deals/board` |
| Pipeline | `PipelineSwitcher` + `extraQuery.pipeline` |
| Stage chips | `StagePills` inside domain `renderResults` |
| Loading | Page `useInertiaLoading` + `SkeletonList` |

`CrmListShell` defaulted Deals to `resultMode="domain"`. Shared-table helpers from P03D/P04/P05/P06 were unused on this page.

---

## AFTER

Deals **list** is a real shared-table consumer. The page no longer renders a raw table, `CrmEmptyState`, or `CrmListFooter`. The **board** is untouched.

| Concern | Owner |
|---|---|
| Workspace composition | DataWorkspace |
| Query chrome | DataWorkspace SavedViews + FilterBar + AdvancedFilterDrawer |
| Table shell | `ListDataTable` → `ListViewTable` |
| Selection | P03B `WorkspaceSelection` (uncontrolled). `selectable: canBulk` |
| Row href | P03D `dealRowHref` → `/crm/deals/:id` |
| Empty | P03D `WorkspaceEmpty` via `empty={dealEmptyState(...)}` |
| Pagination | P03D `WorkspacePaginator` via `listPageHref` + `extraQuery.pipeline` |
| Bulk chrome slot | Existing `BulkActionBar` (assign owner / move stage / delete) |
| Domain columns / cells | `deal-columns.tsx` + `ListViewConfig::columns('deal')` |
| Create | Unchanged `CreateDrawer` + POST `/crm/deals` |
| Import / export | Unchanged secondary link + `exportHref` with pipeline |
| List ↔ Board | Unchanged `DealLayoutToggle` (separate routes) |
| Pipeline | Unchanged `PipelineSwitcher` + `extraQuery.pipeline` |
| Stage chips | Existing `StagePills` via CrmListShell `toolbarExtra` (Deal-owned) |

`CrmListShell` now branches:

- Contacts + Companies + Leads + **Deals**: `resultMode="shared-table"` (requires `rows`, `rowHref`, `empty`)
- Quotes / Tickets: `resultMode="domain"` + `renderResults` (unchanged)

---

## LIST / BOARD BOUNDARY

One Deal domain. P07 owns the **list surface only**.

| Surface | Route | P07 |
|---|---|---|
| Deals list | `GET /crm/deals` | Migrated to shared-table |
| Deals board / pipeline | `GET /crm/deals/board` | Unchanged. P11 |
| Deal record | `GET /crm/deals/{deal}` | Unchanged |
| Legacy leads URL | `GET /leads` → **302 `/crm/deals/board`** | Unchanged |
| Lead object | `GET /crm/leads` | Unchanged (P06) |
| Quotes | `GET /crm/quotes` | Unchanged. P08 |

**Proof P07 does not migrate the board**

- `pages/crm/deals/board.tsx` still mounts `PipelineKanban` and `DealLayoutToggle`
- No `resultMode`, `mode="board"`, `DataWorkspace`, or `WorkspaceBoard` on the board page
- `DealLayoutToggle` still navigates `/crm/deals` ↔ `/crm/deals/board` (no `mode=board`)
- Deals list does not pass `board`, `onModeChange`, or `PipelineKanban`
- P03D `resolveWorkspaceBoardSlot` stays dormant until P11
- Drag/drop, `/move`, weighted forecast, stage model, and `DealBoardOptions` are not edited

---

## DATAWORKSPACE MIGRATION

```
DealsIndex
  CrmListShell resultMode="shared-table"
    DataWorkspace object="deal"
      PageHeader (Create deal + Import)
      SavedViews
      FilterBar (search “Search deals…” + owner/created/status + Advanced + columns
                 + DealLayoutToggle + PipelineSwitcher)
      StagePills (toolbarExtra)
      BulkActionBar (when selected)
      ListDataTable(rowHref) | WorkspaceEmpty | loading skeletons
      WorkspacePaginator (preserves pipeline extraQuery)
```

Forbidden on the Deals **list** page for the normal list surface:

- `CrmShell` / `chrome="workspace"` / `RoomShell`
- `children` / `renderResults`
- Raw `<table>` / `CrmEmptyState` / `CrmListFooter` / page `listPageHref`
- `QuickRecordDrawer` / `onRowPeek`
- `DealWorkspaceTable` / `DealWorkspacePaginator` / `DealSavedViews` forks
- `PipelineKanban` / `mode="board"` / in-page board slot

---

## DEAL QUERY CONTRACT

P03C already normalized Deals. **Do not replace the adapter.**

`DEAL_ADAPTER` remains:

| Field | Value |
|---|---|
| `object` | `deal` |
| `supportsQuery` | `true` |
| `searchParam` | `q` |
| `filterKeys` | workspace keys including `owner`, `created`, `status`, `stage`, … |
| `extras` | `['pipeline']` |

Serialized production params stay `q` / `view` / `owner` / `stage` / `pipeline` / `sort` / `direction` / `filter_id` / `filter_groups` only as they already exist. No aesthetic renames.

P03C pipeline/stage preservation is unchanged:

- Changing **stage** preserves search / filters / sort / view / **pipeline** and resets page
- Changing **pipeline** preserves search / filters / sort / view and **drops pipeline-scoped stage**
- Unrelated valid state is not erased

`extraQuery={{ pipeline: pipeline.id }}` is still the only pipeline write from this page (PipelineSwitcher + paginator + export).

---

## DEAL COLUMN CONTRACT

File: `resources/js/pages/crm/deals/deal-columns.tsx`

Real `ListViewConfig::columns('deal')` fields only:

| id | Default visible | Role |
|---|---|---|
| `title` | yes | Identity. Frontend label **Deal** |
| `stage` | yes | Pipeline stage (name unchanged) |
| `amount` | yes | `amount_cents` via existing `formatDzd` |
| `close_date` | yes | Existing date format |
| `owner` | yes | Same owner cell as Contacts / Companies |
| `company` | yes | Association column |
| `contact` | yes | Association column |
| `health` | no | Existing health score/label text |
| `next_step` | no | Existing computed next meeting/task or health next action |
| `last_activity_at` | no | Metadata |
| `created_at` | no | Metadata |

No invented columns (probability, forecast, quotes count, source, priority, next-activity engine).

Recommended scan hierarchy (documented, not forced): identity → stage → amount → close → owner → association.

Identity cell: deal name + one secondary association. Prefer company; fall back to contact. Do not stack both. Subtle 24px initials from the first two title tokens. Long titles truncate with `title` tooltip. Same grammar as Contacts / Companies / Leads.

---

## AMOUNT

`DealAmountCell` calls existing `formatDzd(amount_cents ?? 0)`.

- Currency remains DZD via `Intl.NumberFormat('fr-DZ')`
- No conversion, no extra rounding, no compact format on the list
- `tabular-nums` + truncate + tooltip for scan

---

## STAGE

Verified production default slugs (not a rename license): **New / Qualified / Demo / Proposal / Won / Lost**. Custom pipeline names/slugs still render as stored.

List cell tone (restrained, not all orange):

| Tone | When | Presentation |
|---|---|---|
| `won` | `is_won` or slug `won` | Quiet success — `font-medium text-ink` |
| `lost` | `is_lost` or slug `lost` | Quiet danger — `text-destructive` (text only, no red pill) |
| `open` | everything else | `text-mute` |

Stage **names are not renamed**. StagePills remain the stage filter chrome and still use P03C `applyStageFilter`.

---

## PIPELINE

`PipelineSwitcher` + `extraQuery.pipeline` + controller `PipelineManager::resolve` are unchanged. List rows stay scoped to the resolved pipeline. Board forecast / `DealBoardOptions` are not edited.

---

## NEXT ACTIVITY

The list already receives `next_step`:

1. Next undone meeting/task with `due_at`, formatted `d M H:i` Africa/Algiers
2. Else `health.next_action` when present

That column stays **default hidden** (`ListViewConfig`). P07 does not invent a P12 attention engine, badges, or overdue coloring.

---

## ROW NAVIGATION

`dealRowHref(row) → /crm/deals/${row.id}`  
P03D `resolveRowHref` / `ListDataTable.rowHref`.  
`onRowPeek` is still unused (P09).  
Row click ignores `a, input, button, label` so the name link / checkboxes / menus do not double-navigate.

---

## SELECTION

Uncontrolled P03B `WorkspaceSelection` only.

- Single / multi
- Select page = current rendered page ids
- Indeterminate when some page rows are selected
- Cross-page ids persist until cleared
- Clear via bulk bar
- `bulkActive` when `selectedIds.length > 0`

No page-local `useState<number[]>` / `setSelectedIds`.

---

## BULK ACTIONS

Real production actions only. Unchanged:

- Route `POST /crm/deals/bulk`
- Permission `crm.bulk`
- Actions: assign owner, move stage, delete
- ID format: selected row ids as posted today
- Confirmation / errors stay in the existing bar

No BulkActionBar redesign. Companies / Leads still have no deal-style fake bulk.

---

## SAVED VIEWS

Preserved. `SavedFilter` entity already allows `deal`. All / My / saved filter_id / pin stay on DataWorkspace SavedViews. Columns stay ListViewConfig / session (not URL).

---

## FILTERS

Real deal `filterFields` only: stage, owner, city, wilaya, created, last_activity, status (`open` / `won` / `lost`), unanswered, unassigned.

Quick bar still uses the shared `owner` / `created` / `status` set (priority is not a deal field, so it does not appear). Stage remains StagePills, not a new quick filter. Search placeholder is **Search deals…**.

---

## COLUMNS

Visibility + order stay on ListViewConfig / session / saved views. `applyDealColumnContract` only relabels `title` → **Deal**. Widths are list-table chrome (P05 lesson):

- `table-fixed min-w-[68rem]` (seven default columns)
- title 24% / stage 11% / amount 12% / close 12% / owner 13% / company 14% / contact 14%
- Identity `flex w-full min-w-0` + ellipsis
- Intentional table H-scroll; vertical scroll on the table body (`scrollbar-gutter: stable`)

---

## EMPTY STATES

`WorkspaceEmpty` (`h2` + `role="status"`).

| State | Title | CTA |
|---|---|---|
| No records | No deals yet | Create deal |
| Filtered / search miss | No deals match these filters | none |

Copy matches the previous domain empty. Filtered empty uses `hasActiveListFilters(activeFilters)`.

---

## PAGINATION

`WorkspacePaginator` → `workspacePageHref` → `listPageHref`.  
Noun is now `deals` (was a generic `records` stub because Deals had not migrated).  
`extraQuery.pipeline` is preserved on Prev/Next. Export href still includes pipeline.

---

## VISUAL BASELINE INHERITANCE

Inherited from P04/P05/P06. No independent Deals visual system.

- Identity cell: two-line title + company/contact; table headers 13/18
- Deal rows `min-h-12` so two-line identity can grow
- Header hierarchy unchanged (PageHeader title, Import secondary, one primary Create deal)
- Filter chrome is existing DataWorkspace spacing (pad-x 32)
- List/Board toggle and PipelineSwitcher stay in `filterExtra`
- No new cards, gradients, orange surfaces, or app-shell redesign

---

## 1440 / 1280 / 1024 / 768 QA

Intended (not executed here — see LIVE VISUAL QA):

| Viewport | Intended behavior |
|---|---|
| 1440 | Default columns visible in the pane when the workspace is wide. Toolbar wraps toggle + pipeline + search. Identity truncates; full title in `title`. |
| 1280 | Same columns. May start the intentional table H-scroll if the pane is narrower than `68rem`. |
| 1024 | Table `min-w-[68rem]` + one intentional horizontal scroller. Vertical scroll on the table body. StagePills wrap. |
| 768 | Same H-scroll contract above 480px container. Below `@[480px]/list` card rows. Primary CTA + List/Board toggle visible. |

---

## LIST ↔ BOARD QA

1. List toggle stays on `/crm/deals` (pipeline query preserved)
2. Board toggle visits `/crm/deals/board?pipeline=`
3. Board still renders `PipelineKanban`, forecast, drag/drop, `/move`
4. Back from board returns to the list URL (not an in-page mode)
5. `/leads` still 302s to `/crm/deals/board`

---

## BACK / FORWARD QA

1. Search `q` survives Back/Forward
2. Stage pill + pipeline extraQuery survive
3. Saved view / `filter_id` survive
4. Page 2 + pipeline survive
5. Owner / status chips survive
6. Selection is not written to the URL (P03B)

---

## OWNERSHIP MAP

| Area | Owner after P07 |
|---|---|
| List composition / chrome | DataWorkspace |
| Deal columns, cells, identity, amount, stage tone | Deals (`deal-columns.tsx`) |
| Query keys / pipeline extra | P03C `DEAL_ADAPTER` |
| Selection | P03B WorkspaceSelection |
| Bulk actions / permissions | Existing Deal bulk |
| Board / kanban / forecast / drag | **Unchanged. P11** |
| Record hub | Unchanged |
| Quotes | Unchanged. P08 |

---

## TESTS

New lock: `tests/Feature/P07DealsWorkspaceTest.php`  
Proofs: `resources/js/pages/crm/deals/deal-columns-contract.ts`

Updated source locks that previously froze Deals on domain children: P03A, P03B, P03D, P04, P05, P06, `CrmListWorkspaceTest`, `CrmRecordHubVisualTest`, `EvoCrmWave2DealsChromeTest`, `EvoCrmWave6EmptyMotionTest`.

P03C query lock is unchanged (adapter extras, stage/pipeline preservation).

Deal engine tests (`DealStagesTest`, `DealAmountStageTest`, `DealStagePillsTest`, `CrmBulkActionsTest`) are not rewritten.

---

## LIVE VISUAL QA

**Status: NEEDS HUMAN / RESEARCH BOX**

This agent did not run a real browser against a deployed Contabo / preview host. Do not treat the checklist below as executed.

Exercise at **1440 / 1280 / 1024 / 768**:

1. `/crm/deals` uses DataWorkspace shared-table, not domain `ListViewTable` children
2. Identity truncates long titles; tooltip shows the full title
3. Secondary is company, or contact if no company — never both under the title
4. Amount is existing DZD formatting, tabular, scannable
5. Won is quiet success; Lost is quiet danger; New/Qualified/Demo/Proposal are mute (not all orange)
6. Stage names are the real pipeline names
7. Row click → `/crm/deals/:id`; name link / checkbox do not double-navigate
8. Create deal drawer still POSTs `/crm/deals`
9. Import still goes to `/crm/deals/import` when permitted
10. Search placeholder reads “Search deals…”
11. Saved views / chips / Advanced still work
12. Pipeline switcher preserves query and may drop pipeline-scoped stage (P03C)
13. List ↔ Board toggle uses separate routes; board is still kanban
14. Bulk select page / indeterminate / assign / move stage / delete still work when permitted
15. True empty vs filtered empty copy
16. Paginator shows “Showing N of M deals” and keeps `pipeline`
17. 1024/768: one intentional H-scroll; cards below 480px container
18. Contacts / Companies / Leads / Quotes / Deal record unchanged
19. `/leads` still redirects to `/crm/deals/board`
20. Back/Forward keeps q / stage / pipeline / view / page

Realistic Contabo QA data:

- ≥1 long deal title (80+ chars)
- Deal with company + contact
- Deal with contact only
- Mix of New / Qualified / Demo / Proposal / Won / Lost
- Amounts 0 and large (e.g. 650,000 DZD)
- Deal with `next_step` (upcoming meeting/task) and without
- Second pipeline (prove stage reset + unrelated state)
- Saved deal view
- Enough rows for page 2
- Empty filtered search
- User with and without `crm.bulk` / `crm.import`

---

## BOARD REGRESSION

P07 does **not**:

- render the board through the DataWorkspace board slot
- move `/crm/deals/board`
- replace `PipelineKanban`
- modify drag/drop or the deal movement endpoint
- change weighted forecast or `DealBoardOptions`
- invent `mode=board` as a list query

P03D board slot stays dormant until P11.

---

## REMAINING DEAL LIST DEBT

- Health / next_step remain optional columns (text only)
- `next_step` is a computed label, not a P12 attention engine
- Column chooser is session-only (same as Contacts / Companies / Leads)
- `CrmListShell` still maps Inertia; page does not import DataWorkspace directly
- No QuickRecordDrawer, no mobile sheet
- Seven default columns need H-scroll under ~1280 content width (intentional)
- Custom pipeline stage names rely on `is_won` / `is_lost` for tone when slugs are not `won`/`lost`

---

## DEFERRED TO P08+

| Item | Phase |
|---|---|
| Quotes shared-table | **P08** |
| QuickRecordDrawer / `onRowPeek` | **P09** |
| Pipeline board on `mode="board"` | **P11** |
| Next-activity attention engine | **P12** |
| New deal backend / stages / forecast / currency | out of scope |
| Columns / sort on the URL | later (unless main already did; it did not) |
| App-wide a11y | **P26** |
| Legacy helper deletion | **P28** |
