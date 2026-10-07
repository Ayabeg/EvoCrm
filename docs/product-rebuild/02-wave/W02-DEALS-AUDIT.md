# W02 — Deals composition audit (Wave 2, Agent A)

**Wave:** 2 · **Agent:** A (audit only)  
**Lane:** Deals composition (`/crm/deals`, `/crm/deals/board`)  
**Branch:** `cursor/w02-deals-audit-909f`  
**Base:** `rebuild/p01-certification` @ `72877f7c` (`docs(rebuild): recertify Gate A on the final 39c7de4 stack`)  
**Product head inside that stack:** `39c7de4e`  
**Date measured:** 7 October 2026  
**Host:** localhost only (`http://127.0.0.1:8000`). No deploy, DNS, production, or extra seed records.

**Product-code freeze:** this PR does not change `resources/js`, `app/`, `routes/`, `database/`, `config/`, or `tests/` product files. Added only this document, before-captures, and the audit capture script.

**UX authority:** EvoCRM Product Layout Blueprint V1 §17 (Deals), §12 header slots, D15.  
**Contract authority:** this repository. Where the blueprint invents a route, prop, permission, filter, saved-view, status machine, or component API that the code does not have, **the existing contract wins**. Conflicts are reported; nothing is invented.

**Product-owner decision C-18 (APPROVED):** the large Forecast / Attention region must **not** be permanent default chrome above the pipeline. Preserve its functionality and data; move it to a contextual surface, disclosure, secondary view, or other Blueprint-compliant location. The pipeline is the primary work surface.

**Required hierarchy (C-18 + Blueprint §17):**

1. Deals identity  
2. Saved dataset views  
3. **One** compact operational toolbar  
4. Pipeline / list  

Board columns already carry stage + count + value. There must be **no** separate full-width summary band. List and Board stay two presentations of the **same** dataset / URL state.

---

## 0. How to read this

- **KEEP** — stays in the default stack, possibly restyled.  
- **MERGE** — same contract, folded into an existing WorkspaceHeader slot (J–Q) or column header.  
- **MOVE** — functionality and data stay; leave the default stack.  
- **COLLAPSE** — same controls, denser (one row, icons, overflow).  
- **REMOVE FROM DEFAULT** — not in the default Deals chrome. Data / props / endpoints stay.  
- **RESPONSIVE ONLY** — allowed only at a named breakpoint, not as desktop chrome.

Target first-content Y at 1440×1000: **≤ 200**, Blueprint goal **≈ 148**. Gate A already measured list **y=717**, board **y=793**. This audit remeasures the same stack and classifies every band.

---

## 1. Measurement identity

| Fact | Value |
|---|---|
| Login | `owner@evosales.local` / `password` |
| Workspace | **Evotechly** (DatabaseSeeder). VisualQaSeeder also ran and created Cabinet El Aurassi / `visualqa@evosales.local` — **not** used. |
| Simple mode | false |
| Seeded Deals (this workspace) | **15** |
| Pipelines | **1** (`PipelineSwitcher` returns `null` when `pipelines.length <= 1` — `pipeline-switcher.tsx:27-28`) |
| Stages | **6** from the workspace pipeline: Nouveau 3 · Qualification 3 · Négociation 3 · Proposition 3 · Gagné 2 · Perdu 1 |
| Forecast totals (board) | Pipeline **2 995 000 DA** · Open **15** · Weighted **1 638 750 DA** · Band 1 229 063 – 2 212 313 DA |
| Inbox | workspace `inbox_url` unused on these routes |
| Console | **0** errors on all 18 shots (`artifacts/product-rebuild/02-wave/before/deals/console-errors.json`) |
| Capture | `scripts/product-rebuild/deals-audit-capture.mjs` → `artifacts/product-rebuild/02-wave/before/deals/` |
| Window scroll | `windowScrolls: false` on every Deals capture (frame-owned) |

Gate A recert (`P01-FRAME-REPORT.md`, `P01-QA.md`) already locked: rail 224 / 56 / overlay; one orange primary; Deals forecast + attention **visible by default** (R06-01 reverted the closed-`<details>` experiment). This audit does not reopen the frame.

---

## 2. Architecture map (live contract)

Every citation is the current product on `rebuild/p01-certification`. List and Board share chrome through `CrmListShell` → `DataWorkspace`. They are **not** two apps.

### 2.1 Routes

| Path | Name | Controller | Inertia page |
|---|---|---|---|
| `GET /crm/deals` | `crm.deals.index` | `DealController::index` `app/Http/Controllers/Crm/DealController.php:37-153` | `resources/js/pages/crm/deals/index.tsx` |
| `GET /crm/deals/board` | `crm.deals.board` | `DealController::board` `:155-217` | `resources/js/pages/crm/deals/board.tsx` |
| `POST /crm/deals` | `crm.deals.store` | `:311` in `routes/web.php` | MorphingForm on both pages |
| `POST /crm/deals/{deal}/move` | `crm.deals.move` | `DealController::move` `:439-457` | `deal-pipeline-board.tsx:78-94` |
| `PUT /crm/deals/board/options` | `crm.deals.board.options` | `updateBoardOptions` `:219-233` | `BoardOptionsSheet` |
| `GET /crm/deals/export` | `crm.deals.export` | `web.php:301` | header overflow / FilterBar export |
| `POST /crm/deals/bulk` | `crm.deals.bulk` | `web.php:307` | list `BulkActionBar` only |
| Import / show / attributes / ask | `web.php:302-322` | out of this composition lane | — |

`routes/web.php:184` still redirects `/leads` → `/crm/deals/board`. Do not invent `/crm/deals/attention` (P12 lock).

### 2.2 Page composition

```
EvoShell + EvoRail
  └─ WorkspaceFrame (archetype=workspace; list scrollOwner=surface; board=pipeline)
       └─ page root
            list:  data-crm="deals-workspace"   index.tsx:78-80
            board: data-crm="deals-board"       board.tsx:121-123
            └─ CrmListShell
                 └─ DataWorkspace
                      PageHeader → WorkspaceHeader (slots A–H only today)
                      banner (list: AttentionQueue; board: ForecastBar + AttentionQueue [+ empty])
                      SavedViews
                      FilterBar  (layoutToggle + pipelineSwitcher in filterExtra)
                      toolbarExtra = StagePills
                      surface = ListDataTable  |  DealPipelineBoard
```

