# Leads list

## 1. Screen Identity

Screen ID: SCR-LEAD-001
Product area: CRM / Leads
Route: `GET /crm/leads`
Route name: `crm.leads.index`
Frontend file: `resources/js/pages/crm/leads/index.tsx`
Primary component: `LeadsIndex` → `CrmListShell` (`resultMode="shared-table"`)
Layout: App shell + breadcrumbs `[{ title: 'Leads', href: '/crm/leads' }]`. Page does **not** wrap `CrmShell` / `RoomShell` tabs. `[CONFIRMED-CODE]`
Authentication: `auth`, `verified`, `EnforceProductPermissions`, `EnforceSimpleMode`. `[CONFIRMED-CODE]`
Permissions: GET is not gated by a named CRM permission in `EnforceProductPermissions` (safe methods skip). Create uses `LeadPolicy::create` → `crm.edit`. `[CONFIRMED-CODE]`
Parent navigation: Full-mode sidebar **More → Leads** (`/crm/leads`). Simple-mode rail (`SimpleMode::SIMPLE_NAV`) omits Leads. Command palette always includes `nav-leads` → `/crm/leads`. `[CONFIRMED-CODE]`
Entry points: More menu; command palette; `CrmObjectSecondaryLink` “Leads list” from captures; row back-links from lead detail; direct URL. `[CONFIRMED-CODE]`
Exit points: Row / identity link → `/crm/leads/{id}` (`leadRowHref`); header “Capture inbox” → `/crm/leads/captures`; Create drawer POST `/crm/leads`. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/leads/index`. `[CONFIRMED-UI]`
Evidence: `Screen/_evidence/runtime-index.json` path `/crm/leads`. Prop keys: `leads`, `contacts`, `listView`, `recordCount`, `paginator` — **no `savedFilters` / `activeFilters`** (contacts list does pass those). `[CONFIRMED-BOTH]`

## 2. Purpose

Workspace table of inbound Lead records (title + contact + status + score). Create a lead from an existing contact. Jump to capture inbox. This is **not** a pipeline kanban. `[CONFIRMED-CODE]`

## 3. Current UX Summary

Shared CRM list workspace (`data-crm="leads-workspace"`): object header “Leads”, primary **Create lead**, secondary **Capture inbox**, shared table of up to 100 latest leads. Selection is present but not selectable. Empty copy distinguishes true empty vs filtered empty even though the controller never applies filters. `[CONFIRMED-CODE]` Runtime confirmed 200 with those Inertia keys; visual chrome of `CrmListShell` was not separately screenshot-audited. `[UNVERIFIED]`

## 4. Screen Anatomy

- App sidebar + header (global). `[CONFIRMED-CODE]`
- `CrmListShell` header: title “Leads”, record count, primary Create, secondary Capture inbox. `[CONFIRMED-CODE]`
- Shared table columns from `ListViewConfig` lead defs, relabeled by `applyLeadColumnContract` (title → “Lead”). `[CONFIRMED-CODE]`
- Identity cell: initials avatar + title + contact name secondary. `[CONFIRMED-CODE]`
- Score cell: `LeadScorePill` via `leadScorePayload`. `[CONFIRMED-CODE]`
- Footer/paginator chrome from shared table (controller always page 1 of 1, per_page 100). `[CONFIRMED-CODE]`
- Overlay: `CreateDrawer` “Create lead”. `[CONFIRMED-CODE]`
- NOT PRESENT: list/board toggle, stage pills, export, saved-view tabs from server, bulk bar. `[CONFIRMED-CODE]`

## 5. Data Displayed

Inertia `leads` (Lead models with `contact`, `latestScore`, latest 100). Row contract (`LeadListRow`): `id`, `title`, `status`, `score`, `contact.{first_name,last_name}`, `latest_score.{score,reason}`. `[CONFIRMED-CODE]`

Visible columns (default): Lead (title), Contact, Status, Score. `[CONFIRMED-CODE]`

`recordCount` / `paginator.total` = count of the loaded collection (capped at 100), not a workspace-wide count. `[CONFIRMED-CODE]`

`contacts` options for the create form: `id`, `first_name`, `last_name`. `[CONFIRMED-CODE]`

`listView` from `CrmHub::listViewMeta('lead')` — lead filterFields are empty (`ListViewConfig` default). `[CONFIRMED-CODE]`

Runtime props omit `savedFilters` (frontend defaults `[]`) and `activeFilters` (defaults `{}`). `[CONFIRMED-BOTH]`

## 6. Primary Actions

- **Create lead** — opens drawer; POST `/crm/leads` (`crm.leads.store`). Fields: title*, contact_id*, source. Server sets `status=new`, copies `company_id` from contact, scores via `LeadScorer`. Redirect `back()`. `[CONFIRMED-CODE]`
- Row open — `/crm/leads/{id}` (SCR-LEAD-002). Shared table also peeks via `useQuickRecord` (`type: lead`). `[CONFIRMED-CODE]` `[UNVERIFIED]` peek not in runtime crawl.

## 7. Secondary Actions

- **Capture inbox** header link → `/crm/leads/captures` (SCR-LEAD-003). `[CONFIRMED-CODE]`
- Column chooser if `DataWorkspace` exposes it for leads. `[UNVERIFIED]`
- Empty-state **Create lead** when unfiltered empty. `[CONFIRMED-CODE]`

## 8. Search

NOT PRESENT as a working list query. `LEAD_ADAPTER.supportsQuery = false`, `filterKeys = []`. Typing in shared FilterBar search is a no-op for leads. `[CONFIRMED-CODE]` Controller `index` ignores `q`. `[CONFIRMED-CODE]` Command palette can still find leads by title (`CommandSearch::leads`). `[CONFIRMED-CODE]`

## 9. Filters

NOT PRESENT on the server. No `savedFilters` prop (unlike contacts). Frontend still passes `savedFilters={[]}` and `activeFilters={}`. Filtered empty copy exists for `hasActiveListFilters` but cannot fire from this controller. `[CONFIRMED-BOTH]`

## 10. Sorting

Server: `latest()` (created_at/id desc implied) then `limit(100)`. No user sort param. `ListViewConfig::defaultSort('lead')` is `created_at desc` but is not applied as a query builder sort beyond `latest()`. `[CONFIRMED-CODE]`

## 11. Selection

`selection.mode = 'uncontrolled'`, `selectable: false`, `pageIds` mapped. Comment: “Page does not participate now. Not a permanent bulk ban.” `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

