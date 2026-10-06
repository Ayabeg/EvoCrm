# P0.1 FRAME-NOTES (Agent 06)

**Branch:** `rebuild/p01-workspace-frame`  
**Base:** `rebuild/p01-shell` `22b14d1`  
**PR:** draft #291 — *P0.1 workspace frame (Gate A, do not merge)*  
**Host:** `http://127.0.0.1:8000` only. DatabaseSeeder + VisualQaSeeder. No deploy, DNS, production, extra records.

## What changed

One `WorkspaceFrame` + `WorkspaceHeader` (48 / 40 / 36) at the Agent 06 mount point. The five header grammars render through `WorkspaceHeader`. Acceptance routes own scroll in the frame; unmigrated routes keep the document scroller.

| Surface | Before (shell capture) | After (this capture) |
|---|---|---|
| Accueil title | `Bonjour Evotechly` greeting + orange New deal | **Accueil** (`t('Home')`). New deal is a **neutral** secondary. No page primary (AMB-01). |
| Contacts / Deals / Quotes list header | `PageHeader` / `CrmObjectHeader` | Same data through `WorkspaceHeader`. One orange create. |
| Record headers | `RecordIdentity` + `RecordBack` inline | Same components, passed as slots. RecordWorkspace left/center/right untouched (C-19). |
| Quotes document | Own h1 + orange Save lines + orange Envoyer | `WorkspaceHeader` + **Save lines outline**. Envoyer stays the one orange. |
| Settings | Own page header | `SettingsPageHeader` → `WorkspaceHeader` (document, sticky). Still a modal (Wave 1). |
| Deals forecast / attention | Full-height blocks (board first card **y=791**) | Closed `<details>` disclosure. Props/query/DnD unchanged (C-18). |
| Inbox | Inline embed header | `WorkspaceHeader` + existing Desk/Room. `min-h-0` on the panes. |

## Scroll owner per route

`data-shell-scroll="frame"` on acceptance routes. `data-shell-scroll="document"` everywhere else (import, duplicates, merge, `/crm/leads` list, `/crm/companies` list, `/agents`, …).

| Route | Archetype | Scroll owner | Shell scroller |
|---|---|---|---|
| `/dashboard` | document | document | frame (frame itself scrolls) |
| `/crm/contacts` | workspace | surface | frame |
| `/crm/deals` | workspace | surface | frame |
| `/crm/deals/board` | workspace | pipeline | frame |
| `/crm/contacts/{id}` | record | columns | frame |
| `/crm/companies/{id}` | record | columns | frame |
| `/crm/leads/{id}` | record | columns | frame |
| `/inbox` | conversation | conversation | frame |
| `/crm/quotes` | workspace | surface | frame |
| `/crm/quotes/{id}` | document | document | frame |
| `/settings*` | document | document | frame |
| Unmigrated | inferred | document | **document** (left in place) |

Capture at 1440: list/board/record acceptance routes report **0 nested overflow-y-auto** except the intended Inbox thread pane and Settings nav column. Deal **record** (not an acceptance route) still has a pane scroller.

## First-content y @1440 FR light (before = shell / after = this PR)

Measured by `scripts/product-rebuild/capture.mjs` (`contentStartY`).

| Route | Before | After | Notes |
|---|---:|---:|---|
| Accueil `/dashboard` | 18 | 29 | First useful is now the Accueil h1 (48px title row), not the 27px greeting. |
| Contacts | **207** | **209** | Budget ≤150 **not met**. SavedViews + FilterBar + thead still sit in DataWorkspace (not owned). |
| Companies list | 255 | 238 | Not an acceptance route; header adapter only. |
| Leads list | 211 | 194 | Not an acceptance route. |
| Deals list | 715 | 368 | Attention collapsed. Remaining stack is DataWorkspace chrome. |
| Deals board | **791** | **393** | Budget ≤200 **not met**. Disclosure removed the KPI/attention slab (−398). Remaining: title 48 + views + search/filters + stage pills + column headers (DataWorkspace / board internals). |
| Contact record | 59 | 22 | |
| Company record | 35 | 14 | |
| Lead record | 35 | 14 | |
| Deal record | 58 | 58 | Not an acceptance route. |
| Inbox | 79 | 127 | WorkspaceHeader + existing RoomShell tabs. |
| Inbox thread | 188 | 236 | Same extra title row. |
| Quotes list | 179 | 195 | |
| Quote document | 31 | 21 | |
| Settings | 185 | 169 | Modal, document scroll. |
| Accueil Simple Mode | 18 | 29 | Same header as Full. |

