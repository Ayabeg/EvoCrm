# Reports analytics rooms

## 1. Screen Identity

Screen ID: SCR-REPORT-001
Product area: Reports
Route: `/reports` (canonical). Alias `/crm/reports`. Category `/reports/{category}` where category ∈ `sales|pipeline|outbound|ads`.
Route names: `reports`, `crm.reports`, `reports.category`
Frontend file: `resources/js/pages/crm/reports.tsx`
Primary component: `Reports` → Inertia `crm/reports`
Layout: `ReportsShell` (`resources/js/components/crm/reports-shell.tsx`) + `RoomShell` title “Reports”. Breadcrumbs: Reports `/reports`. [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET method-safe — no extra capability. Mutations: `reports.dashboards*` require `reports.manage` (owner/admin/member default true). `POST/PUT/DELETE /reports/schedules` are **not** mapped to `reports.manage` in `EnforceProductPermissions` (any authenticated user can mutate schedules). Not blocked by SimpleMode. [CONFIRMED-CODE]
Parent navigation: Sidebar More → Reports `/reports` (hidden in simple rail but URL works). Command palette `nav-reports`. Reports room tabs: Overview, Sales, Pipeline, Outbound, Ads, Custom. [CONFIRMED-CODE]
Entry points: `/reports`, `/crm/reports`, category URLs, dashboard query `?dashboard=`, outbound redirect `/outbound/reports` → `/reports/outbound`, EvoViz chart hrefs into CRM. [CONFIRMED-CODE]
Exit points: category tabs; Custom → `/crm/report-builder` (403 in simple mode); chart `href`s (`/leads`, `/crm/deals`, `/crm/leads`, `/outbound/outbox`, `/ads`, `/conversations`); lost-review deal links; outbound detail campaign/sequence links. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): `/reports` **200** component `crm/reports`; `/crm/reports` **200** same component/props; `/reports/funnels` is a different screen (SCR-REPORT-003); `/reports/{sales|pipeline|outbound|ads}` **200** same component with filtered `categories`. [CONFIRMED-UI]
Evidence: `runtime-index.json` `/reports` and `/crm/reports` 200, props include `activeCategory`, `window`, `categories`, `owners`, `dashboards`, `dashboard`, `widgetCatalog`, `schedules`, `savedReports`, `leadOsGraph`, `lostReview`. `ReportController::index`. Tests `CrmReportsTest.php`, `CrmReportDashboardsTest.php`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Deep per-category analytics: KPIs + EvoViz charts + backing tables from real workspace rows in an Africa/Algiers window (default last 30 days, max 92). Empty categories omitted; all-zero charts omitted. Additive saved dashboards pin existing EvoViz charts. Owner filter scopes rooms. Scheduled report delivery UI lives on the same page. [CONFIRMED-CODE]

## 3. Current UX Summary

Reports room with tabs. Optional inner title when not “Reports”. Description shows window dates/days/timezone and “Real rows only. Empty categories stay hidden.” Filter form: owner, from, to, Apply, optional Last 30 days. Compact Lead OS graph + Lost this week list. Dashboard chip nav (Rooms | named boards | New dashboard). Scheduled reports list + create form. Then either open dashboard widgets, empty “nothing to report”, or stacked category sections (KPI strip, chart grid, table). Outbound category appends operations detail. Dialogs: New dashboard, Add widget. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell. [CONFIRMED-CODE]
2. `RoomShell` tabs: Overview `/reports` (also active on `/crm/reports`), Sales `/reports/sales`, Pipeline `/reports/pipeline`, Outbound `/reports/outbound`, Ads `/reports/ads`, Custom `/crm/report-builder` (also active for `/reports/funnels`). [CONFIRMED-CODE]
3. Canvas `bg-canvas-soft` padding. Optional `h2` dashboard name. Description. Filters slot. [CONFIRMED-CODE]
4. `LeadOsGraphStatus` compact. [CONFIRMED-CODE]
5. `LostReviewList` (renders null if empty). [CONFIRMED-CODE]
6. Dashboards nav `aria-label="Dashboards"`. [CONFIRMED-CODE]
7. Scheduled reports section + create form. [CONFIRMED-CODE]
8. Dashboard widgets **or** category sections **or** empty. [CONFIRMED-CODE]
9. Footer: `Reports window {from} → {to} · {timezone}`. [CONFIRMED-CODE]
10. Dialogs New dashboard / Add widget. [CONFIRMED-CODE]

## 5. Data Displayed

**window:** `from`, `to`, `days`, `timezone: Africa/Algiers`, `custom` if from/to query, `owner_id`. Default last 29 days back from today EOD; swap if inverted; clamp to 92 days. [CONFIRMED-CODE]

