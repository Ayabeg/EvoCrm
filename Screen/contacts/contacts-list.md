# Contacts list

## 1. Screen Identity

Screen ID: `SCR-CONTACT-001`
Product area: Contacts
Route: `GET /crm/contacts`
Route name: `crm.contacts.index`
Frontend file: `resources/js/pages/crm/contacts/index.tsx`
Primary component: `ContactsIndex` → `CrmListShell` (`resultMode="shared-table"`) → `DataWorkspace` → `ListViewTable`
Layout: `AppLayout` (`resources/js/app.tsx` default for non-auth pages) with breadcrumbs `Contacts` → `/crm/contacts`
Authentication: `auth` + `verified` + `EnforceProductPermissions` + `EnforceSimpleMode` (`routes/web.php`)
Permissions: Safe GET requires workspace membership (`ContactPolicy::viewAny`). Create POST requires `crm.edit`. Export GET requires `crm.export`. Import/duplicates/bulk gated by `crm.import` / `crm.merge` / `crm.bulk` (`config/permissions.php`, `EnforceProductPermissions`).
Parent navigation: Sidebar Contacts (`app-sidebar.tsx` + `SimpleMode::SIMPLE_NAV` / `FULL_NAV`). Simple mode still includes Contacts.
Entry points: sidebar; command palette navigate; dashboard activation “Create contact”; header Create menu (`OVR-SHELL-003`); command create (`/crm/contacts?create=1`).
Exit points: row identity / peek → `SCR-CONTACT-002` or `OVR-SHELL-006`; Import → `SCR-CONTACT-003`; Duplicates → `SCR-CONTACT-004`; Create drawer `OVR-CONTACT-001`; export CSV; Connect email → `/outbound/mailboxes`.
Runtime HTTP (owner, simple_mode=true): `200` component `crm/contacts/index`. `GET /crm/contacts?create=1` also `200`, same component. [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `app/Http/Controllers/Crm/ContactController.php` `index`; `resources/js/pages/crm/contacts/index.tsx`.

Shared Inertia page props (owner crawl): `contacts`, `companies`, `members`, `savedFilters`, `activeFilters`, `listView`, `recordCount`, `paginator`, `cities`, `wilayas`, `hasMailbox`, `createOpen`, `bulk` plus shared shell keys (`auth`, `workspace`, `simpleMode`, `nav`, …). [CONFIRMED-BOTH]

## 2. Purpose

Workspace index of people the team sells to. Filter, sort (via saved views / advanced), paginate, inspect via row peek, open the record, create from a drawer on this same route, export the current filter, and (when permitted) import, merge duplicates, or run bulk assign / enroll / delete.

## 3. Current UX Summary

Full-height white workspace (`data-crm="contacts-workspace"`). `PageHeader` title “Contacts” plus record-count description (`N contacts`). Primary “Create contact”. Secondary text links Duplicates / Import when capabilities allow. Saved-view pills (All contacts / My contacts + saved filters). Filter bar: search `q`, quick Owner / Create date / Lead status, Advanced funnel, Columns chooser. Shared table (identity cell + visible columns). Footer “Showing X of Y contacts”, Prev/Next, Export. Optional mailbox banner. Bulk bar appears when rows are selected and `crm.bulk` is enabled. Create is a right drawer on this page, not a separate route. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. Application shell (sidebar + header) — `SCR-SHELL-001` / `002` / `003`.
2. Page header: title, `recordCount` description, secondary actions, primary create.
3. Optional banner: “Connect email to log outbound from this list.” + link `/outbound/mailboxes` when `hasMailbox` is false. [CONFIRMED-CODE]
4. Saved views row (`SavedViews`).
5. Filter bar (`FilterBar`): extras (none on contacts), search, quick filters, column chooser, chips, Clear all.
6. Advanced filter drawer (`AdvancedFilterDrawer`) when funnel clicked.
7. Bulk action bar (`BulkActionBar`) when selection active.
8. Result surface: loading skeletons, empty (`WorkspaceEmpty`), or `ListViewTable`.
9. Paginator + Export.
10. Overlay: `OVR-CONTACT-001` CreateDrawer; row click without modifier → `OVR-SHELL-006` QuickRecord peek; identity Link still nested-navigates.

## 5. Data Displayed

### Table column contract (authoritative)

PHP `ListViewConfig::columns('contact')` (`app/Support/ListViewConfig.php`):

| id | PHP label | defaultVisible |
|---|---|---|
| `name` | Name | true |
| `email` | Email | true |
| `phone` | Phone | true |
| `lead_status` | Lead status | true |
| `company` | Company | true |
| `owner` | Owner | true |
| `city` | City | false |
| `wilaya` | Wilaya | false |
| `last_activity_at` | Last activity | false |
| `created_at` | Created | false |

JS `CONTACT_COLUMN_IDS` matches that id list (`resources/js/pages/crm/contacts/contact-columns.tsx`). `applyContactColumnContract` relabels `name` → **Contact** in headers only; it does not invent fields. [CONFIRMED-CODE]

Custom attribute columns `custom:{key}` may append via `CrmHub::customColumnDefs`; defaultVisible false. Values come from `withListAttributes`. [CONFIRMED-CODE]

Identity cell (`ContactIdentityCell`): 24px initials avatar + formatted name (`formatContactName`) + secondary line **company name only** (never email). Row href `/crm/contacts/{id}`. Email/phone cells are `mailto:` / `tel:` when present. Lead status title-cased. Dates formatted `en-GB` / `Africa/Algiers`. Empty cells `—`. [CONFIRMED-CODE]

P04 contract proofs: `resources/js/pages/crm/contacts/contact-columns-contract.ts`.

### Row payload (backend)

`Contact` with `company`, `owner`, `deals.stage`; counts `threads`, `deals`, `enrollments`; plus `attributes` map. Counts are **not** rendered as columns. [CONFIRMED-CODE]

### Other props

- `companies`: `{id,name,city,wilaya}` for create-drawer select (shell also receives them but `CrmListShell` voids unused `companies`).
- `members`: owner filter + bulk assign.
- `cities` / `wilayas`: `config('evosales.cities|wilayas')` for advanced filters.
- `listView`: `columnDefs`, `filterFields`, `columns` (normalized visibility/order), `sort` default `{field: created_at, direction: desc}`.
- `paginator`: `{page, per_page, total, last_page}` (25 per page).
- `bulk`: `{enabled, sequences: [{id,name}]}`.

## 6. Primary Actions

- Create contact — opens drawer (`onCreate` → local `setDrawer(true)`). Also opened when `createOpen` from `?create=1`. [CONFIRMED-BOTH]
- Empty-state CTA “Create contact” when unfiltered empty (`contactEmptyState(false)`). Filtered empty has no CTA. [CONFIRMED-CODE]

## 7. Secondary Actions

- Duplicates — `/crm/contacts/duplicates` if `auth.capabilities` includes `crm.merge`.
- Import — `/crm/contacts/import` if `crm.import`.
- Export — footer `<a href="/crm/contacts/export">`; server requires `crm.export` (403 otherwise). UI does **not** hide Export by capability. [CONFIRMED-CODE]
- Columns chooser — local visibility/order until a saved view persists them.
- Advanced filters; chip remove; Clear all.
- Connect email banner.
- Row peek / open record.

## 8. Search

Query param `q` (`list-query` adapter `searchParam: 'q'`). Submit via FilterBar form (Enter). Backend `CrmFilter::applySearch('contact')`: `LIKE` on `first_name`, `last_name`, `email` only — **not phone, company, or city**. [CONFIRMED-CODE]
Placeholder: `Search` / aria-label `Search list` (contacts do not get a specialized placeholder). [CONFIRMED-CODE]

## 9. Filters

`ListViewConfig::filterFields('contact')`:

| id | label | type | options |
|---|---|---|---|
| `owner` | Owner | select | members + Unassigned (`owner=unassigned`) |
| `city` | City | select | config cities (also matches contact **or** company city) |
| `wilaya` | Wilaya | select | config wilayas (contact **or** company) |
| `created` | Create date | select | `today`, `7d`, `30d`, `90d` |
| `last_activity` | Last activity | select | `7d`, `30d`, `none` |
| `status` | Lead status | select | `new`, `working`, `qualified`, `disqualified` |
| `unanswered` | Unanswered | boolean | |
| `unassigned` | Unassigned | boolean | |
| `enrolled_in_sequence` | Enrolled in sequence | select | sequence id (advanced / URL; options not populated in PHP def) |
| `email_replied` | Replied to email | boolean | outbound `replied_at` |
| `email_opened` | Opened email | boolean | outbound `opened_at` |

Association extras from `CrmHub::associationFilterFields('contact')`: `has_open_deal`, `deal_stage` (pipeline stage slugs), `has_won_deal`, `has_company`, `deal_min_amount` (DZD number). [CONFIRMED-CODE]

Built-in views: `view=all` | `view=my` (forces owner = current user). Controller also checks `'mine'` which `CrmFilter::resolve` never emits (`all`/`my` only) — dead branch. [CONFIRMED-CODE]

Quick bar shows first four of `owner`, `created`, `status`, `priority` that exist on `filterFields`. Contacts have no `priority` field, so quick = Owner, Create date, Lead status. City/wilaya/unanswered/sequence live in Advanced. [CONFIRMED-CODE]

**Business mismatch:** `status` filter applies to related **leads.status**, not `contacts.lead_status`. The table column is `lead_status`. Create-drawer values are `new` / `open` / `unqualified`, which do not match filter options `working` / `qualified` / `disqualified`. [CONFIRMED-CODE]

Chips via `listFilterChips`; removing a chip navigates with that key nulled (`preserveState: true`).

Saved filters: `POST/PATCH/DELETE /crm/filters`; visibility private/team/workspace; workspace default requires settings-capable role.

## 10. Sorting

Default: `created_at desc`. `CrmFilter::applyContactSort` supports `name` (first+last), `company` (join companies.name), `email`, `city`, `wilaya`, `created_at`, `last_activity_at`. Table headers are **not** click-to-sort; sort is carried on saved views / advanced hidden `sort`+`direction` fields. [CONFIRMED-CODE]
`lead_status`, `owner`, `phone` are not sortable.

## 11. Selection

Uncontrolled workspace selection. `selectable: canBulk` (`bulk.enabled` ← `crm.bulk`). Page checkbox “Select page”; row checkboxes `aria-label="Select {id}"`. Row click on checkbox does not peek. Companies list explicitly disables selection; contacts enable it when permitted. [CONFIRMED-CODE]

## 12. Bulk Actions

When `canBulk` and ≥1 selected: `BulkActionBar` entity `contact` actions `assign_owner`, `enroll_sequence`, `delete`. POST `/crm/contacts/bulk` (`crm.contacts.bulk`) with `action`, `ids[]`, optional `owner_id` / `sequence_id`. Sequences from workspace. Success flash `Bulk {action} finished: N succeeded, M failed.` (session status; no dedicated toast consumer found in Inertia share). [CONFIRMED-CODE] [UNVERIFIED] whether flash is visible in UI.
No company bulk. No bulk export action on this bar (list export is filter-wide CSV).

## 13. Pagination / Loading Strategy

Server pagination 25/page (`CrmFilter::paginate`). Query `page`. Footer Prev/Next + `page / lastPage`. Inertia `useInertiaLoading` → three skeleton rows (`data-p27="loading"`). Row peek hydrates QuickRecord without leaving the list. Import/duplicates are full visits.

## 14. Forms

None on the list surface except search GET, saved-view save form, advanced filter GET, and the create drawer form (`OVR-CONTACT-001`). Export is a GET download, not a form.

## 15. Overlays

- `OVR-CONTACT-001` create drawer (this page).
- `OVR-SHELL-006` row peek (QuickRecord). Identity `<Link>` / mailto / tel / checkbox stay nested.
- `AdvancedFilterDrawer`.
- Column chooser drawer.
- Global Create menu / command palette can land `?create=1`.

## 16. States

- Loading (Inertia visit).
- Rows present.
- True empty: title “No contacts yet”, body about name/phone/company, CTA Create contact.
- Filtered empty: “No contacts match these filters”, no CTA.
- Mailbox missing banner.
- Bulk active (`data-bulk-active`).
- Drawer open (`createOpen` or local state).
- Permission-hidden Import/Duplicates/selection.

## 17. Empty State

See `contactEmptyState` in `contact-columns.tsx`. Filtered vs true empty is `hasActiveListFilters` (chips, `view !== 'all'`, or non-empty `q`). [CONFIRMED-CODE]

## 18. Error Handling

Validation errors on create stay in Inertia `errors` on this page. Duplicate email/phone: `ContactIdentity::createUnique` validation. Export/import/merge/bulk 403 via middleware. Cross-workspace records 404 on show. [CONFIRMED-CODE]
List query itself has no inline error UI. [CONFIRMED-CODE]

## 19. Feedback

Inertia progress bar (`#E8530E`). Toaster present globally. Bulk uses `back()->with('status', …)` — [UNKNOWN] if rendered. Create success redirects to index (or `?create=1` for add another) and drawer `onSuccess` closes + `resetOnSuccess`. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stays on `/crm/contacts` for filter/view/page/create-query. Closing the drawer does **not** strip `?create=1`. Row peek keeps list mounted. Identity link visits `/crm/contacts/:id`. Ctrl/meta/shift/alt/middle-click: new tab vs peek per `resolveRowActivation`. [CONFIRMED-CODE]

## 21. Entity Relationships

Contact → Company (optional), Owner user, Deals, Threads, Enrollments, Leads (filter only), custom attributes, sequences (bulk). Create drawer can attach `company_id`. List does not show deal/thread counts. [CONFIRMED-CODE]

## 22. Business Rules

- Workspace scoped `forWorkspace`.
- Unique email and normalized Algerian phone on create.
- `view=my` = owner is current user.
- City/wilaya filters match contact **or** associated company.
- `status` filter = related lead status, not contact `lead_status`.
- Export CSV columns: id, first_name, last_name, email, phone, company, owner, city, wilaya, created_at, last_activity_at (ordered by first_name, ignores UI sort). [CONFIRMED-CODE]
- Simple mode does not block this route.

## 23. Backend Dependencies

`ContactController@index`, `CrmFilter`, `CrmHub`, `ListViewConfig`, `Mailbox` existence, `Sequence` list, `ContactPolicy`, `BulkActionController@contacts`, `BulkActionRunner`, `SavedFilterController`, `ContactIdentity` (store), export stream.

## 24. Frontend Dependencies

`CrmListShell`, `DataWorkspace`, `ListViewTable`, `contact-columns(+contract)`, `list-query` adapters, `list-view-config`, `BulkActionBar`, `CreateDrawer`, `hasActiveListFilters`, `useInertiaLoading`, i18n `t()`.

## 25. Responsive Behavior

`ListViewTable`: `@container/list`; below 480px card list (identity + up to 3 secondary fields); ≥480px table `min-w-[640px]` with local overflow-x. Filter bar wraps. Header Create label hidden on very small widths (shell). Pad-x 16 / md 32. [CONFIRMED-CODE]
Viewport crawl: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: page checkbox `aria-label="Select page"` with mixed `aria-checked`; search `aria-label`; Advanced `aria-label`; chip remove `aria-label`; bulk count `aria-live="polite"`; bulk action selects labeled; row peek `tabIndex=0` + `aria-label="Inspect {name}"`; identity initials `aria-hidden`. [CONFIRMED-CODE]
LIKELY ISSUE: row select `aria-label="Select {numeric id}"` is not the contact name; duplicates/import links have no extra a11y name beyond visible text; table headers not associated as sortable buttons.
REQUIRES MANUAL TEST: keyboard peek vs link, screen reader table scan, focus return after drawer.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-CONTACT-LIST-01 | HIGH | Lead status column vs `status` filter vs create options disagree (contact field vs lead relation; different enums) | Filters do not match what the table/create UI show | `CrmFilter::applyToContacts`; `ListViewConfig`; create `<select>` |
| UX-CONTACT-LIST-02 | MEDIUM | Search ignores phone and company | Algeria-first phone workflows cannot find by number | `applySearch` |
| UX-CONTACT-LIST-03 | MEDIUM | Export link shown without `crm.export`; 403 on click | Confusing failure | `WorkspacePaginator` + middleware |
| UX-CONTACT-LIST-04 | MEDIUM | Column chooser / sort not persisted unless saved view | Users lose layout | `onColumnsChange` local state |
| UX-CONTACT-LIST-05 | LOW | `?create=1` remains after closing drawer | Refresh re-opens drawer | `createOpen` boolean; no URL cleanup |
| UX-CONTACT-LIST-06 | LOW | Create button not hidden without `crm.edit` | 403 on submit for members | `canCreate` default true vs policy |
| UX-CONTACT-LIST-07 | OBSERVATION | Deal/thread/enrollment counts loaded unused | Extra payload | `withCount` vs columns |
| UX-CONTACT-LIST-08 | OBSERVATION | Mailbox banner even if user cannot manage outbound | Extra nav hop | `hasMailbox` banner |

## 28. Consistency Comparison

Same `CrmListShell` + `DataWorkspace` shared-table path as companies, deals, quotes, leads. Contacts uniquely: bulk + export + import/duplicates header + mailbox banner + identity secondary = company. Companies: no bulk, no export, no import, location secondary, city/wilaya quick filters. Deals: stage pills, list/board mode, attention quick filter.

## 29. Functional Preservation Contract

Redesign MUST keep: authenticated list at `/crm/contacts`; `?create=1` opens create on this page; shared-table columns per ListViewConfig + JS relabel + identity secondary company-only; default visible set; custom columns; search `q`; filters including association extras; All/My + saved views; 25-row pagination; export CSV of current filter; capability-gated Import/Duplicates; bulk assign/enroll/delete; row peek + record href; empty vs filtered empty copy/CTA; mailbox banner; workspace isolation; unique email/phone on create.

## 30. Design Input Contract

Purpose: find and act on people.
Primary goal: scan identity → company → email/phone → owner → status, then open or create.
Primary actions: Create contact; open/peek record.
Secondary: filter/views, import, duplicates, export, bulk, connect email.
Required information: name, email, phone, lead status, company, owner; optional city, wilaya, last activity, created, custom attrs.
Required components: header, views, search, filters, column control, table/cards, pagination, bulk bar, create drawer, empty/loading.
Required states: loading, empty, filtered empty, populated, bulk, no-mailbox, permission-limited, drawer open.
Information priority: identity, communication, company, owner, status, activity.
Business-critical: uniqueness, workspace scope, export columns, merge/import entry, bulk.
May NOT be removed: create-on-list via `?create=1`, column ids, filter keys, export, capability gates, peek vs nested link behavior.

## 31. Open Questions / Unknowns

- [UNKNOWN] whether session `status` flash from bulk is shown.
- [UNVERIFIED] live column-chooser + saved-view roundtrip with custom attributes.
- [UNKNOWN] enrolled_in_sequence option list in Advanced UI (type select, no options in PHP).
- [UNVERIFIED] viewport at 390/768/1024 for this page specifically.
- [UNKNOWN] default locale French vs English list copy (`t()` keys often English source).
