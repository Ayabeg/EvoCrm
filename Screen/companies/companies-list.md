# Companies list

## 1. Screen Identity

Screen ID: `SCR-COMPANY-001`
Product area: Companies
Route: `GET /crm/companies`
Route name: `crm.companies.index`
Frontend file: `resources/js/pages/crm/companies/index.tsx`
Primary component: `CompaniesIndex` → `CrmListShell` `resultMode="shared-table"`
Layout: `AppLayout`; breadcrumbs Companies
Authentication: auth + verified + product middleware
Permissions: GET viewAny workspace. POST create `crm.edit`. No export/import/bulk routes for companies. [CONFIRMED-CODE]
Parent navigation: Full-mode sidebar Companies (`FULL_NAV`). **Simple mode `SIMPLE_NAV` omits Companies** — not in seed owner rail — but the route is **not** blocked by `SimpleMode::blocks()` (only tickets/ads/warmup/report-builder/ask). Runtime still 200. [CONFIRMED-BOTH]
Entry points: full-mode sidebar; header Create → Company; command palette create/navigate; contact hub add/view company; URL.
Exit points: row → `SCR-COMPANY-002` or peek `OVR-SHELL-006`; create drawer `OVR-COMPANY-001`.
Runtime HTTP (owner, simple_mode=true): `200` component `crm/companies/index`. Props: `companies`, `members`, `savedFilters`, `activeFilters`, `listView`, `recordCount`, `paginator`, `cities`, `wilayas`, `createOpen`. **No `bulk`, `hasMailbox`, `exportHref`.** [CONFIRMED-BOTH]
Evidence: runtime-index; `CompanyController@index`; `index.tsx`.

## 2. Purpose

Account list: companies in the workspace, filterable by owner/location/activity, openable to a hub, creatable from a drawer on this same page (`?create=1`).

## 3. Current UX Summary

Same DataWorkspace chrome as contacts: title Companies, count “N companies”, primary Create company, All companies / My companies views, search “Search companies…”, quick Owner / Create date / City / Wilaya, Advanced, Columns, shared table with Company identity cell, paginator without Export. Selection explicitly `selectable: false` (comment: not a permanent bulk ban). [CONFIRMED-CODE]

## 4. Screen Anatomy

Workspace `data-crm="companies-workspace"`. Header, SavedViews, FilterBar (company quick ids), ListViewTable, WorkspacePaginator (no export). CreateDrawer. No mailbox banner, no Import/Duplicates headerActions.

## 5. Data Displayed

### Table column contract

PHP `ListViewConfig::columns('company')`:

| id | PHP label | defaultVisible |
|---|---|---|
| `name` | Name | true |
| `city` | City | true |
| `wilaya` | Wilaya | true |
| `owner` | Owner | true |
| `created_at` | Created | false |

JS `COMPANY_COLUMN_IDS` matches. `applyCompanyColumnContract` relabels `name` → **Company**. Identity secondary: compact location `city · wilaya`, or one of them, or null; same-name city/wilaya shown once; never owner. Initials = first two name tokens. Href `/crm/companies/{id}`. Dates Algiers. Custom `custom:{key}` columns allowed. [CONFIRMED-CODE]

P05 proofs: `company-columns-contract.ts`.

Row payload: Company with `owner`, counts `contacts`/`deals` (unused in cells), `attributes`. Table widths: name 36%, city 16%, wilaya 16%, owner 18%, created 14%; `table-fixed min-w-[52rem]`. [CONFIRMED-CODE]

## 6. Primary Actions

Create company → drawer. Empty CTA “Create company” when unfiltered empty.

## 7. Secondary Actions

Views, search, filters, columns, Advanced, pagination. **No export, import, duplicates, bulk.** Row peek/open.

## 8. Search

`q` LIKE on `companies.name` only (`applySearch('company')`). Placeholder “Search companies…”. [CONFIRMED-CODE]

## 9. Filters

`ListViewConfig::filterFields('company')`:

| id | label | type | options |
|---|---|---|---|
| `owner` | Owner | select | |
| `city` | City | select | |
| `wilaya` | Wilaya | select | |
| `created` | Create date | select | today, 7d, 30d, 90d |
| `last_activity` | Last activity | select | 7d, 30d, none |
| `unassigned` | Unassigned | boolean | |

Association extras: `has_open_deal`, `deal_stage`. [CONFIRMED-CODE]

`last_activity` uses contact **or** deal `last_activity_at` on related records, not a company column. `applyCompanyDealStatus` exists for `status` open/won/lost but **status is not in company filterFields** (only reachable if stuffed in URL/filter_groups). Filter groups overlay still applies URL city/wilaya/`q` for companies. [CONFIRMED-CODE]

