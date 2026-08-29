# EvoSales product polish audit

**Date:** 2026-08-28  
**Baseline:** PR #117 chrome · #118 Home · #119 lists · #120 records · #121 pipeline  
**Source of truth:** the repository, not earlier audit screenshots.

Design read: an all-day enterprise CRM for Algerian sales operators. Precision / density / Evotechly identity. Brand Book owns look. Aurora owns interaction. EvoSales owns IA and workflows.

Dials remain: Variance 3 · Motion 3 · Density 8.

This document ranks what is still under-designed **after** the pro-product phases. It does not propose a second design system.

---

## What is already finished enough

Do not undo these.

| Surface | Why it stays |
|---|---|
| AppSidebar | Black 240px rail, expanded CRM objects, More for secondary destinations |
| Top bar | Find a page · Create · Notifications · Account. Navigate-only palette |
| Mobile drawer | Aurora Sheet, 240px, `#000`, focus trap |
| CRM lists | `CrmShell chrome="workspace"` + `CrmObjectHeader` + `ListToolbar` + `ListViewTable` |
| Pipeline | Identity → one forecast strip → List/Board → board. No KPI card stack |
| Records | Shared grammar: identity → Log activity → context → work → Ask Evo demoted |
| Home data | Real `HomeDashboardBuilder` KPIs, attention, activity. No invented metrics |
| ListViewTable | Stays. Not Aurora DataTable |

The product is coherent. It is not yet **composed**.

---

## Hierarchy (every screen)

1. What am I looking at?  
2. What needs my attention?  
3. What can I do?  
4. What context do I need?  
5. What is supporting?  
6. What is chrome?

Work must dominate chrome. Cards are not the default container.

---

## Findings

### P0 — visibly broken / destroys usability

None found in the current baseline. Pipeline, lists, records, drawer, and Home data contracts hold.

### P1 — major professional-quality issues

**P1.1 Home still reads as a dashboard page, not a workspace**  
`resources/js/pages/home.tsx`

- `max-w-6xl mx-auto` leaves unused desktop canvas at 1440/1920.
- Vertical rhythm is still `mb-4 md:mb-6` / `gap-4 md:gap-6` (16–24px) between every module.
- Needs attention is a `rounded-xl` bordered **panel card** (`surface="panel"`). Other sections are plain. The first work surface looks framed, not operational.
- Pipeline / Performance / Activity / Won by owner sit as four isolated modules instead of one workspace with hairline groups.
- New deal points at `/crm/deals` (list), not the existing create drawer (`?create=1`).

**P1.2 Shared KPI cards are still generic dashboard tiles**  
`evo-kpi-card.tsx` + `crm-kpi-strip.tsx`

Home already uses a hairline `HomeKpiStrip`. Outbound, Reports, and Funnels still render `rounded-2xl` KPI cards with 16–20px padding. Same product, two languages.

**P1.3 Record workspace padding is still page-like**  
`adaptive-workspace-shell.tsx` defaults to `py-5` / `sm:py-6`.  
`RecordIdentity` adds `mt-2 gap-3`. Contact/Company/Deal left rails use `space-y-5`.  
The record is readable but the work column does not fill the first glance.

**P1.4 Desk chrome stacks before the thread**  
`room-shell.tsx` + `desk/inbox.tsx`

- Room title “Desk” + Inbox / Conversations / Channels tabs consume the first ~72px before the three-pane work.
- Folder + selected-thread states use `bg-brand/12` and `bg-brand/8` (orange wash). Orange is the primary-action signal, not every selected row.
- Folder stack uses `space-y-5` and `rounded-[12px]` pills.

**P1.5 PageHeader still uses marketing-page spacing**  
`page-header.tsx` is `mb-6 gap-3`. Outbound, Reports, Segments, and Lead show still inherit a large title block before work.

### P2 — polish issues

**P2.1 Object header / toolbar can go one step quieter**  
`CrmObjectHeader` `py-3` and list toolbar `py-2` are fine but still sit above the table as a second band. Tighten, don’t restyle.

**P2.2 Lead board filter strip is a second card-like band**  
Search + chips live in a padded canvas band; the Kanban then has another `px-4 py-3`. Compact into one toolbar + board.

**P2.3 Catch-up on records is a rounded card**  
`catch-up-block.tsx` non-compact mode is `rounded-xl border p-4`. Records already have section labels. The extra frame is decorative.

**P2.4 Pipeline is directionally correct**  
Keep composition. Shared header tightening is enough. Do not add fake search/filters.

**P2.5 Top bar is architecturally correct**  
PR #117. Alignment is acceptable. Do not reopen Find-a-page or add unread badges.

**P2.6 Orange leaks on Desk selection**  
See P1.4. Also RoomShell active tabs correctly use a 2px brand underline — keep that as the one chrome active signal.

### P3 — optional refinement

- Deal board has no keyboard move menu (Lead board does). Do not invent.
- Home period comparison (`+100%`) can be noisy on short windows. Data is real; leave the number, keep it mute.
- Campaigns / templates / other Outbound `PageHeader` pages remain tightened, not destacked. Do not restyle those rooms in this pass.

---

## Highest-leverage shared surfaces (implement these)

1. Home canvas + section grouping (`home.tsx`, `dashboard-header`, `dashboard-section`)
2. `CrmKpiStrip` → hairline strip (Outbound / Reports / Funnels inherit)
3. `PageHeader` spacing
4. `CrmObjectHeader` density
5. `RoomShell` compact chrome (Desk / Outbound / Reports)
6. `AdaptiveWorkspaceShell` + `RecordIdentity` padding
7. Desk selection surfaces (ink, not orange wash)
8. Catch-up + Lead board toolbar tightness

Do **not** touch: AppSidebar, ListViewTable implementation (row padding only), drawer architecture, command palette contract, backend, tokens.

---

## Increment 2 — shipped on this branch

Composition only. No second design system.

| Surface | Change |
|---|---|
| `ReportsShell` | Destacked: `text-page-title`, compact padding, no `max-w-7xl` / 28px title |
| `OutboundPage` | Compact 13px title + 11px mute. Index tables are hairline, not `Card` |
| `crm/reports.tsx` | Hairline groups, quieter dashboard pills, one orange primary (`Add widget`) |
| `ListViewTable` | Row padding only (`py-1.5` / mobile `py-2`) |
| Home KPI strip | One horizontal strip on narrow viewports; `md:grid-cols-5` |
| Pipeline cards | Real `close_date` formatted as day + month (`en-GB`) |
| `DeskGlass` | Canvas + hairline. Empty thread is a mute line, not an EmptyState card |

---

## Ranked implementation order

1. Audit (this file)  
2. Shared foundation (header, KPI strip, page header, room shell, workspace padding)  
3. Home as the reference workspace  
4. CRM objects inherit object-header/toolbar tightness  
5. Records inherit workspace padding  
6. Pipeline inherits header; Desk selection + RoomShell  
7. Mobile: no new interaction model — just less air
