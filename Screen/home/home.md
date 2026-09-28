# Operating Home (dashboard)

## 1. Screen Identity

Screen ID: `SCR-HOME-001`
Product area: Home
Route: `GET /dashboard`
Route name: `dashboard`
Frontend file: `resources/js/pages/home.tsx`
Primary component: Inertia `home` (`Home` default export)
Layout: default `AppLayout` (`resources/js/layouts/app-layout.tsx` → sidebar shell). Page sets `Home.layout.breadcrumbs` to Home → `/dashboard`.
Authentication: `auth` + `verified` + `EnforceProductPermissions` + `EnforceSimpleMode` (`routes/web.php`). GET is a safe method, so product middleware does not require `crm.edit`.
Permissions: any authenticated verified member can load the page. Create CTAs (`New deal`, activation CTAs, empty-state create) require `crm.edit` (`auth.capabilities`). View-only members still receive workspace-scoped metrics (`P17DashboardOperatingHomeTest`).
Parent navigation: sidebar Home (`/dashboard`). Simple-mode server nav includes `{ id: home, href: /dashboard }` (`App\Support\SimpleMode::SIMPLE_NAV`). Runtime owner nav label is French `Accueil`.
Entry points: `/` redirects authenticated users to `dashboard`; login success; sidebar Home; command OS `nav-home` (if present); activation / other in-app links to `/dashboard`.
Exit points: KPI hrefs (deals list/board), attention deal hrefs + Quick Record deal drawer, work hrefs to `/crm/activities` (+ `group=`), pipeline stage hrefs and Open board, recent RecordLink drawers, activation step hrefs, dismiss POST.
Runtime HTTP (owner, simple_mode=true): **200**, component `home`, url `/dashboard`. [CONFIRMED-BOTH] `Screen/_evidence/runtime-index.json`, `Screen/_evidence/dashboard.json`.
Evidence: `Screen/_evidence/dashboard.json`; `app/Http/Controllers/HomeController.php`; `app/Services/Home/HomeDashboardBuilder.php`; `tests/Feature/P17DashboardOperatingHomeTest.php`; `tests/js/p17-dashboard-operating-home.ts`.

Working-tree note: uncommitted V02 visual work exists. Dirty files (do not treat HEAD as truth): `resources/js/pages/home.tsx`, `resources/js/components/dashboard/activation-checklist.tsx`, `dashboard-attention.tsx`, `dashboard-header.tsx`, `dashboard-work.tsx`, `resources/js/lib/dashboard-operating-home.ts`. This audit documents **current working-tree files**. Clean relative to HEAD: `dashboard-pipeline.tsx`, `dashboard-recent.tsx`, `home-kpi-strip.tsx`, `home-widget.tsx`.

## 2. Purpose

Operating home for the signed-in seller: exceptions first, then scheduled work, then a month snapshot, then default-pipeline distribution, then recently logged activity, plus workspace activation until dismissed. Controller comment: “attention → work → performance → context.” Builder composes P11 pipeline / P12 attention / P15 work queue **without recalculating** those domains (`HomeDashboardBuilder`).

## 3. Current UX Summary

Single-column canvas (`max-w-[72rem]`, `bg-canvas-soft`, `data-home="workspace"`). Order in current `home.tsx`:

1. Header: translated title Home + subtitle `name · date · timezone`; optional `New deal` when `crm.edit`.
2. Activation checklist (if `activation` prop present and `visible`).
3. Two-pane module: **Needs attention** (deals) | **Today** (work queue preview).
4. KPI strip (omitted when `metrics.kpis` is empty).
5. Pipeline module with stacked bar + stage rows.
6. Recent records module.

Seed owner payload: 4 KPIs, 6 attention items, work counts overdue 1 / today 0 / upcoming 1 (2 items), pipeline Sales 12 deals / 228_500_000 DZD unweighted, 6 recent logs, activation 5/5 complete, collapsed, still visible. [CONFIRMED-BOTH]

## 4. Screen Anatomy

