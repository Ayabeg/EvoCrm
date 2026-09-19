# P25 — Responsive hardening audit

**BASE:** `fa13a64e507b90b25008e0274d42615b84ac9678` (P24 merge).  
**Date:** 2026-09-19.  
**Scope:** Make CURRENT EvoCRM robust at 1440 / 1280 / 1024 / 768 without redesign.  
**Law:** page H-overflow = defect. Intentional table / board local scroll = OK.  
**Out of scope:** V00–V15 visual redesign, Contabo deploy, merge, P27.

Audited on the frozen P00–P24 tree **before** product code. Findings are from source (layout primitives, page shells, source-lock tests). Live Contabo walk is Research-owned.

---

## Method

Inspected:

- Shell: `app-sidebar-layout`, `app-sidebar-header`, `app-content` / `SidebarInset`, `app-shell`, `sidebar.tsx` 64/240
- Shared workspace: `DataWorkspace`, `DataTable` / `ListDataTable`, `ListViewTable`, `FilterBar`, `SavedViews`, `PageHeader`, `BulkActionBar`, `WorkspacePaginator`
- QRD: `QuickRecordDrawer`, Aurora `sheet`
- Pipeline: `deals/board`, `pipeline-kanban`
- Inbox: `desk/inbox` native + embed, `DeskShell`, `RoomShell`
- Activities: `activity-work-queue`
- Dashboard: `home.tsx`, `home-kpi-strip`, P17 contract
- Quotes: `quote-split-builder`, `quote-builder.ts`, `QuoteAmountCell`, `RecordFact`
- Automation: `workflows/index`, `workflow-builder`
- Settings + integrations: `settings/layout`, `secret-callback-field`, Meta / SMS / connectors
- Activation: `activation-checklist`
- Ask Evo: panel + drawer
- Overlays: Aurora dialog / dropdown / popover / command palette

Viewports checked in the mental model: **1440, 1280, 1024, 768**. 280–430 phone widths are DEFER-VISUAL unless they already cause page H-overflow at 768.

---

## Findings