Hard cap 100; paginator always `{ page: 1, per_page: 100, total: $total, last_page: 1 }`. `[CONFIRMED-CODE]` `useInertiaLoading` drives table loading. `[CONFIRMED-CODE]`

## 14. Forms

Create drawer POST `/crm/leads`:
- `title` required string max 180
- `contact_id` required integer, must exist in workspace
- `source` optional max 80, default `manual`
Authorize `create` Lead. `[CONFIRMED-CODE]`

No create-from-query (`?create=1`) unlike tickets/contacts. Drawer is local `useState`. `[CONFIRMED-CODE]`

## 15. Overlays

- `CreateDrawer` “Create lead” `[CONFIRMED-CODE]`
- Quick-record peek for `lead` rows `[CONFIRMED-CODE]` `[UNVERIFIED]` runtime
- Global command palette / create menu do **not** include “Create lead” (only contact, company, deal, quote, activity). `[CONFIRMED-CODE]`

## 16. States

- Loading: inertia loading flag on shared table. `[CONFIRMED-CODE]`
- Populated table. `[CONFIRMED-CODE]` Runtime 200 implies data or empty table; row contents `[UNVERIFIED]`.
- Empty / filtered empty (see §17). `[CONFIRMED-CODE]`
- Processing on create submit (`disabled={processing}`). `[CONFIRMED-CODE]`

## 17. Empty State

`leadEmptyState(false)`: title “No leads yet”, body “Create a lead from an existing contact…”, `actionLabel` “Create lead”. `[CONFIRMED-CODE]`
`leadEmptyState(true)`: “No leads match these filters” / “Clear filters to see inbound records again.” — no CTA. Unreachable unless filters appear without this controller. `[CONFIRMED-CODE]` `[UNREACHABLE]`

## 18. Error Handling

Validation errors via Inertia `errors` on create. Contact `findOrFail` 404 if contact not in workspace. Policy 403 without `crm.edit`. `[CONFIRMED-CODE]` `[UNVERIFIED]` UI of those errors.

## 19. Feedback

Create uses `resetOnSuccess` and closes drawer. No dedicated toast on create. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