- Application chrome: sidebar + topbar (command palette, create menu, **Tasks overlay** `OVR-SHELL-002`, user menu). Home page does not render its own chrome.
- `DashboardHeader` — H1 + context subtitle + secondary `New deal` → `/crm/deals?create=1`.
- `ActivationChecklist` — `data-activation="checklist"`. Activated: compact 14px-tall “Workspace ready” + progress label + Dismiss. Incomplete: “Get started”, progressbar, step list unless `collapsed`.
- `HomeModule` wrappers (`home-module`).
- `HomeWidget` sections: title, optional description, `View all` / `Open board` text links.
- `DashboardAttention` list (max `HOME_ATTENTION_VISIBLE` = 4 rows in UI).
- `DashboardWork` count chips + time-first rows.
- `HomeKpiStrip` (`aria-label="Sales snapshot"`), 2×2 then 4-col from `lg`.
- `DashboardPipeline` amount bar + stage list.
- `DashboardRecent` subject + type/related + relative-ish datetime.
- Unused by current `home.tsx` (legacy files still in `resources/js/components/dashboard/`): `attention-list.tsx`, `activity-feed.tsx`, `guided-actions.tsx`, `quick-actions.tsx`, `dashboard-section.tsx`. P17 asserts payload **missing** `guidedActions`, `activityFeed`, `quota`, `leadOsGraph`. [CONFIRMED-CODE]

## 5. Data Displayed

Shared Inertia chrome (from `HandleInertiaRequests`): `auth`, `workspace`, `simpleMode`, `nav`, `features`, `integrations`, `evoOpenTaskCount` (7 on seed), `evoOpenTasks`, etc.

Page props from `HomeDashboardBuilder::build`:

| Prop | Seed / contract | Notes |
| --- | --- | --- |
| `context` | name `Evotechly` (first token of user name “Evotechly Owner”), date `Monday, 21 September 2026`, tz `Africa/Algiers` | Clock is `DealAttentionEvaluator::TIMEZONE`, not `workspaces.timezone` if they diverged. |
| `metrics.window` | 2026-09-01 → 2026-09-30, label September 2026 | Calendar month in Algiers. |
| `metrics.kpis` | 4 tiles when any deal exists in default pipeline | Keys: `revenue`, `pipeline`, `win_rate`, `open_deals`. Formats money / money / percent / number. |
| `attention.items` | 6 (builder `ATTENTION_LIMIT`) | P12 `DealAttentionEvaluator::queue`. UI shows 4. `view_all_href` `/crm/deals?attention=needs_attention`. |
| `work` | counts + items (limit 6), mine-scoped | Same presenter as P15. **No `body`.** Hrefs `/crm/activities`, `?group=overdue\|today\|upcoming`. |
| `pipeline` | default pipeline, open stages only | Unweighted DZD. Stage href `/crm/deals?pipeline={id}&stage={slug}`. Board href `/crm/deals/board?pipeline={id}`. |
| `recent` | `kind: logged_activity`, 6 items by `created_at` | Not `updated_at`. `recordRef` deal→contact→company. **No `body`.** |
| `activation` | 5 steps, core 3 | Seed: `activated true`, `dismissed false`, `visible true`, `collapsed true`, progress 5/5. |

KPI seed sample: revenue value `62000000` cents, href `/crm/deals?status=won`, hint September 2026, `change` null. [CONFIRMED-UI] truncated list in `dashboard.json`.

## 6. Primary Actions

- Open a deal that needs attention: row click → Quick Record `{ type: 'deal', id }` (`useQuickRecord`); title `<a href={item.href}>` still navigates to deal show if used as a link. [CONFIRMED-CODE]
- Open work queue: Today “View all” → `/crm/activities`; count links with `group=`.
- Open board / stage list from pipeline.
- `New deal` (if `crm.edit`).
- Activation Dismiss: `POST /dashboard/activation/dismiss` (`dashboard.activation.dismiss`) via `ActivationDismissalController` → `WorkspaceActivationService::dismiss`. Unsafe method; product permission: route name does not start with `crm.` so `EnforceProductPermissions` returns null (any verified user can dismiss their own preference). [CONFIRMED-CODE]

## 7. Secondary Actions

- KPI tile navigation (won list, board, deals index).
- Related record drawer from work/recent (`RecordLink` mode `drawer`).
- Activation step CTAs when incomplete (`/crm/contacts?create=1`, import, pipelines, `/crm/deals?create=1`, `/crm/activities?create=1`, `/settings/apps`).
- Empty-state links: View deals, Open activities, Create deal, Create contact.

Home **does not** complete activities (`dashboard-work.tsx` has no `/complete`; P17 locks this). Completing is Tasks overlay / Activities index.

## 8. Search

NOT PRESENT on the page. Global command palette search is shell (`OVR-SHELL-001`). Home does not filter its modules.

## 9. Filters

NOT PRESENT. Attention/work/pipeline are server-composed for default pipeline + current user (work = mine). No owner/date/pipeline picker on Home.

