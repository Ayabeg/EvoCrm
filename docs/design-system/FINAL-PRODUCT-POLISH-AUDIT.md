# EvoSales final product polish audit

**Date:** 2026-08-29  
**Baseline:** `main` at the landed 114–122 stack + Lead OS.  
**Method:** repository implementation, not earlier screenshots.

Design read: all-day enterprise CRM for Algerian sales operators. Evotechly Brand Book + Aurora primitives + EvoSales IA. Dials stay Variance 3 · Motion 3 · Density 8.

This pass does **not** redesign. It makes leftover surfaces belong to the already-approved grammars.

---

## Canonical page grammars (approved)

| Grammar | Composition |
|---|---|
| CRM list | Object identity → primary action → filters/views → table |
| Record | Identity → facts → primary work → activity → secondary intelligence |
| Workspace | Identity → compact controls → work surface |
| Room | Room identity → room controls → primary work surface |
| Home | Identity → primary → filters → KPI strip → attention → intelligence → activity |
| Pipeline | Identity → forecast → board controls → board |
| Desk | Inbox → conversation → context |
| Reports | Dashboard identity → controls → visualization |

Do not invent a composition per page.

---

## Already finished enough

Do not undo these.

| Surface | Why it stays |
|---|---|
| AppSidebar | Black 240px rail, CRM objects first-class, More secondary |
| Top bar | Find a page · Create · Notifications · Account |
| Mobile drawer | Aurora Sheet, 240px, `#000` |
| Home | Full canvas workspace, `HomeKpiStrip`, Needs attention first, Lead OS graph under KPIs |
| CRM lists | `CrmShell chrome="workspace"` + `CrmObjectHeader` + `ListToolbar` + `ListViewTable` |
| Contact / Company / Deal records | Shared record grammar; Ask Evo demoted |
| Pipeline | Identity → forecast → List/Board |
| Desk | `DeskGlass` canvas + hairline; empty “Select a conversation” |
| Outbound chrome | `OutboundShell` + `OutboundPage` on listed rooms |
| `ListViewTable` | Stays. Not Aurora DataTable |

---

## Findings (from the current UI)

### P0 — broken

None. Navigation, drawers, overlays, and data contracts hold.

### P1 — visibly unfinished

**P1.1 Reports title renders twice**  
`RoomShell` already prints **Reports**. `ReportsShell` then prints `pageTitle` (often also “Reports”) at `text-page-title`. Two identities for one room.

**P1.2 Lead show is a leftover admin card stack**  
`resources/js/pages/crm/leads/show.tsx` still uses `PageHeader`, `Card`, orange links, and a full-width `p-6 space-y-6` stage. Contacts/Companies/Deals already use record grammar.

**P1.3 Segments still use PageHeader + Card + orange chips**  
Index and history are CRM list/workspace surfaces wearing marketing-page chrome (`space-y-6 p-6`, `bg-brand` filter pills, `text-brand` every link).

**P1.4 Capture inbox still uses SurfaceHeader**  
`aurora-text-display-2` + `p-6` + `HairlinePanel` cards + orange “Leads list” / filter fills. Operationally a CRM list with ingest tools, not a marketing page.

**P1.5 Warmup still uses Aurora `StatCard`**  
Four rounded KPI tiles sit next to destacked Outbound rooms. Same product, two languages. `CrmKpiStrip` already exists.

### P2 — inconsistent

**P2.1 Hairline table/panel still frames as cards**  
`rounded-xl` + full border on `HairlineTable` / `HairlinePanel` vs `ListViewTable` hairline rows. Outbound + Capture inherit this.

**P2.2 Accidental orange**  
Desk “Open contact” and private-note label; lead-board title `hover:text-brand`; capture/segment row links; Warmup “hold at ceiling” brand chip. Orange should be one primary + active chrome, not every link.

**P2.3 Company edit controls use `rounded-xl`**  
Selects on company record disagree with deal `h-8` hairline controls.

**P2.4 Qualify settings is a Card**  
Settings → Qualify is Lead OS adjacent and still a bordered card under `Heading`.

### P3 — optional / leave

- Ads rooms still use `SurfaceHeader` — Ads is a different room; out of this pass.
- Workflows `SurfaceHeader` — Automation, not the leftover list.
- Email HTML preview `[&_a]:text-brand` — content, not chrome.
- Form validation `text-brand` — leave; not a second primary CTA.
- Warmup per-mailbox work units stay grouped (forms + meters). Destack the frame, do not invent a new card.
- Capture ingest (CSV / URL / Maps) is not a CRM list. Keep as grouped work under the inbox table.
- Home, Pipeline, polished records: no further composition change.

---

## Decisions

