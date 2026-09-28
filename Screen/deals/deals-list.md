# Deals list

## 1. Screen Identity

Screen ID: SCR-DEAL-001
Product area: CRM / Deals
Route: `/crm/deals`
Route name: `crm.deals.index` [CONFIRMED-CODE] `routes/web.php`
Frontend file: `resources/js/pages/crm/deals/index.tsx`
Primary component: `DealsIndex`
Layout: Authenticated app shell + `CrmListShell` (`resultMode="shared-table"`). Breadcrumb: Deals → `/crm/deals`. [CONFIRMED-CODE]
Authentication: `auth` + `verified` + `EnforceProductPermissions` + `EnforceSimpleMode`. [CONFIRMED-CODE]
Permissions: Workspace membership for view. Create/update/move require `crm.edit`. Import link requires `crm.import`. Bulk bar requires `crm.bulk` (`bulk.enabled`). Members with `deals.team_only` are forced to own records. [CONFIRMED-CODE] `DealPolicy`, `DealController::index`
Parent navigation: Sidebar CRM group, **Deals** (`/crm/deals`, excludes `/crm/deals/board`). Companion **Pipeline** item is the board. [CONFIRMED-CODE] `app-sidebar.tsx`
Entry points: Sidebar Deals; dashboard won/attention links (`/crm/deals?status=won`, `/crm/deals?attention=needs_attention`); command palette / global create `Create deal` → `/crm/deals?create=1`; contact/ticket/lead “create deal” links with `contact_id`; layout toggle from board. [CONFIRMED-CODE]
Exit points: Row / peek → `/crm/deals/{id}` (SCR-DEAL-003); Import → `/crm/deals/import` (SCR-DEAL-004); Board toggle → `/crm/deals/board` (SCR-DEAL-002); Export CSV; Create drawer POST then stay on list (OVR-DEAL-001).
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/deals/index`. `/crm/deals?create=1` also **200**, `createOpen` true in code (dump of unparameterized list has `createOpen: false`). [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `%TEMP%/evocrm-inertia/crm_deals.json`; `%TEMP%/evocrm-inertia/crm_deals_create_1.json`. Seed owner `owner@evosales.local`. Workspace Evotechly `simple_mode: true` does **not** block this screen.

Related (do not document here): `/leads` **302** → `/crm/deals/board` is SCR-LEAD-004 (`Screen/leads/leads-legacy-redirect.md`). `/crm/leads` remains a live Lead object list.

## 2. Purpose

Workspace table of opportunities in one pipeline. Users scan identity, stage, DZD amount, close date, owner, associations, and attention; filter/save views; bulk-assign/move/delete; open the create drawer.

## 3. Current UX Summary

HubSpot-like object index: toolbar (search, views, filters, columns, list/board toggle, pipeline switcher, export, create), stage pills, Needs Attention banner, 25-row table. Amounts use `formatDzd`. Default sort close date ascending. Forecast totals are computed server-side but **not rendered** on this page. [CONFIRMED-CODE] `index.tsx` does not consume `forecast` / `openPipelineCents`.

## 4. Screen Anatomy

1. App shell (sidebar, header, command/tasks). Locale dump: `fr`; many chrome strings remain English in source.
2. `CrmListShell` / `DataWorkspace`:
   - Title **Deals** + record count (`15 deals` on seed).
   - Primary **Create deal**.
   - Secondary **Import** if `crm.import`.
   - List | Board toggle.
   - Pipeline switcher (hidden when only one pipeline; seed has Sales + another).
   - Search, saved views, quick filters, advanced filters, column chooser, export.
   - Stage pills (New…Lost counts).
3. Banner: `DealAttentionQueue` (seed: 7 items; cap 8).
4. Shared table of deal rows; row checkbox when bulk enabled.
5. Bulk action bar when selection non-empty.
6. Pagination footer.
7. Right `CreateDrawer` when open (`data-aurora="drawer"`).

`data-crm="deals-workspace"`. [CONFIRMED-CODE]

## 5. Data Displayed

Inertia page props (page-specific): `deals`, `stages`, `stageCounts`, `pipeline`, `pipelines`, `contacts`, `members`, `savedFilters`, `activeFilters`, `listView`, `recordCount`, `paginator`, `stagePills`, `cities`, `wilayas`, `openPipelineCents`, `forecast`, `createOpen`, `prefillContactId`, `attentionQueue`, `bulk`. [CONFIRMED-BOTH]

Default visible columns (`ListViewConfig` + title relabel **Deal**): Deal (initials + title; secondary company else contact), Stage, Amount, Close date, Owner, Company, Contact, Attention. Hidden by default: Health, Next step, Last activity, Created. [CONFIRMED-CODE]

Seed sample row: id 1 “Clinic website intake”, 22_000_000 cents, stage Qualified, company Clinique El Djazair, contact Amine Benali, owner null. [CONFIRMED-BOTH]

Each row also carries `health` `{score, band, label}`, `next_step`, `attention.primary`. [CONFIRMED-CODE]

Stage pills seed: 6 stages; New count 0 in dump item. `recordCount` 15. `paginator` page 1 / 25 / total 15 / last_page 1.

`forecast` (unused in UI): count 15, amount_cents 299_500_000, weighted_cents 172_625_000, open_cents 228_500_000. `openPipelineCents` 228_500_000. [CONFIRMED-BOTH]

## 6. Primary Actions

- **Create deal** — opens OVR-DEAL-001. Also `?create=1`.
- Row title / peek — `/crm/deals/{id}` or quick-record drawer (OVR-SHELL-006).
- Empty-state **Create deal** when unfiltered empty.

## 7. Secondary Actions

- **Import** → SCR-DEAL-004 (`canImport`).
- **Export** `GET /crm/deals/export?pipeline={id}` CSV (id, title, amount_cents, currency, stage, contact, company, owner, source, close_date, created_at). Honors current filters. [CONFIRMED-CODE]
- List/Board toggle preserves filters + pipeline.
- Pipeline switcher `?pipeline=`.
- Saved views, column visibility, stage pills, attention “View all” (`attention=needs_attention`).
- Command palette **Create deal**.

## 8. Search

Present. Filter bar placeholder **Search deals…**, query key `q`. Backend: `title LIKE %term%` only (`CrmFilter::applySearch` entity deal). [CONFIRMED-CODE]

## 9. Filters

`CrmFilter::resolve` + `applyToDeals`:

- `view`: `all` | `my` (my forces current user as owner).
- `stage` (slug; pills).
- `owner` / `unassigned`.
- `city`, `wilaya` (company or contact).
- `created`: today | 7d | 30d | 90d.
- `last_activity`: 7d | 30d | none.
- `status`: open | won | lost.
- `attention`: needs_attention | overdue | no_next_action.
- `unanswered` (contact flag).
- Advanced `filter_groups` AND/OR.
- `filter_id` saved view.
- `pipeline` extra query (not a filter field; scopes the query).

`listView.filterFields` count 11 on seed. Saved views present (e.g. “Agri Blida”). [CONFIRMED-BOTH]

Team-only members always constrain `owner_id`.

## 10. Sorting

Default `close_date` asc. Allowed: `title`, `amount` (`amount_cents`), `close_date`, `created_at`, `last_activity_at`. Other column clicks that are not these fields are no-ops. [CONFIRMED-CODE] `applyDealSort`

## 11. Selection

Uncontrolled checkboxes when `bulk.enabled`. `pageIds` = current page deal ids. Peek vs checkbox: nested interactive targets do not peek. [CONFIRMED-CODE]

## 12. Bulk Actions

`POST /crm/deals/bulk`. Deal actions: `assign_owner`, `move_stage`, `delete`. `enroll_sequence` rejected for deals. Move uses `Deal::moveTo` (same stage gates as board). Flash: `Bulk {action} finished: N succeeded, M failed.` Seed `bulk.enabled: true`. [CONFIRMED-BOTH]

## 13. Pagination / Loading Strategy

Server pagination 25/page (`CrmFilter::paginate`). `useInertiaLoading` table skeleton. Attention queue max 8 (`DealAttentionEvaluator::QUEUE_LIMIT`). [CONFIRMED-CODE]

## 14. Forms

Create drawer form documented in OVR-DEAL-001. No inline row edit on the list.

## 15. Overlays

- OVR-DEAL-001 create drawer (this page and board).
- OVR-SHELL-006 row peek.
- Advanced filter drawer / column chooser / saved-view name (shared list chrome).
- OVR-SHELL-001/002/003/004/005 from shell.

## 16. States

- Default populated list (seed 15).
- `createOpen` from `?create=1`.
- `prefillContactId` from `?contact_id=`.
- Loading via Inertia.
- Bulk selection.
- Attention banner hidden when queue empty.
- Pipeline switcher hidden if `pipelines.length <= 1`.
- Import hidden without `crm.import`.
- Bulk hidden without `crm.bulk`.

## 17. Empty State

Unfiltered: title **No deals yet**, body about creating a deal + contact, CTA **Create deal**. Filtered: **No deals match these filters**, no primary CTA. [CONFIRMED-CODE] `dealEmptyState`

## 18. Error Handling

Validation errors on create stay on the drawer (Inertia Form). Bulk/move failures flash or 422 from `StagePropertyGate`. Unauthorized create 403. Workspace mismatch on other deal routes 404. [CONFIRMED-CODE] Move/create errors not exercised in this crawl. [UNVERIFIED]

## 19. Feedback

Toaster for some CRM errors (board move). List relies on Inertia validation + bulk status flash. No dedicated success toast on create; redirect to index. [CONFIRMED-CODE]

## 20. Navigation Behavior

Create success → `/crm/deals` unless `add_another` → `/crm/deals?create=1`. Filters via GET list-query (preserve pipeline). Layout toggle does not write `peek`. [CONFIRMED-CODE] `deal-board-contract.ts`

## 21. Entity Relationships

Deal → pipeline/stage, contact, company (from contact), owner, lead, quotes, line items, activities, tickets. List is pipeline-scoped. Related: SCR-DEAL-002 board, SCR-DEAL-003 show, SCR-QUOTE-001, SCR-CONTACT-002, SCR-COMPANY-002, SCR-LEAD-001.

## 22. Business Rules

- Currency DZD; amounts stored as cents; UI `amount_dzd`.
- Default create stage: selected stage or slug `new`; `StagePropertyGate` before save.
- If no `contact_id`, `ContactIdentity::findOrCreate` from contact name or deal title, source `deal`.
- Owner defaults to current user.
- Amount ignored on later update if line items exist (list create still sets cents).
- Forecast on this endpoint is **unfiltered boardData** (also capped at 200 deals) plus open-stage sum; **not shown**.
- Stage pill counts ignore the active stage filter so pills stay comparable.
- Simple mode: allowed.

## 23. Backend Dependencies

`DealController::index`, `CrmFilter`, `CrmHub`, `PipelineManager`, `RecordInsight::dealHealth`, `DealAttentionEvaluator`, `DealPolicy`, `BulkActionController` / `BulkActionRunner`, export stream. Config `evosales.cities` / `wilayas`.

## 24. Frontend Dependencies

`CrmListShell`, `BulkActionBar`, `CreateDrawer`, `DealAttentionQueue`, `DealLayoutToggle`, `PipelineSwitcher`, `deal-columns.tsx` / `deal-columns-contract.ts`, `DataWorkspace`, `FilterBar`, `StagePills`.

## 25. Responsive Behavior

Shell uses `h-app-workspace`. Attention queue extra padding `md:px-8`. Drawer `sm:max-w-md`. Table horizontal overflow via shared workspace. Viewport crawl not run. [NOT VERIFIED] beyond classnames. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: Create required title; search `aria-label` “Search deals”; layout toggle `aria-current`; pipeline select `aria-label="Pipeline"`; attention queue `aria-labelledby`.
LIKELY ISSUE: Dense table; stage pills may be text-only links; bulk bar a11y not inspected.
REQUIRES MANUAL TEST: keyboard through filters, peek vs row link, screen reader of money cells.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-DEAL-001 | MEDIUM | `forecast` / `openPipelineCents` computed but unused on list | No pipeline value without opening board | `index.tsx` vs controller props |
| UX-DEAL-002 | LOW | Search is title-only | Contact/company names miss | `CrmFilter::applySearch` |
| UX-DEAL-003 | LOW | “Edit this form” in drawer is `#edit-form` | Looks like settings, goes nowhere useful | `create-drawer.tsx` |
| UX-DEAL-004 | OBSERVATION | French locale chrome, English object copy | Mixed language | inertia dump `locale: fr` |
| UX-DEAL-005 | LOW | Health/next step hidden by default while attention is visible | Extra click to see health | `ListViewConfig` |