## 10. Sorting

Server-defined only:

- Attention: P12 evaluator order (overdue activity before no-next-action). [CONFIRMED-CODE] `P17DashboardOperatingHomeTest`.
- Work items: overdue → today → upcoming, each `due_at` then id (`ActivityWorkQueueQuery::orderGroup` + `dashboardWork`).
- Pipeline stages: pipeline `position`.
- Recent: `latest('created_at')`, permission-filtered, take 6.

No user-controlled sort.

## 11. Selection

NOT PRESENT. No multi-select. Attention row is a button (drawer) wrapping a native link for the title.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full Inertia page load. Caps: attention 6 payload / 4 visible; work 6; recent 6; pipeline all open stages of default pipeline. No infinite scroll, no partial reloads except activation dismiss `preserveScroll`. KPI strip unmounts when `kpis.length === 0`.

## 14. Forms

No page-level create form. Activation dismiss is `router.post` with empty body. Activity/deal create happens on destination screens.

## 15. Overlays

- Quick Record deal drawer from attention / related links (`OVR-SHELL-006`). Home does not import `QuickRecordDrawer` directly; provider is in `AppLayout`.
- Shell Tasks overlay (`OVR-SHELL-002`) is **not** the Home Today module; different data path (`evoOpenTasks` vs `work`).
- Command palette / global create / user menu / Ask Evo: shell, not Home-specific.
- No Home-owned modal.

## 16. States

- Default populated operating home (seed).
- No deals: `metrics.kpis = []` (strip hidden), pipeline empty, activation typically visible. [CONFIRMED-CODE] P17.
- Attention empty: “No deal exceptions”.
- Work empty: “Nothing on your schedule” when overdue+today+upcoming all 0 (unscheduled does not keep Today filled).
- Recent empty: “Nothing logged yet”.
- Activation hidden when `visible === false` (dismissed) or component returns null if `!activation.visible`.
- View-only: no New deal; activation hrefs null for create steps. [CONFIRMED-CODE]
- Loading: standard Inertia visit (no Home skeleton). [UNVERIFIED] in UI crawl beyond 200 HTML.

## 17. Empty State

Per-widget `HomeWidgetEmpty` / `EmptyState` density `panel`:

- Attention: overdue activities and deals without next action copy + View deals.
- Work: Open activities.
- Pipeline: Create deal (`/crm/deals?create=1`) — not gated in the empty component itself; users without `crm.edit` still see the link. [CONFIRMED-CODE] likely 403/no-create on destination.
- Recent: Create contact if `canCreate`.

## 18. Error Handling

No Home-specific error UI. Authorization failures on nested resources are omitted from lists (Gate `view` on activities/deals). Other-workspace rows never appear. [CONFIRMED-CODE] P17. Activation dismiss errors would surface as Inertia error bag — [UNKNOWN] no dedicated handler.

## 19. Feedback

No toasts on Home. Completing work is not on this screen. Dismiss is silent except checklist disappearance on next props. Focus rings on View all / KPI / stage links (`focus-visible:ring-brand`).

## 20. Navigation Behavior

- `/` → `/dashboard` when authenticated. [CONFIRMED-BOTH]
- Inertia `<Link>` for most exits; attention title uses `<a href>` (full visit) with `stopPropagation` so the row button still opens the drawer.
- Work subject links to **queue index**, not a per-activity URL (activities have no show route).
- Recent prefers RecordLink drawer when `recordRef` exists, else `/crm/activities`.
- Browser title: `t('Home')` → `Home · EvoCrm` (or translated). Locale `fr` on seed. [CONFIRMED-UI] `dashboard.json` locale fr.

## 21. Entity Relationships

- Workspace default `Pipeline` + open `Stage`s + `Deal` amounts.
- `DealAttentionEvaluator` on default-pipeline deals.
- `Activity` work queue (mine) and recent logs (workspace, view-gated).
- Related: deal / contact / company labels only (no amounts on work rows).
- Activation facts: contact/company existence, deals, activities, pipeline customization, integrations.
- Does **not** own tickets, inbox threads, or reports.

## 22. Business Rules