1. **One Reports identity.** Room owns “Reports”. Inner title only for a saved dashboard name, at section size (13px), not a second 22px page title.
2. **Lead show joins record grammar.** Reuse `RecordPageFrame` / facts / associations / Ask Evo. No new record component. No invented timeline.
3. **Segments and Capture join CRM list grammar.** `CrmObjectHeader` + destacked table. Capture primary is omitted (ingest is the work, not “Create”).
4. **Warmup meters use `CrmKpiStrip`.** Do not add another card.
5. **Destack `HairlineTable` / `HairlinePanel`.** Shared outbound + capture frames become hairlines.
6. **Do not touch** AppSidebar, ListViewTable implementation, drawer architecture, backend, Lead OS logic, or Ads.

---

## Implementation order

1. Shared frames (ReportsShell, HairlineTable/Panel, optional CrmObjectHeader primary)
2. Known leftovers (Reports, Warmup, Lead show, Segments, Capture)
3. Orange / control radius on already-open surfaces
4. Composition tests + browser verify

---

## Implemented (this branch)

All P1 and the listed P2 items were fixed. No new components.

| Finding | Fix |
|---|---|
| P1.1 Reports dual title | Room owns “Reports”. Inner title only when it is a saved dashboard name, at 13px. |
| P1.2 Lead show admin stack | Record grammar: `RecordPageFrame` / facts / Enrichment / Edit / associations / Ask Evo. Qualify stays the only orange primary. Save lead is outline. |
| P1.3 Segments PageHeader + cards | `CrmShell chrome="workspace"` + `CrmObjectHeader` + destacked table + CreateDrawer. Filter chips canvas-soft. |
| P1.4 Capture SurfaceHeader | Same list grammar. Ingest tools stay grouped work. Accept is the only orange primary. |
| P1.5 Warmup StatCard | `CrmKpiStrip`. “hold at ceiling” is a hairline pill. |
| P2.1 Hairline frames | `border-y` / `border-t`. No `rounded-xl`. Mobile rows divide, not cards. |
| P2.2 Accidental orange | Desk / board / outbound / capture / segment row links → ink. Enrichment icon no longer brand. |
| P2.3 Company selects | `rounded-md` hairline. |
| P2.4 Qualify settings | Card removed; `border-t` group. |

---

## Browser verification (2026-08-29)

Headless Chrome against `php artisan serve` after `npm run build`. Login `owner@evosales.local`.

| Width | Light | Dark | Overflow | Reports h1 | Brand row-links | StatCard |
|---|---|---|---|---|---|---|
| 320 | Home, Contacts, Desk, Reports, Capture | same | 0 | 1 | 0 | 0 |
| 375 | Home, Contacts, Companies, Deals, Leads, Lead board, Pipeline, Desk, Outbound, Warmup, Reports, Capture, Segments | same | 0 | 1 | 0 | 0 |
| 390 | Home, Contacts, Desk, Reports, Capture | same | 0 | 1 | 0 | 0 |
| 430 | Home, Contacts, Desk, Reports, Capture | same | 0 | 1 | 0 | 0 |
| 768 | Home, Contacts, Desk, Reports, Capture | same · black rail | 0 | 1 | 0 | 0 |
| 1024 | Home, Contacts, Desk, Reports, Capture | same · black rail | 0 | 1 | 0 | 0 |
| 1280 | Home, Contacts, Desk, Reports, Capture | same · black rail | 0 | 1 | 0 | 0 |
| 1440 | Home, Contacts, Pipeline, Desk, Warmup, Reports, Capture, Segments + records | Home, Reports, Warmup, Capture, Lead record · black canvas `#000` | 0 | 1 | 0 | 0 |
| 1920 | Home, Contacts, Desk, Reports, Capture | same · black rail | 0 | 1 | 0 | 0 |

Records (numeric IDs, not import/duplicates shortcuts): contact, company (`Agri Blida`), deal, lead (`Clinic website intake`) at 1440. Lead also 375 light + dark.

One 375 Pipeline request returned ViteManifestNotFound while `npm run build` rewrote the manifest. Retry after the build: 200, title Pipeline, overflow 0.

Mobile drawer trigger exists at 375. Architecture not changed (240px black Aurora Sheet from #114). This probe’s click did not mount `[data-mobile="true"]` — same flake as the prior pass, not a chrome rewrite.

Dark mode: `html.dark`, canvas `rgb(0,0,0)`, rail `rgb(0,0,0)`, mark `#EC6025` on the single primary. Not an inverted light theme.

---

## Remaining weaknesses (honest)

- Capture ingest remains three tools (CSV / URL / Maps). Outline, not orange. Workflow is not a CRM list.
- Lead / contact / deal right-rail `AssociationCard` headers are still heavier than left `RecordSection`. Existing record chrome — not rewritten.
- Ads and Workflows still use `SurfaceHeader`. Out of this pass.
- Settings connectors / people / attributes still use orange on codes and some links.
- Report-builder, activities, conversations, sequence show still have `text-brand` row links.
- Reports charts use orange as data ink (correct).
- Login can still show “Log in to your account” twice (auth chrome).
- Mobile drawer click is flaky in headless Chrome; architecture left alone.