**activeCategory:** route category or `overview`. [CONFIRMED-CODE]

**categories[]:** `{ key, title, description, kpis[], charts[], table }`. Overview includes all non-null rooms; category route filters via map `sales→leads`, `pipeline→pipeline`, `outbound→outbound`, `ads→ads`. Desk and activity rooms appear only on overview (no dedicated tab). [CONFIRMED-CODE]

Room payloads when rows exist:

| key | title | KPIs | Charts (omitted if zero series) | Table |
| --- | --- | --- | --- | --- |
| pipeline | Pipeline | Open deals, Open pipeline money, Won/Lost in window, Win rate | bar open value by stage; area won/day; donut outcomes | stage / open / open value / closed / closed value |
| leads (tab Sales) | Leads | New leads, Qualified, Qualification rate, Converted to deal | area new/day; donut status; ranked-bars source | source / leads / qualified / rate |
| outbound | Outbound | Sent, Opened, Clicked, Replied, Open rate, Failed | area sent/day; bar engagement | last 10 days sent/opened/clicked/replied |
| ads | Ads | Spend, Impressions, Clicks, CTR, Ad leads, Cost per lead | area spend/day; ranked-bars spend by campaign (top 6) | top 8 campaigns impr/clicks/spend/leads/CPL |
| desk | Desk | Open threads, Unread, Messages, Inbound, Outbound | area messages/day; donut thread status | channel / threads / unread / messages |
| activity | Activity | Completed, Open tasks, Overdue, Logged | bar by type; area completed/day | owner / open / overdue / done |

[CONFIRMED-CODE]

**owners:** workspace users for filter. [CONFIRMED-CODE]
**dashboards:** visible private-own + team/workspace, widget_count. Visibility prefix ◆ workspace / ◇ team. [CONFIRMED-CODE]
**dashboard:** open board widgets with resolved charts from current categories (null chart → “No rows in this window”). [CONFIRMED-CODE]
**widgetCatalog:** `ReportWidgets::CATALOG` keys. [CONFIRMED-CODE]
**schedules:** name, cron, active, last_status. [CONFIRMED-CODE]
**savedReports:** id, name for schedule select. [CONFIRMED-CODE]
**leadOsGraph / lostReview:** Lead OS + lost-reason confirm list. [CONFIRMED-CODE]
**outboundDetail:** only when `category === 'outbound'`: totals, perSequence, perCampaign, daily 30d, unused tracking labels. [CONFIRMED-CODE]

Money: DZD cents. Null KPI → “—”. Backing table hidden if `rows.length === 0`. [CONFIRMED-CODE]

## 6. Primary Actions

- **Apply** date/owner filters (`router.get` current `reportsBasePath`, preserveState). [CONFIRMED-CODE]
- **Last 30 days** when `window.custom` (drops from/to, keeps owner/dashboard). [CONFIRMED-CODE]
- **Rooms** vs open dashboard chips. [CONFIRMED-CODE]
- **New dashboard** dialog → POST `/reports/dashboards` (name, visibility, from, to, owner) → redirect `?dashboard={id}`. [CONFIRMED-CODE]
- **Add widget** (dashboard) → WidgetPicker POST `/reports/dashboards/{id}/widgets`. [CONFIRMED-CODE]
- **Remove** widget DELETE widgets. [CONFIRMED-CODE]
- **Delete** dashboard DELETE `/reports/dashboards/{id}` → `/reports` with filters. [CONFIRMED-CODE]
- **Create schedule** POST `/reports/schedules`. [CONFIRMED-CODE]
- **Pause/Resume** PUT schedule `active` toggle. [CONFIRMED-CODE]
- **Delete** schedule. [CONFIRMED-CODE]
- Lost review confirm (Lead OS) on items. [CONFIRMED-CODE]

## 7. Secondary Actions

Chart tiles may include `href` into CRM/ads/outbound. Outbound detail links campaigns/sequences. Lead OS graph actions in child component. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

- Owner `<select>` All owners + members. Query `?owner=`. Scopes deals/activities by `owner_id`; leads/outbound/ads/desk via `contact.owner_id`. [CONFIRMED-CODE]
- From/To `type=date`, max/min cross-bound. Query `from`/`to` Y-m-d. Timezone Africa/Algiers. [CONFIRMED-CODE]
- Dashboard `?dashboard=` 404 if missing. [CONFIRMED-CODE]
- Category path filters rooms; overview shows all present rooms. [CONFIRMED-CODE]

