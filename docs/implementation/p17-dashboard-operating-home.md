# P17 — Dashboard / Operating Home

**PR:** Turn `/dashboard` into the daily operating home: attention → next work → current sales state → recent change.  
**Baseline:** `main` @ `e372dfbfbd458e0f41c24bca13cee38017e3cd60` (P16 #225).  
**Date:** 2026-09-17.

P00–P16 merged and frozen. P17 is a composition layer over P11 / P12 / P14 / P15 / P16. It is not a second source of truth, a Reports Lite page, a DashboardV2, a new attention/timing/forecast engine, P18 Quotes, P23 onboarding, or P24 Ask Evo.

Live Contabo deploy + populated QA is owned by Research after this PR opens.

---

## P17 STATUS

Audit complete on fresh main @ `e372dfb` **before** product code. CURRENT DASHBOARD recorded below. The active `resources/js/pages/home.tsx` + `HomeController` + `HomeDashboardBuilder` remain the only Home. No DashboardV2 / HomeV2 / SalesDashboardNew / OperatingDashboard.

**MERGE READY: NO** until Research Contabo populated QA is PASS.

## BASE / PR / TIP

- Base: `e372dfbfbd458e0f41c24bca13cee38017e3cd60`
- Branch: `cursor/p17-dashboard-operating-home`
- PR title: P17 — Dashboard / Operating Home
- Tip: this branch after the P17 commits

---

## AUDIT

Inspected on fresh main @ `e372dfb` **before coding**:

| Area | Paths |
|---|---|
| Route | `GET /dashboard` → `HomeController` (`routes/web.php`). Fortify home + rail + Command Navigate all `/dashboard`. No `/home`. |
| Page | `resources/js/pages/home.tsx` — command-center workspace (`data-home="workspace"`) |
| Header | `DashboardHeader` — title Home, date `from`/`to`, owner select, New deal `?create=1` |
| Builder | `HomeDashboardBuilder` — loads **all** workspace deals into PHP, filters in memory |
| Extra | `QuotaTracker`, `GuidedActionBuilder`, `GraphRunner`, Places `EnrichmentRun`, `AiInsight` research brief |
| KPI strip | `HomeKpiStrip` — 5 tiles, `text-kpi` 28px, `%` vs previous window, links include Reports |
| Attention | Builder-owned stalled (7d `last_activity_at`), tasks due today, overdue count, inbox unread, leads without follow-up, deferred outbound. **Not** `DealAttentionEvaluator`. |
| Today / work | No P15 queue. Tasks-due is a count card. `date=today` href (legacy). |
| Pipeline | Open deals by stage (count + `amount_cents`) from in-memory deals + default pipeline stages. CSS bars. Board link. |
| Recent | `activityFeed` ordered by **`updated_at`** (forbidden as a fake event). |
| Quota | `QuotaTracker` monthly DZD vs closed-won — real domain, but Reports-adjacent. |
| Charts | EvoViz “Revenue won over time”; Won by owner table. |
| Pulse | Lead OS graph + Places + research brief on Home. |
| Search | None on the page. P16 Command OS is the shell search. |
| QRD | Home does not call `openRecord`. Attention/recent are `Link` visits. |
| Permissions | `Deal::forWorkspace` / `Activity::forWorkspace`. Optional `owner_id` query. No `Gate::view` per row on feed. |
| TZ | Africa/Algiers. `workspaces.timezone` unused (same as P12/P15). |
| Tests | `HomeCommandCenterTest`, `HomeQuotaTest`, `DashboardTest`, polish source locks (`HomeKpiStrip` before Needs attention, `md:grid-cols-5`, `t('Performance')`). |
| Reports | `/reports` + `Crm\DashboardController` widget dashboards — separate product. |

Search hits for home, dashboard, KPI, revenue, pipeline, forecast, win_rate, quota, attention, needs_attention, activity, overdue, today, upcoming, recent, meeting, task, deal, won, lost, weighted, amount, sales, report, analytics, trend, period, comparison confirmed the above.

---

## CURRENT DASHBOARD

| Topic | Finding |
|---|---|
| CURRENT ROUTE | `GET /dashboard` → Inertia `home`. Authoritative. |
| CONTROLLER | `HomeController` builds window + owner, then Quota + Lead OS + Places + research brief. |
| PAYLOAD | `window`, `kpis`, `primaryChart`, `pipelineHealth`, `attention` (count cards), `guidedActions`, `caughtUp`, `activityFeed`, `salesPerformance`, `quota`, `quickActions`, `owners`, `filters`, `dataAsOf`, `leadOsGraph`, `placesRun`, `researchBrief`. |
| WIDGETS | KPI strip, Pipeline bars, Needs attention (guided + stalled/overdue/inbox/leads), Recent (`updated_at`), Quota, Performance chart, Workspace pulse, Won by owner. |
| KPI SOURCES | Revenue = won `amount_cents` in `from`/`to` (default last 30 days). Pipeline = sum open `amount_cents` (all pipelines). Win rate = won / (won+lost) in window, null if none closed. Open deals = non-terminal stages. Activities done = completed in window (5th tile). Change % vs previous equal-length window (`previous=0` → `+100`). |
| PIPELINE SOURCE | Default pipeline stages × in-memory open deals. Unweighted. Not `PipelineManager::boardData` (200-cap board). |
| ATTENTION SOURCE | **Not P12.** Stalled uses `last_activity_at` (P12 deferred stale). Overdue is a **count**, not deal queue. No QRD. |
| ACTIVITY SOURCE | Not P15 `ActivityWorkQueueQuery`. Today tasks use startOfDay–endOfDay (misses P12 “earlier today is overdue”). |
| TIME PERIOD | Query `from`/`to`, max 92 days, default 30. Decorative enough to feel like Reports Lite. |
| CURRENCY | DZD via `formatDzd` / `formatCompactDzd`. Amounts in cents. |
| PERMISSIONS | Workspace scope. Owner filter is a manager report control. Feed can include names without per-row Gate. |
| EMPTY STATES | Guided connect mailbox/Meta/WhatsApp/Calendar (P23-ish). Pipeline/recent empties with Create links. Wall of zeros possible on KPIs. |
| RESPONSIVE | KPI 2/3/5 cols + `overflow-x-auto`. Grid 12-col. No `overflow-x-hidden` on Home. Priority is not Attention → Today → KPIs. |
| REPORTS OVERLAP | Revenue chart, won-by-owner, quota, period picker, Lead OS, research brief, Reports KPI hrefs. |
| DEAD/LEGACY | `quickActions` payload unused in UI. Aurora `Dashboard` model is Reports widgets. Historical Home “stalled” ≠ P12. `attention-list` / `activity-feed` / `guided-actions` are command-center leftovers. |

---

## DASHBOARD VS REPORTS

| | Dashboard (P17) | Reports |
|---|---|---|
| Job | What needs me, what I do next, current sales state, what changed | History, custom widgets, long ranges, Lead OS |
| Charts | None on Home | EvoViz + report builder |
| Period | Implicit current **calendar month** (Africa/Algiers) on period KPIs only | User-selected windows |
| Quota / Lead OS / Places / research | Deferred off Home (P28 leftovers) | Reports already owns Lead OS |

Home is not Reports Lite. No period chips, no revenue area chart, no won-by-owner league table.

---

## ONE DASHBOARD

Refactored the **active** Home:

- `app/Http/Controllers/HomeController.php`
- `app/Services/Home/HomeDashboardBuilder.php`
- `resources/js/pages/home.tsx`

Not created: `DashboardV2`, `HomeV2`, `SalesDashboardNew`, `OperatingDashboard`, `DashboardDealDrawer`.

Reports `Crm\DashboardController` + `dashboards` table stay Reports (P28 can rename leftover Home widgets).

---

## SOURCE-OF-TRUTH MATRIX

| ITEM | SOURCE | EXACT SEMANTICS | AUTHORITATIVE? | PERMISSION | LOAD | SHIP / DEFER |
|---|---|---|---|---|---|---|
| Route / page | `GET /dashboard` + `home` | One operating home | Yes | Auth | One Inertia | **SHIP** |
| Greeting | `users.name` + `DealAttentionEvaluator::now()` | First token + Algiers date. No coaching | Yes | Auth user | Local | **SHIP** |
| Attention | `DealAttentionEvaluator::queue` | overdue_activity > no_next_action; severity, earliest due, id | P12 | Workspace deals, default pipeline | Bounded 6 | **SHIP** |
| Attention View all | `/crm/deals?attention=needs_attention` | P12 URL | P12 | Same | Nav | **SHIP** |
| Attention open | `openRecord({type:'deal'})` | QRD P09/P10 | P09 | Peek | Transient | **SHIP** |
| Today / My work | `ActivityWorkQueueQuery::dashboardWork` | P15 overdue / today / upcoming, `owner_id = me` | P15 | `Gate::view` Activity | Bounded 6 | **SHIP** |
| Work View all | `activityQueueHref` group= | P15 canonical | P15 | Same | Nav | **SHIP** |
| Complete from Home | P15 POST | Identity + crm.edit | P15 | — | — | **DEFER** — navigate |
| Revenue | Won `amount_cents` + `closed_at` in current Algiers month, default pipeline | Label = calculation | Yes | Workspace deals | `SUM` | **SHIP** |
| Revenue trend | Same definition, previous calendar month | Only if previous won cents > 0 | Yes | Same | `SUM` | **SHIP** |
| Pipeline value | Open (not won/lost) `SUM(amount_cents)` default pipeline | Unweighted P11 raw | P11 | Same | `GROUP BY` | **SHIP** |
| Open deals | Count of those open deals | Stage truth | P11 | Same | `COUNT` | **SHIP** |
| Win rate | won_count / (won+lost) this month, same pipeline | Null if denominator 0 | Existing formula | Same | `COUNT` | **SHIP** |
| Weighted forecast | `DealBoardForecast` | Must not mix with raw | P11 | — | — | **DEFER** |
| Period selector | `from`/`to` / 7d 30d 90d | Decorative | No | — | — | **OUT** |
| Pipeline stages | Default pipeline open stages, count + amount, slug href | Same scope as KPIs | P11 | Same | Aggregate | **SHIP** |
| Stage click | `/crm/deals?pipeline=&stage={slug}` | CrmFilter slug | P11 | — | Nav | **SHIP** |
| Recent | Activities by **`created_at`** (logged) | Not `updated_at`, not messages, not audit | Yes | `Gate::view` + omit body | 6 | **SHIP** |
| Quota | `QuotaTracker` | Real, not operational-first | Settings | — | — | **DEFER** primary |
| Meetings widget | No Meeting domain on Home | — | — | — | **DEFER** |
| Guided connect | Mailbox/Meta/WA/Calendar | P23 | — | — | **OUT** of Home |
| Lead OS / Places / brief | GraphRunner / Enrichment / AiInsight | Reports / P24 | — | — | **OUT** of Home |
| Command search | P16 | No Home search bar | P16 | — | **SHIP** consume |
| Stale / aging | last_activity_at / stage history | Insufficient | P12 | — | **DEFER** |
| AI / predictions | — | Forbidden | P24 | — | **OUT** |

---

## IA PRIORITY

1. Attention  
2. Work  
3. Performance (KPI strip only)  
4. Context (pipeline + recent)

Rendered: greeting → Needs Attention + Today → KPI strip → Pipeline + Recent.

No duplicate Search. P16 owns Command OS.

---

## CONTEXT HEADER

Restrained: page title **Home**, subtitle `{first name} · {weekday D month YYYY} · Africa/Algiers`.  
Clock = `DealAttentionEvaluator::now()`. No motivation, AI summary, prediction, or coaching.  
New deal remains ` /crm/deals?create=1` (existing create). Date/owner filters removed.

---

## KPIs

Compact four-metric strip. Server-computed. React only formats.

| Key | Label | Filter | Window | Pipeline | Currency | Closed | Comparison | Empty |
|---|---|---|---|---|---|---|---|---|
| `revenue` | Won this month | `stages.is_won` + `closed_at` | Current Algiers month | Default | DZD cents | Won only | vs previous month iff previous won > 0 | `0` if deals exist |
| `pipeline` | Open pipeline | not won/lost | Current snapshot | Default | DZD cents | Open | None (no snapshot) | omit strip if no deals |
| `win_rate` | Win rate | won / (won+lost) | Current Algiers month | Default | percent | Closed | None | `null` → “—” |
| `open_deals` | Open deals | not won/lost | Current snapshot | Default | count | Open | None | `0` if deals exist |

No 5th “activities done”. No Reports hrefs. No fake `+100%` from a zero previous. No React math.

---

## NEEDS ATTENTION

P12 `DealAttentionEvaluator::queue` on default-pipeline workspace deals. Limit **6**. Same order as List/Board.

View all → `/crm/deals?attention=needs_attention`.  
Row click → `openRecord` (deal). Title link → full `/crm/deals/{id}`.  
No DashboardDealDrawer. No local stale cache.

Resolution: complete the overdue Activity on P15/QRD → evaluator clears → next Home visit updates. Home does not POST complete.

---

## TODAY / MY WORK

P15 `dashboardWork`: My work (`owner_id = me`). Compact overdue → today → upcoming, total ≤ 6. Authoritative **counts** from `ActivityTiming` (not `items.length`).

View all → `activityQueueHref({ scope: 'mine' })`. Group links use `group=overdue|today|upcoming`.

Roles: Attention = deal exceptions; Today = personal schedule. Same deal can appear in both for different reasons — cards are not merged.

Complete-from-Dashboard **deferred**. Navigate to P15.

---

## PIPELINE OVERVIEW

Default pipeline, open stages only. `COUNT` + `SUM(amount_cents)` grouped by `stage_id`. Unweighted. Weighted **deferred** and unlabelled.

Financial parity: Open pipeline KPI + Open deals KPI === sum of stage rows (same query scope). Not the board’s 200-card cap.

Stage click → List with `pipeline` + `stage` slug. Open board → `/crm/deals/board?pipeline=`.

Restrained CSS bars + text values. No Kanban. No `DealPipelineBoard`.

---

## RECENT

**Logged activities** (`created_at` desc), not audit, not inbox messages, not `updated_at`. Bounded 6. Subject + type + created_at (Algiers ISO). Related deal/contact/company only if `Gate::view`. No `body`. QRD via `recordRef` when present.

Truthful absence: empty → “Nothing logged yet” + Create contact/deal if `crm.edit`.

---

## EMPTY / PARTIAL / NEW WORKSPACE

- No deals → KPI strip omitted (no wall of zeros). Pipeline empty uses Create deal.  
- No P12 signals → quiet “No deal exceptions.”  
- No personal overdue/today/upcoming → “Nothing on your schedule.”  
- New workspace (`crm.edit`, no deals, no activities): real Create actions only — deal, contact, activity. No mailbox/Meta/WhatsApp/Calendar guided setup (P23).  
- Partial: show widgets that have data.

---

## SCOPE / PERMISSIONS

| Widget | Scope |
|---|---|
| Attention / Pipeline / KPIs | Workspace-visible deals, **default pipeline** |
| Today | Personal `activities.owner_id = auth` |
| Recent | Workspace activities + `Gate::view` each |

One Dashboard. Members without `crm.edit` see the same facts they can see on List/P15; Create/New deal hidden. Other-workspace rows never serialize. Aggregates use `forWorkspace` only.

---

## SERVER COMPOSITION

One Inertia `DashboardPayload`: `context`, `metrics`, `attention`, `work`, `pipeline`, `recent`, `activation`.

No widget waterfall. No `all()` deals. DB `GROUP BY` / `SUM` / `COUNT`. P12 queue and P15 preview are already set-based. No Home cache. No localStorage snapshots.

---

## INTEROP

- P16 Command OS unchanged (shell Cmd+K).  
- Attention deal → QRD; work/recent associations → `openRecord`.  
- Close QRD → Home stays. Next reload reflects P12/P15.  
- P14 Inbox composer untouched.

---

## VISUAL

`bg-canvas-soft` / `bg-canvas`, hairline, ~10px radius, minimal shadow. Brand orange only on New deal. KPI values `text-kpi` (28px) — not 48–64. No orange KPI tiles. No count-up animation. Localized empty/error copy. Tokens only (no raw `--aurora-*` on Home chrome).

---

## RESPONSIVE

| Viewport | Layout | H-overflow |
|---|---|---|
| 1440 / 1280 | Attention ‖ Today; KPI 4; Pipeline ‖ Recent | NONE |
| 1024 | Same, tighter | NONE |
| 768 | **Attention → Today → KPIs → Pipeline → Recent**. KPI 4-col (`md+`) with wrapping / compact type so DZD values stay readable. Below `md`: **2×2 grid**, not a horizontal scroller. | NONE |

Page `overflow-x-hidden`. KPI values use `break-words` (no `whitespace-nowrap`). Rows truncate.

---

## TESTS

Frozen clock: `2026-09-16 12:00 Africa/Algiers`.

| Theme | Lock |
|---|---|
| KPI fixtures | Won this month vs last month; win rate null if no closed; open/pipeline match stage sums |
| P11 parity | Stage count/amount === KPI open/pipeline; unweighted; no React math |
| P12 parity | Same queue order/types as evaluator; complete overdue clears Home attention |
| P15 parity | Same buckets; earlier today overdue; exactly-now today; mine vs other owner |
| Timezone midnight | Aug 31 23:00 not this month; Sep 1 00:00 is |
| Permissions | Other workspace absent; view-only no create; no activity body |
| New / partial | Empty activation Create-only; partial shows existing widgets |
| Large data | No `deals` dump; no per-deal `activities.deal_id = ?` |
| Long names / DZD | Truncate classes; `formatCompactDzd` / cents |
| Source | No DashboardV2; no Date.now overdue; no updated_at feed |

---

## LIVE VISUAL QA

**NEEDS RESEARCH.** This agent cannot browser Contabo. Research owns deploy + populated walk after the PR opens.

Need populated: P12 overdue, no-next-action, today/upcoming, won/open/lost, stages, logged recent, long names, large DZD, empty-ish workspace.

Walks: attention→QRD; today→P15; pipeline→P11; Cmd+K; complete overdue → attention gone; KPI proof; pipeline parity; today parity; permission; empty; 1440/1280/1024/768.

Regressions: P16, P15, P14, P13, P12, P11, P09/P10, Reports, app shell.

### Contabo (first populated pass)

**PARTIAL / MERGE_BLOCKING.**

PASS: Attention→QRD, attention resolution (6→5), Today parity, Pipeline, Command OS, 1440/1280/1024, regressions.

FAIL Sev2: at **768px**, KPI strip values overlapped/truncated. Page H-overflow was NONE (`scrollWidth=768`), but the strip was unreadable. Root cause: `flex overflow-x-auto` + `min-w-[7.5rem]` cards + `whitespace-nowrap` `text-kpi` DZD strings. **Fix in this PR:** 2×2 grid below `md`, 4-col at `md+`, wrapping / slightly smaller type. KPI pipeline semantics unchanged.

Note (not a product bug): Contabo P17SEED Won/Lost were on `pipeline_id=2` while Home KPIs scope **default pipeline id=1**. Seed for KPI proof must use the default pipeline. Do not change KPI pipeline semantics.

---

## HANDOFFS

| Later | Note |
|---|---|
| P18 Quotes | Do not redesign. Home does not own quotes. |
| P23 | Onboarding/connect guided actions removed from Home. |
| P24 | Ask Evo consumes P12/P15/P17 facts — no AI on Home. |
| P28 | Leftover Home widgets: `guided-actions`, `attention-list` (count cards), `activity-feed` (`updated_at`), `QuotaTracker` on Home, Lead OS/Places/brief on Home, Performance chart, Won by owner. |

---

## ACCEPTABLE DEFERRALS (taken)

No complete-from-Home. No quota/meetings/period picker/weighted/customization/AI/onboarding. Trend only when previous month won > 0. Recent is logged activities only.

## OUT OF SCOPE

P18–P29. No AI. No dashboard builder. No new forecast/activity/attention engines. No DataWorkspace on Home.

---

## AFTER

| Before | After |
|---|---|
| Command-center + Reports Lite | Operating home |
| Home-owned stalled/overdue counts | P12 deal queue + QRD |
| No Today | P15 My work preview |
| All deals in PHP + 5 KPIs + % from zero | DB aggregates, 4 honest KPIs |
| `updated_at` feed | `created_at` logged activities |
| Quota, chart, Lead OS, Places, research, guided connects | Off Home |
| Date/owner filters | Implicit month + permissions |
| KPI → Attention | Attention + Today → KPI → Pipeline + Recent |

---

## FILES CHANGED

| File | Change |
|---|---|
| `docs/implementation/p17-dashboard-operating-home.md` | Audit + matrix + AFTER |
| `app/Services/Home/HomeDashboardBuilder.php` | Bounded composition payload |
| `app/Http/Controllers/HomeController.php` | One builder call; drop quota/Lead OS/Places/brief |
| `app/Services/Crm/ActivityWorkQueueQuery.php` | Additive `dashboardWork` |
| `resources/js/pages/home.tsx` | Operating IA |
| `resources/js/components/dashboard/dashboard-header.tsx` | Greeting + date, no filters |
| `resources/js/components/dashboard/home-kpi-strip.tsx` | 4-metric strip |
| `resources/js/components/dashboard/dashboard-attention.tsx` | P12 rows + QRD |
| `resources/js/components/dashboard/dashboard-work.tsx` | P15 preview |
| `resources/js/components/dashboard/dashboard-pipeline.tsx` | Stage rows |
| `resources/js/components/dashboard/dashboard-recent.tsx` | Logged activities |
| `resources/js/lib/dashboard-operating-home.ts` | Href + display helpers |
| `tests/Feature/P17DashboardOperatingHomeTest.php` | Fixtures + parity + perms |
| `tests/js/p17-dashboard-operating-home.ts` | Hrefs / no Date.now |
| Home consumers | Command center, quota, polish, Lead OS Home, ActivityCreate, P10 Mobbin |

**Not changed:** `DealAttentionEvaluator` class, `ActivityTiming`, `DealBoardForecast`, P15 queue UI, QRD adapters, Command OS, Inbox, board/list engines, Quotes.

---

## REMAINING DEBT

- Complete-from-Home with explicit P15 identity  
- Quota / weighted / period selector (if product wants them later — not on operating home)  
- Contabo populated QA (re-walk 768 KPI strip after 2×2 / wrap fix)  

## P18 HANDOFF

Do not start P18. Quotes stay untouched.

## P24 HANDOFF

Home facts are P12/P15/P11 aggregates. Do not add model answers to Home.

---

## RISKS

- Existing Home command-center / quota / Lead-OS-on-Home tests must follow the new payload (updated in this PR).  
- Completing the last dated activity surfaces P12 `no_next_action` on Home — correct.  
- Contabo is a merge blocker owned by Research.

## TESTS

- `tests/Feature/P17DashboardOperatingHomeTest.php`
- `tests/js/p17-dashboard-operating-home.ts` (`npx vite-node`)
- Updated Home / polish / Lead OS Home / ActivityCreate / P10 consumers
- P16 / P15 / P12 / P11 / P09 / P10 source locks remain

Commands:

| Command | Result |
|---|---|
| Focused Pest (P17 + Home consumers + polish) | **70 passed** |
| `php artisan test` | **954 passed** (11819 assertions) |
| `npx vite-node tests/js/p17-dashboard-operating-home.ts` | **pass** |
| eslint on P17-touched JS | **pass** |
| `php artisan wayfinder:generate --with-form && npm run types:check` | **pass** |
| `composer types:check` | Repo-wide phpstan already red (~1585 errors on main-era files). Not a GitHub CI gate (`composer ci:check` = Pest only). |
| `npm run build` | **pass** |
| GitHub CI (`tests / ci`) | first run failed 6 Home consumer locks; fixes in this revision; re-run pending |

## LIVE VISUAL QA

**NEEDS RESEARCH.** Agent did not walk Contabo populated Dashboard after the 768 KPI strip fix. First Contabo pass was **PARTIAL** (Sev2 768 overlap). See Contabo note above.

## MERGE READY

NO — Contabo populated QA pending Research re-walk (768 KPI strip). Do not merge. Do not start P18.