| ID | Severity | Route / surface | Viewport | Problem | Cause | Fix | Shared vs local | Risk |
|---|---|---|---|---|---|---|---|---|
| A1 | **BLOCKER** | All DataWorkspace lists (`/crm/contacts`, companies, leads, deals, quotes) | 1024 / 768 (rail 240 + content) | Page H-overflow when wide `table-fixed min-w-[52–68rem]` tables expand the flex column | `DataWorkspace` root + result column omit `min-w-0`; flex `min-width: auto` lets the table grow the page even though `ListDataTable` has `overflow-x-hidden` and the table wrapper has `overflow-x-auto` | Add `min-w-0 overflow-x-hidden` on workspace root and result column; keep table local `overflow-x-auto` | **Shared** (`PAGE_OVERFLOW_CLASS`) | Low — containment only; column contracts unchanged |
| A2 | **MAJOR** | FilterBar (especially Contacts — wrap helper skipped) | 768 / 1024 | Search `min-w-[12rem]` + `shrink-0 whitespace-nowrap` quick filters can force a wider first row than the pane | `wrapQuickFilters` only for company/lead/deal/quote; Contacts leaves chips as siblings | Always wrap quick filters; search `min-w-0 flex-1` | **Shared** (FilterBar) | Low — wrap already used on other objects |
| A3 | **MAJOR** | Quote builder `/crm/quotes/:id` | 768 | Line-item money + unit inputs can clip or push page H-overflow; properties `RecordFact` uses `truncate` on money | 4-col table with `w-28` unit input, no local scroll; shared `RecordFact` truncates DZD | Local `overflow-x-auto` on line table; `MONEY_NEVER_CLIP_CLASS` (`break-words`, no truncate) on builder total + `RecordFact money` + `QuoteAmountCell` | **Shared** money class + local table scroll | Low — formatDzd unchanged |
| A4 | **MAJOR** | Modals (`Dialog` xl / lg) | 768 | `max-w-4xl` / `max-w-2xl` exceed `768 - 32` | Size tokens have no viewport cap except `full` | Cap every size with `max-w-[min(<token>,calc(100vw-2rem))]` | **Shared** (Aurora Dialog) | Low — visual inset only |
| A5 | **MAJOR** | Dropdown menus | 768 | `min-w-[10rem]` without viewport max; long labels / user menu `w-64` OK but submenus can escape | Aurora dropdown content | `max-w-[min(24rem,calc(100vw-1rem))]` | **Shared** | Low |
| A6 | **MAJOR** | Settings workspace | 768 | Settings pane has `min-w-0` but workspace root can still H-overflow from wide system-health / audit tables | Root missing `overflow-x-hidden`; nav labels no truncate | Page overflow on workspace; truncate nav labels; keep table local scroll | **Shared** + settings shell | Low |
| A7 | **MAJOR** | QRD | 768 | Drawer width already `min(92vw,520px)` but content/header row (Open full + title) can overflow the panel | Header flex without overflow-x containment on `DrawerContent` | `overflow-x-hidden` on drawer content; keep title truncate | **Shared** overflow + existing QRD truncate | Low — P09/P10 peek unchanged |
| A8 | **MINOR** | PageHeader / record titles / RoomShell | 768+ | Long object titles (`text-[28px]`) and room chrome lack page overflow containment | `PageHeader` title not truncated; `RoomShell` / `RecordPageFrame` no `overflow-x-hidden` | Truncate titles; page overflow on record/room frames | **Shared** chrome | Low |
| A9 | **MINOR** | Inbox embed | 768+ | Native inbox has `overflow-x-hidden`; embed workspace does not | `DeskEmbedWorkspace` omitted the law | Same page overflow class; **do not** restyle iframe / native switch | Local inbox embed | Low — preserve native/embed |
| A10 | **MINOR** | List amount cells | 1024 / 768 | `QuoteAmountCell` / `DealAmountCell` `truncate` + `overflow-hidden` td clip DZD | `table-fixed` + truncate | Money: wrap, not clip. Identity cells keep truncate | Shared money class; list cells | Medium if P08 visual lock expected truncate — P08 does not lock amount truncate |
| A11 | **MINOR** | Activation checklist | 768 | Step row wraps already; long CTA + label can crowd | Flex wrap present; labels not min-w-0 truncated | `min-w-0` + wrap on labels; no visual redesign | Local | Low |
| A12 | **MINOR** | Ask Evo rail / drawer | 768 | Already `overflow-x-hidden`; long context chips may wrap poorly | Chips / context row | Keep overflow; `min-w-0` on context text | Local, P24 contract frozen | Low |
| A13 | **OK** | Shell topbar | 768+ | Search `flex-1 min-w-0`; ⌘K hidden below `sm`; Tasks hidden below 390 | Prior responsive pass | Keep | Shared (already) | — |
| A14 | **OK** | Dashboard P17 | 768 | KPI **2×2** below `md`, 4-col at `md+`; page `overflow-x-hidden`; values `break-words` | Frozen P17 contract | **Do not change** KPI math, IA, or 2×2 | Frozen | Changing KPI grid is a P17 regression |
| A15 | **OK** | Pipeline board | all | Page `overflow-x-hidden`; columns `w-[280px] min-w-[260px]` scroll locally | Intentional board scroll | Keep | Local board | — |
| A16 | **OK** | Activities queue | all | Root already `overflow-x-hidden`; header wraps | — | Keep; add `min-w-0` if missing on long subjects | Local | Low |
| A17 | **OK** | Command OS | 768 | `width: 640px` + `maxWidth: calc(100vw - 32px)` + `overflowX: hidden` | Already capped | Keep | Shared overlay | — |
| A18 | **OK** | Settings secrets | all | Meta callback uses `masked_url` + reveal POST; SMS `api_key` has no `defaultValue`; P22/P23/P24 lock tokens off Inertia | Overflow of long masked URL is `break-all` | Keep reveal-on-demand; add overflow containment; **no secrets in initial DOM** | Shared SecretCallbackField | High if someone inlines tokens — do not |
| A19 | **DEFER-VISUAL** | 280–430 phone | <768 | Command bar / sheet already handled; not P25 viewport matrix | Visual polish | V00–V15 | — | — |
| A20 | **DEFER-VISUAL** | Inline settings/ads tables `min-w-[640–760]` | 768 | Local H-scroll inside Card | Documented in `responsive-architecture.md` | Keep local scroll; migrate tables later | Local | — |
| A21 | **DEFER-VISUAL** | Kanban column width, filter `min-w-[7rem]` | 768 | Intentional | Keep | V-pass | Local | — |
| A22 | **DEFER-VISUAL** | Tiny-font temptation | all | Shrinking type to fit is forbidden | Use truncate/wrap/`min-w-0` | Contract | Shared | — |

---

## Severity rubric

| Level | Meaning |
|---|---|
| **BLOCKER** | Page-level H-overflow on a primary operator surface at a required viewport |
| **MAJOR** | Money clipped, overlay wider than viewport, or toolbar that forces page overflow |
| **MINOR** | Contained overflow / missing truncate on a secondary chrome row |
| **DEFER-VISUAL** | Visual density, <768 craft, or table-column redesign |

---

## Shared primitives (preferred)

1. `PAGE_OVERFLOW_CLASS` — `min-w-0 overflow-x-hidden` on page/workspace columns  
2. `LOCAL_SCROLL_X_CLASS` — `min-w-0 overflow-x-auto` on tables/boards only  
3. `LONG_TEXT_CLASS` / `LONG_TEXT_WRAP_CLASS` — truncate vs wrap; **not** smaller fonts  
4. `MONEY_NEVER_CLIP_CLASS` — money may wrap; never `truncate` / `overflow-hidden`  
5. Overlay viewport caps on Dialog + Dropdown  

---

## Frozen rails this pass must not rewrite

P00–P24 product semantics: DataWorkspace ownership, QRD peek, P11 board movement, P12 attention, P13/P14 inbox native/embed, P15 queue groups, P16 Command OS, **P17 KPI 2×2 + sources**, P18 quote lifecycle/math, P19/P20 automation logic, P21 IA, P22 reveal-only secrets, P23 activation step IDs, P24 Ask Evo contract.

---

## Test plan

- Source-lock Pest + `tests/js/p25-responsive-hardening.ts` for overflow classes and money/no-secret DOM  
- Re-run P17 KPI 2×2 proofs (must stay green)  
- eslint on touched TS, `types:check`, `npm run build`  
- Document pre-existing phpstan / suite failures if any  

---

## Contabo / merge

Not this PR. `READY_FOR_CONTABO` only after CI is green. `MERGE READY: NO`.