Form `aria-label="Dashboard filters"`. [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT as control. Tables ordered by domain (stages position, sources by count, spend desc, days desc, etc.). Dashboards `orderBy name`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT (no row select). Dashboard chip is exclusive view, not multi-select. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

No paginator. Full Inertia GET with `preserveState` on filters; `preserveScroll` on widget add/remove. Categories computed server-side in one request. Outbound table takes 10 days; ads table 8 campaigns. [CONFIRMED-CODE]

## 14. Forms

**Filters:** client state `from`,`to`,`owner`; submit GET. [CONFIRMED-CODE]

**New dashboard:** name required max 120; visibility private|team|workspace. POST `reports.dashboards.store`. Needs `reports.manage`. [CONFIRMED-CODE]

**Schedule create:** name, saved_report_id optional, cron default `0 8 * * 1`, recipients comma emails (min 1 email). `dashboard_id` current dashboard or null. `active: true`. Recipients parsed client-side. [CONFIRMED-CODE]

**Schedule pause:** PUT recipients + flipped active. [CONFIRMED-CODE]

**Widget add:** `{ key }` in catalog. [CONFIRMED-CODE]

No PUT dashboard rename UI (backend `update` exists, unused on this page). [CONFIRMED-CODE]

## 15. Overlays

- Dialog “New dashboard” / sharing. [CONFIRMED-CODE]
- Dialog “Add widget” `max-h-[80vh]` + `WidgetPicker` grouped by room; already-added keys marked. [CONFIRMED-CODE]
- Global command palette / tasks not owned by this screen. [CONFIRMED-CODE]

## 16. States

- Loading: Inertia visits. [CONFIRMED-CODE]
- No categories: “Nothing to report in this window” + explanation (no placeholders). [CONFIRMED-CODE]
- Open dashboard empty widgets: “No widgets on this dashboard”. [CONFIRMED-CODE]
- Widget chart null: title + “No rows in this window”. [CONFIRMED-CODE]
- No schedules: “No schedules yet.” [CONFIRMED-CODE]
- Lost review hidden when empty. [CONFIRMED-CODE]
- Lead OS graph always mounted (compact). [CONFIRMED-CODE]
- Category tabs can show empty rooms if that room has no rows (filter yields []). [CONFIRMED-CODE]
- Dashboard 404 invalid id. [CONFIRMED-CODE]
- Private dashboard of another user: GET 404 from `find` only if missing; visibility query excludes others’ private from list; direct `?dashboard=` uses `find` without visibility check — **may open another user’s private dashboard by id** (`abort_unless($open !== null, 404)` only). [CONFIRMED-CODE]

## 17. Empty State

Dedicated copy when `categories.length === 0` and no dashboard. Category with KPIs but no charts/table still shows section. [CONFIRMED-CODE]

## 18. Error Handling

Validation 422 on bad dates/owner. Dashboard mutations 403 without `reports.manage`. Delete others’ private dashboard 403 unless `canManageSettings`. Schedule validation: recipients emails required. No inline error mapping in JSX (`errors` prop unused). [CONFIRMED-CODE]

## 19. Feedback

Dialog close on dashboard create success. Buttons have hover styles. No toasts in `reports.tsx`. Schedule last_status text. Lost review confirm is a form in child. [CONFIRMED-CODE]

## 20. Navigation Behavior

`reportsBasePath`: overview `/reports`, else `/reports/{category}`. Reset always `router.get('/reports', …)` not category path. `/crm/reports` Overview tab active via `activePaths`. Custom tab highlights report-builder and funnels — leaving rooms. Filter preserveState. Opening dashboard keeps category path. [CONFIRMED-CODE]

## 21. Entity Relationships

Deals/stages, Leads, OutboundMessage/Sequence/OutboundCampaign, AdCampaign/AdCampaignStat/AdLead, Thread/Message/Channel, Activity/User, Dashboard widgets keys → ReportWidgets catalog → EvoViz payloads from rooms, ScheduledReport → SavedReport and/or Dashboard, Lead OS graph, lost review suggestions → Deal. [CONFIRMED-CODE]

## 22. Business Rules

- No invented numbers; omit empty rooms and zero charts. [CONFIRMED-CODE]
- TZ Africa/Algiers, max 92-day span. [CONFIRMED-CODE]
- Sales tab = leads room (label mismatch). [CONFIRMED-CODE]
- Ads reports still work in simple_mode; Ads Hub does not. [CONFIRMED-CODE]
- Owner filter does not apply to pipeline stage list itself but to deals. Ads stats not owner-scoped except ad leads via contact. [CONFIRMED-CODE]
- Dashboards list: owner or visibility team/workspace. Widget charts only resolve if that room is in current `categories` (owner/date may drop the chart). [CONFIRMED-CODE]

## 23. Backend Dependencies

`ReportController`, `DashboardController`, `ScheduledReportController`, `ReportWidgets`, `GraphRunner`, `LostReview`, models Deal/Lead/OutboundMessage/Ad*/Thread/Message/Activity/Dashboard/ScheduledReport/SavedReport/User. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`ReportsShell`, `reportsBasePath`, `CrmKpiStrip`, `EvoVizChart`, `WidgetPicker`, `LeadOsGraphStatus`, `LostReviewList`, `OutboundReportsDetail`, Dialog, `formatDzd`, Inertia `router`. [CONFIRMED-CODE]

## 25. Responsive Behavior

Filters wrap. Header `lg:flex-row`. Charts `sm:grid-cols-2 xl:grid-cols-3`. KPI strip `xl:grid-cols-6` from columns=6. Tables `overflow-x-auto`. Tabs overflow-x. Schedule form `md:grid-cols-4`. Viewport NOT VERIFIED beyond code breakpoints. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: filters `aria-label="Dashboard filters"`; owner select `aria-label="Owner"`; dashboards nav labeled; category `section aria-label={title}`; remove widget `aria-label={`Remove ${title}`}`; dialog titles. Room h1 sr-only “Reports”. [CONFIRMED-CODE]

LIKELY ISSUE: date inputs lack `aria-label` (only visual uppercase labels). Schedule form unlabeled. Pause/Delete are text buttons in forms. Custom tab goes to 403 in simple mode. Sales vs Leads heading mismatch. [CONFIRMED-CODE]

REQUIRES MANUAL TEST: keyboard dialogs, chart a11y inside EvoViz, live filter announce. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-REP-001 | HIGH | Custom tab → `/crm/report-builder` 403 in simple_mode; funnels still 200 but sit under Custom | Broken tab; funnels hard to discover | SimpleMode + reports-shell [CONFIRMED-UI] [CONFIRMED-CODE] |
| UX-REP-002 | MEDIUM | Tab “Sales” shows room titled “Leads” | Label confusion | keyMap sales→leads [CONFIRMED-CODE] |
| UX-REP-003 | MEDIUM | Reset “Last 30 days” navigates `/reports` not current category | Drops Sales/Pipeline/etc. | `reset()` [CONFIRMED-CODE] |
| UX-REP-004 | MEDIUM | `?dashboard=` skips visibility (IDOR-ish for private boards) | Teammate can open private id | `find` without visibility [CONFIRMED-CODE] |
| UX-REP-005 | MEDIUM | Schedules CRUD not permission-gated | Any member can email reports | EnforceProductPermissions [CONFIRMED-CODE] |
| UX-REP-006 | LOW | Schedule/dashboard UI always on page, including empty rooms | Noise before any CRM data | `reports.tsx` order [CONFIRMED-CODE] |
| UX-REP-007 | LOW | No toast on schedule/dashboard errors | Silent 422 | no errors UI [CONFIRMED-CODE] |
| UX-REP-008 | OBSERVATION | Desk/Activity only on Overview | Users on Sales tab miss them | keyMap [CONFIRMED-CODE] |

## 28. Consistency Comparison

Same RoomShell as Ads/Outbound. KPIs use `CrmKpiStrip` here vs `KpiMeter` on Ads hub. Reports Ads room ≠ Ads Attribution (windowed EvoViz vs all-time FunnelBoard). Home dashboard is a different surface. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: `/reports` + `/crm/reports` alias; category routes sales/pipeline/outbound/ads; Algiers window + owner filter + 92-day clamp; omit empty rooms/zero charts; six rooms’ KPI/chart/table contracts; dashboard CRUD + widget catalog keys; schedule CRUD; Lead OS + lost review; outbound detail on outbound category; EvoViz-only widgets; simple_mode still allows this page; DZD money.

## 30. Design Input Contract

Purpose: Honest analytics rooms plus saved boards.
Primary goal: Read KPIs/charts for a window and optionally pin widgets.
Primary actions: Apply filters; switch room/dashboard; add widget; create dashboard.
Secondary: schedules, lost review, outbound ops, chart drill-outs.
Required information: window, owner, categories, dashboards, schedules, catalog.
Required components: room tabs, filter form, dashboard chips, KPI strip, EvoViz grid, backing tables, two dialogs.
Required states: empty workspace, empty dashboard, null widget, category-only, overview, 403 on builder not this page.
Information priority: filters → rooms/dashboard → KPIs → charts → tables.
Business-critical: no fake data, timezone, owner scope, widget keys.
May NOT be removed: date/owner filters, room omit rules, dashboard widgets from catalog, category URLs.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Local seed: which categories non-empty for Evotechly owner. [UNVERIFIED] (prop keys present; values not dumped in runtime-index)
- EvoViz keyboard/contrast. [UNKNOWN]
- Whether PUT dashboard name will be exposed. [UNKNOWN]