| Layer | File:line | What it does |
|---|---|---|
| List page | `index.tsx:75-178` | `CrmListShell` `resultMode="shared-table"`, `banner=<DealAttentionQueue>`, `layoutToggle`, `pipelineSwitcher`, MorphingForm create, bulk when `crm.bulk` |
| Board page | `board.tsx:118-311` | Same shell, `mode="board"`, `banner=<DealForecastBar>+<DealAttentionQueue>`, `board=<DealPipelineBoard>`, Board options dropdown, `selectable: false` |
| List shell mapper | `crm-list-shell.tsx:77-81`, `:255-343`, `:345-361` | Maps Inertia props → DataWorkspace. `filterExtra` = layout toggle + pipeline switcher (`:302-307`). `toolbarExtra` = `StagePills` for deal/ticket (`:308-335`) |
| DataWorkspace | `DataWorkspace.tsx:82-273` | Order: `PageHeader` → `banner` → `SavedViews` → `FilterBar` → `toolbarExtra` → bulk → surface (`:158-271`) |
| PageHeader adapter | `ds/chrome/PageHeader.tsx:17-42` | Forwards title / count / primary / secondary into `WorkspaceHeader`. **Does not fill slots J–Q.** |
| WorkspaceHeader | `WorkspaceHeader.tsx:20-266` | Slots A–I on row 1 (`:92-163`); J / L / M / N / Q on views row (`:166-251`); chips/bulk row 3. Slots N–P share the `filters` prop (`types.ts:66-67`). O and P have **no** separate `data-workspace-slot`. |
| Frame / scroll | `WorkspaceFrame.tsx:21`; `routes.ts:63-73`; `workspace-frame.css:18-26` | `/crm/deals` → `scrollOwner: 'surface'`; `/crm/deals/board` → `'pipeline'`; `shellScroll: 'frame'`. Window does not scroll. |
| Rail / mobile chrome | `evo-shell.tsx:317` | `evo-mobile-header` **48px**, `min-[769px]:hidden`. Adds a band **above** WorkspaceHeader at ≤768. |

### 2.3 Shared list ↔ board query

| Contract | File:line |
|---|---|
| One Deal query; board drops `page` | `lib/list-query/deal-layout.ts:10-27` |
| Paths `/crm/deals` · `/crm/deals/board` | `:5-6`, `:30-32` |
| Toggle writes those hrefs | `deal-layout-toggle.tsx:21-23`, `:30-56` |
| Compatible siblings: search, view, filter_id, chrome filters, filter_groups, sort, pipeline | `deal-layout.ts:13-14` |
| Never writes peek / mode / create | `deal-layout.ts:14-15` |
| Proofs (list↔board keep `attention=needs_attention`) | `deal-layout-contract.ts:89-156` |
| Chrome filter keys include `attention` | `lib/list-query/keys.ts:21-33` |
| `applyAttentionFilter` modes: `needs_attention` \| `overdue` \| `no_next_action` | `lib/list-query/patch.ts:193-201` |
| `applyStageFilter` / `applyPipeline` / `applyBuiltInView` | `patch.ts` + `DataWorkspace.tsx:276-323` |

**List and Board are two presentations of the same dataset.** Implementation must keep `dealLayoutHref` / `dealLayoutQuery` and must not invent a second filter bag.

### 2.4 Saved views

| Fact | Citation |
|---|---|
| Built-ins for deals | `SavedViews.tsx:128-139` — **All :noun** + **My :noun** only. Tickets get extra built-ins (`:102-127`); deals do not. |
| Seeded extra on Evotechly | « Pipeline ouvert » + « Ajouter une vue (1/5) » — a saved filter, not a server built-in. |
| No « Ouvertes » / « À relancer » / « Clôturées » built-ins | Blueprint §17 view bar. **Do not invent server views.** « À relancer » = existing `attention=needs_attention` (PAGE-DEAL-01, C-18). « Ouvertes » would be a client/saved view over open stages, not a new API. « Clôturées » = won+lost filter if/when a saved view writes existing stage/status keys. |
| Active id | `filter_id` else `view ?? 'all'` — `crm-list-shell.tsx:256-258` |
| Visit owner | SavedViews `<Link href={viewHref(...)}>`; shell `onViewChange` is a no-op comment (`:259-269`) |
| Cap | UI copy « (1/5) » — existing saved-view limit. Do not raise it. |

### 2.5 Filters / search / toolbar

| Control | File:line | Notes |
|---|---|---|
| FilterBar | `ds/workspace/FilterBar.tsx:54-236` | `data-crm="list-toolbar"`. Deal quick fields: `owner`, `created`, `status`, `attention` (`:21`, `:87`) |
| Search | inside FilterBar | Writes `q` via list-query. Not in header slot M today. |
| Advanced | `AdvancedFilterDrawer` from `DataWorkspace.tsx:240-252` | GET + list-query; shell `onFiltersChange` is a no-op (`crm-list-shell.tsx:272-275`) |
| Layout toggle | `deal-layout-toggle.tsx:10-58` | `data-testid="deal-layout-toggle"`. Passed as `filterExtra`, **inside** FilterBar — also a second List/Board pair from DataWorkspace `onModeChange` (`DataWorkspace.tsx:207-234`) which Deals **does not set** (`board.tsx` P11 lock: `not->toContain('onModeChange')`) |
| Pipeline selector | `pipeline-switcher.tsx:14-28` | Hidden when only one pipeline. Slot B / title dropdown in Blueprint; today it sits in the FilterBar extra. |
| Stage pills | `stage-pills.tsx:12-26` | Full-width count strip. `applyStageFilter` via `crm-list-shell.tsx:323-333` |
| Board options | `board.tsx:209-227`, `board-options-sheet.tsx` | Header secondary today. Blueprint: Affichage (slot P). |

### 2.6 Stage data

Stages come from the **workspace pipeline**, not from the Blueprint’s three named columns.

| Source | File:line |
|---|---|
| List stage pills | `DealController::index` `:98-110`, `:141` — count per stage after applying filters minus `stage` |
| Board columns | `PipelineManager::boardData` via `board()` `:169-176`, `:201` — each stage has `count`, `amount_cents`, `weighted_cents` (`deal-pipeline-board.tsx:28-38`) |
| Board pills (duplicate of column counts) | `board()` `:178-192`, `:212` |
| Column header UI | `PipelineColumn.tsx:63-82` — **name + count + amount already rendered** |
| C-03 | `BLUEPRINT-IMPLEMENTATION-MATRIX.md` C-03 — **do not hardcode 3 stages**. Gagné / Perdu are real stages on this seed and currently **are columns**. Blueprint drop-bar is OK only as an extra target for those existing stages, not as a replacement that deletes them from pipelines that still return them. |

Seeded Evotechly: 6 stages including won/lost as columns. Blueprint §17 « exactly 3 open stages » and « 25 open deals / 1 320 000 DA » are **AMB-07 demo figures**, not acceptance.

### 2.7 Forecast (real contract)

