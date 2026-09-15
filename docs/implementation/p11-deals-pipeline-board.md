# P11 — Deals pipeline board normalization

**PR:** Make Deals LIST and BOARD two views of one Deal workspace.  
**Baseline:** `main` @ `268caef` (P10 #219, tip `d919cf5`).  
**Date:** 2026-09-15.

P11 is view-mode normalization only. Deal engine, stage model, move route, forecast math, P09 adapters, and P10 URL decision B are frozen. P12 is not started.

---

## P11 STATUS

Normalized. `/crm/deals` and `/crm/deals/board` stay two routes. Both consume `CrmListShell` + P03C `DEAL_ADAPTER`. Board slots `DealPipelineBoard` through P03D `resolveWorkspaceBoardSlot`. Toggle and pipeline switcher preserve compatible query. Card click peeks via existing `openRecord`; identity link is full record; stage move reuses `POST /crm/deals/{deal}/move`.

## BASE / PR / TIP

- Base: `268caefba0cedeec9729906478e79f9bad4c963e`
- Branch: `cursor/p11-deals-pipeline-board-45bc`
- Tip: this branch after the P11 commits

## 0 — PRODUCT GOAL

User should feel “I changed the view of my deals,” not “I entered a different CRM module.” Shared: pipeline, filters, query, saved view, record context, navigation semantics.

## 1 — NON-NEGOTIABLE BUSINESS PRESERVATION

Unchanged: Deal model / persistence / permissions / ownership / amount / currency / pipeline / stage IDs / names / ordering, `POST /crm/deals/{deal}/move`, stage-transition rules, `DealBoardForecast` math, bulk routes, full record routes, associations, Quote relationships, Deal create, `/leads` → `/crm/deals/board`.

Stages stay exactly: New, Qualified, Demo, Proposal, Won, Lost.

---

## 2 — AUDIT (main @ 268caef)

| Surface | Before |
|---|---|
| List | `pages/crm/deals/index.tsx` → `CrmListShell` `resultMode="shared-table"` + P03C `DEAL_ADAPTER` (`q`, `view`, `owner`, `stage`, `pipeline`, `sort`, `direction`, `filter_id`, `filter_groups`). P07 columns. P10 `onRowPeek` → `openRecord`. Paginated. |
| Board | `pages/crm/deals/board.tsx` → `CrmObjectHeader` + `DealForecastBar` + inline `PipelineKanban`. Query consumed **pipeline only**. No `CrmFilter`. No saved views / search chrome. Card `router.visit(deal.url)`. |
| Toggle | `DealLayoutToggle` string-concat `?pipeline=` — dropped every sibling key. |
| Switcher | Board path used `emptyCanonicalListQuery()` (H4 “board does not leak list keys”). |
| Query keys | List = P03C canonical. Board = ad-hoc `pipeline`. No `BoardQuery` type, but a competing *behavior*. |
| Stage move | Existing `POST /crm/deals/{deal}/move` + `Deal::moveTo`. Inertia POST, no invented optimistic store. |
| Forecast | `PipelineManager::boardData` → `DealBoardForecast::weightedCents` on unfiltered pipeline deals (200 cap). |
| Board open Deal | Full visit. No peek. |
| List peek | P10 `openRecord({type:'deal',id},{opener})`. Peek not in URL (decision B). |
| List↔Board | Only `pipeline` survived. Search / owner / stage / view / `filter_id` / sort dropped. |
| QRD on Board | Provider already in `app-layout`. Board did not call `openRecord`. Safe to consume. |
| P03D slot | `resolveWorkspaceBoardSlot` ready; live board did not use it. |
| `/leads` | 302 → `/crm/deals/board`. `/crm/leads` = Lead workspace. |

P03C / P03D / P07 / P09 / P10 docs match this audit. Board was a second Deal surface, not a second Deal engine.

---

## 3 — BEFORE MAP

### List (keep)

| Concern | Owner | View-specific? |
|---|---|---|
| Route | `GET /crm/deals` | Yes — list path |
| Chrome | `CrmListShell` shared-table | Shared after P11 |
| Query | P03C + `CrmFilter::applyToDeals` | Shared after P11 |
| Pagination | `WorkspacePaginator` + `page` | **List only** — board is not paginated |
| Columns | `deal-columns.tsx` + `ListViewConfig` | **List only** |
| Selection / bulk | Uncontrolled + `BulkActionBar` when permitted | **List only** |
| Peek | P10 row activation | Shared after P11 (card) |
| Create | `CreateDrawer` POST `/crm/deals` | Shared |

### Board (before)

| Concern | Owner | Divergence |
|---|---|---|
| Route | `GET /crm/deals/board` | Keep two routes (`mode=` unsafe) |
| Chrome | `CrmObjectHeader` + pipeline-workspace | **Illegitimate** — second product header |
| Query | `pipeline` only | **Illegitimate** |
| Cards | Inline in `board.tsx` | Rendering ownership OK; visit-on-click not |
| Forecast strip | `DealForecastBar` | Keep; math unchanged |
| Board options | `BoardOptionsSheet` | Keep — sheet must not lie |
| 200 cap | `boardData` limit | Keep — board is not a paginated list |
| Tickets kanban | Same `PipelineKanban` | Shared chrome; tickets still visit |

Legitimate view-specific differences **not** “fixed”: pagination, columns, bulk checkboxes, 200-card cap, board-options card chrome, tickets visit-on-click.

---

## 4–5 — ARCHITECTURE / DATAWORKSPACE

One Deal domain. List and Board are view modes.

| Layer | Owns |
|---|---|
| DataWorkspace / `CrmListShell` | Chrome, query, saved views, filters, P03D board slot |
| `DealPipelineBoard` + `PipelineKanban` | Board rendering, columns, cards, H-scroll |
| Deal domain (`DealController`, `PipelineManager`, `CrmFilter`) | Semantics, move, forecast input set, permissions |

No `BoardDeal` / `KanbanDealModel` / `PipelineDealRecord` types beyond the existing board DTO (`BoardDeal` / `BoardStage` in `deal-pipeline-board.tsx`). Cards are **not** forced through `ListDataTable`.

`resolveWorkspaceBoardSlot({ mode: 'board', board })` is the live slot. List page still omits `board={` / `mode="board"` / `onModeChange`.

---

## 6–11 — TOGGLE / QUERY / URL / CONTINUITY

### Toggle

`dealLayoutHrefFromFilters(activeFilters, extras, target)` — P03C serialize. No string concat. Never writes `peek` / `mode` / `create`.

### Query (option A)

Board consumes the same `CrmFilter::resolve` + `applyToDeals` as List. No `BoardQuery`. Compatible keys: `q`, `view`, `owner`, `stage`, `pipeline`, `sort`, `direction`, `filter_id`, `filter_groups`, created/date chrome filters.

`teamOnly` / `mine` owner clamp matches List.

### Page reset

Board is not paginated. `dealLayoutQuery(..., 'board')` sets `page: null`. Board→List does not restore the old page. Documented; not a bug.

### PipelineSwitcher

Always `fromActiveFilters`. `applyPipeline` preserves siblings and drops `stage` (stage IDs are pipeline-local). Empty board + pipeline still `/crm/deals/board?pipeline=9`.

### URL

Canonical Inertia URL only. No mirrored React query. Peek stays out of the URL (P10 decision B). `peek` and `mode` remain `UNSAFE_QUERY_KEYS`.

### Continuity proofs (`deal-layout-contract.ts`)

1. List→Board preserves `q` / owner / created / status / stage / view / `filter_id` / sort / pipeline; drops `page`; no `peek` / `mode`.
2. Board→List restores compatible query; page stays reset.
3. Reconstructed board query writes back to list.
4. Pipeline switch on board preserves siblings and drops stage.
5. Empty board pipeline emits only `pipeline`.
6. Board search stays on `/crm/deals/board` and keeps siblings.
7. Page reset is board-only.

---

## 12–13 — HEADER / CHROME

Board header is P02 / `CrmListShell`: **Deals**, List|Board, Pipeline, search / filters / saved views, Create deal. `CrmObjectHeader` and `data-crm="pipeline-workspace"` removed. No horizontal CRM nav above the global shell. Board options stay a compact dropdown (Edit cards / Edit stages / Export), not a second product header.

---

## 14–23 — SUMMARY / COLUMNS / CARDS

### Summary

Existing `DealForecastBar` as a compact strip: deal count, pipeline total, weighted. Optional band / backtest remain pipeline-level `RecordInsight` (not filter-recomputed). No giant KPI row. No new forecast formula.

When filters are active, **presented** `forecast` / column counts / totals come from the filtered board set (same `DealBoardForecast::weightedCents`). Unfiltered board still matches `DealBoardTest`.

### Columns

NEW QUALIFIED DEMO PROPOSAL WON LOST — name, count, stage total. Weighted in the column footer from existing stage probability. Accents: open = hairline, Won = `--color-success`, Lost = `--color-danger`. Orange is not a stage color.

### Cards

Content-driven ~100–150px. Hierarchy: name, company/contact, `formatDzd(amount_cents)`, owner (`Unassigned` if null), `next_activity_label` **if a real Activity exists**, quote count **if `quote_count > 0`**. Existing board-options activity / inactive / priority / close date kept so the options sheet does not lie. No invented P12 health score.

Truncation on name / association / owner. White card, 1px hairline, 10px radius, no giant shadow.

---

## 20–21 — AMOUNT / OWNER

Same `amount_cents` + DZD/`formatDzd` as List / Show. No Quote recompute. Owner is compact text. No new assign UI.

---

## 24–29 — DRAWER / CLICK VS DRAG / A11Y

No `BoardDealDrawer`. No Deal adapter / P09 / P10 URL-B edits.

| Target | Action |
|---|---|
| Card background click (≤6px move) | `openRecord({ type: 'deal', id }, { opener })` |
| Identity `Link` (`deal.url`) | Full show |
| Open full in drawer | P09 `openFull` |
| Nested menu / button / link | `resolveRowActivation` → ignore |
| Cmd/Ctrl or middle | `window.open(href)` |
| Shift/Alt | `router.visit(href)` |
| Enter on focused card | Peek |
| Enter on identity link | Full |
| Drag past 6px / native drag | Move; drop never peeks |
| Move to stage menu | Same `POST /…/move` |

`CARD_DRAG_THRESHOLD_PX = 6`. `dragged` flag cleared on `dragEnd` (timeout 0) so a completed drag cannot peek. Tickets board still visits on card open (no Deal peek).

Keyboard: `tabIndex={0}`, `aria-label="Inspect {title}"`. Mouse drag is not the sole move method.

---

## 30–35 — MOVE / FORECAST

Reuse `POST /crm/deals/{deal}/move` exactly. `preserveScroll: true`. Duplicate-move guard (`movingId`). Failure → toast + server truth (no invented optimistic cache). No full-screen load. Same permissions / validation / `Deal::moveTo`.

Forecast math: `DealBoardForecast::weightedCents($amountCents, $probability)` unchanged. Visuals only reposition. After a successful move, Inertia reload refreshes counts / totals / forecast from the same presented set.

---

## 36–43 — EMPTY / CREATE / VIEWS / FILTERS / SEARCH / SELECTION

- Empty stage: compact dashed `PipelineKanbanEmpty`.
- Filtered-empty vs true-empty: compact filter banner vs Wave6 `EmptyState` `density="banner"` (`No deals in this pipeline`) plus existing `dealEmptyState`.
- Create Deal: same `CreateDrawer` + POST `/crm/deals`.
- Saved views: same `/crm/filters` entity `deal`. No `BoardSavedViews`.
- Filters / `q`: same `CrmFilter` language. No client-only subset filter.
- Selection: Board `selectable: false`. Checkboxes not forced. List selection is list-local and is not silently mutated by the board (separate page).

---

## 44–49 — DRAWER CONTEXT / SCROLL

Global P09 provider in `app-layout` (unchanged). Focus restore uses the card as `opener`. Associations unchanged. No peek URL.

Board owns H-scroll (`overflow-x-auto` on `PipelineKanban`). Page wrapper `overflow-x-hidden`. Columns `w-[280px] min-w-[260px] max-w-[320px]` with column `overflow-y-auto`. Sticky headers deferred (risk to drag). Drawer open/close does not `router.get` the board, so pipeline / filters / search / view / scroll stay.

Shared kanban width also applies to tickets — still inside 260–320.

---

## 50–55 — VISUAL / TYPE / SPACE / MOTION / RESPONSIVE

Locked tokens via existing EvoSales / Tailwind theme (`bg-canvas-soft` #F7F7F5, white surface, hairline borders, accent hover, success, danger). Cards: white, 1px, 10px, `shadow-none`. Type: 11 / 13, tabular money. Spacing 4–32. Hover/focus/drag restrained. `motion-reduce:transition-none`.

**1440 / 1280 / 1024 / 768:** LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX. No P25 mobile redesign.

---

## 56–68 — LIVE QA / REGRESSIONS / P12 BOUNDARY

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** This agent cannot browser Contabo. Do not treat harness-only or Pest as the populated-pipeline walk.

Required on research box after deploy:

- Populated pipeline: List / Board / Show amounts match for ≥3 deals.
- Stage / pipeline / weighted vs backend.
- Reversible stage move (drag + menu).
- Click vs drag (threshold; drop does not peek; click does not move).
- List→Board→List query walk + Back/Forward.
- Drawer + query walk; focus restore to card.
- P07 List regression.
- `/leads` 302 `/crm/deals/board`; `/crm/leads` Lead workspace.
- Inbox / Command / Dashboard untouched.

P09 / P10 frozen: no adapter / hydration / history / URL-B changes.

**P12 not implemented:** no attention intelligence, no invented activity health, no undo stack, no new scoring.

---

## 70 — TESTS

`tests/Feature/P11DealsPipelineBoardTest.php` + `tests/js/p11-deals-pipeline-board.ts` (imports `deal-layout-contract` + `deal-board-contract`).

Source-lock retargets (not weaken): P03C, P03D, P06, P07, P08, P09, P10, `CrmPipelineWorkspace`, `EvoCrmWave2`, `EvoCrmP10MobbinQa`, `ProductPolishWorkspace` — board page now hosts `DealPipelineBoard` / `CrmListShell` `mode="board"`.

Regression set: P01–P10 + `CrmListWorkspace` + `CrmBulkActions` + `Deal*` + `Lead*` + `Quote*` + `QuickRecord*`.

Commands: `php artisan test`, `npm run types:check`, eslint on touched files, `npm run build`.

### §70 lock coverage (1–45)

| # | Item | Lock |
|---|---|---|
| 1–7 | List/Board one workspace; no BoardQuery; two routes; no peek URL | P11 source + layout contract |
| 8–12 | Stages exact; move route; `/leads` | Feature + routes |
| 13–18 | Query apply `q` / owner / stage / `filter_id`; page drop | Feature + layout proofs |
| 19–22 | Amount / forecast / quote_count truth | Feature financial test |
| 23–28 | Toggle helpers; switcher `fromActiveFilters`; no concat | Source + JS proofs |
| 29–33 | Slot / shell / no list board props | P03D + P07 + P11 |
| 34–38 | Peek `openRecord`; no BoardDealDrawer; no adapter rewrite | Source + P09 adapter `formatMoneyCents` |
| 39–42 | Click/drag 6px; nested ignore; modifier new-tab | Board contract |
| 43–45 | Stage accents; peek/mode unsafe | Board contract + keys |

---

## 71 — DOCS

This file.

---

## P09 / P10 CONTRACT CONSUMED

Unchanged: one `QuickRecordDrawer`, deal adapter, peek endpoint, `openRecord({type,id},{opener})`, `resolveRowActivation`, `peek` unsafe, decision B. P11 only **calls** `openRecord` from the card. No adapter / hydration / URL helper activation.

## PROVIDER PLACEMENT

Still `app-layout.tsx`. No per-card provider.

## FILES CHANGED

- `app/Http/Controllers/Crm/DealController.php` — board uses `CrmFilter` + chrome props
- `app/Services/Crm/PipelineManager.php` — optional `$constrain`; `quote_count`; real `next_activity_label`
- `resources/js/lib/list-query/deal-layout.ts` — List↔Board href helpers
- `resources/js/lib/list-query/deal-layout-contract.ts` — continuity proofs
- `resources/js/lib/list-query/index.ts` — exports
- `resources/js/components/crm/deal-layout-toggle.tsx` — canonical hrefs
- `resources/js/components/crm/pipeline-switcher.tsx` — always `fromActiveFilters`
- `resources/js/components/crm/pipeline-card-interaction.ts` — 6px threshold
- `resources/js/components/crm/pipeline-kanban.tsx` — width, H-scroll, activation, a11y
- `resources/js/lib/stage-colors.ts` — `dealStageColumnAccent`
- `resources/js/pages/crm/deals/deal-pipeline-board.tsx` — Deal board renderer
- `resources/js/pages/crm/deals/deal-board-contract.ts` — click/drag/peek proofs
- `resources/js/pages/crm/deals/board.tsx` — `CrmListShell` + board slot
- `resources/js/pages/crm/deals/index.tsx` — toggle gets `activeFilters`
- `resources/js/components/crm/crm-list-shell.tsx` — P11 slot comment
- `resources/js/ds/workspace/types.ts` — comment
- `tests/Feature/P11DealsPipelineBoardTest.php`
- `tests/js/p11-deals-pipeline-board.ts`
- source-lock retargets listed above
- `docs/implementation/p11-deals-pipeline-board.md`

Not changed: Deal model, move controller, `DealBoardForecast`, P09 adapters, P10 URL helpers, Inbox, Command, Dashboard, `/leads` redirect.

## TESTS

See §70. JS proofs run via `npx vite-node tests/js/p11-deals-pipeline-board.ts`.

## LIVE VISUAL QA

**NEEDS HUMAN / RESEARCH BOX.** This agent cannot browser Contabo. Pest + JS contracts are not the populated-pipeline walk.

## REMAINING DEBT

- Contabo viewport / click-vs-drag / query / drawer walks
- Board 200-card cap (pre-existing; not pagination)
- `forecastBand` / `forecastBacktest` remain unfiltered pipeline-level RecordInsight
- Tickets board inherits kanban width + click/drag threshold (still visits)
- URL-addressable peek still deferred (decision B)
- List `page` does not survive List→Board→List
- Board selection absent by design

## DEFERRED TO P12+

Attention intelligence, invented activity health, undo, mobile board redesign (P25), URL peek, sticky column headers.

## RISKS

Click/drag misfires if a browser fires click after a short drag — 6px + `dragged` flag + `dragEnd` timeout. Shared `PipelineKanban` width change is visible on tickets. Filter-aware presented forecast can diverge from unfiltered band/backtest — documented, not a math rewrite.

## MERGE READY

YES — local Pest 912/912, types, eslint, build, and GitHub `ci` are green. Contabo populated-pipeline visual QA is still NEEDS HUMAN / RESEARCH BOX (not faked).

---

## Contabo / research checklist

- [ ] Deploy this branch to the research box
- [ ] Populated Deals pipeline (not empty workspace)
- [ ] List | Board feel like one workspace (same chrome, no second Pipeline header)
- [ ] ≥3 deals: amount List = Board = Show; DZD/DA
- [ ] Stage names: New, Qualified, Demo, Proposal, Won, Lost
- [ ] Weighted / column totals match backend for the **visible** filter set
- [ ] Search / owner / stage / saved view / pipeline survive List→Board→List
- [ ] `page` dropped on Board (expected); Back/Forward restore URL query
- [ ] Card click peeks; identity opens show; Open full opens show
- [ ] Drag past 6px moves; drop does not peek; click does not move
- [ ] Move to stage menu uses existing route; reversible
- [ ] Failed move shows error and server truth
- [ ] Drawer close restores focus to the card; scroll/H-scroll survive
- [ ] Filtered-empty vs true-empty copy
- [ ] Create Deal still works
- [ ] `/leads` → board; `/crm/leads` is Leads
- [ ] Inbox / Command / Dashboard unchanged
- [ ] 1440 / 1280 / 1024 / 768: no page H-overflow; columns ~260–320
- [ ] Reduced-motion: no large motion
- [ ] P07 List / P09–P10 peek on other objects still work
