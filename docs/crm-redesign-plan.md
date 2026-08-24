# CRM Complete Redesign Plan — Brandbook + taste-skill

**Repo:** [Mohamedbeghanem/EvoSales](https://github.com/Mohamedbeghanem/EvoSales)  
**Baseline:** `main` @ `3c271d8` (HubSpot chrome landed, CRM 500 fixes)  
**Created:** 2026-08-24  
**Mode:** Redesign — **Preserve** (taste-skill §11) — evolve Evotechly brand, unify dual UI, close M14/M2/M4/M10 gaps  
**Design read:** *B2B sales cockpit for Algeria-first teams, with a Linear/HubSpot-clean language, leaning toward Tailwind v4 + shadcn-owned components + Geist + restrained motion (DENSITY 7, VARIANCE 4, MOTION 3).*

---

## 0. Inputs & constraints

### taste-skill (Leonxlnx/taste-skill)

Installed to `.agents/skills/` (13 skills). Primary guides for this plan:

| Skill | Application |
|-------|-------------|
| `design-taste-frontend` | Anti-slop discipline; one accent; Geist over Inter; no purple defaults; dashboard density |
| `redesign-existing-projects` | Audit-first; font/color/hover/states priority; work with existing stack |
| `brandkit` | Presentation quality bar for any future brand-board deliverables |

**Preservation rules (§11):** Keep routes, nav labels, form field names, analytics hooks, and Evotechly orange mark. No silent URL or IA renames.

### Brandbook

**Status:** ✅ **Resolved** — `Mohamedbeghanem/Brandbook` does not exist on GitHub (404: repo never created; confirmed 2026-08-24). Brand tokens are vendored into **[`docs/brandbook/`](./brandbook/README.md)** from live implementation sources.

| Source | Role |
|--------|------|
| [`docs/brandbook/design-tokens.md`](./brandbook/design-tokens.md) | Complete token table (canonical for redesign) |
| [`resources/css/app.css`](../resources/css/app.css) | Live CSS — source of truth for hex values |
| [`public/brand/evotechly/mark.svg`](../public/brand/evotechly/mark.svg) | Mark artwork `#EC6025` |
| [`README.md`](../README.md) § Brand | Product brand rules |
| [`tests/Feature/BrandingTest.php`](../tests/Feature/BrandingTest.php) | Automated assertions |

Marketing PDFs in Google Drive (*Design system v3.0*, *Web Design System v1.0*) use `#FF6A00` for campaigns — **product UI stays `#EC6025`**. If a standalone Brandbook repo is created later, mirror `docs/brandbook/` and reconcile against `app.css`.

---

## 1. Executive summary

### Vision: the “final CRM”

EvoSales becomes a **single coherent sales OS** — not a HubSpot clone with orphaned hub pages. The final look is:

- **Evotechly Cabinet:** white/black neutrals + `#EC6025` as the only action color; Geist Sans at 13px base for data density; true-black sidebar rail (EvoDesk lineage) that never leaks navy/teal into content.
- **HubSpot-grade chrome** on every surface: pinned sidebar, 52px command header (“Find or Ask”), list view tabs, record 3-column shell, right create drawer — **with full feature wiring** (FilterBuilder, saved views, Ask Evo, custom properties, layout editor).
- **Evotechly moats visible in UI:** DZD tabular money everywhere, wilaya/city filters first-class, EvoDesk embed + native desk fallback, owned outbound stack (warmup, domains, suppressions), Meta funnel + deep conversion funnels (#53–56), Algeria/Algiers timezone on reporting.

### Current state (@ `3c271d8`)

| Area | Score | Problem |
|------|-------|---------|
| M14 Visual chrome | ~79 | Shell looks HubSpot; features lag |
| M2 Lists & views | 85→effective ~70 on chrome | `index` pages lack FilterBuilder / ColumnChooser / save-view |
| M4 Record UX | 84→effective ~75 on chrome | `show` pages omit Ask Evo, engagement, custom props |
| M10 AI | 60 on chrome | Backend ready; UI not rendered |
| Consistency | ~65 | **Dual UI:** `index`/`show` (chrome) vs `hub` (feature-complete) |

### Redesign goal

One architecture, one component system, Brandbook-aligned tokens, taste-skill polish (states, typography rhythm, tabular nums, no AI-slop purple). Target **M14 ≥ 90**, restore **M2/M4/M10** without regressing moats.

---

## 2. Brand token mapping

| Brandbook token ([design-tokens.md](./brandbook/design-tokens.md)) | Current CSS / Tailwind | Target token | Usage |
|--------------------------|------------------------|--------------|-------|
| Canvas (primary surface) | `--evosales-canvas` `#FFFFFF` | `bg-canvas` | Cards, main panels |
| Canvas soft (page wash) | `--evosales-canvas-soft` `#F7F7F6` | `bg-background`, `bg-canvas-soft` | App background only |
| Ink (primary text) | `--evosales-ink` `#111111` | `text-ink` | Headlines, body |
| Mute (secondary text) | `--evosales-mute` `#525252` | `text-mute`, `text-muted-foreground` | Labels, hints |
| Hairline (borders) | `--evosales-hairline` `#E5E5E5` | `border-hairline`, `border-border` | Dividers, inputs |
| Mark / brand orange | `--evosales-mark` `#EC6025` | `text-brand`, `bg-primary`, `border-brand` | CTAs, links, active tab pip, focus ring |
| Primary on orange | `--primary-foreground` white | `text-primary-foreground` | Filled buttons |
| Font stack | Geist Sans via `@fontsource` | `font-sans` | All UI; keep Geist (taste-skill approved) |
| Display sizes | Ad hoc `text-[22px]`, `text-[20px]` | `--text-page-title`, `--text-record-title` in `@theme` | Standardize list/record headers |
| Body / data | `text-[13px]` | `--text-ui` 13px / 14px | Lists, records, desk |
| Money | `.money` utility | extend to all DZD | `font-variant-numeric: tabular-nums` |
| Radius | `--radius: 0.5rem` | `rounded-md` default; `rounded-sm` controls | HubSpot-ish tight corners on toolbars |
| Sidebar rail | `--sidebar` `#000000` | `bg-sidebar`, `text-sidebar-*` | Left nav only — never in content |
| Sidebar active | `--sidebar-accent` orange tint light / `#171717` dark | active nav row | Orange wash light; neutral dark |
| Dark Cabinet canvas | `--evosales-canvas` `#0A0A0A`, soft `#000000` | `.dark` tokens | Elevated cards `#0A0A0A`, hairline `#1F1F1F` |
| Logo | `public/brand/evotechly/mark.svg` fill `#EC6025` | **Do not recolor** | Sidebar 24px, favicon, auth |
| Product name | EvoSales · Evotechly | `config('app.name')` | Title, mail, auth |
| Destructive | oklch red | `--destructive` only | Delete flows — not brand |

### Typography scale (proposed)

| Role | Size / weight | Tracking | Notes |
|------|---------------|----------|-------|
| Page title (list header) | 22px / semibold | tight | Contacts, Deals, Reports room |
| Record title | 20px / semibold | tight | Contact/deal name |
| Section label | 11–12px / semibold uppercase | wide | Association cards, KPI labels |
| UI body | 13px / normal | default | Tables, timeline |
| Micro | 10–11px / medium | — | Badges, Ask Evo source chip |
| KPI number | 28px / semibold | `.money` | Home tiles, funnel KPIs |

### Tone (from README + RecordInsight)

- Plain, specific copy — never “HubSpot”, “Breeze”, “Elevate”, “Seamless”.
- Algeria-first: DZD, wilaya, Africa/Algiers, +213.
- Ask Evo voice: two short sentences, record-grounded.

### Do's

- White + black + orange only for brand colors.
- Orange for every primary action and active nav state.
- Dark charcoal/black sidebar in both Light and Dark Cabinet.
- Geist; tabular nums for money and counts.
- Sentence case labels (not Title Case Everywhere).

### Don'ts

- No navy, indigo, teal in dark tokens (already guarded in `app.css`).
- No second accent (green online dot `#22c55e` is status-only).
- No purple AI gradients (Ask Evo may use subtle orange radial — already in panel).
- No recoloring the Evotechly mark.
- No inventing colors beyond Brandbook/README palette.

---

## 3. Information architecture

### Primary rail (pinned defaults — `nav-pins.ts`)

| Order | ID | Label | Route | Rationale |
|-------|-----|-------|-------|-----------|
| 1 | home | Home | `/dashboard` | Command center |
| 2 | contacts | Contacts | `/crm/contacts` | Core object |
| 3 | companies | Companies | `/crm/companies` | Core object |
| 4 | deals | Deals | `/crm/deals` | Core object |
| 5 | desk | Desk | `/inbox` | EvoDesk room |
| 6 | outbound | Outbound | `/outbound` | EvoOutreach room |
| 7 | ads | Ads | `/ads` | Meta room |
| 8 | segments | Segments | `/crm/segments` | Lists → automation |
| 9 | reports | Reports | `/reports` | Analytics room |

### More menu categories (`app-sidebar.tsx`)

Keep seven categories; refine grouping:

| Category | Items | Change |
|----------|-------|--------|
| **CRM** | Contacts, Companies, Deals, Leads (`/leads` board), CRM Leads, Automation, Workflows | Dedupe: pick **one** Leads entry (`/leads` Kommo board); hide `crm/leads` duplicate |
| **Sales** | Home, Pipelines (link `/settings/pipelines`), Quotes (future) | Add pipeline admin shortcut for admins |
| **Desk** | Desk, Conversations | Keep |
| **Outbound** | Hub + Mailboxes, Warmup, Domains, Templates, Campaigns, Sequences, Outbox, Replies, Suppressions, Quiet hours | Keep exhaustive list |
| **Ads** | Ads hub | Keep |
| **Reports** | Reports, Report builder, Outbound reports, **Funnels** (`/reports/funnels` after #56) | Add funnels when merged |
| **Settings** | Settings, Channels, Apps, Appearance, People, Attributes, Pipelines, Connectors, Security | Expand settings leaves |

### Header command bar (`app-sidebar-header.tsx`)

| Element | Current | Target |
|---------|---------|--------|
| Search | GET `/crm/contacts?q=` | **Global command palette** (⌘K): contacts, deals, companies, nav jump, Ask Evo entry |
| Create | Contact, Company, Deal | + Task, Note (context-aware), Enroll sequence |
| Notifications | Bell placeholder | Wire or hide until real |
| User menu | Existing | Keep |

### Breadcrumbs

Retain Inertia layout breadcrumbs; visually de-emphasize (chrome uses page headers, not breadcrumb trail).

---

## 4. Page-by-page redesign spec

### 4.1 Home (`/dashboard`, `home.tsx`)

**Role:** Sales command center — “what needs attention today.”

| Zone | Current | Redesign |
|------|---------|----------|
| Header | Title + star + owner/date selects (partially unwired) | Wire filters to query; add **period comparison** chip |
| KPI tiles | Generic bordered cards | **Evo KPI card** component: label, big number (`.money` where $), sparkline optional |
| Charts | EvoViz area/bar + grid | Fixed **2×2 chart grid** on xl; department moats row (Desk, Outbound, Ads connection status) |
| Next steps | Task list | Add quick-complete; link to record |
| Add content | Dashed placeholder | **Widget picker** (reuse reports catalog subset) |
| Empty | N/A | First-run: connect Meta + mailbox CTA strip |

**Moat callouts:** DZD in pipeline tile; wilaya breakdown widget; outbound warmup status chip.

### 4.2 CRM lists — Contacts, Companies, Deals (`*/index.tsx`)

**Canonical pattern:** HubSpot list chrome + **full** `ListToolbar` capabilities.

| Element | Spec |
|---------|------|
| Header | `CrmListHeader` — object dropdown (future: switch object), view tabs, primary CTA |
| View tabs | All / My / saved views / **+ save current** |
| Toolbar | Merge `list-chrome` toolbar with `list-toolbar.tsx`: FilterBuilder, ColumnChooser, stage pills (deals), export |
| Table | Sticky header, row hover, avatar/initials, DZD column on deals, wilaya on contacts |
| Footer | Count + export + bulk actions (phase 2) |
| Create | `create-drawer.tsx` right sheet — keep |
| Empty | Illustrated empty state (taste-skill: composed getting-started, not bare text) |

**Migration:** Replace `CrmListToolbar` inline filters with `ListToolbar` as single source.

### 4.3 Record pages — Contacts, Deals, Companies (`*/show.tsx`)

**Canonical pattern:** 3-column `RecordShell` + AI rail.

| Column | Content |
|--------|---------|
| Left | Key properties, custom attributes (`RecordProperties`), layout editor button, **Ask Evo** (`AskEvoPanel`), engagement score |
| Center | Record header (avatar, actions, stage picker for deals), `ActivityTabs`, timeline, catch-up block |
| Right | Associations (`AssociationsCard`), deals/contacts links, quotes, line items (deals) |

**Companies:** Migrate `companies/show` from legacy `hub` to chrome `show` matching contacts/deals.

**Deal-specific:** Health pill, forecast band, line items, board link, DZD amount prominent.

### 4.4 Desk (`/inbox`, `desk/inbox.tsx`)

| State | Spec |
|-------|------|
| Connected | Full-height embed; minimal CRM header strip (channel chips, link to email replies) |
| Embed blocked | Native `FrontDesk` — align thread list styling with hub list rows (orange inset active) |
| Empty | `ConnectChannels` — wizard CTA to `/settings/setup/meta` (#57–58) |
| Moat | Never “Open Desk” eject; EvoDesk stays in iframe |

### 4.5 Outbound (`/outbound/*`)

| Page | Spec |
|------|------|
| Hub index | KPI strip (sent, replies, warmup, suppressed) + mailbox health table — use shared KPI card |
| Sequences show | Step funnel viz (EvoViz) when #56 patterns land |
| Warmup | Keep; add visual cap bar per mailbox |
| Mailboxes | Table with status pills matching brand (orange warming, neutral active) |

**Room chrome:** Shared `OutboundShell` — sub-nav tabs under 52px header (Hub, Mailboxes, Sequences, …).

### 4.6 Reports (`/reports`, `crm/reports.tsx`, `crm/report-builder.tsx`)

| Surface | Spec |
|---------|------|
| Reports hub | Category tabs (Pipeline, Leads, Outbound, Ads, Desk, Activity) + saved dashboards |
| Filters | Global owner + date (Africa/Algiers) — sticky bar |
| Widgets | EvoViz charts in unified grid; DZD format on money KPIs |
| Report builder | Keep form; polish with list-chrome header |
| **Funnels** (#53–56) | `/reports/funnels` — stage bars, CPL, source table; sidebar Reports → Funnels; match KPI card system |

### 4.7 Funnels (#53–56) — post-merge integration

Integrate into redesign **after** API/UI PRs merge:

- Shared funnel visualization component (`FunnelStageBar`, `FunnelKpiStrip`).
- Nav: Reports category + pinned optional.
- Ads cross-link from campaign show.

### 4.8 Setup wizard (#57–58)

| Step | Spec |
|------|------|
| Shell | `SetupStepper` — Kommo-style horizontal stepper, troubleshooting panel |
| Meta connect | OAuth CTA, page picker, scope chips |
| Finish | Channel verification checklist; return to Desk |
| Launch points | Sidebar “Set up channels”, Apps index banner, empty Desk |

**Polish:** Apply brand card surfaces; orange primary CTAs; remove generic `Card` shadow slop.

### 4.9 Settings (`/settings/*`)

| Page | Spec |
|------|------|
| Layout | Keep settings layout; add **Settings nav** matching More → Settings category |
| Appearance | Light/Dark Cabinet — preview swatches using brand tokens |
| People | Role badges (owner/admin/member) |
| Attributes | Fill-rate bars — orange accent |
| Pipelines | Stage drag reorder — visual parity with deals board |
| Apps | Marketplace tiles with connection status |
| **New:** Permissions | RBAC matrix (M11 gap) — phase 2 PR |
| **New:** Record layouts | Workspace default layout admin (M4 gap) |

---

## 5. Component system

### Keep (extend)

| Component | Action |
|-----------|--------|
| `app-sidebar.tsx` | Refine More drawer width/scroll; add Funnels + Setup links |
| `app-sidebar-header.tsx` | Wire ⌘K command palette |
| `list-chrome.tsx` | **Merge** with `list-toolbar.tsx` → `CrmListShell` |
| `record-chrome.tsx` | Keep shell primitives; add `RecordHeader`, `RecordKpiRow` |
| `hub-chrome.tsx` | **Deprecate** `HubShell` after migration; keep `formatDzd` → move to `lib/money.ts` |
| `create-drawer.tsx` | Keep; unify trigger from list header |
| `ask-evo-panel.tsx` | Keep styling; mount on all record shows |
| `saved-view-tabs.tsx` | Promote to list header |
| `filter-builder.tsx` | Wire to chrome index |
| `stage-pills.tsx` | Keep on deals list |
| `setup/stepper.tsx` | Keep; brand polish |

### Refactor

| From | To | Reason |
|------|-----|--------|
| Dual list toolbars | `CrmListShell` | Single list architecture |
| `hub.tsx` pages | `show.tsx` + optional split view flag | Eliminate dual UI |
| `page-header.tsx` | Room headers inside shell | Consistency |
| Lucide-only | Keep Lucide (project convention; taste-skill defers if already depended) | Minimize churn |

### Replace / new

| Component | Purpose |
|-----------|---------|
| `EvoKpiCard` | Home, reports, funnels, outbound hub |
| `CommandPalette` | ⌘K global search + Ask Evo entry |
| `RecordAiRail` | Ask Evo + engagement + proactive summary |
| `FunnelViz` | Stage bars for #56 + ads funnel |
| `EmptyRoom` | Branded empty states per room |
| `SkeletonList` / `SkeletonRecord` | Loading states (taste-skill audit) |

### Drawers & steppers

- **Create drawer:** 480px right sheet, hairline border, no double shadow.
- **Layout editor:** Keep modal; admin settings page for defaults.
- **Setup stepper:** Horizontal numbered steps, orange completed check.

---

## 6. HubSpot parity + Evotechly moats

### Closing M14 chrome gaps (from PR #52)

| Gap | Redesign action | Parity impact |
|-----|-----------------|---------------|
| Dual UI | Unify on chrome; retire hub pages | M14 consistency 65→90 |
| Lists missing FilterBuilder | Wire `ListToolbar` on index | M2 +15 effective |
| Ask Evo not on show | Render `AskEvoPanel` | M4/M10 +10 |
| Company show = hub | Migrate to record chrome | M14 |
| Command search | ⌘K palette | HubSpot global search parity |
| Test drift | Update Pest to assert `index`/`show` | CI truth |

### Moat surfacing (don't HubSpot-copy these away)

| Moat | UI treatment |
|------|--------------|
| **DZD / Algeria** | `.money` everywhere; wilaya/city in filters + reports; TZ label on date pickers |
| **EvoDesk** | Desk embed first; native fallback styled as CRM, not Chatwoot clone |
| **EvoOutreach** | Outbound room with warmup/domains/ suppressions visible in nav; health on home |
| **Meta native** | Ads funnel + segment → audience; funnel dashboard (#56) |
| **Owned stack** | No fake OAuth; honest “connect” states in Apps |
| **Ask Evo** | Distinct from Breeze — record-grounded, orange accent panel, “This record” vs “Evo + model” chip |

---

## 7. PR breakdown

| # | Branch | Title | Scope | Depends | Acceptance |
|---|--------|-------|-------|---------|------------|
| 1 | `cursor/design-tokens-brandbook-91cb` | feat(ui): consolidate Evotechly design tokens | `app.css` `@theme` typography scale, document Brandbook sync | — | Tokens documented; no visual regressions; dark mode AA |
| 2 | `cursor/crm-list-shell-unify-91cb` | feat(crm): unify list chrome with FilterBuilder | Merge `list-chrome` + `list-toolbar` on contacts/deals/companies index | 1 | Saved views, column chooser, filter builder work on index |
| 3 | `cursor/crm-record-ai-rail-91cb` | feat(crm): Ask Evo and properties on record pages | Wire `AskEvoPanel`, engagement, `RecordProperties` on show controllers/pages | 1 | RecordInsightTest passes on show components |
| 4 | `cursor/crm-company-record-chrome-91cb` | feat(crm): migrate company record to chrome | Replace `companies/hub` show with `companies/show` | 3 | Single company UX |
| 5 | `cursor/crm-command-palette-91cb` | feat(chrome): global Find or Ask command palette | ⌘K modal, search API or client route index | 1 | Opens from header; searches contacts/deals |
| 6 | `cursor/crm-home-command-center-91cb` | feat(home): wire filters and KPI cards | Home dashboard filters, `EvoKpiCard`, department row | 1 | Owner/date filters query backend |
| 7 | `cursor/crm-hub-retire-91cb` | refactor(crm): retire legacy hub pages | Remove or redirect hub components; update tests | 2, 3, 4 | No dual UI; Pest green |
| 8 | `cursor/crm-reports-funnels-chrome-91cb` | feat(reports): funnels + reports visual unify | Funnel pages (#56) + reports grid + KPI components | 1, #56 merged | Funnels in nav; shared viz |
| 9 | `cursor/crm-outbound-desk-shell-91cb` | feat(rooms): desk and outbound room chrome | Sub-nav shells, empty states, embed polish | 1 | Desk/outbound feel native to CRM |
| 10 | `cursor/crm-setup-wizard-polish-91cb` | feat(setup): brand polish on OAuth wizard | #57–58 UI pass with tokens + stepper | 1, #57–58 | Wizard matches Cabinet |
| 11 | `cursor/crm-states-motion-91cb` | feat(ui): loading empty error states | Skeletons, EmptyRoom, hover/focus pass | 1 | taste-skill audit items addressed |
| 12 | `cursor/crm-settings-admin-ui-91cb` | feat(settings): layouts and permissions UI | Record layout admin, RBAC matrix v1 | 3 | Admin can set workspace layout |

**Recommended merge order:** 1 → 2 → 3 → 4 → 7 → 5 → 6 → 9 → 8 (after #53–56) → 10 (after #57–58) → 11 → 12

**Parallel stacks:** Funnels (#53–56) and OAuth (#57–58) can merge independently; redesign PRs 8 and 10 integrate them.

---

## 8. Migration strategy

### Phase A — Stop the bleed (PRs 2–3)

1. Wire existing hub capabilities onto chrome pages **without deleting hub yet**.
2. Controllers: ensure `index`/`show` pass same props as hub (`listView`, `askEvo`, `catchUp`, etc.).
3. Feature flag optional: `CRM_USE_HUB=false` (default chrome) for rollback.

### Phase B — Consolidate (PR 7)

1. Delete `crm/contacts/hub.tsx`, `deals/hub.tsx`, `companies/hub.tsx` once parity checklist green.
2. Redirect any hub URLs if bookmarked (unlikely — same routes).
3. Realign `CrmSavedViewTest`, `RecordInsightTest`, `CrmRecordWorkspaceTest` to `index`/`show`.

### Phase C — Polish (PRs 5–12)

Command palette, home, rooms, funnels integration, settings admin.

### Ask Evo wiring

```text
ContactController@show → askEvo, contactEngagement, proactiveSummary (already passed)
contacts/show.tsx → import AskEvoPanel, mount in left rail
Same pattern for DealController + deals/show.tsx
```

### Saved views

- `SavedViewTabs` + `FilterBuilder` on list shell.
- “Save view” posts to `SavedFilterController`; tabs reflect workspace/team visibility.

---

## 9. Screenshot QA checklist

Use production or seeded workspace. Capture **Light + Dark Cabinet** for each.

### Brand & shell

- [ ] Sidebar black rail; orange active state (light mode)
- [ ] Logo mark orange `#EC6025` — not recolored
- [ ] Header: Find or Ask, Create, user menu — 52px height
- [ ] No navy/teal in dark mode content area
- [ ] Geist rendering; DZD uses tabular nums

### Home

- [ ] KPI tiles aligned; owner/date filters work
- [ ] EvoViz charts render
- [ ] Next steps list + empty state
- [ ] Department / integration status visible

### Lists (contacts, deals, companies)

- [ ] View tabs: All / My / saved
- [ ] FilterBuilder + ColumnChooser functional
- [ ] Save view flow works
- [ ] Create drawer; export footer
- [ ] Deals stage pills with counts

### Records (contact, deal, company)

- [ ] 3-column layout responsive
- [ ] Ask Evo panel visible and submits
- [ ] Custom properties editable
- [ ] Association cards link correctly
- [ ] Deal: health, DZD, line items

### Desk & Outbound

- [ ] Desk full-height; embed or fallback
- [ ] Outbound hub KPIs; warmup page

### Reports & Funnels

- [ ] `/reports` categories + dashboards
- [ ] `/reports/funnels` stage bars (post-#56)
- [ ] Report builder save/run

### Setup & Settings

- [ ] Setup wizard stepper (#57–58)
- [ ] Apps Meta OAuth status
- [ ] Appearance Light/Dark toggle
- [ ] Pipelines reorder

---

## 10. Risks & open questions

| Risk | Mitigation |
|------|------------|
| ~~Brandbook repo inaccessible~~ | **Resolved:** vendored to `docs/brandbook/`; tokens from `app.css` + mark.svg |
| Hub deletion breaks hidden workflows | Parity checklist + Pest before delete |
| Command palette scope creep | v1: search + nav only; Ask Evo in v2 |
| Funnels/OAuth stacks not merged | Redesign PRs 8/10 are integration-only; don't block core unification |
| Dark mode contrast on orange | Test WCAG AA on `#EC6025` white text buttons |
| Render deploy | No new bind ports; `npm run build` only; ephemeral FS unchanged |
| taste-skill icon swap (Phosphor) | Defer — Lucide already project-wide |
| Performance on FilterBuilder | Server-side filter apply unchanged; UI debounce |

### Open questions for product owner

1. **Hub vs split view:** Retire hub entirely, or offer optional split-pane list+record (HubSpot preview pane)?
2. **⌘K scope:** Global Ask Evo copilot or record-only first?
3. **Leads duplication:** Keep `/leads` board only and remove `/crm/leads` from More?
4. **Merge priority:** Complete dual-UI fix before funnels/oauth, or parallel?

---

## Appendix A — File audit map (@ `3c271d8`)

| File | Role | Redesign touch |
|------|------|----------------|
| `resources/css/app.css` | Tokens | PR 1 |
| `app-sidebar.tsx` | Nav | PR 1, 8 |
| `app-sidebar-header.tsx` | Command bar | PR 5 |
| `list-chrome.tsx` | List UI | PR 2 |
| `list-toolbar.tsx` | Advanced list | PR 2 |
| `record-chrome.tsx` | Record shell | PR 3 |
| `hub-chrome.tsx` | Legacy | PR 7 deprecate |
| `contacts/index.tsx` | Chrome list | PR 2 |
| `contacts/show.tsx` | Chrome record | PR 3 |
| `contacts/hub.tsx` | Legacy | PR 7 remove |
| `home.tsx` | Dashboard | PR 6 |
| `desk/inbox.tsx` | Desk | PR 9 |
| `crm/reports.tsx` | Analytics | PR 8 |
| `settings/setup/wizard.tsx` | OAuth quiz | PR 10 |

## Appendix B — Related docs & PRs

- [HubSpot parity comparison](https://github.com/Mohamedbeghanem/EvoSales/pull/52) (draft)
- [EvoCells roadmap](./evocells-roadmap.md)
- Funnels: #53–56 | OAuth setup: #57–58
- taste-skill: `.agents/skills/design-taste-frontend/SKILL.md`, `redesign-existing-projects/SKILL.md`

---

*Plan only — no production UI changes in this PR.*