| Piece | File:line |
|---|---|
| Board UI | `DealForecastBar` in `board.tsx:249-253`; component `deal-forecast-bar.tsx:53+`; `data-testid="forecast-totals"` |
| Props | `forecast`, `forecastBand`, `forecastBacktest` from `DealController::board` `:203-205` |
| List also computes `forecast` + `openPipelineCents` | `index()` `:121-145` — **not rendered** on the list page |
| Math | `DealBoardForecast` / `PipelineManager::forecast`; locked by `DealBoardTest`, `DealGuidanceTest`, `ForecastBacktestTest`, `P11DealsPipelineBoardTest` |
| Blueprint | « KPI strip removed; forecast lives in Rapports » (§17). **No Deals→Rapports route is specified in contract.** Do not invent `/reports/forecast` or a new reports widget. **C-18:** preserve data; relocate the surface. Safe destinations: header slot L one-liner, a disclosure / sheet the user opens, or an existing reports page **only if** that page already consumes these props (it does not today). |

### 2.8 Attention (real contract)

| Piece | File:line |
|---|---|
| Queue UI | `deal-attention-queue.tsx:7-99`; `data-crm="deal-attention-queue"` |
| Empty | returns `null` when `items.length === 0` (`:26-28`) |
| View all | writes `attention=needs_attention` on the **current** basePath (`:20-24`, `:43-56`). **No** `/crm/deals/attention` |
| Row click | `openRecord({ type: 'deal', id })` QuickRecord (`:66-70`) |
| Server queue | `DealController::attentionQueue` `:466-488` — composes current filters + forces `attention=needs_attention`; `DealAttentionEvaluator::queue` |
| Evaluator | `needs_attention` \| `overdue` \| `no_next_action`; `QUEUE_LIMIT` 8; timezone `Africa/Algiers` (P12) |
| Filter | `CrmFilter::applyDealAttention` |
| Home | `HomeDashboardBuilder` `view_all_href=/crm/deals?attention=needs_attention` |
| Card / row | `BoardDeal.attention` (`deal-pipeline-board.tsx:58`); `DealAttentionCell` in `deal-columns.tsx`; QuickRecord `data-crm="deal-attention"` |
| C-18 / PAGE-DEAL-01 | Hide the **block**. Keep query param, evaluator, Home href, card stale state. Wire a **saved view** (or built-in tab that only writes `attention=needs_attention`) labeled « À relancer ». Do not invent a server view name. |

### 2.9 Pipeline / DnD / mutations

| Piece | File:line |
|---|---|
| Board surface | `deal-pipeline-board.tsx` → `Pipeline` + `DealCard` + `LostReasonDialog` |
| Move | `moveDeal` `deal-pipeline-board.tsx:78-94` — `router.post(/crm/deals/${id}/move, { stage_id, lost_reason }, { preserveScroll: true })` |
| Server | `DealController::move` `:439-457` — `authorize('move')`, validate `stage_id` + optional `lost_reason`, `deal->moveTo($stage, $user)` |
| Policy | `DealPolicy::move` `:28-31` = `update` = `canEditWorkspaceRecord` = workspace + `crm.edit` (`AuthorizesWorkspaceCrmRecord.php:26-30`) |
| Lost reason | `LostReasonDialog` — required on drop to a lost stage (existing) |
| Create | `POST /crm/deals` via MorphingForm (`index.tsx:90-104`, `board.tsx:133-186`) |
| Board options | `PUT /crm/deals/board/options` |
| Bulk (list only) | `POST /crm/deals/bulk` when `bulk.enabled` / `crm.bulk` (`index.tsx:73`, `:159-176`) |
| Legacy kanban | `pipeline-kanban.tsx` is used by **leads/tickets**, not the live deals board. Do not retarget it. |

Gate A already proved `POST /crm/deals/1/move` `{"stage_id":2}` and restore (`P01-QA.md`).

### 2.10 QuickRecord / peek

| Piece | File:line |
|---|---|
| Shell wires `onRowPeek` | `crm-list-shell.tsx` + `useQuickRecord` |
| Board card | `deal-pipeline-board.tsx:151` `openRecord({ type: 'deal', id })` |
| Attention row | `deal-attention-queue.tsx:67-70` |
| Drawer | `QuickRecordDrawer.tsx` (P09/P10 contract; URL peek sync deferred) |
| List row | `ListDataTable` `onRowPeek` (`DataWorkspace.tsx:72`) |

Peek JSON and `openRecord` stay. Composition work must not invent a second peek URL scheme.

### 2.11 Permissions / Simple Mode

| Gate | Where |
|---|---|
| Import link | `auth.capabilities.includes('crm.import')` `index.tsx:72`, `:126-130` |
| Bulk | `crm.bulk` `index.tsx:73` |
| Create / move / update | `crm.edit` via policy |
| Team-only members | `deals.team_only` forces `owner` (`DealController.php:43-48`, `:161-166`) |
| Saved-view manage | owner/admin `DataWorkspace.tsx:118` |
| Simple nav | `SimpleMode::SIMPLE_NAV` still includes Deals (C-02). Do not drop it. |

### 2.12 Responsive / scroll / RTL / dark

| Concern | Live behavior |
|---|---|
| 1440 / 1280 | Rail **224**. Frame x=224. |
| 1024 | Rail **56**. Frame x=56. FilterBar wraps to **148px** (2–3 rows). |
| ≤768 | Rail overlay **width 0**. Extra **48px** `evo-mobile-header`. WorkspaceHeader starts at y=48. Stage pills wrap (74 → 146 @768; 102–125 @390/430). |
| 390 list | Table is **below the fold** inside a clipped surface scroller. Capture `firstUsefulY=0` is a **measurement artifact** (zero-size / not in viewport). Screenshots are chrome-only. |
| 390 board | First card **y=907** on an 844-tall viewport — below the fold. Blueprint PAGE-DEAL-02 wants **stage tabs + list, no drag**. Out of this composition’s exclusive desktop stack but the chrome height is why the card never appears. |
| Scroll | List: surface. Board: pipeline horizontal + **5 nested column** `overflow-y-auto` (1440). Window does not scroll. |
| RTL AR 1440 | `dir=rtl`; rail at **x=1216**. First card x=947 (start edge = right). Attention wraps taller (**386.2** vs 362). |
| Dark 1440 | Same band heights as FR light (list 717 / board 792.5). |
| One orange | `primaryActionCount: 1` — « Créer une affaire » / « Create deal » / « إنشاء صفقة » on every shot. |

### 2.13 Header slots vs what Deals fills