- One operating Home; no DashboardV2 / HomeV2 (P17 source lock).
- Timezone for metrics/work/recent presentation: `Africa/Algiers` (`DealAttentionEvaluator::TIMEZONE`), not browser local, not `Date.now` in Home components.
- KPIs exist only if at least one deal in default pipeline; win rate null when no closed deals this month.
- Pipeline amounts unweighted (`weighted: false`), currency hardcoded `DZD`.
- Work preview is **mine** even if Tasks overlay lists all open workspace activities.
- Recent ordered by `created_at`; completing a task does not bump it via `updated_at`.
- Activity bodies never in payload.
- Activation: core steps = add CRM data, first deal, first activity; optional = configure pipeline, connect channel. `activated` when all core complete; UI then collapses but stays `visible` until dismiss.
- N+1 guard: no per-deal activity queries on Home (P17).

## 23. Backend Dependencies

- `App\Http\Controllers\HomeController` → `Inertia::render('home', $builder->build($user))`.
- `App\Services\Home\HomeDashboardBuilder`
- `App\Services\Crm\DealAttentionEvaluator`
- `App\Services\Crm\ActivityWorkQueueQuery::dashboardWork`
- `App\Services\Activation\WorkspaceActivationService`
- `App\Http\Controllers\Activation\ActivationDismissalController`
- Models: `Deal`, `Activity`, `Pipeline`, `Stage`, `Contact`, `Company`
- `App\Support\Integrations` (activation facts)
- Routes: `GET /dashboard`, `POST /dashboard/activation/dismiss`
- Tests: `tests/Feature/P17DashboardOperatingHomeTest.php`, `tests/js/p17-dashboard-operating-home.ts`, `tests/Feature/HomeCommandCenterTest.php` (activation hrefs)

## 24. Frontend Dependencies

- `resources/js/pages/home.tsx`
- `components/dashboard/{dashboard-header,activation-checklist,dashboard-attention,dashboard-work,home-kpi-strip,dashboard-pipeline,dashboard-recent,home-widget}.tsx`
- `lib/dashboard-operating-home.ts`, `lib/activation.ts`, `lib/money.ts` (`formatCompactDzd`), `lib/i18n.ts`
- `@/ds/workspace/quick-record` (`useQuickRecord`, `RecordLink`)
- `@inertiajs/react` Head/Link/router/usePage
- Shell: `AppLayout`, Tasks overlay (adjacent, not imported here)

## 25. Responsive Behavior

[CONFIRMED-CODE] not viewport-crawled.

- Page: `overflow-x-hidden`; padding `px-4 md:px-8`.
- Header: column then `md:flex-row`.
- Attention | Today: stacked; `lg:grid-cols-[13fr_8fr]` with left border on Today at lg.
- KPI: `grid-cols-2` / `lg:grid-cols-4`; hint line `hidden sm:block`; values may wrap (`HOME_KPI_VALUE_CLASS`). P17 forbids `overflow-x-auto` on the strip.
- Pipeline/recent: truncate + hover rows.
- [NOT VERIFIED] actual 375/768/1024 screenshots.

## 26. Accessibility Observations

CONFIRMED (code):

- H1 Home; widget H2s; activation `aria-labelledby="activation-title"`.
- Progressbar with valuemin/now/max when setup incomplete.
- KPI links have `aria-label` of label + value; pipeline bar `role="img"` + amount/count label.
- Focus-visible rings on interactive links/buttons.
- Attention rows are buttons; nested `<a>` is a known pattern (possible duplicate activation).

LIKELY ISSUE:

- Nested interactive control in attention (button > a).
- KPI section label “Sales snapshot” not passed through `t()`.
- Home work rows are not complete controls; keyboard users must leave Home to complete.

REQUIRES MANUAL TEST: screen reader order of two-column module; drawer vs link on attention; French/English mix.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-HOME-001 | MEDIUM | Payload ships 6 attention items; UI slices to 4 with no “+2 more” in the widget | Operator thinks View all is optional chrome, misses exceptions 5–6 | `HOME_ATTENTION_VISIBLE`; `dashboard.json` `_list: 6` |
| UX-HOME-002 | MEDIUM | Right module title is **Today** but lists overdue + upcoming; empty rule ignores unscheduled | Overdue work looks like “today”; counts can contradict the heading (seed: Today header, 1 overdue / 0 today) | `home.tsx` `t('Today')`; `dashboard.json` work.counts |
| UX-HOME-003 | HIGH | Home work rows cannot be completed; overlay and `/crm/activities` can | Extra navigation to close the loop the home page just showed | P17 `dashboard-work.tsx` must not contain `/complete` |
| UX-HOME-004 | MEDIUM | Work subject `<Link>` goes to `/crm/activities` (unfiltered index), not a focused row | Loses the item; user hunts the queue | `dashboard-work.tsx` `href={work.view_all_href}` |
| UX-HOME-005 | LOW | KPI / pipeline copy is English (`Won this month`) while chrome nav is `Accueil` | Mixed-language home | `dashboard.json` locale `fr` vs KPI labels |
| UX-HOME-006 | MEDIUM | Activation stays visible after 5/5 as “Workspace ready” until Dismiss | Permanent banner on an already-activated seed workspace | `activation.visible true`, `collapsed true` |
| UX-HOME-007 | OBSERVATION | Uncommitted V02 visual work in working tree | Design/audit drift if someone diffs HEAD | `git status` on home + 5 dashboard/lib files |
| UX-HOME-008 | LOW | Legacy dashboard widgets remain in tree but are not composed | Future contributors may wire a second Home | unused `guided-actions.tsx` etc.; P17 missing props |
| UX-HOME-009 | OBSERVATION | `context.name` is user first name, not workspace name | Subtitle can read as workspace by coincidence (`Evotechly`) | `HomeDashboardBuilder::context` vs `dashboard.json` |

