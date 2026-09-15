# P06 — Leads workspace migration

**PR:** Move the real CRM Lead list (`/crm/leads`) onto DataWorkspace `resultMode="shared-table"`. Third live object on the canonical shared-table path. Remove `CrmShell` from this page only.  
**Baseline:** `main` @ `b05275c` (P05 #212).  
**Date:** 2026-09-15.

Structural migration. Zero qualification / conversion / permission / bulk / saved-view / filter contract changes. No Lead bulk API. Deals, Pipeline, legacy `/leads`, and QuickRecordDrawer are not started.

---

## BEFORE

Leads was a custom raw table wrapped in CrmShell workspace chrome. It was **not** a CrmListShell / DataWorkspace consumer.

| Concern | Owner |
|---|---|
| Page composition | `pages/crm/leads/index.tsx` → `CrmShell chrome="workspace"` → `CrmObjectHeader` |
| Result renderer | Page-local `<table>` (Title / Contact / Status / Score) |
| Columns | Hardcoded `<th>` in the page |
| Selection | None |
| Row href | Page `router.visit` + `<Link>` to `/crm/leads/:id` |
| Empty | Domain `CrmEmptyState` (true empty only) |
| Pagination | Domain `CrmListFooter` count of loaded rows |
| Bulk | None. No `/crm/leads/bulk` |
| Filters / query | None. `LEAD_ADAPTER.supportsQuery: false`. `?q=` ignored |
| Saved views | None. SavedFilter entity does not allow `lead` |
| Header | Title + count, Capture inbox, Create lead |
| Loading | None |
| Extra chrome | `CrmShell` → RoomShell tabs (double chrome) |

`CrmListShell` defaulted to `resultMode="domain"` for unmigrated objects. Shared-table helpers from P03D/P04/P05 were unused on this page.

Index query: `Lead::latest()->limit(100)->get()` with `contact` + `latestScore`. No `activeFilters`, `listView`, `paginator`, or `savedFilters`.

---

## AFTER

Leads is a real shared-table consumer. The page no longer renders a raw table or `CrmShell`.

| Concern | Owner |
|---|---|
| Workspace composition | DataWorkspace |
| Query chrome | DataWorkspace FilterBar column chooser only |
| Table shell | `ListDataTable` → `ListViewTable` |
| Selection | P03B `WorkspaceSelection` (uncontrolled). `selectable: false`. No bulk |
| Empty | P03D `WorkspaceEmpty` via `empty={leadEmptyState(...)}` |
| Pagination | P03D `WorkspacePaginator` reflecting the existing 100-row cap |
| Bulk chrome slot | Unused. Do not fake a Lead bulk API |
| Domain columns / cells | `lead-columns.tsx` + `ListViewConfig::columns('lead')` |
| Create | Unchanged `CreateDrawer` + POST `/crm/leads` |
| Capture inbox | Unchanged secondary link `/crm/leads/captures` |

`CrmListShell` remains the Inertia → DataWorkspace mapper. It now branches:

- Contacts + Companies + **Leads**: `resultMode="shared-table"` (requires `rows`, `rowHref`, `empty`)
- Deals / Quotes / Tickets: `resultMode="domain"` + `renderResults` (unchanged)

---

## ROUTE DISTINCTION

| Route | Object | P06 |
|---|---|---|
| `GET /crm/leads` | Real inbound **Lead** list | Migrated |
| `GET /crm/leads/{lead}` | Lead record + Path + conversion | Unchanged |
| `POST /crm/leads/{lead}/qualify` | Conversion (creates/links a deal) | Unchanged |
| `GET /crm/leads/captures` | Capture inbox | Unchanged secondary link |
| `GET /leads` | **302 → `/crm/deals/board`** | Unchanged. Not this object |
| `GET /crm/deals` / `/crm/deals/board` | Deals / Pipeline | Unchanged. P07 / P11 |

Do not treat “lead” as “deal”. Contact `lead_status` is a different field.

---

## DATAWORKSPACE MIGRATION

```
LeadsIndex
  CrmListShell resultMode="shared-table"
    DataWorkspace object="lead"
      PageHeader (Create lead + Capture inbox)
      FilterBar column chooser only (no search / Advanced / saved views)
      ListDataTable(rowHref) | WorkspaceEmpty | loading skeletons
      WorkspacePaginator
```

Forbidden on the Leads page for the normal list surface:

- `CrmShell` / `chrome="workspace"` / `RoomShell`
- `children` / `renderResults`
- Raw `<table>` / `CrmEmptyState` / `CrmListFooter`
- `BulkActionBar` / `/crm/leads/bulk`
- `QuickRecordDrawer` / `onRowPeek`
- `LeadWorkspaceTable` / `LeadWorkspacePaginator` / `LeadSavedViews` forks

---

## LEAD QUERY ADAPTER

P03C left `LEAD_ADAPTER.supportsQuery: false`. **Resolved intentionally: keep false.**

Existing Lead request contract consumes **no** list query params. `LeadController@index` still ignores `q`, `page`, `view`, `filter_id`, `status`, `owner`, and `filter_groups`.

| Canonical concept | Serialized? | Why |
|---|---|---|
| `search` → `q` | no | Backend does not search |
| `page` | no | Hard `limit(100)`, not `CrmFilter::paginate` |
| `view` / `filter_id` | no | SavedFilter entity is still `contact,deal,company` |
| `filters.*` | no | `ListViewConfig::filterFields('lead')` is `[]` |
| `sort` | no | Fixed `latest()` |

`toDomainParams()` still returns `{}` for lead. One URL writer remains (none, for this object). Page defaults `activeFilters = {}` and `savedFilters = []`. Controller does **not** emit `activeFilters` so P03C `missing('activeFilters')` stays true.

DataWorkspace / FilterBar now read `listQueryAdapter(object).supportsQuery`:

- `false` → hide SavedViews, search, Advanced, chips. Keep ColumnChooser.
- `true` → Contacts / Companies / Deals / Quotes / Tickets unchanged.

This is domain adapter config, not a Lead chrome fork.

**Exception (documented):** Inertia now also sends `listView`, `recordCount`, and a one-page `paginator` so the shared-table shell can render columns / empty / footer. That is a typed adapter for existing data, not a new query capability.

---

## LEAD COLUMN CONTRACT

File: `resources/js/pages/crm/leads/lead-columns.tsx`

Existing list fields only (the previous raw table):

| id | Default visible | Role |
|---|---|---|
| `title` | yes | Identity. Frontend label **Lead** |
| `contact` | yes | Association |
| `status` | yes | Qualification (`new` / `working` / `disqualified` / `qualified`) |
| `score` | yes | Score via existing `LeadScorePill` |

No `source`, `owner`, `company`, `created_at`, `last_activity`, or conversion-target columns. Those fields/relations exist elsewhere; they were not list columns and P06 does not invent them.

Recommended scan hierarchy (documented, not forced): identity → contact → qualification → score.

Identity cell: title + compact contact name. Status and score stay in their columns and are never repeated under the title. Subtle 24px initials from the first two title tokens. Long titles truncate with `title` tooltip. Same grammar as Contacts / Companies.

---

## QUALIFICATION

Unchanged.

| Mechanism | Route / owner | List presentation |
|---|---|---|
| Path steps | `PUT /crm/leads/{id}` `{path_step}` on **show** | Not a list action |
| DB `status` | `new` / `working` / `disqualified` / `qualified` | Title-cased muted text (not all orange) |
| Formula score | `leads.score` + `latestScore` | Existing `LeadScorePill` compact |
| Thresholds | `/settings/qualify` | Untouched |

No new qualification states, badges, or list actions.

---

## CONVERSION

Unchanged. Endpoint is still `POST /crm/leads/{lead}/qualify`.

Validation, `LeadConverter` transaction, create/link modes, idempotency, permissions (`LeadPolicy::qualify`), navigation (`back()`), and `LeadConversionDialog` on **show** are not modified. The list does not add a convert button.

---

## ROW NAVIGATION

`leadRowHref(row) → /crm/leads/${row.id}`  
P03D `resolveRowHref` / `ListDataTable.rowHref`.  
`onRowPeek` is still unused (P09).  
Row click ignores `a, input, button, label` so the name link / menus do not double-navigate.

---

## SELECTION / BULK DECISION

Uncontrolled P03B contract. Page passes `pageIds` + `selectable: false`.  
No `useState<number[]>` / `setSelectedIds`.  
No checkboxes. No bulk bar. There is no `/crm/leads/bulk`. Do not fake one.

---

## SAVED VIEWS

Not supported. `SavedFilter` validation remains `contact,deal,company`.  
SavedViews chrome is hidden while `supportsQuery` is false so All / My / Add view cannot POST an invalid `entity=lead`.

---

## FILTERS

None. `filterFields('lead')` is empty. No status / owner / source / city quick filters.  
`CrmFilter` has no `applyToLeads`.

---

## SEARCH

Not supported. No `name="q"` on the Leads page. FilterBar does not render the search box when `supportsQuery` is false. No client-side filter. Placeholder `Search leads…` is deferred until a real backend `q` exists.

---

## EMPTY STATES

`WorkspaceEmpty` (`h2` + `role="status"` from Aurora EmptyState).

| State | Title | CTA |
|---|---|---|
| No records | No leads yet | Create lead |
| Filtered / search miss | No leads match these filters | none |

Filtered empty is defined for contract completeness. With no query adapter it cannot appear from the toolbar.

---

## PAGINATION

`WorkspacePaginator` → `workspacePageHref` → `listPageHref`.  
Noun is `leads`.

**Exception:** this is a one-page stub of the existing `limit(100)` load (`page=1`, `last_page=1`, `total=loaded count`). Prev/Next stay disabled. P06 does not invent `CrmFilter::paginate`. Header count still matches loaded rows, same as before.

---

## VISUAL BASELINE INHERITANCE

Inherited from P04/P05. No independent Leads visual system.

- Identity cell: two-line title + contact; table headers 13/18
- Lead rows `min-h-12` so two-line identity can grow
- Header hierarchy unchanged (28/34 title via PageHeader, secondary Capture inbox, one primary Create lead)
- Filter chrome is existing DataWorkspace spacing (pad-x 32)
- Removed CrmShell / room tabs from this page only
- Lead `table-fixed min-w-[52rem]` with title 40% / contact 22% / status 18% / score 20%
- Identity `flex w-full min-w-0` + ellipsis + `title`
- Vertical scrollbar reserved (`scrollbar-gutter: stable`)
- Horizontal scroll only on the table wrapper (same P05 1024 contract)
- Below `@[480px]/list`: existing card rows

No new cards, gradients, orange surfaces, or app-shell redesign.

---

## 1440 / 1280 / 1024 / 768 QA

Intended (not executed here — see LIVE VISUAL QA):

| Viewport | Intended behavior |
|---|---|
| 1440 | All four default columns visible. Toolbar wraps ColumnChooser only. Identity truncates; full title in `title`. |
| 1280 | Same columns. Toolbar stays one row when the pane is wide enough. |
| 1024 | Table `min-w-[52rem]` + one intentional horizontal scroller if the pane is narrower. Vertical scroll on the table body. |
| 768 | Same H-scroll contract above 480px container. Below `@[480px]/list` card rows. Primary CTA visible. |

---

## INTERACTION QA

1. Row click → `/crm/leads/:id` (name link does not double-fire)
2. Create lead drawer (title / contact / source) still POSTs `/crm/leads`
3. Capture inbox still goes to `/crm/leads/captures`
4. No search box, no All/My views, no Advanced, no checkboxes, no bulk bar
5. True empty shows Create lead
6. Score pill still uses `latest_score` + denormalized `score`
7. Status stays title-cased muted text
8. Nested controls do not navigate
9. Contacts / Companies / Deals / Quotes / Pipeline unchanged
10. `GET /leads` still redirects to the deal board

---

## TESTS

New lock: `tests/Feature/P06LeadsWorkspaceTest.php`  
Proofs: `resources/js/pages/crm/leads/lead-columns-contract.ts`

Updated source locks that previously froze Leads on CrmShell / raw table: P03A, P03B, P03D, P04, P05, `CrmListWorkspaceTest`.

P03C query lock is unchanged (`supportsQuery: false`, `leads emit no list query`, `?q=ignored` still `missing('activeFilters')`).

Qualification / conversion tests (`LeadPathTest`, `LeadConversionTest`, `LeadQualifyScoreTest`) are not rewritten.

---

## LIVE VISUAL QA

**Status: NEEDS HUMAN / RESEARCH BOX**

This agent did not run a real browser against a deployed Contabo / preview host. Do not treat the checklist below as executed.

Exercise at **1440 / 1280 / 1024 / 768**:

1. `/crm/leads` uses DataWorkspace shared-table, not CrmShell / room tabs
2. Identity truncates long titles; tooltip shows the full title
3. Contact secondary does not duplicate status or score
4. Status is muted title-case; score uses LeadScorePill (not all orange)
5. Row click → `/crm/leads/:id`; name link does not double-navigate
6. Create lead drawer still works
7. Capture inbox still works
8. No search, no saved-view pills, no Advanced, no checkboxes, no bulk
9. True empty vs (unreachable) filtered empty copy
10. Paginator shows “Showing N of N leads” with disabled Prev/Next
11. 1024/768: one intentional H-scroll; cards below 480px container
12. Contacts / Companies / Deals list / Deal board / Quotes unchanged
13. `/leads` still redirects to `/crm/deals/board`
14. Show-page Path + conversion still work

Realistic Contabo QA data:

- ≥1 long title (80+ chars)
- Lead with contact first+last
- Lead with no contact name edge (should not happen at create; still render —)
- Mix of `new` / `working` / `qualified` / `disqualified`
- Leads with and without `latest_score`
- Empty workspace (true empty)
- 100+ leads (cap still 100; do not expect page 2)

---

## REMAINING LEAD DEBT

- No search / filters / real pagination (intentional; backend never had them)
- Hard `limit(100)` can hide older leads
- No saved views (`SavedFilter` still excludes `lead`)
- No bulk API
- Source / owner / company / created_at / conversion target are not list columns
- `CrmListShell` still maps Inertia; page does not import DataWorkspace directly
- No QuickRecordDrawer, no mobile sheet
- Column chooser is session-only (same as Contacts / Companies)

---

## DEFERRED TO P07+

| Item | Phase |
|---|---|
| Deals list shared-table | **P07** |
| Quotes shared-table | **P08** |
| QuickRecordDrawer / `onRowPeek` | **P09** |
| Pipeline board on `mode="board"` | **P11** |
| Lead search / filters / real pagination | later (needs CrmFilter + adapter flip) |
| Lead saved views | later (needs SavedFilter entity `lead`) |
| Lead bulk API | later (needs backend) |
| Columns / sort on the URL | later |
| App-wide a11y | **P26** |
| Legacy helper deletion | **P28** |