| Slot | Blueprint §12 / §17 | Deals today |
|---|---|---|
| C | « Deals » | Filled via PageHeader title `t('Deals')` → « Affaires » |
| D | count of current view | PageHeader `description` = « 15 affaires » |
| B | Pipeline selector in title if >1 pipeline | Exists as FilterBar extra; **hidden** on this seed (1 pipeline) |
| F | Importer | List: `CrmObjectSecondaryLink` when `crm.import`. Board: buried in Board options |
| G | ⋯ Exporter, pipeline settings | Board dropdown. List: export lives in paginator / FilterBar |
| H | + Nouvelle affaire | MorphingForm / PageHeaderAction — **one orange** |
| J | Ouvertes · Mes · À relancer · Clôturées · + | **Not filled.** SavedViews is a **sibling band** under the banner |
| L | `n · amount DA` | **Empty.** Forecast is a 50.5px strip, not a one-liner |
| M | search | Inside FilterBar |
| N–P | Filtrer / Trier / Affichage | FilterBar + Board options — **sibling band**, 104px (wraps to 148–264) |
| Q | Liste / Tableau ⌘B | `DealLayoutToggle` inside FilterBar extra, not slot Q |

WorkspaceHeader **already accepts** `views`, `viewItems`, `summary`, `search`, `filters`, `layoutToggle`. DataWorkspace / PageHeader simply do not pass them.

---

## 3. Blueprint §17 vs live screen

| Blueprint | Live (Evotechly, 1440 FR light) | Verdict |
|---|---|---|
| Identity → views → one toolbar → pipeline | Identity → **Forecast (board)** → **Attention 362px** → views → FilterBar → **StagePills** → pipeline | **Conflict with C-18 / LAW-06 / LAW-07 / PAGE-DEAL-01 / REM-02** |
| First card y ≈ 148 (L6 ≤ 200) | List **717** · Board **792.5** | Fail LAW-06 |
| View bar 40px with Ouvertes / Mes / À relancer / Clôturées | SavedViews 39px: Tous / Mes / Pipeline ouvert / + | Partial. Missing À relancer / Ouvertes / Clôturées as **named views**. Mes already exists (`view=my`) |
| KPI / Forecast / Needs attention / stage-count strip **removed** | All four present on board (list has attention + pills, no ForecastBar) | C-18 / REM-02 |
| Column header: name + count + amount + share bar | `PipelineColumn` has name + count + amount (`:63-76`). No share bar, no hover « Valeur moyenne · Âge moyen » | KEEP header; share/hover are additive if data exists on `BoardStage` (count + amount_cents + weighted_cents **do** exist — share can be derived client-side without a new endpoint) |
| Gagné / Perdu = drop targets, not columns in « Ouvertes » | They **are columns** (C-03). Seed has 2 won + 1 lost | Do not hard-delete columns. An « Ouvertes » **view** may hide them by filtering stages — only if the filter/query already supports that. Today `stage` is a single slug, not « all open ». **Report:** hiding won/lost needs a filter that the server already understands (omit won/lost in the view’s stage set, or a saved filter). Do not invent `view=open` server-side unless it already maps. `index()` already computes `$openQuery` (`:112-115`) but does not expose an `open` list view. |
| Card: next action + stale bar; attention is card state + « À relancer » view | Cards already show next activity / « Aucune prochaine action » / attention (`deal-pipeline-board.tsx:110-134`). Queue is a **second** surface | MOVE queue; KEEP card state |
| List = same header + same views + grid | Same chrome minus ForecastBar. Same `activeFilters` / `dealLayoutQuery` | KEEP shared state |
| ⌘B list ↔ board | Toggle is a Link, not documented as ⌘B in the page | Keyboard is later; href contract stays |
| Mobile 390: stage tabs + list, no drag | Still a horizontal board; first card below the fold | PAGE-DEAL-02 — flag for the implementation agent; desktop C-18 chrome is the blocker |
| Forecast in Rapports | Props exist; no reports consumer on this page | MOVE, do not invent a reports route |
| 25 deals / 3 columns / 1 320 000 DA | 15 deals / 6 stages / 2 995 000 DA | AMB-07. Not a bug |

---

## 4. Vertical band tables

Heights are `getBoundingClientRect()`. Y is viewport-absolute. « First useful » = first deal **row** (`TR`) or first **DealCard**.

### 4.1 Board `/crm/deals/board` — 1440×1000 FR light (primary)

Screenshot: `deals-board__1440x1000__fr__light.png`

| # | Band | Selector | y | h (px) | bottom | Class | Target location |
|---|---|---|---:|---:|---:|---|---|
| — | EvoRail | `[data-evo-rail]` | 0 | 1000×**224** wide | — | KEEP | Frame. Not a vertical content band. |
| 0 | WorkspaceHeader | `[data-workspace="header"]` | 0 | **56** | 56 | **KEEP** (trim toward 48 if slots J–Q join this header) | Stays. Fill C/D/F/G/H. Add J–Q **into** this header, do not keep a second header. |
| 0a | Gap header → forecast | — | 56 | **8** | 64 | COLLAPSE | Workspace padding / `--workspace-gap`. Should disappear when banner leaves. |
| 1 | DealForecastBar | `[data-testid="forecast-totals"]` | 64 | **50.5** | 114.5 | **REMOVE FROM DEFAULT** | Preserve `forecast` / `forecastBand` / `forecastBacktest` props. Surface as (a) WorkspaceHeader slot **L** one-liner (`n · amount · weighted`) and/or (b) a user-opened sheet / disclosure / overflow item. **Not** a permanent strip. Do **not** invent a Rapports route. |
| 1a | Gap | — | 114.5 | **12** | 126.5 | COLLAPSE | Goes with the banner. |
| 2 | DealAttentionQueue | `[data-crm="deal-attention-queue"]` | 126.5 | **362** | 488.5 | **REMOVE FROM DEFAULT** / **MOVE** | Function stays: evaluator, `attentionQueue` prop, `?attention=needs_attention`, Home href, card stale, QuickRecord. Default chrome: **saved-view tab « À relancer »** (writes existing filter) + card state. Optional overflow / disclosure « À traiter » listing the same `attentionQueue` items. **Do not** keep the 362px slab. |
| 2a | Gap | — | 488.5 | **12** | 500.5 | COLLAPSE | Goes with the banner. |
| 3 | SavedViews | `[data-crm="views"]` | 500.5 | **39** | 539.5 | **MERGE** | WorkspaceHeader slot **J** (`views` / `viewItems`). Add a client tab that applies `attention=needs_attention` (label via i18n, e.g. existing « Needs attention » / product « À relancer »). Do not add a server view entity. |
| 4 | FilterBar | `[data-crm="list-toolbar"]` | 539.5 | **104** | 643.5 | **MERGE** + **COLLAPSE** | One compact operational toolbar in header slots **M + N–P + Q**. Search → M. Filters / sort / Affichage → N–P. `DealLayoutToggle` → **Q** (leave FilterBar extra). PipelineSwitcher → slot **B** (or C dropdown) when `pipelines.length > 1`. |
| 5 | StagePills | `[data-crm="stage-pills"]` | 643.5 | **74** | 717.5 | **REMOVE FROM DEFAULT** | Duplicate of column headers. Filtering by stage stays via FilterBar / column click / URL `stage=`. **RESPONSIVE ONLY** as the 390 stage-tab strip (PAGE-DEAL-02), not a desktop band. |
| 5a | Pipeline pad + column header | `[data-column-header]` / first col | 737.5 | **47** (hdr) · gap+pad **~20** | 784.5 | **KEEP** | Column chrome. Already has « NOUVEAU 3 450 000 DA ». Optional share bar using existing `amount_cents` / pipeline total. |
| 6 | First DealCard | `[data-testid="deal-card-11"]` | **792.5** | 149.5 | 942 | KEEP (the work) | Pipeline body. Target **y ≤ 200**, goal **≈ 148–160**. |

