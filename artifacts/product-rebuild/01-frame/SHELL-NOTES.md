# P0.1 SHELL-NOTES (Agent 05)

**Branch:** `rebuild/p01-shell`  
**Base:** `main` `1e146ffb`  
**Capture commit:** `cf2f2ec8` (screenshots) + later lint-only shell fix  
**Host:** `http://127.0.0.1:8000` only. No deploy, DNS, production, seeds beyond DatabaseSeeder + VisualQaSeeder.

## What changed

The live tree is unchanged: `AppLayout` → `AppSidebarLayout` → `AppShell` → `EvoShell` + `EvoRail`. The global top bar is gone. Search, Create, tasks, and the user/theme menu live in the rail. One width system: **224 expanded / 56 icon rail**.

| Surface | Before (W0 audit) | After (this capture) |
|---|---|---|
| Global top bar | 52px `.app-topbar` (Quotes 40px) | **not rendered** (`topBar: null`) |
| Sidebar ≥1280 | 212px (metrics often reported 0 because `[data-slot=sidebar]` was the unused shadcn wrapper) | **224px** on `[data-slot=sidebar]` (the live rail) |
| Sidebar 1024 | 212 expanded (stole workspace) | **56px** icon rail (`data-rail=auto`) |
| Sidebar ≤768 | 212 expanded, resized the workspace | **overlay drawer** — workspace width unchanged; compact 48px mobile header (trigger + logo + name) |
| First content y @1440 Contacts | 259 (52px bar + page chrome) | **207** (−52 from the bar; remaining stack is page / Agent 06) |
| First content y @1440 Deals board | 843 | **791** (−52; kanban still far from blueprint ≈148 — page chrome, not shell) |
| Orange global Créer | top-bar primary | **gone**. Rail `+ Créer` is neutral. Page-level orange create is untouched. |
| Ask Evo ⌘J | top-bar sparkle | Full Mode only (`features.ask_evo && !simpleMode`). Off in Simple Mode (C-07). |
| Agents | Menu / Agents / Search pill | Pill retired. One Full-mode `product-nav` row under `pilot` (`/agents`). SIMPLE_NAV membership **unchanged** (C-02 OPEN). |
| Palette | 560px | **640px**, opened from rail Search / ⌘K |
| Collapse persist | `sidebar_state` cookie written by unused `SidebarProvider` (mobile could clobber) | `rail-state.ts` owns the cookie. Provider no longer writes it. |

Tokens in `resources/js/evo/tokens/evo.css` (Wave 1 token owner):

- Brand hexes unchanged: orange `#EC6025` (primary actions only), ink `#0D1B24`, teal `#0F4C5C`, canvas `#F7F8F5`, hairline `#E6E8E3`.
- New sidebar surface `#F0F2EE` (dark `#111111` so the rail is not the same black as canvas `#0A0A0A` / workspace `#121212`).
- Rail `--evo-rail: 224px` / `--evo-rail-collapsed: 56px`.
- Density: nav 32, header title/view/chip/toolbar 48/40/36/40, rows 32/36/40 + touch 44, radius panel 8 / chip 6.
- `--evo-radius-standard` stays **10px** and `--evo-chrome-height` stays **48px** — page consumers still read them. Do not treat those as “shell chrome height.”
- Deleted leftover rail widths 212 / 240 / 248 from `evo-shell.css`, `approved-v02.css`, and `ui/sidebar.tsx`. Design-lab still shows 212 (out of P0.1 ownership).

Scroll: the `.evo-shell` itself is `overflow-hidden`. **One default document scroller remains** on `.aurora-page-shell` (`overflow-y-auto`, `data-shell-scroll="document"`). Not-yet-migrated pages still need it. Agent 06 should take scroll ownership inside `WorkspaceFrame` and then we can drop the shell-level scroller.

RTL: logical properties (`inset-inline-start` active bar, `padding-inline`, `text-start`, `rtl:rotate-180` on the collapse caret). AR 1440 rail is at `x=1216` (1440−224).

A11y: 32px nav rows, teal focus ring, `aria-current="page"` on the active item, labelled collapse control, Escape closes the ≤768 overlay, `prefers-reduced-motion` disables width transitions.

## Ownership respected

Touched only Agent 05 files: layouts (`app-layout.tsx`, `app-sidebar-layout.tsx`), `app-shell.tsx`, `evo-shell.tsx`, `evo-shell.css`, `evo-rail.tsx`, `evo/shell/mode-switch.tsx` (retired comment), `app-sidebar-header.tsx` (UNMOUNTED leftover), `product-nav.ts` presentation (casing already sentence-case; one Full-mode Agents row; SIMPLE_NAV ids untouched), shell + density tokens in `evo.css`, leftover width systems, mobile nav, command-palette width/placement, tasks bell + user/theme menu, plus the few shell labels in `lang/{fr,en,ar}.json`.

