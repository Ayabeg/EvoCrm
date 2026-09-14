# P04 — Contacts workspace migration

**PR:** Move Contacts onto DataWorkspace `resultMode="shared-table"`. First live object on the canonical shared-table path.  
**Baseline:** `main` @ `aee49804` (P03D #210).  
**Date:** 2026-09-14.

Structural migration plus a measured Contacts-only polish pass. Zero backend / Inertia / permission / saved-view / bulk-POST contract changes. Companies, Leads, Deals, Quotes, and QuickRecordDrawer are not started.

---

## BEFORE

Contacts was a domain-result consumer:

| Concern | Owner |
|---|---|
| Page composition | `pages/crm/contacts/index.tsx` → `CrmListShell` children |
| Result renderer | Domain `ListViewTable` inside `renderResults` |
| Columns | Backend `ListViewConfig` + page `listView.columnDefs`; `ContactNameCell` in `list-view-table.tsx` |
| Selection | P03B `useWorkspaceSelection` (uncontrolled). Page read it via `children(columns, selection)` |
| Row href | Domain fallback `${basePath}/${id}` (no `rowHref` passed) |
| Empty | Domain `CrmEmptyState` (true empty vs filtered) |
| Pagination | Domain `CrmListFooter` + page-local `listPageHref` |
| Bulk | Domain `BulkActionBar` inside children; POSTs `/crm/contacts/bulk` |
| Filters / query | P03C `list-query` via FilterBar / SavedViews / AdvancedFilterDrawer |
| Saved views | Existing `/crm/filters` + pin/max. Unchanged product model |
| Header | PageHeader title + count, Duplicates, Import, Create contact |
| Loading | Page `useInertiaLoading` + `SkeletonList` |

`CrmListShell` always set `resultMode="domain"`. Shared-table helpers from P03D were unused on any live page.

---

## AFTER

Contacts is a real shared-table consumer. The page no longer renders the list through `children` / `renderResults`.

| Concern | Owner |
|---|---|
| Workspace composition | DataWorkspace |
| Saved views / query chrome | DataWorkspace (P03C) |
| Table shell | `ListDataTable` → `ListViewTable` |
| Selection | P03B `WorkspaceSelection` (uncontrolled). No page-local `selectedIds` |
| Empty | P03D `WorkspaceEmpty` via `empty={contactEmptyState(...)}` |
| Pagination | P03D `WorkspacePaginator` via `listPageHref` |
| Bulk chrome slot | DataWorkspace `bulk` render function. Contacts still supplies verbs |
| Domain columns / cells | `contact-columns.tsx` + existing `ListViewConfig` visibility |
| Create / import / duplicates | Unchanged page actions + permissions |

`CrmListShell` remains the Inertia → DataWorkspace mapper. It now branches:

- Contacts: `resultMode="shared-table"` (requires `rows`, `rowHref`, `empty`)
- Other objects: `resultMode="domain"` + `renderResults` (unchanged)

---

## DATWORKSPACE MIGRATION

```
ContactsIndex
  CrmListShell resultMode="shared-table"
    DataWorkspace
      PageHeader / SavedViews / FilterBar / AdvancedFilterDrawer
      bulk(selection) → BulkActionBar
      ListDataTable(rowHref) | WorkspaceEmpty | loading skeletons
      WorkspacePaginator (exportHref preserved)
```

Forbidden on the Contacts page for the normal list surface:

- `children`
- `renderResults`
- `ListViewTable` / `CrmEmptyState` / `CrmListFooter` / page-local `listPageHref`

---

## CONTACT COLUMN CONTRACT

File: `resources/js/pages/crm/contacts/contact-columns.tsx`

Existing backend fields only (`ListViewConfig::columns('contact')`):

| id | Default visible | Role |
|---|---|---|
| `name` | yes | Identity. Frontend label **Contact** |
| `email` | yes | Communication |
| `phone` | yes | Communication |
| `lead_status` | yes | Lifecycle |
| `company` | yes | Association |
| `owner` | yes | Owner |
| `city` / `wilaya` | no | Metadata |
| `last_activity_at` / `created_at` | no | Activity / metadata |

Visibility and order stay on `ListViewConfig` + session `CrmListShell` column state + saved views. P04 does **not** put columns on the URL and does **not** reorder saved views.

Recommended scan hierarchy (documented, not forced onto saved views): identity → company → communication → owner → lifecycle → activity → metadata.

Identity cell: name + email (or company if no email). Subtle 24px initials. No new backend fields.

---

## ROW NAVIGATION

`contactRowHref(row) → /crm/contacts/${row.id}`  
P03D `resolveRowHref` / `ListDataTable.rowHref`.  
`onRowPeek` is still unused (P09).  
Row click ignores `a, input, button, label` so checkbox / name link / menus do not double-navigate.

---

## SELECTION

Uncontrolled P03B contract. Page passes `pageIds` + `selectable: canBulk`.  
No `useState<number[]>` / `setSelectedIds`.  
Select-all = current page, accumulates across pages, indeterminate is current-page-only, `bulkActive` from `selectedIds.length > 0`.

---

## BULK ACTIONS

Unchanged verbs: assign owner, enroll sequence, delete.  
Unchanged POST `/crm/contacts/bulk` body (`action`, `ids`, `owner_id`, `sequence_id`).  
Unchanged `bulk.enabled` / `crm.bulk` gate.  
Tiny compatibility: DataWorkspace `bulk` may be `(selection) => ReactNode` so shared-table pages can read workspace selection without a local id store. Bar chrome is not redesigned.

---

## QUERY STATE

P03C only. Contacts search still maps to `q`. Preserved: search, owner, create date, lead status, advanced `filter_groups`, saved `filter_id`, view, page.  
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
| No records | No contacts yet | Create contact |
| Filtered / search miss | No contacts match these filters | none |

---

## PAGINATION

`WorkspacePaginator` → `workspacePageHref` → `listPageHref`.  
Page ≤ 1 omitted. Search / filters / sort / view / `filter_id` survive.  
Export link moved onto the shared paginator (`exportHref="/crm/contacts/export"`). Noun is `contacts`.

---

## VISUAL CHANGES (Contacts only)

- Identity cell: two-line name + secondary identifier; contact table headers 13/18
- Contact rows `min-h-12` so two-line identity can grow; other objects stay `h-12`
- Header hierarchy unchanged (28/34 title, secondary Duplicates/Import, one primary Create)
- Filter / saved-view chrome is the existing DataWorkspace spacing (pad-x 32)

No new cards, gradients, orange surfaces, or app-shell redesign.

---

## TESTS

New lock: `tests/Feature/P04ContactsWorkspaceTest.php`  
Proofs: `resources/js/pages/crm/contacts/contact-columns-contract.ts`

Updated source locks that previously froze Contacts on domain children: P03A, P03B, P03D, Wave1, Wave6, `CrmListWorkspaceTest`, P05, `CrmRecordHubVisualTest`.

CI-only fixture pin (not a Home change): `ActivityCreateTest` now uses midday `Africa/Algiers` for `due_at`. `now()->addHour()` already failed on `main` @ `aee49804` after ~22:00 UTC because Home KPIs use Algiers day bounds.

---

## LIVE VISUAL QA

**Status: NEEDS HUMAN / RESEARCH BOX**

This agent did not run a real browser against a deployed preview. Do not treat the checklist below as executed.

Exercise at **1440 / 1280 / 1024 / 768**:

1. Search (`q`) persists on page change
2. Owner / create date / lead status quick filters
3. Advanced filters + chips
4. Built-in and saved views (pin/max unchanged)
5. Column chooser (session only; not URL)
6. Single select, page select, indeterminate, cross-page leftover ids
7. Bulk assign / enroll / delete (permission gated)
8. Pagination prev/next keeps query
9. Row click → `/crm/contacts/:id` (checkbox / name link do not double-fire)
10. Duplicates / Import / Create contact
11. True empty vs filtered empty
12. Narrow widths: identity first, primary CTA visible, table can scroll horizontally

---

## REMOVED DUPLICATION

Removed from the Contacts **page** only (still used by Companies / Deals / Quotes / Tickets / Leads):

- Domain `ListViewTable` mount
- `CrmEmptyState` / `CrmListFooter` / page `listPageHref`

Not deleted: `list-view-table.tsx`, `list-chrome.tsx`, `CrmListShell` domain path. P28 owns broad legacy removal.

---

## REMAINING CONTACTS DEBT

- Email can appear in the identity cell and the Email column when both are visible
- Default column order is still ListViewConfig (company is not immediately after identity)
- Bulk bar still sits in the chrome slot (not a visual redesign)
- `CrmListShell` still maps Inertia; page does not import DataWorkspace directly
- No QuickRecordDrawer, no mobile sheet

---

## DEFERRED TO P05+

| Item | Phase |
|---|---|
| Companies shared-table + remove CrmShell | **P05** |
| Leads workspace table | **P06** |
| Deals list shared-table | **P07** |
| Quotes shared-table | **P08** |
| QuickRecordDrawer / `onRowPeek` | **P09** |
| Pipeline board on `mode="board"` | **P11** |
| Columns / sort on the URL | later (needs backend read path) |
| BulkActionBar visual redesign | later |
| App-wide a11y | **P26** |
| Legacy helper deletion | **P28** |