Text on forecast (verbatim): `Pipeline 2 995 000 DA · Affaires ouvertes 15 · Pondéré 1 638 750 DA · Bande · Hausse probable 1 229 063 DA – 2 212 313 DA · Rétrotest · 90 j Il faut 3+ affaires fermées`.

Nested column scrollers: **5**. Window scroll: false. Primary oranges: **1** (« Créer une affaire »).

### 4.2 List `/crm/deals` — 1440×1000 FR light

Screenshot: `deals-list__1440x1000__fr__light.png`

No ForecastBar (component not mounted). Same attention / views / filters / pills stack.

| # | Band | y | h (px) | Class | Target |
|---|---|---:|---:|---|---|
| 0 | WorkspaceHeader | 0 | **56** | KEEP | Same as board |
| 0a | Gap | 56 | **20** | COLLAPSE | Banner margin (`deal-attention-queue.tsx:32` `mt-3`) |
| 2 | DealAttentionQueue | 76 | **362** | REMOVE FROM DEFAULT / MOVE | Same as board |
| 2a | Gap | 438 | **12** | COLLAPSE | |
| 3 | SavedViews | 450 | **39** | MERGE | Slot J |
| 4 | FilterBar | 489 | **104** | MERGE + COLLAPSE | Slots M–Q |
| 5 | StagePills | 593 | **74** | REMOVE FROM DEFAULT | Column/group metadata; list grouping « Grouper par Étape » is Blueprint-only and **not** a current list-query mode — do not invent grouping. Stage filter stays. |
| 5a | `thead` | 681 | **36** | KEEP | Grid header. Blueprint list thead = 36. |
| 6 | First row | **717** | 37 | KEEP | Target ≤ 200. Row text: `CW Clinic website intake · Clinique El Djazair · Nouveau · 220 000 DA`. |

### 4.3 Why removing the banners is not enough

If an implementer only unmounts Forecast + Attention + StagePills and leaves SavedViews + FilterBar as sibling bands:

| Remaining (board, 1440) | px |
|---|---:|
| Header | 56 |
| SavedViews | 39 |
| FilterBar (unwrapped) | 104 |
| Pipeline pad + column header | ~67 |
| **First card ≈** | **~266–286** |

Still **above 200**. Hitting LAW-06 **requires MERGE** of views + toolbar into WorkspaceHeader J–Q (Blueprint 48 + 40 + 48 column header ≈ **148**). Contacts already sit at y=209 for the same DataWorkspace reason (`P01-FRAME-REPORT.md`). Deals-only chrome props are safer than rewriting DataWorkspace for every object.

### 4.4 1280×900 FR light

| Route | Header | Forecast | Attention | Views | FilterBar | Pills | First useful |
|---|---:|---:|---:|---:|---:|---:|---:|
| List | 56 | — | 362 | 39 | **148** (wrap) | 74 | **761** |
| Board | 56 | 50.5 | 362 | 39 | **148** | 74 | **836.5** |

Same classes as 1440. FilterBar wrap is why Y grows. COLLAPSE the toolbar so it stays one row at 1280.

### 4.5 1024×768 FR light (rail 56)

| Route | Rail | Header | Forecast | Attention | Views | Filter | Pills | First useful | Viewport |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| List | 56 | 56 | — | 362 | 39 | 148 | 74 | **761** | 768 tall — first row is **on the fold** |
| Board | 56 | 56 | 50.2 | 358.8 | 39 | 146.7 | 73.4 | **831** | **below the fold** |

Slot L is already `max-[1023px]:hidden` (`WorkspaceHeader.tsx:236`). Do not put a second summary band back at 1024. FilterBar wrap + attention slab = chrome-only first screen.

### 4.6 768×1024 FR light (overlay + 48px mobile header)

WorkspaceHeader **y=48** (below `evo-mobile-header` 48). Rail width 0.

| Route | Mobile hdr | WorkspaceHeader | Forecast | Attention | Views | Filter | Pills | First useful |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| List | 48 | 56 | — | 362 | 39 | 148 | **146** (wrap) | **881** |
| Board | 48 | 56 | 50.5 | 362 | 39 | 148 | **146** | **956.5** |

Blueprint tablet: view bar collapses to `[Vue ▾] [Filtrer] [⚙] [Liste/Tableau]`; board shows 2.5 columns with snap. **RESPONSIVE ONLY** for the collapsed view control. Stage pills wrapping to 146px must not remain on desktop.

### 4.7 430×932 and 390×844 FR light

| Route | VP | Mobile hdr | Header | Forecast | Attention | Views | Filter | Pills | First useful |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| List 430 | 430×932 | 48 | 56 | — | 309.2 | 85 | 264.9 | 124.9 | **0 (artifact)** — table not in viewport |
| Board 430 | 430×932 | 48 | 56 | 43.8 | 289.8 | 85 | 248.3 | 117.1 | **995** (below 932) |
| List 390 | 390×844 | 48 | 56 | — | 270.3 | 85 | 231.4 | 109.3 | **0 (artifact)** — chrome-only screenshot |
| Board 390 | 390×844 | 48 | 56 | 40.3 | 252.5 | 85 | 216 | 102.2 | **907** (below 844) |

LAW-06 mobile: first actionable row ≤ **220** at 390. Live: **no deal row on the first screen**.

Blueprint mobile: **stage tabs + list, no HTML5 drag** (PAGE-DEAL-02). Classification for the current horizontal board at 390: **RESPONSIVE ONLY** rebuild — replace columns with a segmented stage control that reuses `stagePills` / `BoardStage` counts and amounts; « Déplacer vers… » already exists on the card menu (`deal-pipeline-board.tsx` dropdown) and must keep `POST /crm/deals/{id}/move`.

### 4.8 EN / AR / dark at 1440

