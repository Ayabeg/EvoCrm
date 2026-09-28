# Deals pipeline board

## 1. Screen Identity

Screen ID: SCR-DEAL-002
Product area: CRM / Deals
Route: `/crm/deals/board`
Route name: `crm.deals.board` [CONFIRMED-CODE]
Frontend file: `resources/js/pages/crm/deals/board.tsx`
Primary component: `DealBoard` → `DealPipelineBoard` → `PipelineKanban`
Layout: App shell + `CrmListShell` `mode="board"`. Breadcrumbs: Deals → Pipeline. [CONFIRMED-CODE]
Authentication: same auth group as deals list.
Permissions: view workspace deals; drag/move requires `DealPolicy::move` = `crm.edit`. Team-only members see own deals. [CONFIRMED-CODE]
Parent navigation: Sidebar **Pipeline** (`/crm/deals/board`). Deals nav item excludes this path. [CONFIRMED-CODE]
Entry points: Sidebar Pipeline; list layout toggle; dashboard `view_all_href` `/crm/deals/board?pipeline=1`; **`GET /leads` 302 → `/crm/deals/board`** (SCR-LEAD-004 — mention only). [CONFIRMED-BOTH]
Exit points: card href / peek → deal show; **Edit stages** → `/settings/pipelines`; export; list toggle; create drawer POST `/crm/deals`.
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/deals/board`. [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `%TEMP%/evocrm-inertia/crm_deals_board.json`; `%TEMP%/evocrm-inertia/leads.txt`.

## 2. Purpose

Kanban of the selected pipeline: drag deals between stages, read per-column DZD totals and weighted forecast, surface attention and inactivity, customize card chrome.

## 3. Current UX Summary

Same list chrome as SCR-DEAL-001 (search, filters, views, stage pills, attention) plus forecast band bar and a horizontally scrolling six-column board. Cards are native HTML5 drag. Drop POSTs `/crm/deals/{id}/move`. No bulk selection. Board loads **at most 200 deals**. [CONFIRMED-CODE] `PipelineManager::boardData` `limit(200)`.

## 4. Screen Anatomy

1. `data-crm="deals-board"`.
2. List chrome: title Deals, Create deal, Board options dropdown, List|Board, pipeline switcher, filters.
3. Banner stack:
   - `DealForecastBar` (`data-testid="forecast-totals"`): Pipeline DZD, Open deals count, Weighted DZD, optional Band + Backtest.
   - `DealAttentionQueue`.
   - Empty pipeline banner (`data-crm="pipeline-empty"`) when `deals.length === 0`.
4. `DealPipelineBoard` inside `PipelineKanban` (`role="region"` `aria-label="Pipeline board"` `data-testid="pipeline-kanban"`).
5. Per column (`data-testid="stage-column-{slug}"`, width ~260–320px):
   - Header: stage name (uppercase), count, **amount DZD**, accent hairline (won success, lost danger, open neutral).
   - Stack of cards or dashed **No deals**.
   - Footer: **Weighted: {DZD} · {probability}%**.
6. Card (`data-testid="deal-card-{id}"`): title, association, amount, owner, attention, next activity, quote count, inactivity, close date, priority; ⋮ **Move to stage**.
7. Overlays: Board options sheet (`PUT /crm/deals/board/options`); Create drawer.

## 5. Data Displayed

Page props: `pipeline`, `pipelines`, `stages`, `deals`, `forecast`, `forecastBand`, `forecastBacktest`, `boardOptions`, `savedFilters`, `activeFilters`, `listView`, `members`, `recordCount`, `stagePills`, `cities`, `wilayas`, `attentionQueue`. [CONFIRMED-BOTH]

Seed pipeline **Sales** id 1. 6 stages. 15 deals. Forecast: count 15, amount_cents 299_500_000, weighted_cents 172_625_000. Band: low 129_468_750 – high 228_500_000, label **Upside likely**, source math. Backtest: status `insufficient_data`, label **Need 3+ closed deals**, sample_count 0. `boardOptions` defaults: card_style default, show_priority/associations/activity true, mark_inactive true, inactive_after_days 14, sort last_activity. [CONFIRMED-BOTH]

Stage payload: `id, name, slug, position, is_won, is_lost, probability, count, amount_cents, weighted_cents`. Seed New: probability **10**, count 0. [CONFIRMED-BOTH]

Card payload: title, amount_cents, currency DZD, stage_id, contact_name, company_name, owner_name, close_date, priority high|low|null, last_touch_at, inactive_days, is_inactive, has_next_activity, next_activity_label, quote_count, url, attention.

`stagePills` are **full filtered counts**; column `count` is cards actually loaded (≤200). They can diverge if the pipeline has >200 deals. [CONFIRMED-CODE]

## 6. Primary Actions

- Drag card onto another column → `POST /crm/deals/{deal}/move` `{ stage_id }` `preserveScroll`.
- Card ⋮ menu → same POST for any other stage.
- Click card background → peek (OVR-SHELL-006); title Link / modifier click → visit or new tab.
- **Create deal**.

## 7. Secondary Actions

- Board options: Edit cards, Edit stages, Export view.
- Options sheet tabs Cards / Board: card_style default|compact; show_priority; show_activity; mark_inactive + inactive_after_days 1–90; sort last_activity|amount|close_date|title. `show_associations` posted hidden `1`.
- Forecast bar is display-only.
- Attention View all.
- Same filters/search/export/pipeline as list.

## 8. Search

Same FilterBar **Search deals…** `q` on title. Constrains `boardData` via `applyToDeals`. [CONFIRMED-CODE]

## 9. Filters

Same deal filter bag as list, including stage pills (filtering the card set). Team-only / view=my. Board options sort is **in-column card order**, not the list `close_date` default (listView still sent). [CONFIRMED-CODE]

## 10. Sorting

Board cards: `DealBoardOptions.sort` — last_activity (default, last_touch then id), amount desc, close_date asc (nulls last), title. ListView sort does not reorder the kanban. [CONFIRMED-CODE] `sortBoardDeals`

## 11. Selection

`selectable: false`. No checkboxes. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT on board. Bulk exists only on list. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

No page pager. Hard cap **200 deals** per pipeline+filter. Loading: pulse skeleton columns (`aria-busy`). Attention queue still max 8. [CONFIRMED-CODE]

## 14. Forms

Create drawer (subset vs list: no contact select, no add-another). Board options PUT form.

## 15. Overlays

Create drawer; BoardOptionsSheet; card peek; shell overlays; lost-reason is **not** prompted on drag. [CONFIRMED-CODE]

## 16. States

Loading skeleton; empty filtered vs empty pipeline; dragging opacity 50%; drop-target column outline; moving disables ⋮; compact cards hide owner line; inactive/no next activity copy; forecast backtest insufficient_data.

## 17. Empty State

Filtered: status text **No deals match these filters**. Unfiltered: `EmptyState` kind pipeline, **No deals in this pipeline**, CTA Create deal. Per-column empty: **No deals**. [CONFIRMED-CODE]

## 18. Error Handling

Move `onError` toast: `errors.stage_id` or **Could not move this deal. Fill the required fields and try again.** Gate message: `Fill {labels} before moving to {stage}.` Cross-pipeline stage throws `InvalidArgumentException` (not a 422). [CONFIRMED-CODE] Not executed in crawl. [UNVERIFIED]

## 19. Feedback

Sonner toast on move error. Success is Inertia reload of board. Options sheet closes on success.

## 20. Navigation Behavior

`preserveScroll` on move. Layout href omits `peek`. `/leads` lands here. Create success redirects to **list** `/crm/deals`, not back to board. [CONFIRMED-CODE] `DealController::store`

## 21. Entity Relationships

Same deal graph as list. Quotes appear as `quote_count` on cards. Settings pipelines edit stage definitions including `required_properties` and `probability`.

## 22. Business Rules

### Weighted forecast

`weighted_cents = round(amount_cents * probability / 100)` (`DealBoardForecast`). Probability: stored `stages.probability` else config defaults: New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0; unknown open stages **20**. [CONFIRMED-CODE] `config/evosales.php`

Column header amount = sum of **loaded** card amounts (includes won/lost). Footer weighted uses that sum × stage probability. Forecast bar Pipeline = sum of stage amounts; Weighted = sum of stage weighteds; Open deals = loaded deal count (not necessarily open-only). List `forecast.open_cents` is **not** passed on board (`forecast()` vs `boardData` forecast). [CONFIRMED-CODE]

Band: `RecordInsight::pipelineForecastBand` (seed Upside likely). Backtest 90d.

### Board transition rules

There is **no sequential-stage lock**. UI allows drop or menu-move to **any other stage in the same pipeline**, including skipping, moving backward, Won, and Lost.

| Rule | Behavior | Evidence |
| --- | --- | --- |
| Same stage | Client no-op | `deal-pipeline-board.tsx` `deal.stage_id === stage.id` |
| Other stage, same pipeline | `POST /crm/deals/{id}/move` `{stage_id}` | `DealController::move` |
| Stage not in deal’s pipeline | `findOrFail` 404 if id missing in pipeline; `moveTo` throws if pipeline_id mismatch | `Deal.php` |
| Missing required properties on **target** | 422 `stage_id`: Fill X before moving to {name} | `StagePropertyGate` |
| Default seed stages | `required_properties: null` on deal 1’s Qualified; no extra fields required | `%TEMP%/evocrm-inertia/crm_deals_1.json` |
| Lost reason | Optional body field; stored only if target `is_lost` and filled. **Drag/menu do not send it.** No lost-reason modal on board. | `move()` + frontend POST |
| Won/lost | `closed_at` set/cleared via `isTerminal()`; activity `stage_change`; health refresh | `Deal::moveTo` |
| Auth | `authorize('move')` = `crm.edit` | `DealPolicy` |
| Create into stage | Store also `assertCanEnter` | `DealController::store` |

Forbidden transitions: **not a fixed adjacency matrix**. Forbidden only when (a) stage outside pipeline, (b) policy deny, (c) required properties empty on the destination (workspace-configurable in Settings → Pipelines).

## 23. Backend Dependencies

`DealController::board`, `updateBoardOptions`, `move`; `PipelineManager::boardData`; `DealBoardOptions`; `DealBoardForecast`; `RecordInsight` band/backtest; `DealAttentionEvaluator`; `StagePropertyGate`; `Deal::moveTo`.

## 24. Frontend Dependencies

`board.tsx`, `deal-pipeline-board.tsx`, `pipeline-kanban.tsx`, `deal-board-contract.ts`, `deal-forecast-bar.tsx`, `board-options-sheet.tsx`, `deal-layout-toggle.tsx`, `stage-colors.ts`, `formatDzd`.

## 25. Responsive Behavior

Kanban `overflow-x-auto`; columns fixed ~280px. Forecast bar `overflow-x-auto`. Empty/attention padding `md:px-8`. `motion-reduce:transition-none` on cards. Viewport not crawled. [NOT VERIFIED] [CONFIRMED-CODE] classes.

## 26. Accessibility Observations

CONFIRMED: region label Pipeline board; column count `sr-only` “deal(s)”; cards `tabIndex=0`, Enter/Space activate, `aria-grabbed`, `aria-label` Inspect {title}; ⋮ `aria-label` Move to stage; focus-visible outline.
LIKELY ISSUE: drag-and-drop without keyboard alternative except ⋮ menu (menu is the keyboard path); footer weighted not in header for SR scan.
REQUIRES MANUAL TEST: screen reader of DZD, drop with keyboard, peek vs visit.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-DEAL-010 | HIGH | Create from board redirects to **list**, not board | User loses kanban context | `store()` redirect |
| UX-DEAL-011 | HIGH | No lost-reason prompt on drop to Lost | Lost reason never captured from board | move POST body |
| UX-DEAL-012 | MEDIUM | 200-deal cap; column totals from loaded set | Incomplete forecast on large pipelines | `limit(200)` |
| UX-DEAL-013 | MEDIUM | Forecast “Open deals” is loaded count including won/lost | Misread of open pipeline | `forecast.count` = presented count |
| UX-DEAL-014 | LOW | Board create omits contact picker | Always creates contact from title | `board.tsx` Form |
| UX-DEAL-015 | LOW | `stagePills` vs column counts can disagree | Confusing counts | controller vs boardData |
| UX-DEAL-016 | OBSERVATION | Compact mode still shows amount; associations gated | — | `DealCard` |

## 28. Consistency Comparison

Shares list chrome with SCR-DEAL-001. Tickets board reuses `PipelineKanban` but different move API. Quotes have no board.

## 29. Functional Preservation Contract

Must keep: six (or workspace-defined) columns; DZD header totals; weighted footer + %; drag + POST move; ⋮ move; StagePropertyGate errors as toast; peek vs visit vs new-tab; 6px drag threshold; list/board toggle; forecast bar + band + backtest; board options persistence; attention queue; 200 cap behavior or an explicit replacement; pipeline switcher; create.

## 30. Design Input Contract

Purpose: move work through stages and read weighted pipeline.
Primary goal: change stage without opening the record.
Primary actions: drag/move, create, open/peek.
Secondary: board options, export, edit stages, filters.
Required information: stage name, count, DZD total, weighted DZD + probability, card title, amount, association, attention.
Required components: kanban, forecast bar, attention, list chrome, options sheet.
Required states: empty column, empty board, loading, drag, move error.
Information priority: column economics → card identity/amount → attention → activity.
Business-critical: move API, same-pipeline rule, property gates, DZD weighted math, probabilities.
Must not remove: move endpoint, weighted math, list toggle, DZD.

## 31. Open Questions / Unknowns

- Seed second pipeline name/stages: dump only shows first item. [UNKNOWN]
- Whether inactive_days uses Africa/Algiers correctly for all activity sources: code yes, UI crawl of stale cards [UNVERIFIED]
- Whether users expect create-from-board to stay on the board: product intent [UNKNOWN].