Not touched: WorkspaceFrame / WorkspaceHeader, `ds/chrome/PageHeader.tsx`, `crm-object-header.tsx`, page internals, DataWorkspace / DataGrid / Tablecn / FilterBuilder / SavedViews / RecordWorkspace / QuickRecord / Pipeline / Inbox / Quotes, controllers, routes, permissions, Simple Mode membership / `SimpleMode.php`, unrelated localization keys.

## Exact Agent 06 mount point

File: `resources/js/layouts/app/app-sidebar-layout.tsx`

```tsx
<EvoShell>
  {/*
    AGENT 06 MOUNT POINT — WorkspaceFrame
    Replace the wrapper below with:
      <WorkspaceFrame>{children}</WorkspaceFrame>
    Shell owns this file except that one line. Do not implement
    WorkspaceHeader or header slots here.
  */}
  <div
    className="aurora-page-shell min-h-0 min-w-0 overflow-x-clip flex-1 overflow-y-auto …"
    data-shell-scroll="document"
  >
    {children}
  </div>
</EvoShell>
```

`EvoShell` already gives the main region `min-h-0 flex-1 overflow-hidden`. Swap the inner wrapper; do not add a second global header.

## Risks for Agent 06

1. **Page chrome still owns first-content Y.** Removing the 52px top bar bought exactly 52px. Contacts first row is 207; Deals board first card is 791. Blueprint wants ≤200 (goal ≈148) on the board. That is WorkspaceHeader / DataWorkspace / KPI / filter stack — not the rail.
2. **Scroll owner.** Keep `data-shell-scroll="document"` until every remaining page scrolls inside the frame. Then delete `overflow-y-auto` on `.aurora-page-shell` so only the workspace scrolls.
3. **`--evo-chrome-height: 48px` is still the page-header token**, not a global top bar. Do not set it to 0.
4. **Do not remount** `app-sidebar-header.tsx` or `.app-topbar`. CSS still hides `.app-topbar` as a leftover lock.
5. **Cookie.** Desktop collapse is `sidebar_state` via `rail-state.ts`. Do not let `SidebarProvider` write it (mobile overlay would pin the desktop rail).
6. **Create.** Rail Create is neutral and reuses `?create=1` + existing object actions. No second orange global button. GAP-14: Tâche is not in the rail create menu.
7. **C-02 remains OPEN.** SIMPLE_NAV = Home, Inbox, Leads, Contacts, Companies, Deals, Quotes, Activities. Do not add Agents (or anything else) to Simple Mode without a product-owner decision.
8. **Capture hook.** Desktop rail is `data-slot="sidebar"` + `data-sidebar="sidebar"` + `data-shell="production"`. Mobile overlay is the shadcn offcanvas, not that aside.

## Conflicts with the business contract (reported, not invented)

| ID | Status in this PR |
|---|---|
| C-02 Simple nav membership | **OPEN — not changed.** |
| C-07 Ask Evo in Simple Mode | **Honored.** ⌘J and the shortcuts row are off when `simpleMode` or `!features.ask_evo`. |
| C-10 / C-11 brand hexes | **Honored.** PR1 hexes unchanged. |
| C-12 Agents | Existing `/agents` desk. Reachable as a Full-mode nav row after the pill was retired. |
| C-14 `layout_v1` flag | **Not added.** |
| GAP-01 bell | Tasks overlay, not notifications. |
| GAP-14 create | No Tâche in the rail create menu. |

## Visual proof

`node scripts/product-rebuild/capture.mjs --out artifacts/product-rebuild/01-frame/shell`

103 shots, 0 skipped. Viewports 1440 / 1280 / 1024 / 768 / 430 / 390, FR + EN + AR-RTL, light + dark, Simple Mode 1440. `console-errors.json`: every route is `[]`.

## Tests added or retargeted

- New `tests/Feature/P01ShellFrameTest.php`: no `.app-topbar`; tokens 224/56; cookie persist; SIMPLE_NAV lock; Cmd+J gated; hierarchical nav × capability + Agents Full-only.
- Source-locks updated (never deleted): Wave0 / P04 / P02 / EvoShell* / AuroraTokenBridge / V01 / AgentsShell / I18nFoundation / P16 / P25 / P27.
- Vitest `product-nav.test.ts`: Agents visible in Full, hidden in Simple.

## Unfixed (not Agent 05)

- Deals board first card y=791 (P0 page chrome / Agent 06).
- Contacts first row y=207 still above blueprint header budget (Agent 06 / list workspace).
- Settings is still a modal (pre-existing).
- FR/EN mix on nav labels “Leads” / “Contacts” (i18n copy, not shell).
- `tsc` 3 pre-existing errors unchanged. Full-repo ESLint in this environment reports more than the Wave 0 **389** count (see closeout); owned shell files were brought back to clean.
