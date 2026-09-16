# P12 — Pipeline Attention & Sales Execution

**PR:** One deterministic attention system: which deals need attention, why, and what to do next.  
**Baseline:** `main` @ `ecec15b` (P11 #220).  
**Date:** 2026-09-16.

P00–P11 merged and frozen. P12 does not redesign the pipeline, invent AI risk/health, or rewrite the deal engine. P13 is not started.

---

## P12 STATUS

Shipped two factual signals only: **overdue activity** and **no next action**.  
**Deferred (honest):** stale deal, stage aging.  
One `DealAttentionEvaluator` feeds List, Board, Quick Record Drawer, and a compact Needs Attention queue.

## BASE / PR / TIP

- Base: `ecec15b8f7ce72325550325e9eaf6fb633a83e80`
- Branch: `cursor/p12-pipeline-attention-7551`
- Tip: this branch after the P12 commits

---

## 1 — AUDIT

Inspected Deal / Activity / Stage models, `DealObserver`, `DealController`, `PipelineManager`, `DealBoardForecast`, `DealPipelineBoard`, `PipelineKanban`, Deals List columns, QuickRecordDrawer + deal adapter + peek, P03C `DEAL_ADAPTER`, `CrmListShell`, `FilterBar`, SavedViews, `DealLayoutToggle`, `PipelineSwitcher`, Home `Needs attention`, health/LeadOs paths, and P07/P09/P10/P11 tests.

**Facts:**

| Topic | Finding |
|---|---|
| Task model | Does not exist. Tasks are `Activity` rows (`type = 'task'`). |
| Due field | `activities.due_at` only. No `due_date`. Completion = `done` + `completed_at`. |
| Deal next fields | `next_step` (free text), `next_activity_at` (datetime). List `next_step` column is computed. |
| Last activity | `deals.last_activity_at` updated by `ActivityRecorder`, `Deal::moveTo()`, and `DealHealthScorer::refreshOpenDealsForContact()`. Completing an activity does **not** touch it. Threads/outbound do not write deal last activity. |
| Stage entry | No `stage_entered_at`. No stage-history table. Proxy = `activities.type = stage_change`. Create/`update` can set `stage_id` without `moveTo()`, so first stage often has no history. |
| Won/Lost | `stages.is_won` / `stages.is_lost`. `deals.closed_at` set on terminal `moveTo()`. No deal `status` column. |
| Timezone | CRM date math is hardcoded `Africa/Algiers` (Home, board, activities, list). `config('app.timezone')` defaults to the same. `workspaces.timezone` exists but is not the backend clock. No user timezone. |
| Health / AI | `DealHealthScorer`, `DealHealthSnapshot`, `RecordInsight::dealHealth` exist. **P12 does not use them.** |
| Existing attention | Home `HomeDashboardBuilder::attention()` is a dashboard list, not a Deal evaluator. Board has `is_inactive` / `has_next_activity` from a different rule set. |

Search hits for stale / overdue / next_activity / stage_history / health / risk confirmed the above. No P12 evaluator existed.

---

## 2 — SOURCE-OF-TRUTH MATRIX

| SIGNAL | SOURCE | EXACT SEMANTICS | CONFIDENCE | PERMISSION SAFETY | PERFORMANCE COST | SHIP / DEFER | REASON |
|---|---|---|---|---|---|---|---|
| Overdue Activity | `activities` belonging to the deal | `deal_id` set AND `done = false` AND `due_at IS NOT NULL` AND `due_at < now(Africa/Algiers)` | High | Workspace-visible activities only; payload is subject + due, never body | One `whereIn(deal_id)` or `whereHas` subquery | **SHIP** | Real due timestamp vs authoritative now. Completed / future / null due ≠ overdue. `created_at` is never used as due. |
| No Next Action | Open deal + scheduled actions | Open (`stage.is_won = false` AND `is_lost = false`) AND no incomplete activity with `due_at` AND no `deals.next_activity_at >= now` | High | No extra activity fields | `whereDoesntHave` + stage predicate | **SHIP** | Reliable scheduled-action determination. Free-text `next_step` is **not** a next action. Overdue open activities count as having an action (overdue wins). |
| Stale Deal | `last_activity_at` / board `lastTouches` | No trustworthy “last meaningful sales/customer interaction” | Low | n/a | n/a | **DEFER** | `last_activity_at` is bumped by stage moves and health-scorer side effects; completion and customer threads are missing. `updated_at` is forbidden. Truthful absence > fake inactivity. |
| Stage Aging | stage-entry timestamp / history | No dedicated column; `stage_change` history incomplete on create | Low | n/a | n/a | **DEFER** | Cannot age a stage without a truthful entry stamp. Fallback to `created_at` / `updated_at` is fabrication. |

P12 does not ship all four. That is success.

---

## 3–4 — HARD TRUTH / NO AI

No invented CRM intelligence. `updated_at` is not engagement or stage entry. No customer interest, sentiment, likelihood, churn, quality, health, or engagement inference.

No OpenRouter, LLMs, ML, sentiment, AI risk, predicted close, 0–100 health, or A–B–C grades. P24 owns Ask Evo. P12 is deterministic facts.

Existing `DealHealthScorer` / `RecordInsight::dealHealth` / list `health` column remain as they were. P12 does not read them for attention.

---

## 5–9 — ONE DOMAIN / EVALUATOR / OUTPUT / SEVERITY / PRIORITY

**One class:** `App\Services\Crm\DealAttentionEvaluator`.

**Output (same shape everywhere):**

```
attention.signals[] + attention.primary
```

Signal: `type`, `severity`, `label`, `reason`, `at`, `ref`.

Shipped types: `overdue_activity`, `no_next_action`.

Board / List render **primary only** (compact `{ type, severity, label }`). Drawer can show multiple signals.

Severity is action urgency only: `critical` | `warning` | `info`. No numerical score.

Primary priority (shipped only): **overdue_activity > no_next_action**. Same deal ⇒ same primary on List, Board, Drawer.

No `BoardAttention` / `ListAttention` / `DrawerAttention` / `DashboardAttention` / `PipelineRiskEngine`.

---

## 10–14 — OVERDUE / TZ / DATES / NO NEXT ACTION / CLOSED

**Overdue:** Activity belongs to the Deal AND incomplete (`done = false`) AND real `due_at < now(Africa/Algiers)`. Completed / future / null due ≠ overdue. Never `created_at` as due.

**Timezone:** `DealAttentionEvaluator::TIMEZONE = Africa/Algiers`. Matches Home, `PipelineManager`, activities, deal list next-step formatting. Not browser-local. `workspaces.timezone` is documented and unused for this clock.

**Date tests:** future hour, exactly now, earlier today, yesterday, completed overdue, null due. Exactly-now is not overdue (`lt`, not `lte`) and counts as a scheduled next action.

**No next action:** open deal with no incomplete dated activity and no future `next_activity_at`. `next_step` text is ignored.

**Won/Lost:** no open-sales “No next action”. Overdue still follows Activity semantics (a Won deal with an overdue task can still be overdue).

---

## 15–18 — STALE / STAGE AGING / THRESHOLDS / CLOSED

**STALE DEFERRED.** `last_activity_at` is not last meaningful customer interaction.

**STAGE AGING DEFERRED.** No truthful stage-entry timestamp/history for all deals.

No new 7/14/30 scatter. No Settings UI (P21). Existing Home stalled (7d) and board inactive (14d) are **not** P12 attention.

Won/Lost excluded from no-next / (deferred) stale / (deferred) stage aging. Overdue follows Activity.

---

## 19–24 — ORTHOGONAL / P03C / QUERY / CONTINUITY / URL

Attention does not change stage, amount, forecast, totals, ownership, or business state.

`attention` is a P03C chrome filter on `DEAL_ADAPTER` (`ListQueryFilters.attention`). No `AttentionQuery` / `BoardAttentionQuery` / `RiskQuery`.

URL values (shipped only): `needs_attention` | `overdue` | `no_next_action`.

`needs_attention` = deal has ≥1 shipped signal (evaluator aggregate).

Composes with `q` / `owner` / `stage` / `pipeline` / `view` / `filter_id` / `filter_groups` / `sort`. Applied in `CrmFilter::applyToDeals` and also after `filter_groups` in `apply()`.

List → Needs attention → owner → search → Board → List: attention survives (`dealLayoutQuery` copies filters). Toggle / Switcher preserve via existing serialize. Page still drops on board (P11).

Attention URL via P03C. Drawer is not URL-addressable. P10 decision B frozen. No `peek=` in production nav.

---

## 25–33 — UI / BOARD / LIST / DRAWER

FilterBar existing primitive (deals quick fields): **All / Needs attention / Overdue / No next action**. No second toolbar.

P11 Board frozen except a restrained primary line. Healthy deals stay quiet (no Healthy/Good badges). Critical = `text-destructive`. Warning = ink. Info = mute. Orange is not used as a risk color.

List: one compact **Attention** column (`DealAttentionCell`). Not four columns. Same deal, same primary.

Drawer: frozen P09/P10 shell. Compact Needs attention section on overview when signals exist. Existing email / call / open-full actions only. No AttentionDrawer / mini Activities app.

---

## 34–44 — QUEUE / RESOLUTION / NO TABLE

Compact Needs Attention queue in the Deals workspace (max 8). Same evaluator. Order: severity, then overdue duration (earliest due first), then `deals.id`. Not amount.

View all → `attention=needs_attention` on the current list/board path. No `/crm/deals/attention`.

Queue row click → `openRecord`. Title link → full show href.

Resolution is derived: fix the CRM fact (complete the overdue activity, schedule a next action) → refresh → signal gone. No dismiss / ignore / mark healthy. No attention table.

---

## 45–52 — PERMISSIONS / PERF / FORECAST / MOVE / VIEWS

Peek/list/board payloads never include activity `body`. Labels use subject + formatted due.

No foreach-Deal activity query. `presentMany` / filter `whereHas` / queue `orderByUrgency` are set-based. Compact list/board payload is primary only.

Forecast math frozen (`DealBoardForecast` untouched). Amounts frozen. Move route frozen (`POST /crm/deals/{deal}/move`). Move to Won/Lost re-evaluates via exclusions.

Saved views: `fromSaved` / `resolve` read `attention` if present. Save form still posts advanced `filter_groups` (P03 architecture). No `AttentionSavedViews`. Persist-on-save of the chrome attention pill is deferred.

---

## 53–58 — BOUNDARIES / RESPONSIVE / A11Y

**Dashboard:** not redesigned. Home stalled/overdue items stay. **P17** can reuse `DealAttentionEvaluator` and point stalled/overdue hrefs at `attention=needs_attention` / `attention=overdue`. Not done here because Home “stalled” ≠ shipped P12 signals.

Activities P15 / Command P16 / Ask Evo P24: no changes.

Responsive: queue and FilterBar wrap; board still H-scrolls inside kanban; page `overflow-x-hidden` kept. No mobile Pipeline redesign (P25).

Attention is text (`Overdue activity` / `No next action`), not color-only. Queue rows and View all are keyboard reachable.

---

## 59–67 — TESTS / REGRESSIONS

Fixtures A–E: overdue, future, no next, Won, Lost. Time frozen at `2026-09-16 12:00 Africa/Algiers`.

Locks: evaluator, date boundaries, query composition, queue order, N+1 (no per-deal `activities.deal_id = ?`), resolution, move-to-Won, peek signals, `/leads` + no `/crm/deals/attention`.

P11 regression mandatory (same test file still green): stages, move, forecast, query, `/leads`. P09/P10 frozen. `/crm/leads` remains Lead workspace.

JS: `tests/js/p12-pipeline-attention.ts` imports layout contract (attention preservation + `applyAttentionFilter`).

---

## 68–74 — LIVE CONTABO QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** This agent cannot browser Contabo. Do not treat Pest as the populated-pipeline walk.

Research will deploy the tip. Checklist after deploy:

- Populated overdue / no-next / healthy / Won / Lost on List and Board.
- Attention filter All → Needs attention → Overdue → No next action.
- List → Needs attention → owner → search → Board → List (attention survives).
- Toggle / PipelineSwitcher preserve attention.
- Queue (≤8) urgency order; View all = `attention=needs_attention`; click peeks; title opens show.
- Complete overdue activity → signal gone. Schedule next action → no-next gone.
- Financial truth: amount / forecast unchanged vs P11.
- Drag 6px / menu move; move to Won/Lost → no-next drops.
- Drawer Needs attention + existing actions only. No `peek=` in the URL.
- 1440 / 1280 / 1024 / 768: board H-scroll, page no H-overflow.
- `/leads` → `/crm/deals/board`; `/crm/leads` Lead workspace.

---

## 75–76 — BLOCKERS / DEFERRALS

| Item | Status |
|---|---|
| Stale | Deferred — insufficient source truth |
| Stage aging | Deferred — no truthful stage-entry stamp |
| AI / health / grades | Out of scope (P24) |
| Settings thresholds | Out of scope (P21) |
| URL peek | Frozen P10 decision B |
| Board selection | Frozen P11 |
| Dashboard redesign | Deferred to P17 |
| Activities redesign | P15 |
| Saved-view chrome persist | Deferred (save posts filter_groups only) |
| Keyboard undo / rejection recovery (old master-plan P12) | Out of this brief; P11 move + menu stay |

---

## 77–79 — DOCS / COMMANDS / ACCEPTANCE

This file.

Commands:

| Command | Result |
|---|---|
| `php artisan test` | **924 passed** (11002 assertions) |
| `composer types:check` | Repo-wide phpstan already red (~1545 errors on main-era files). P12 evaluator has the same Eloquent-cast noise as the rest of CRM. Not a GitHub CI gate (`composer ci:check` = Pest only). |
| `php artisan wayfinder:generate --with-form && npm run types:check` | **pass** |
| eslint on P12-touched JS | **pass** |
| `npm run build` | **pass** |
| GitHub CI (`tests / ci`) | **green** — https://github.com/Mohamedbeghanem/EvoCrm/actions/runs/35046656885 |

### Acceptance checklist

- [x] Audit-first; no fabricated stale/aging
- [x] One evaluator; shipped overdue + no next only
- [x] Severity = urgency; primary priority overdue > no next
- [x] Timezone documented (`Africa/Algiers`)
- [x] Won/Lost exclusions for no next
- [x] P03C `attention=` compose + List↔Board continuity
- [x] No second toolbar; one Attention column; restrained board line
- [x] Drawer compact section; no AttentionDrawer
- [x] Queue 5–8; View all canonical; no `/crm/deals/attention`
- [x] Resolution derived; no dismiss table
- [x] Forecast / amount / move frozen
- [x] P11 / P09 / P10 not reopened
- [ ] LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX
- [x] GitHub CI green (Pest + `composer setup` / `ci:check`)

---

## FILES

| Layer | Path |
|---|---|
| Evaluator | `app/Services/Crm/DealAttentionEvaluator.php` |
| Query | `app/Services/Crm/CrmFilter.php` |
| List / board / queue payload | `app/Http/Controllers/Crm/DealController.php` |
| Board DTO | `app/Services/Crm/PipelineManager.php` (additive `attention` only) |
| Peek | `app/Support/QuickRecordPeek.php` |
| Columns | `app/Support/ListViewConfig.php` |
| P03C | `resources/js/lib/list-query/*` |
| UI | `deal-attention.ts`, `DealAttentionCell`, `DealAttentionQueue`, FilterBar, board card, drawer |
| Tests | `tests/Feature/P12PipelineAttentionTest.php`, `tests/js/p12-pipeline-attention.ts` |

---

## MERGE READY

YES — local Pest 924/924, `npm run types:check`, eslint on touched files, `npm run build`, and GitHub `tests / ci` are green. Contabo populated-pipeline visual QA is still **NEEDS HUMAN / RESEARCH BOX** (not faked). Do not merge. Do not start P13.
