# P0.1 FRAME-NOTES (Agent 06)

**Branch:** `rebuild/p01-workspace-frame`  
**Base:** `rebuild/p01-shell` `1e5eb94` (Agent 05 finished; merged)  
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
| Deals forecast / attention | Full-height blocks (board first card **y=791**) | **Restored.** ForecastBar + AttentionQueue render in the default banner again (C-18 / Wave 2). The closed `<details>` disclosure was reverted — P0.1 does not own Deals page-internal visibility. |
| Inbox | Inline embed header | Conversation `WorkspaceHeader` is **quiet**: accessible `h1` is `sr-only`, no 48px title row under RoomShell tabs. Embed keeps a slim count/secondary row. Desk/Composer untouched. |

## `app-sidebar-layout.tsx` handshake

Shell left a one-line mount: replace the document-scroller wrapper with `<WorkspaceFrame>{children}</WorkspaceFrame>`. This branch owns that swap. Everything else in the file stays shell-owned.

**Removed from the layout (moved into `WorkspaceFrame`, not deleted from the product):**

| What left the layout | Why |
|---|---|
| `usePage()` + path parse | Route → archetype / scroll owner lives in `resolveWorkspaceRoute`. The layout must not keep a second copy of that decision. |
| `agents-route-page-shell` class | Agents source-locks still need the class. `WorkspaceFrame` applies it when the resolved path is `/agents` or `/agents/…`. |
| `overflow-y-auto` + `data-shell-scroll="document"` on the wrapper | A layout-level document scroller would nest under frame-owned acceptance routes. Frame sets `data-shell-scroll="frame"` on the 10 routes and `"document"` on unmigrated ones; CSS then chooses `overflow-y: hidden` vs `auto`. |

The layout file is now AppShell → EvoShell → WorkspaceFrame. Do not put header slots or scroll classes back on the layout.

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

Capture at 1440: list/record acceptance routes report **0 nested overflow-y-auto** except the intended Inbox thread pane and Settings nav column. Deal **record** (not an acceptance route) still has a pane scroller. Restoring the Deals forecast/attention slab shrinks the board columns, so the five pipeline column scrollers overflow again — Wave 2 / C-18 owns those.

## First-content y @1440 FR light (before = shell / after = this PR)

Measured by `scripts/product-rebuild/capture.mjs` (`contentStartY`).

| Route | Before | After | Notes |
|---|---:|---:|---|
| Accueil `/dashboard` | 18 | 29 | First useful is the Accueil h1 (48px title row), not the 27px greeting. |
| Contacts | **207** | **209** | Budget ≤150 **not met**. SavedViews + FilterBar + thead still sit in DataWorkspace (not owned). |
| Companies list | 255 | 238 | Not an acceptance route; header adapter only. |
| Leads list | 211 | 194 | Not an acceptance route. |
| Deals list | 715 | **717** | Attention queue restored (R06-01). First row is back at the shell-era stack. +2 vs shell is the WorkspaceHeader title row. |
| Deals board | **791** | **793** | ForecastBar + AttentionQueue restored (R06-01). First card back at the shell-era stack. Budget ≤200 **not met** — Wave 2 / C-18. +2 vs shell is the header adapter. |
| Contact record | 59 | 22 | |
| Company record | 35 | 14 | |
| Lead record | 35 | 14 | |
| Deal record | 58 | 58 | Not an acceptance route. |
| Inbox | 79 | **79** | Conversation header is quiet. Matches the shell baseline. RoomShell tabs remain. |
| Inbox thread | 188 | **188** | Same quiet header; no extra title row. |
| Quotes list | 179 | 195 | |
| Quote document | 31 | 21 | |
| Settings | 185 | 169 | Modal, document scroll. |
| Accueil Simple Mode | 18 | 29 | Same header as Full. |

**Blocking the vertical budget (not Wave 1 page composition):** DataWorkspace still renders SavedViews + FilterBar **below** the title row. I must not edit those internals. Board column headers, stage pills, ForecastBar, and AttentionQueue are Pipeline / Deals internals. If Wave 2 folds views/filters into header slots J–Q and owns Deals composition, Contacts can approach ≤150 and the board can approach ≤200.

## Visual proof

`node scripts/product-rebuild/capture.mjs --out artifacts/product-rebuild/01-frame/after`

103 shots, 0 skipped. Viewports 1440 / 1280 / 1024 / 768 / 430 / 390, FR + EN + AR-RTL, light + dark, Simple Mode 1440. `console-errors.json`: every route is `[]`.

`P01-AFTER-CONTACT-SHEET.png` uses the same 3+5 grid as the shell BEFORE sheet.

## Ownership respected

Touched: `resources/js/evo/workspace/*`, `PageHeader.tsx`, `crm-object-header.tsx`, Settings header adapter, the Agent 06 mount line, and **only** the header/banner/Save-lines lines on the 10 acceptance pages.

Not touched: `evo.css`, `evo-shell*`, `evo-rail`, `rail-state`, `app-shell`, `app-layout`, `product-nav`, `ui/sidebar`, DataWorkspace internals, DataGrid/Tablecn, FilterBuilder, SavedViews logic, RecordWorkspace slots, QuickRecord, Pipeline/DnD, Inbox Desk/Composer internals, Quotes send logic, controllers, routes, permissions, Simple Mode membership, URL state.

## Tests added or retargeted

- Pest `P01WorkspaceFrameTest`: one primary, slot contract, archetype scroll owner, Accueil is not a greeting, Contacts orange fill, Accueil zero page-level orange primaries, Deals banners not in a disclosure, conversation header quiet.
- Vitest `workspace.test.ts` (6 cases). Suite **27/96** (was 26/90).
- **Updated, not deleted:**
  - `V02DashboardVisualTest`: `t('Hello :name')` → `title={t('Home')}` + `WorkspaceHeader`.
  - `AgentsShellTest`: `agents-route-page-shell` now asserted on `WorkspaceFrame`.
  - `P25ResponsiveHardeningTest`: `min-w-0 overflow-x-clip` now asserted on `WorkspaceFrame`.

## Conflicts with the business contract (reported, not invented)

| ID | Status |
|---|---|
| C-18 Deals forecast/attention | **Honored as default visibility.** Same props/query/DnD. Not collapsed by the frame. |
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
- Deals board first card **y=793** and list first row **y=717**. Wave 2 / C-18 owns ForecastBar + AttentionQueue + the rest of the Deals stack. Reported honestly.

**P1**
- DataWorkspace still owns views + filters as separate bands (HDR-01 not fully composed into slots J–N).
- Settings remains a dialog (LAW-09).
- Quote Resend can still be the orange send (LAW-10 “Renvoyer is never orange” is Documents wave; we only demoted Save lines).

**Review fixes on this pass**
- R06-01: disclosure reverted on deals list + board.
- R06-03: conversation header is quiet (no visible title under RoomShell).
- R06-02: Pest locks Contacts orange primary fill and Accueil zero page-level orange primaries.
- R06-04: this handshake section.
- R06-06 / R06-07: no-op ternary and empty primary ruleset removed.

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

| Check | Shell `016e1d70` | This PR (merged `1e5eb94`, recapture) |
|---|---|---|
| Pest | 1206 tests / 1205 pass + 1 skip + 1 risky | **1214 / 1213 pass + 1 skip + 1 risky** |
| Vitest | 26 files / 90 tests | **27 / 96** |
| `tsc` | 3 pre-existing errors | **same 3** |
| Vite build | OK | **OK** (16.72s) |
| ESLint full-repo | 437 (434 err / 3 warn) on that VM | not re-run this pass; owned files unchanged in lint surface |