## 28. Consistency Comparison

Matches contacts/companies shared-table chrome (search, views, filters, peek, 25/page). Unique: pipeline switcher, stage pills, list/board toggle, attention queue, deal-only bulk `move_stage`. Quotes list is thinner (no bulk, empty savedFilters).

## 29. Functional Preservation Contract

Redesign MUST keep: pipeline-scoped list; create drawer + `?create=1` + contact prefill; list/board toggle preserving query; stage pills; attention queue + `attention=` filter; DZD amounts; default columns/sort; saved views; export CSV; import entry if `crm.import`; bulk assign/move/delete if `crm.bulk`; team-only; pagination 25; row href `/crm/deals/:id`; empty vs filtered empty; `crm.edit` on create.

## 30. Design Input Contract

Purpose: operate the sales pipeline as a table.
Primary goal: find a deal and act (open, create, bulk move).
Primary actions: Create deal, open record.
Secondary: import, export, board, filters, attention.
Required information: title, stage, amount DZD, close date, owner, company/contact, attention.
Required components: list chrome, stage pills, attention banner, table, create drawer, bulk bar.
Required states: empty, filtered empty, loading, selection, create open.
Information priority: identity → stage → amount → close → owner → association → attention.
Business-critical: DZD, pipeline/stage, attention, bulk move gates.
Must not remove: list/board toggle, pipeline query, export, import capability, bulk, create, peek/href.

## 31. Open Questions / Unknowns

- Exact on-screen rendering of health/attention colors: [UNVERIFIED] (code tones exist; no screenshot audit).
- Whether owner users see forecast elsewhere on this URL via another wrapper: [UNKNOWN] (page component does not).
- Saved-view “Agri Blida” usefulness: seed data [UNVERIFIED] interaction.