Stays on `/crm/leads` after create (`back()`). Row navigates to detail. Capture inbox is a sibling. Simple mode: URL still 200; rail does not list Leads. `[CONFIRMED-BOTH]`

## 21. Entity Relationships

Lead → required Contact, optional Company (copied at create), optional Deal (after qualify), LeadScore, LeadCapture. List only hydrates contact + latestScore. `[CONFIRMED-CODE]`

## 22. Business Rules

- Lead is an inbound object, not a deal stage. `[CONFIRMED-CODE]`
- Create always `status=new`, source default `manual`. `[CONFIRMED-CODE]`
- Must pick an existing contact (cannot type a new person here). `[CONFIRMED-CODE]`
- Max 100 rows; extra leads exist in DB but not listed. `[CONFIRMED-CODE]`
- Simple mode does **not** block this route (`SimpleMode::blocks` has no `/crm/leads` prefix). `[CONFIRMED-CODE]`
- Selection disabled. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`LeadController::index`, `Lead`, `Contact`, `CrmHub::listViewMeta('lead')`, `LeadScorer` on store, `LeadPolicy`. Routes in `routes/web.php`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`CrmListShell`, `CreateDrawer`, `lead-columns` (+ contract), `ListViewConfig` lead columns, `useInertiaLoading`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Shared table + drawer; identity cell truncates. `[CONFIRMED-CODE]` Viewport evidence: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: create labels mark Title/Contact as required with brand asterisk; Cancel/Create buttons. `[CONFIRMED-CODE]`
LIKELY ISSUE: whole-row click vs identity `Link` may duplicate tab stops (shared-table pattern). `[UNVERIFIED]`
REQUIRES MANUAL TEST: keyboard create, screen reader column headers, empty-state CTA.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-LEAD-001 | HIGH | List capped at 100 with fake single-page paginator | Operators cannot see older leads | `LeadController::index` `[CONFIRMED-CODE]` |
| UX-LEAD-002 | MEDIUM | No search/filter/saved views while chrome looks like other CRM lists | Users expect contact-like filtering | runtime props vs contacts `[CONFIRMED-BOTH]` |
| UX-LEAD-003 | MEDIUM | Create requires picking an existing contact | Cannot capture a new person without leaving the screen | store validation `[CONFIRMED-CODE]` |
| UX-LEAD-004 | LOW | Create lead missing from command create items | Palette users cannot spawn this drawer | `command-os.ts` `[CONFIRMED-CODE]` |
| UX-LEAD-005 | OBSERVATION | Simple mode hides Leads in nav but URL still works | Dual IA: hidden vs reachable | `SimpleMode` + runtime 200 `[CONFIRMED-BOTH]` |

## 28. Consistency Comparison

Contacts/companies/deals lists pass `savedFilters`, `activeFilters`, real pagination, search (`supportsQuery`). Leads share `CrmListShell` but adapter is a no-op and controller is a dump of latest 100. Tickets (full mode) have filters + pagination. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep route `/crm/leads` as the Lead **list** (not a deal board).
- Keep columns: Lead identity, contact, status, score (including score 0).
- Keep Create lead (title + contact + source) and Capture inbox link.
- Keep row href `/crm/leads/:id`.
- Keep empty vs filtered empty copy if filters are ever added.
- Keep workspace scoping and `crm.edit` on create.
- Do not require saved filters that the backend does not provide.

## 30. Design Input Contract

Purpose: scan and open inbound leads; create from a known contact.
Primary goal: find a lead and open it, or create one.
Primary actions: Create lead; open row.
Secondary: Capture inbox.
Required information: title, contact, status, score, count (honest cap).
Required components: list header, table, create drawer, empty state.
Required states: loading, empty, populated, create processing.
Information priority: identity → contact → status → score.
Business-critical: contact linkage, score, capture inbox entry.
Must not remove: create-from-contact, capture inbox, score column, `/crm/leads/{id}` navigation.

## 31. Open Questions / Unknowns

- Exact seeded row count on local Evotechly DB. `[UNKNOWN]`
- Whether operators know `/crm/leads` exists in simple mode. `[UNKNOWN]`
- Quick-record peek contents for leads. `[UNVERIFIED]`
- Whether `limit(100)` is intentional product or leftover. `[UNKNOWN]`