| Capture | dir | First useful | Notes |
|---|---|---:|---|
| List EN light | ltr | **717** | Same stack as FR. Title « Deals · 15 deals · Create deal » |
| Board EN light | ltr | **792.5** | Same. « Board options · Create deal » |
| List AR light | **rtl** | **741.2** | Rail x=1216. Attention **386.2** (+24.2 wrap). Same MERGE/MOVE classes. |
| Board AR light | **rtl** | **822.2** | Forecast 52.4; attention 386.2; first card x=947 (RTL start). Column order is visual-start — keep logical CSS; do not flip stage **data** order in JS. |
| List FR dark | ltr | **717** | Identical geometry to FR light. |
| Board FR dark | ltr | **792.5** | Identical geometry. |

RTL: do not add a second layout tree. Frame already mirrors the rail. Column order « Qualification at the start, on the right » is a later visual pass; C-03 still forbids hardcoding three stages.

---

## 5. Band classification (canonical)

| Band | Default desktop | Target |
|---|---|---|
| WorkspaceHeader (identity + primary) | KEEP | C/D/F/G/H. One orange. |
| `evo-mobile-header` | RESPONSIVE ONLY (≤768) | Frame-owned. Do not duplicate inside Deals. |
| DealForecastBar | REMOVE FROM DEFAULT | Slot L one-liner and/or disclosure / overflow / sheet. Props stay. |
| DealAttentionQueue slab | REMOVE FROM DEFAULT | View tab + card state + optional disclosure. `attentionQueue` prop may still be sent. |
| SavedViews sibling row | MERGE | Header slot J |
| FilterBar sibling row | MERGE + COLLAPSE | Header M + N–P + Q; one row at ≥1280 |
| PipelineSwitcher | KEEP (conditional) | Slot B when >1 pipeline; hidden otherwise (already) |
| DealLayoutToggle | MERGE | Slot Q. Keep `dealLayoutHref`. |
| StagePills desktop | REMOVE FROM DEFAULT | Column headers own count/value. URL `stage=` stays. |
| StagePills / stage tabs at 390 | RESPONSIVE ONLY | PAGE-DEAL-02 |
| Column header | KEEP | Name + count + amount. Optional share bar from existing cents. |
| List `thead` | KEEP | 36px |
| Pipeline / grid surface | KEEP | Primary work. Same query. |
| Board options sheet | KEEP (not a band) | Affichage / overflow. Endpoint unchanged. |
| MorphingForm create | KEEP | Slot H. `POST /crm/deals`. |
| BulkActionBar | KEEP (conditional) | Row 3 when selection active (list). |
| LostReasonDialog / move toast | KEEP | Contract. |
| QuickRecord | KEEP | Not a vertical band. |
| Legacy `pipeline-kanban.tsx` | — | Do not touch (leads/tickets). |

---

## 6. Contract risks (do not invent)

| ID | Risk | What wins |
|---|---|---|
| **C-18 vs R06-01 / P01 lock** | `tests/Feature/P01WorkspaceFrameTest.php:83-91` **requires** `<DealForecastBar>` and `<DealAttentionQueue>` in page source and **forbids** `<details>`. Gate A explicitly reverted hiding them. | **Retarget that test** in the same implementation PR. C-18 is the product-owner decision. Do not leave the P01 source-lock in place or the composition PR cannot land. |
| **P11 source-lock** | `P11DealsPipelineBoardTest.php:65` `toContain('DealForecastBar')` plus CrmListShell / DealPipelineBoard / DealLayoutToggle / no `onModeChange`. | Keep shell + board + toggle locks. **Drop or retarget** the ForecastBar-in-`board.tsx` assertion. Forecast **props** and math tests stay. |
| **CrmPipelineWorkspaceTest** | Source contains `DealForecastBar`; `data-testid="forecast-totals"` on the component. | Component file may keep the testid. Page must not mount it by default. Retarget to « available, not default-mounted » or slot-L consumer. |
| **P12** | `attentionQueue` on controller; View all; no `/crm/deals/attention`; evaluator modes; DealAttentionCell. | **Keep.** Moving the queue UI does not delete the prop or filter. |
| **EvoCrmWave2DealsChromeTest / P07** | List is DataWorkspace shared-table; board/forecast « stay put » comments. | Update comments/assertions that require the **old chrome stack**. Do not break shared-table / column config. |
| **C-03** | Blueprint draws 3 columns + won/lost drop bar. | Render `stages` from pipeline JSON. Do not hardcode names or count. |
| **À relancer** | Blueprint built-in view. | Write `attention=needs_attention` only. No new filter key, no new route. |
| **Ouvertes / Clôturées** | Not a server view. | Only if expressible with existing `stage` / status / saved filter. If not expressible without a new API, **ship Mes + À relancer + All** and report the gap. Do not invent `view=open`. |
| **Forecast → Rapports** | Blueprint sentence. | No reports page consumes `DealForecastBar` props. Relocate on Deals (L / disclosure). Do not add `/crm/reports/forecast`. |
| **DataWorkspace shared with Contacts / Companies / Quotes / Tickets / Leads** | Changing default order of banner / SavedViews / FilterBar regresses Contacts y=209 and every list. | Prefer **deals-only props** (`chromeDensity`, `headerSlots`, `hideBanner`, `hideStagePills`) or compose Deals **without** going through a rewritten DataWorkspace default. Tickets also get StagePills (`crm-list-shell.tsx:310`). |
| **PageHeader is the adapter** | Filling J–Q means PageHeader grows or Deals bypasses it and mounts WorkspaceHeader directly. | Either extend PageHeader **additively** (optional slots) or stop using PageHeader on Deals only. Do not remove PageHeader — Contacts/Quotes still use it. |
| **Double List/Board chrome** | FilterBar extra already has `DealLayoutToggle`. DataWorkspace can also render List/Board via `onModeChange`. P11 forbids `onModeChange` on the board page. | Keep the **Link** toggle (`dealLayoutHref`). Do not turn on `onModeChange`. |
| **Attention queue height is data-dependent** | 362px today because Evotechly has a full 8-item queue. Empty queue already returns `null`. | After MOVE, default Y must not depend on queue length. |
| **AMB-07** | 25 deals / 3 columns in the wireframe. | Seeded 15 / 6. Do not seed extra deals for the screenshot. |
| **Permissions** | Move = `crm.edit`. Import / bulk gated. | Do not loosen. |
| **Scroll** | Frame owns it. Columns already scroll. | Do not add a page scroller to « fit » chrome. |

---

## 7. Implementation brief (one exclusive agent)

**Mission.** Compose Deals to the C-18 hierarchy so the first useful card/row is **≤ 200px** at 1440 (goal **148–160**), without breaking list↔board query, move, attention filter, forecast math, or other objects’ DataWorkspace.

**Out of scope.** Deal record (`/crm/deals/{id}`), Inbox, Contacts rewrite, seed changes, deploy, inventing reports/attention routes, hardcoding three stages, rewriting `Pipeline` DnD internals except props needed for a drop-bar that reuses existing won/lost stages.