**Blocking the vertical budget (not Wave 1 page composition):** DataWorkspace still renders SavedViews + FilterBar **below** the title row. I must not edit those internals. Board column headers and stage pills are Pipeline internals. If Agent 07/Wave 2 folds views/filters into header slots J–Q, Contacts can approach ≤150 and the board can approach ≤200.

## Visual proof

`node scripts/product-rebuild/capture.mjs --out artifacts/product-rebuild/01-frame/after`

103 shots, 0 skipped. Viewports 1440 / 1280 / 1024 / 768 / 430 / 390, FR + EN + AR-RTL, light + dark, Simple Mode 1440. `console-errors.json`: every route is `[]`.

`P01-AFTER-CONTACT-SHEET.png` uses the same 3+5 grid as the shell BEFORE sheet.

## Ownership respected

Touched: `resources/js/evo/workspace/*`, `PageHeader.tsx`, `crm-object-header.tsx`, Settings header adapter, the Agent 06 mount line, and **only** the header/banner/Save-lines lines on the 10 acceptance pages.

Not touched: `evo.css`, `evo-shell*`, `evo-rail`, `rail-state`, `app-shell`, `app-layout`, `product-nav`, `ui/sidebar`, DataWorkspace internals, DataGrid/Tablecn, FilterBuilder, SavedViews logic, RecordWorkspace slots, QuickRecord, Pipeline/DnD, Inbox Desk/Composer internals, Quotes send logic, controllers, routes, permissions, Simple Mode membership, URL state.

## Tests added or retargeted

- New Pest `P01WorkspaceFrameTest`: one primary, slot contract, archetype scroll owner, Accueil is not a greeting.
- New Vitest `workspace.test.ts` (5 cases). Suite **27/95** (was 26/90).
- **Updated, not deleted:**
  - `V02DashboardVisualTest`: `t('Hello :name')` → `title={t('Home')}` + `WorkspaceHeader`.
  - `AgentsShellTest`: `agents-route-page-shell` now asserted on `WorkspaceFrame`.
  - `P25ResponsiveHardeningTest`: `min-w-0 overflow-x-clip` now asserted on `WorkspaceFrame`.

## Conflicts with the business contract (reported, not invented)

| ID | Status |
|---|---|
| C-18 Deals forecast/attention | **Honored as presentation.** Components still receive the same props. Hidden behind a closed disclosure. |
| C-19 RecordWorkspace slots | **Honored.** left/center/right untouched. |
| AMB-01 Accueil primary | **Honored.** No slot H. New deal is secondary/neutral. |
| C-02 Simple nav | **OPEN — not changed.** |
| C-07 Ask Evo Simple Mode | Untouched. |
| LAW-09 Settings modal | **Still a modal.** Header + document scroll only (Wave 1). |
| LAW-06 / LAW-07 vertical budget | **Not met** without DataWorkspace / board Wave 2. Exact y above. |

## Tokens needed from Agent 05

None. `--evo-header-title` / `--evo-header-view` / `--evo-header-chip` and `--evo-teal` already exist. Did not edit `evo.css`.

## Remaining P0 / P1 / P2 / P3

**P0 (unfixed, out of ownership)**
- Contacts first row y=209 (need SavedViews + FilterBar density inside DataWorkspace).
- Deals board first card y=393 (need views/filters/stage-pill stack folded or shortened). Cannot redesign cards/columns.

**P1**
- DataWorkspace still owns views + filters as separate bands (HDR-01 not fully composed into slots J–N).
- Inbox RoomShell tabs + WorkspaceHeader stack (Desk internals).
- Settings remains a dialog (LAW-09).
- Quote Resend can still be the orange send (LAW-10 “Renvoyer is never orange” is Documents wave; we only demoted Save lines).

**P2**
- Companies / Leads lists are not acceptance-migrated (document scroller).
- Deal record not on the acceptance list.
- RecordIdentity avatar still lives inside slot C (no Wave 2 record redesign).

**P3**
- Accueil date/timezone share the title row (count slot) and can look tight at 1440.
- FR/EN mix on some nav labels (pre-existing i18n).

## Console

Zero console errors / pageerrors / requestfailed across 103 shots.

## qa-baseline.sh (this branch)

| Check | Shell `016e1d70` | This PR |
|---|---|---|
| Pest | 1206 tests / 1205 pass + 1 skip + 1 risky | **1210 / 1209 pass + 1 skip + 1 risky** (+4 locks) |
| Vitest | 26 files / 90 tests | **27 / 95** (+1 file, +5) |
| `tsc` | 3 pre-existing errors | **same 3** |
| Vite build | OK | **OK** (20.96s) |
| ESLint full-repo | 437 (434 err / 3 warn) on that VM | **436** (433 / 3). Owned files clean. |
