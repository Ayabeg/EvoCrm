# P05 — Companies workspace migration

**PR:** Move Companies onto DataWorkspace `resultMode="shared-table"`. Second live object on the canonical shared-table path. Remove `CrmShell` from this page only.  
**Baseline:** `main` @ `713b265` (P04 #211).  
**Date:** 2026-09-15.

Structural migration plus a measured Companies-only polish pass. Zero backend / Inertia / permission / saved-view contract changes. No Company bulk API. Leads, Deals, Quotes, and QuickRecordDrawer are not started.

---

## BEFORE

Companies was a domain-result consumer wrapped in CrmShell room/workspace chrome:

| Concern | Owner |
|---|---|
| Page composition | `pages/crm/companies/index.tsx` → `CrmShell` → `CrmListShell` children |
| Result renderer | Domain `ListViewTable` inside `renderResults` |
| Columns | Backend `ListViewConfig` + page `listView.columnDefs` |
| Selection | P03B `useWorkspaceSelection` (uncontrolled). `selectable: false`. No bulk |
| Row href | Domain fallback `${basePath}/${id}` (no `rowHref` passed) |
| Empty | Domain `CrmEmptyState` (true empty vs filtered) |
| Pagination | Domain `CrmListFooter` + page-local `listPageHref` |
| Bulk | None. No `/crm/companies/bulk` |
| Filters / query | P03C `list-query` via FilterBar / SavedViews / AdvancedFilterDrawer. Wilaya/city in `filterContext` |
| Saved views | Existing `/crm/filters` + pin/max. Unchanged product model |
| Header | PageHeader title + count, Create company (`?create=1` or drawer) |
| Loading | Page `useInertiaLoading` + `SkeletonList` |
| Extra chrome | `CrmShell chrome="workspace"` → RoomShell tabs (double chrome) |

`CrmListShell` defaulted to `resultMode="domain"`. Shared-table helpers from P03D were unused on this page.

---

## AFTER

Companies is a real shared-table consumer. The page no longer renders the list through `children` / `renderResults` and no longer mounts `CrmShell`.

| Concern | Owner |
|---|---|
| Workspace composition | DataWorkspace |
| Saved views / query chrome | DataWorkspace (P03C) |
| Table shell | `ListDataTable` → `ListViewTable` |
| Selection | P03B `WorkspaceSelection` (uncontrolled). `selectable: false`. No bulk bar |
| Empty | P03D `WorkspaceEmpty` via `empty={companyEmptyState(...)}` |
| Pagination | P03D `WorkspacePaginator` via `listPageHref` |
| Bulk chrome slot | Unused. Do not fake a Company bulk API |
| Domain columns / cells | `company-columns.tsx` + existing `ListViewConfig` visibility |
| Create | Unchanged `CreateDrawer` + POST `/crm/companies`. `?create=1` still opens the drawer |

`CrmListShell` remains the Inertia → DataWorkspace mapper. It now branches:

- Contacts + Companies: `resultMode="shared-table"` (requires `rows`, `rowHref`, `empty`)
- Other objects: `resultMode="domain"` + `renderResults` (unchanged)

---

## DATWORKSPACE MIGRATION

```
CompaniesIndex
  CrmListShell resultMode="shared-table"
    DataWorkspace object="company"
      PageHeader / SavedViews / FilterBar / AdvancedFilterDrawer
      ListDataTable(rowHref) | WorkspaceEmpty | loading skeletons
      WorkspacePaginator
```

Forbidden on the Companies page for the normal list surface:

- `CrmShell` / `chrome="workspace"` / `RoomShell`
- `children`
- `renderResults`
- `ListViewTable` / `CrmEmptyState` / `CrmListFooter` / page `listPageHref`
- `BulkActionBar` / `/crm/companies/bulk`

---

## COMPANY COLUMN CONTRACT

File: `resources/js/pages/crm/companies/company-columns.tsx`

Existing backend fields only (`ListViewConfig::columns('company')`):

| id | Default visible | Role |
|---|---|---|
| `name` | yes | Identity. Frontend label **Company** |
| `city` | yes | Location |
| `wilaya` | yes | Location |
| `owner` | yes | Owner |
| `created_at` | no | Metadata |

Visibility and order stay on `ListViewConfig` + session `CrmListShell` column state + saved views. P05 does **not** put columns on the URL and does **not** reorder saved views. No `domain`, `contacts_count`, or `deals_count` columns.

Recommended scan hierarchy (documented, not forced onto saved views): identity → location → owner → metadata.

Identity cell: name + compact location (city · wilaya). Same-name city/wilaya is shown once. Owner stays in the Owner column and is never repeated under the name. Subtle 24px initials. No new backend fields.

City and wilaya remain their own columns (same as P04 company-under-name). The secondary is a scan helper so the identity cell can stand alone; it is not a third location column.

---

## ROW NAVIGATION

`companyRowHref(row) → /crm/companies/${row.id}`  
P03D `resolveRowHref` / `ListDataTable.rowHref`.  
`onRowPeek` is still unused (P09).  
Row click ignores `a, input, button, label` so name link / menus do not double-navigate.

---

## SELECTION

Uncontrolled P03B contract. Page passes `pageIds` + `selectable: false`.  
No `useState<number[]>` / `setSelectedIds`.  
No checkboxes. No bulk bar. Master plan: do not fake a Company bulk API.

---

## QUERY STATE

P03C only. Companies search still maps to `q`. Preserved: search, owner, create date, city, wilaya, advanced `filter_groups`, saved `filter_id`, view, page.  
Wilaya/city stay domain `filterContext` on `CrmListShell` (`cities` / `wilayas` from `config('evosales.*')`).  
No second URL writer. No double navigation (`onViewChange` still does not `router.get`).

---

## SAVED VIEWS

Same `/crm/filters` write path, pin, max, built-in `all` / `my`. Persistence unchanged.

---

## COLUMNS

`ListViewConfig` + session `useState` synced from `listView.columns`. Not URL-owned. Shared-table `visibleColumns()` still respects that configuration.

---

## EMPTY STATE

`WorkspaceEmpty` (`h2` + `role="status"` from Aurora EmptyState).

| State | Title | CTA |
|---|---|---|
| No records | No companies yet | Create company |
| Filtered / search miss | No companies match these filters | none |

---

## PAGINATION

`WorkspacePaginator` → `workspacePageHref` → `listPageHref`.  
Page ≤ 1 omitted. Search / filters / sort / view / `filter_id` survive.  
No export link (Companies has no export route). Noun is `companies`.

---

## VISUAL CHANGES (Companies only)

- Identity cell: two-line name + compact location; company table headers 13/18
- Company rows `min-h-12` so two-line identity can grow; other unmigrated objects stay `h-12`
- Header hierarchy unchanged (28/34 title, one primary Create company)
- Filter / saved-view chrome is the existing DataWorkspace spacing (pad-x 32)
- Removed CrmShell / room tabs from this page only

No new cards, gradients, orange surfaces, or app-shell redesign.

---

## TESTS

New lock: `tests/Feature/P05CompaniesWorkspaceTest.php`  
Proofs: `resources/js/pages/crm/companies/company-columns-contract.ts`

Updated source locks that previously froze Companies on domain children / CrmShell: P03A, P03D, P04, `CrmListWorkspaceTest`, `CrmRecordHubVisualTest`.

P03B selection lock is unchanged (`selectable: false`, no bulk bar).

---

## LIVE VISUAL QA

**Status: NEEDS HUMAN / RESEARCH BOX**

This agent did not run a real browser against a deployed preview. Do not treat the checklist below as executed.

Exercise at **1440 / 1280 / 1024 / 768**:

1. Search (`q`) persists on page change
2. Owner / create date quick filters
3. Advanced filters: city + wilaya chips
4. Built-in and saved views (pin/max unchanged)
5. Column chooser (session only; not URL)
6. No checkboxes / no bulk bar
7. Pagination prev/next keeps query
8. Row click → `/crm/companies/:id` (name link does not double-fire)
9. Create company drawer (`?create=1` and header CTA)
10. True empty vs filtered empty
11. No room tabs on the companies list
12. Narrow widths: identity first, primary CTA visible, table can scroll horizontally

---

## REMOVED DUPLICATION

Removed from the Companies **page** only (still used by Deals / Quotes / Tickets / Leads):

- `CrmShell` double chrome
- Domain `ListViewTable` mount
- `CrmEmptyState` / `CrmListFooter` / page `listPageHref`

Not deleted: `list-view-table.tsx`, `list-chrome.tsx`, `CrmListShell` domain path, `CrmShell` (leads / tickets / activities still use it). P28 owns broad legacy removal.

---

## REMAINING COMPANIES DEBT

- Default column order is still ListViewConfig (location columns sit next to identity)
- No bulk API (intentional; do not fake)
- `CrmListShell` still maps Inertia; page does not import DataWorkspace directly
- No QuickRecordDrawer, no mobile sheet
- Create form still omits wilaya (pre-existing; store accepts it)

---

## DEFERRED TO P06+

| Item | Phase |
|---|---|
| Leads workspace table | **P06** |
| Deals list shared-table | **P07** |
| Quotes shared-table | **P08** |
| QuickRecordDrawer / `onRowPeek` | **P09** |
| Company bulk API | later (needs backend) |
| Pipeline board on `mode="board"` | **P11** |
| Columns / sort on the URL | later (needs backend read path) |
| App-wide a11y | **P26** |
| Legacy helper deletion | **P28** |