### 7.1 Files this agent owns

**Primary (expected edits):**

- `resources/js/pages/crm/deals/index.tsx`
- `resources/js/pages/crm/deals/board.tsx`
- `resources/js/components/crm/crm-list-shell.tsx` — **only** additive deals-only chrome flags / slot plumbing. Tickets StagePills must keep working.
- `resources/js/components/crm/deal-attention-queue.tsx` — relocate usage; keep View-all contract.
- `resources/js/components/crm/deal-forecast-bar.tsx` — optional compact one-line variant; do not delete the math UI used by tests that read the file.
- `resources/js/components/crm/stage-pills.tsx` — stop mounting on desktop Deals default; keep component for tickets + mobile.
- `resources/js/components/crm/deal-layout-toggle.tsx` — may move parent; href contract frozen.
- `resources/js/components/crm/pipeline-switcher.tsx` — may move parent; hide-if-one frozen.
- `resources/js/pages/crm/deals/deal-pipeline-board.tsx` — drop-bar / column click only if it still calls `moveDeal` → `POST /crm/deals/{id}/move`.
- Tests listed in §7.4 (this agent **must** retarget the source-locks it will break).

**May add (Deals-local):**

- A small deals chrome helper under `resources/js/pages/crm/deals/` or `resources/js/components/crm/deal-*-chrome.tsx` that maps views + toolbar into header slots.
- Playwright / Pest locks under `tests/Feature/` for first-content and « forecast/attention not default-mounted ».

### 7.2 Shared primitives — do not rewrite; props only

| Primitive | Rule |
|---|---|
| `WorkspaceFrame` / `workspace-frame.css` / `evo-shell.tsx` / `EvoRail` | **Do not touch.** Frame is Gate A certified. |
| `WorkspaceHeader.tsx` | **Props only.** Fill J/L/M/N/Q. Do not rename slots or remove A–H. Adding a missing `data-workspace-slot="o"|"p"` is allowed only if tests in `workspace.test.ts` are updated in the same PR; prefer passing existing `filters` / overflow. |
| `PageHeader.tsx` | Additive optional slots **or** Deals stops using it. Do not change the compact title row for Quotes/Contacts by default. |
| `DataWorkspace.tsx` | **Dangerous shared default.** Prefer props (`banner={null}`, `toolbarExtra={undefined}`, `headerViews`, …) over reordering the default stack. Contacts/Companies/Quotes/Leads/Tickets consume this file. |
| `FilterBar.tsx` / `SavedViews.tsx` | Reuse. May receive denser classNames via props. Do not change `DEAL_QUICK_FIELD_IDS` or built-in All/My semantics. |
| `lib/list-query/**` | **Do not change** `dealLayoutQuery`, chrome keys, or attention modes unless a bug blocks « À relancer » = `needs_attention`. |
| `Pipeline.tsx` / `PipelineColumn.tsx` / `DealCard.tsx` / `LostReasonDialog` | Props only. Column header already has name/count/amount. |
| `QuickRecordDrawer` / peek URL | Do not touch. |
| `DealController` / `DealPolicy` / `DealAttentionEvaluator` / `DealBoardForecast` / `CrmFilter` | **No behavior change** required for C-18. Props may still be serialized. Do not add routes. |
| `tablecn.tsx` | PROTECTED / LEAVE (Wave 0). |
| `pipeline-kanban.tsx` | Not the deals board. Leave. |

### 7.3 Risks (implementation)

1. **P01 + P11 + CrmPipeline source-locks fail CI** the moment ForecastBar / AttentionQueue leave `board.tsx` / `index.tsx`. Retarget first.  
2. **DataWorkspace regression** on Contacts (y=209) and Quotes if the default chrome order changes.  
3. **Tickets StagePills** share `toolbarExtra` (`crm-list-shell.tsx:310`). A blind `toolbarExtra={undefined}` must be deal-scoped.  
4. **Empty attention** already hides the queue; tests that `toContain('<DealAttentionQueue')` still see the **import/JSX**, not visibility. Prefer DOM / Inertia assertions over source-contains after the move.  
5. **FilterBar height 104→148** at 1280/1024 will blow the 200px budget even after banners leave. Collapse is mandatory, not polish.  
6. **Won/lost columns vs drop bar** — C-03. If adding a drag drop-bar, keep columns unless a saved view filters them with existing keys.  
7. **⌘B / mobile stage tabs / card share bar** are Blueprint extras. Do not block C-18 on them. Mobile tabs are the only extra that LAW-06@390 needs.  
8. **AR wrap** adds ~24px to attention; after MOVE this vanishes. Do not special-case RTL geometry.  
9. **One orange** — MorphingForm must remain the only `data-workspace-primary`. Do not orange « View all » or forecast.

### 7.4 Test locks to add or retarget

**Retarget (will go red if ignored):**

| Test | Today | After |
|---|---|---|
| `P01WorkspaceFrameTest.php:83-91` | Must contain ForecastBar + AttentionQueue; no `<details>` | Must **not** mount those as default visible chrome. If a disclosure is used, the test’s « no details » clause is **obsolete under C-18** — replace with « not in the default fold / first-content y ». |
| `P11DealsPipelineBoardTest.php:65` | `board.tsx` contains `DealForecastBar` | Contains DealPipelineBoard + DealLayoutToggle + CrmListShell; forecast **props** still asserted (`:191-192`, `:287-289`). |
| `CrmPipelineWorkspaceTest.php` | Source contains DealForecastBar | Component still exports `forecast-totals`; page default does not render it. |
| `EvoCrmWave2DealsChromeTest.php` | Wave-0 dense chrome assumptions | Update chrome comments; keep create / shared-table / columns. |
| `EvoCrmP10MobbinQaTest.php` | Forecast file contains « Weighted » | Keep file-level i18n lock. |

**Keep green (do not weaken):**

- `P12PipelineAttentionTest` — evaluator, `attentionQueue`, View all, no invented route, card `data-attention`.  
- `DealBoardTest` / `DealGuidanceTest` / `ForecastBacktestTest` — forecast math.  
- `deal-layout-contract.ts` / P11 JS proofs — list↔board query including `attention`.  
- Move + policy tests (`POST /crm/deals/{id}/move`).  
- Simple Mode nav membership.  
- `P01WorkspaceFrameTest` **other** cases (one orange, conversation quiet header, slot H).

**Add:**