## 28. Consistency Comparison

- Aligns with deals board/list for pipeline stage hrefs and attention filter query.
- Work preview shares P15 row shape but **drops complete, attendance, type badge, owner line** — lighter than Activities index.
- Tasks overlay (header) uses a different clock and population than Home Today (see SCR-ACTIVITY-001).
- KPI money formatting uses compact DZD like other CRM money (`formatCompactDzd`), not full dinar strings.
- Room tabs (`CrmShell`) are not used on Home; Home is a standalone canvas under AppLayout.

## 29. Functional Preservation Contract

A redesign MUST keep:

- [ ] Route `GET /dashboard` → Inertia `home` with props `context`, `metrics`, `attention`, `work`, `pipeline`, `recent`, `activation`.
- [ ] Composition order: attention + work above KPIs above pipeline above recent (P17 source order lock).
- [ ] P12 attention items with `primary` type/severity/label/reason and deal identity; View all `?attention=needs_attention`.
- [ ] P15 mine work counts (overdue/today/upcoming) and same timing predicates; no activity `body`.
- [ ] Honest month KPIs (won this month vs last month, unweighted open pipeline, win rate, open deal count) only when deals exist.
- [ ] Default-pipeline stage aggregates + board link; unweighted DZD.
- [ ] Recent by `created_at`, not `updated_at`.
- [ ] Activation server state + dismiss POST; React must not infer step completion.
- [ ] `crm.edit` gating for create CTAs; workspace isolation; no N+1 per deal.
- [ ] No second dashboard product (`DashboardV2`, quota widget, Lead OS graph on this page).
- [ ] Africa/Algiers clock; no `Date.now` overdue math on Home.

## 30. Design Input Contract

Purpose: daily operating surface — what is stuck, what is due, how the month and pipeline look, what was just logged.
Primary goal: get the seller into the next deal or activity in one click.
Primary actions: open exception deal (drawer or show), open work queue (optionally grouped), open pipeline board.
Secondary actions: KPI deep-links, New deal, activation/dismiss, related-record peek.
Required information: workspace/user context + date/tz; attention reasons; work due times and related labels; four KPI values when sample exists; stage counts/amounts; recent subjects/types/when; activation progress.
Required components: header, activation (until dismissed), attention list, work list, KPI strip, pipeline distribution, recent list, empty states per module.
Required states: populated, per-module empty, no-KPI (no deals), view-only, activation incomplete / complete-collapsed / dismissed.
Information priority: exceptions > due work > performance > pipeline > recency > setup.
Business-critical: attention reasons, overdue styling, unweighted money, mine-scoped work counts, created_at recency, activation truth.
Must not remove: View all / Open board exits; dismiss; permission-safe omission of foreign/secret records; money as compact DZD.

Do not prescribe a new look. Note V02 visual tweaks already in the working tree.

## 31. Open Questions / Unknowns

- [UNKNOWN] Whether the live iframe-less crawl rendered French `t('Home')` as Accueil in the H1 (nav is Accueil; Head title uses `t('Home')`).
- [UNVERIFIED] Pixel-level V02 spacing vs HEAD; only `git diff --stat` (~46 insertions) was inspected, files were not reverted.
- [UNKNOWN] Whether `context.name` should be workspace name; product copy in header subtitle is ambiguous.
- [UNVERIFIED] Manual keyboard pass on nested attention controls.
- GuidedActionBuilder.php still exists; not on this screen — confirm no other entry. [UNVERIFIED]