Quick filters: `COMPANY_QUICK_FIELD_IDS` owner, created, city, wilaya.

Built-in All / My companies (`view=my` sets owner).

## 10. Sorting

Default `created_at desc`. `applyCompanySort`: `name`, `city`, `wilaya`, `created_at` only (not owner). Headers not click-to-sort. [CONFIRMED-CODE]

## 11. Selection

`selectable: false`. Checkboxes hidden. Comment documents future bulk. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. No `/crm/companies/bulk`.

## 13. Pagination / Loading Strategy

25 per page, same paginator. Loading skeletons. `scrollbar-gutter: stable` on company table scroller.

## 14. Forms

Create drawer only (`OVR-COMPANY-001`). Search GET. Saved views / advanced.

## 15. Overlays

Create drawer; Advanced; Columns; QuickRecord peek.

## 16. States

Loading; rows; true empty “No companies yet” + CTA; filtered empty “No companies match these filters” no CTA; drawer; simple-mode reachable-without-nav.

## 17. Empty State

`companyEmptyState` in `company-columns.tsx`. Body: “Create a company to keep accounts next to their contacts and deals. One company counts as CRM data.” [CONFIRMED-CODE]

## 18. Error Handling

Create 403/validation. List itself no error banner. [CONFIRMED-CODE]

## 19. Feedback

Inertia progress. Create success closes drawer and resets (same add-another backend flag unused in UI).

## 20. Navigation Behavior

Filters stay on `/crm/companies`. `?create=1` opens drawer; dismiss does not strip query. Simple mode users reach via Create menu/command/URL, not rail. [CONFIRMED-CODE]

## 21. Entity Relationships

Company → Owner, Contacts (count unused), Deals (count unused), custom attributes. City/wilaya used for contact geo filters too.

## 22. Business Rules

Workspace scoped. Country hardcoded `DZ` on create (not a list concern). Simple mode does not 403 this page. No CSV export.

## 23. Backend Dependencies

`CompanyController@index`, `CrmFilter::apply('company')`, `CrmHub::listViewMeta('company')`, `ListViewConfig`.

## 24. Frontend Dependencies

`CrmListShell`, `DataWorkspace`, `company-columns(+contract)`, `CreateDrawer`, `list-query` company adapter (`supportsQuery: true`).

## 25. Responsive Behavior

Card rows `<480px` container; table-fixed ≥480px `min-w-[52rem]` local x-scroll. Search `max-w-md basis-[16rem]` for company. [CONFIRMED-CODE]
Viewport: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: search aria-label “Search companies”; identity link; peek inspect labels. [CONFIRMED-CODE]
LIKELY ISSUE: duplicate location (identity secondary + City + Wilaya columns all default visible).
REQUIRES MANUAL TEST: simple-mode discovery without sidebar item.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-COMPANY-LIST-01 | HIGH | Simple mode hides nav item but Create menu still offers Company | Discoverability split | `SIMPLE_NAV` vs header Create |
| UX-COMPANY-LIST-02 | MEDIUM | No export while contacts export | Cannot dump accounts | no exportHref |
| UX-COMPANY-LIST-03 | MEDIUM | Contact/deal counts loaded unused | Missed density | `withCount` vs columns |
| UX-COMPANY-LIST-04 | LOW | Location shown three times (secondary + city + wilaya) | Scan noise | defaultVisible all true |
| UX-COMPANY-LIST-05 | LOW | Create ungated without crm.edit | 403 | canCreate default |
| UX-COMPANY-LIST-06 | OBSERVATION | Selection hard-off | No bulk assign owner | `selectable: false` |

## 28. Consistency Comparison

Shared-table twin of contacts with fewer tools (no bulk/export/import/duplicates/mailbox). Quick filters emphasize Algeria city/wilaya. Identity secondary is location not parent account.

## 29. Functional Preservation Contract

Must keep: `/crm/companies`, `?create=1` drawer, column contract + Company relabel + location secondary, search name, filters including last_activity-via-children and association extras, All/My + saved views, 25 pagination, no invented bulk, peek + show href, empty copy, workspace scope, simple-mode still HTTP 200.

## 30. Design Input Contract

Purpose: find accounts.
Primary goal: scan company + location + owner.
Primary actions: create, open.
Required information: name, city, wilaya, owner, created optional.
May NOT remove: column ids, `q` on name, create overlay contract.

## 31. Open Questions / Unknowns

- [UNKNOWN] product intent for companies in simple mode (hidden nav vs allowed URL).
- [UNKNOWN] whether bulk/export are planned (code comment on selection).
- [UNVERIFIED] `?create=1` crawl for companies (not in runtime-index; controller supports it).