1. **First-content lock (1440):** board first `[data-testid^="deal-card"]` **y ≤ 200**; list first `tr` in the deals table **y ≤ 200**. Prefer a Playwright/Pest browser lock against the seeded owner workspace, or a documented metric script assertion in `scripts/product-rebuild/` that CI can run headless.  
2. **Default DOM:** `/crm/deals/board` does not show `[data-testid="forecast-totals"]` or `[data-crm="deal-attention-queue"]` in the default fold (unopened disclosure is acceptable if height contribution is 0 or a single 32–40px control).  
3. **Same dataset:** toggling List → Board keeps `q`, `view`, `owner`, `attention`, `pipeline`, `filter_id` (existing deal-layout proofs — assert from the **page** once chrome moves).  
4. **À relancer / Needs attention tab** writes `?attention=needs_attention` and returns the same set as today’s View all.  
5. **Stage pills** absent from default desktop Deals DOM; column header still shows count + amount.  
6. **Tickets** still render StagePills (negative lock).  
7. **Contacts** first-row y does not regress > ~209 (or whatever Gate A measured) if DataWorkspace is touched.  
8. **Move** still `POST /crm/deals/{id}/move` `{ stage_id }` + lost_reason path.  
9. **One** `[data-workspace-primary]` on both Deals routes.  
10. **390 (if PAGE-DEAL-02 in the same PR):** no HTML5 drag; first card/row y ≤ 220. If deferred, say so in the PR and keep the desktop lock only.

### 7.5 Expected first-content Y

| Viewport | Route | Current | Expected after this lane |
|---|---|---:|---|
| 1440×1000 | Board | 792.5 | **≤ 200**, goal **148–160** (header 48–56 + views/toolbar 40–48 + column header 48) |
| 1440×1000 | List | 717 | **≤ 200**, goal **~148–180** (header + views/toolbar + 36 thead) |
| 1280 | Board / List | 836.5 / 761 | ≤ 200 if toolbar stays one row |
| 1024 | Board / List | 831 / 761 | ≤ 220; slot L hidden |
| 768 | Board / List | 956.5 / 881 | +48 mobile header; first useful ≤ 220 **below the mobile header** (≤ 268 viewport Y) if tablet collapse ships |
| 390 | Board / List | 907 / none | PAGE-DEAL-02: first card ≤ **220** viewport (LAW-06). If that slice is deferred, desktop 1440 is still the C-18 gate. |

**Budget at 1440 (do not exceed):**

| Keep in the fold | Budget |
|---|---|
| WorkspaceHeader row 1 (C–H) | 48–56 |
| Row 2 (J + M–Q, optional L) | 40–48 |
| Column header or thead | 36–48 |
| Gutters | ≤ 8 |
| **Sum → first useful** | **≈ 132–160** |

Anything else (forecast sheet, attention disclosure body, advanced filters, board options, bulk) opens **on demand**.

---

## 8. Suggested implementation sequence

1. Retarget P01/P11/CrmPipeline source-locks so CI can accept C-18.  
2. Stop passing ForecastBar / AttentionQueue / StagePills as default `banner` / `toolbarExtra` on Deals.  
3. Extend PageHeader **or** mount WorkspaceHeader from the Deals pages with `viewItems` (All / My / attention tab / saved) + `search` + `filters` + `layoutToggle`.  
4. Collapse FilterBar to one row at ≥1280 (icon buttons + overflow).  
5. Verify list↔board hrefs, move, attention filter, one orange.  
6. Measure 1440; if y still > 200, the leftover is SavedViews+FilterBar — finish the MERGE.  
7. Optional: slot L one-liner from existing `forecast` props; attention disclosure.  
8. Optional / follow-up: 390 stage tabs (PAGE-DEAL-02).

---

## 9. Artifacts

All under `artifacts/product-rebuild/02-wave/before/deals/`. Real seeded Evotechly data only.

| File | Route | Viewport | Lang | Theme |
|---|---|---|---|---|
| `deals-list__1440x1000__fr__light.png` | `/crm/deals` | 1440 | fr | light |
| `deals-board__1440x1000__fr__light.png` | `/crm/deals/board` | 1440 | fr | light |
| `deals-list__1280x900__fr__light.png` | list | 1280 | fr | light |
| `deals-board__1280x900__fr__light.png` | board | 1280 | fr | light |
| `deals-list__1024x768__fr__light.png` | list | 1024 | fr | light |
| `deals-board__1024x768__fr__light.png` | board | 1024 | fr | light |
| `deals-list__768x1024__fr__light.png` | list | 768 | fr | light |
| `deals-board__768x1024__fr__light.png` | board | 768 | fr | light |
| `deals-list__430x932__fr__light.png` | list | 430 | fr | light |
| `deals-board__430x932__fr__light.png` | board | 430 | fr | light |
| `deals-list__390x844__fr__light.png` | list | 390 | fr | light |
| `deals-board__390x844__fr__light.png` | board | 390 | fr | light |
| `deals-list__1440x1000__en__light.png` | list | 1440 | en | light |
| `deals-board__1440x1000__en__light.png` | board | 1440 | en | light |
| `deals-list__1440x1000__ar__light.png` | list | 1440 | ar | light |
| `deals-board__1440x1000__ar__light.png` | board | 1440 | ar | light |
| `deals-list__1440x1000__fr__dark.png` | list | 1440 | fr | dark |
| `deals-board__1440x1000__fr__dark.png` | board | 1440 | fr | dark |
| `metrics.json` | all | — | — | raw rects |
| `manifest.json` | — | — | — | file list |
| `console-errors.json` | — | — | — | all empty |

Recapture: `node scripts/product-rebuild/deals-audit-capture.mjs` against a seeded `owner@evosales.local` session on `:8000`.

---

## 10. Gate A hand-off (unchanged)

From `artifacts/product-rebuild/01-frame/P01-FRAME-REPORT.md` and `docs/product-rebuild/01-frame/P01-QA.md`:

- Frame certified. Rail 224/56/overlay. One orange. Scroll frame-owned.  
- R06-01: forecast + attention **visible by default** — that was correct for Gate A and is **now superseded by C-18** for Wave 2 Deals.  
- Deferred to this lane: board y=793, list y=717, DataWorkspace bands not in J–N.

This audit confirms those numbers (717 / 792.5) and assigns every pixel between the header and the first deal.

---

## 11. One-page brief for the implementer

**Do:** Deals identity → saved views in slot J → one compact toolbar (M–Q) → pipeline/list. Move forecast + attention off the default stack. Kill desktop StagePills. Keep one query, one move endpoint, one orange, workspace pipeline stages.

**Do not:** rewrite DataWorkspace defaults for all objects; invent `/crm/deals/attention` or a forecast report route; hardcode 3 stages; seed 25 demo deals; leave P01/P11 source-locks unretargeted; ship a 266px « almost » that only removed the banners.

**Done when:** 1440 FR light first card/row y ≤ 200; `?attention=needs_attention` unchanged; `POST /crm/deals/{id}/move` unchanged; Pest retargets green; Contacts/Tickets chrome not regressed.
