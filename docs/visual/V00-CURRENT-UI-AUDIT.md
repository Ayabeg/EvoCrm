# V00 — Current UI audit

**Method:** Taste redesign protocol (§11) against live source, CSS tokens, and P25/P26/P27 contracts at `fc57d94`.  
**Viewport intent:** 1440 first.  
**Browser:** This environment has no PHP runtime, no `vendor/`, and no seeded app. A populated 1440 screenshot pass was **not** possible here. The audit is source-true. V01 opens with a 1440 screenshot verification against this file before paint.

Taste diagnosis language below is compositional, not a request to change behavior.

---

## Global reading

**Current inferred dials:** Variance ~2–3 (lists share one grammar; Home / Inbox / Automation / Settings already fork by accident). Motion 3 (P27). Density ~8–9 (11px labels, stacked chrome).

**Current strengths**

- DataWorkspace is a real list operating system (header, views, filters, table, peek).
- Tokens in `app.css` already sit next to the V00 palette (`#F7F7F5`, `#E8530E`, Geist).
- Shadows are mostly suppressed. Phosphor is the product icon language.
- Settings already uses Page 28/34 and a 900px form measure.
- P25 overflow, P26 names/focus, P27 timing are in the tree.

**Current weaknesses**

- Type split: 28 / 22 / 20 / 16 / 15 / 13 / 12 / 11 / 10.
- Surface fragmentation: canvas-soft wrapper + white island + bordered widget + bordered row.
- Border on every horizontal band (header, views, filter, chips, table, pager).
- Second navigation (`RoomShell`) on routes the rail already names.
- Generic SaaS “title + button + cards + table” on too many screens.
- Aurora button default 32×9px vs law 36×8.
- QRD hex-styled as a private mini-theme.
- Badge default maps to Aurora `cyan`.
- Tiny text used to fake density.

**Taste diagnosis:** Competent HubSpot-shaped CRM with a real primitive stack, still reading as a component assembly. Hierarchy is announced by boxes, not by type and grouping.

**Design opportunity:** Restyle the shared system once. Give each product area a signature. Lift type. Remove nested cards. Keep the work the same.

**Do not break:** Routes, permissions, list-query, QRD peek, deal move, quote lifecycle, workflow payloads, Ask Evo context/security, P25/P26/P27 contracts.

---

## Shell

**Files:** `app-sidebar.tsx`, `app-sidebar-header.tsx`, `app-shell.tsx`, `layouts/app/app-sidebar-layout.tsx`, `ui/sidebar.tsx`

**Current strengths**

- 64 / 240 rail with collapse cookie.
- Phosphor icons, 36px expanded rows, 48px collapsed hit.
- Topbar: search opens Command OS, Create, Tasks, profile. One command surface.

**Current weaknesses**

- Paper sidebar is correct in tokens; More flyout still mixes `--evosales-*` literals.
- Breadcrumbs accepted and discarded.
- Sparkle looks like Ask Evo but opens Command OS.
- Topbar chrome height 44–52 vs law 56.
- Active state is soft; hierarchy between Home / CRM / Communication is weak (11px uppercase group labels).

**Taste diagnosis:** Usable rail, still generic SaaS icon-nav. Grouping is labeled, not composed.

**Design opportunity:** V01 makes the shell the brand. Stronger active orange wash. 13px group labels. Search as a real field, not a collapsed chip.

**Do not break:** Collapse cookie, simple-mode leaf swap, Command OS / ⌘K, create `?create=1`, capability gates, P25 overflow on the content column.

---

## Dashboard

**Files:** `pages/home.tsx`, `components/dashboard/*`

**Current strengths**

- Operating home: attention, today, pipeline, recent, KPI strip, activation.
- KPI values scale toward 28px on large screens.
- Empty widgets exist.

**Current weaknesses**

- Title is 22px (`text-page-title`), not Page 28/34.
- Meta 11px throughout.
- `.home-widget` border + 1px shadow on a soft canvas = card stack.
- 2×2 equal widgets is the generic dashboard template Taste bans for marketing and should not be the only Home composition.
- Primary CTA is `size="sm"` / `h-8`.

**Taste diagnosis:** Utilitarian tiles. No hero hierarchy. Looks like four cards and a metric row.

**Design opportunity:** Signature: attention-first band + KPI rail + work column. Widgets become continuous surfaces, not boxed apps.

**Do not break:** Activation payload and dismiss, dashboard hrefs, `canCreate`, P17 `data-home` hooks.

---

## Contacts / Companies / Leads / Deals lists

**Files:** `pages/crm/{contacts,companies,leads,deals}/index.tsx`, `crm-list-shell.tsx`, `DataWorkspace.tsx`, `list-view-table.tsx`

**Current strengths**

- Shared-table DataWorkspace. PageHeader 28/34. Saved views. Filter bar. 48px rows. QRD peek.
- List-query is the durable filter source.

**Current weaknesses**

- Chrome stack is tall: header + view pills + filter + chips (+ deals stage pills).
- White shell on `bg-canvas-soft` doubles the surface.
- Table headers 11px.
- Every toolbar is a bordered band.
- Deals list adds attention banner on top of the same stack.

**Taste diagnosis:** Best product grammar in the app, still chrome-first. Reads as a component demo of DataWorkspace.

**Design opportunity:** One continuous workspace. Views and filters share a band. Table is the page. Identity column carries hierarchy.

**Do not break:** list-query URLs, column contracts, peek vs navigate, bulk endpoints, export hrefs.

---

## Pipeline

**Files:** `pages/crm/deals/board.tsx`, `deal-pipeline-board.tsx`, `pipeline-kanban.tsx`

**Current strengths**

- Same DataWorkspace with `mode="board"`.
- Flat cards, no shadow, QRD on click, column amounts visible.
- Local H-scroll is deliberate (P25).

**Current weaknesses**

- Board is a list page with the table swapped out. Forecast + attention + filter + 28px title eat the board.
- Stage titles 11px uppercase.
- Empty can appear in the banner and in the column.

**Taste diagnosis:** Functional kanban trapped in list chrome.

**Design opportunity:** Board-first signature. Slim filter. Stage names at 13px sentence case. Cards stay quiet.

**Do not break:** POST `/crm/deals/:id/move`, stage slugs, attention engine, drag vs peek, keyboard stage menu (P26).

---

## QRD + Record workspaces

**Files:** `QuickRecordDrawer.tsx`, `record-chrome.tsx`, `record-hub.tsx`, `*/show.tsx`

**Current strengths**

- Peek does not delete show routes.
- Adaptive 3-pane record (About / Activity / Insights).
- Record title 20px reads.
- Association cards are already flattened (`border-0`).

**Current weaknesses**

- QRD is a hex private theme (`#161616`, `#E3E3DF`, `#F7F7F5`) at 16px title.
- Record frame uses a 3px brand bar plus many 11px uppercase sections.
- Right rail stacks Ask Evo + bordered modules.
- `RecordHubHeader` (22px) is unused dead chrome.

**Taste diagnosis:** Salesforce depth without Lightning clutter is the intent. Execution is three densities fighting (drawer / record / list).

**Design opportunity:** One record type scale. QRD uses product tokens. Insights column is one surface, not a pile of cards.

**Do not break:** `?record=` peek, hydrate, Escape/focus restore, attribute POST, activity composer, Ask Evo action URLs, association links.

---

## Activities

**Files:** `pages/crm/activities/index.tsx`, `activity-work-queue.tsx`

**Current strengths**

- 28/34 title. Sticky group headers. Queue mental model.

**Current weaknesses**

- Triple chrome: rail + RoomShell + page header.
- Many bordered `h-7` filter chips.

**Taste diagnosis:** Serious ops queue wearing a second app's tab bar.

**Design opportunity:** Queue signature. Drop RoomShell. Filters as a single band.

**Do not break:** P15 groups, complete permissions, queue hrefs.

---

## Inbox

**Files:** `pages/desk/inbox.tsx`, `crm/conversations.tsx`, desk chrome

**Current strengths**

- Adaptive folders / threads / conversation.
- Empty + connect paths exist.
- 13px desk type is more readable than 11px CRM labels.

**Current weaknesses**

- RoomShell + folder rail + list = layered nav.
- Embed vs native are two UIs.
- Fourth CRM-context pane appears on wide layouts.

**Taste diagnosis:** Communication hub with too many sidebars.

**Design opportunity:** Inbox signature: folders + threads + conversation as one continuous desk. CRM context as a slim inspector, not a fourth card column.

**Do not break:** Native and embed both stay (P25). Visit generation. Connector flows. CRM context matching.

---

## Quotes + Quote Builder

**Files:** `pages/crm/quotes/index.tsx`, `quote-split-builder.tsx`, `quotes/show.tsx`

**Current strengths**

- List is DataWorkspace.
- Builder is document-first. Paper metaphor is the right instinct.
- Send / revoke grouped.

**Current weaknesses**

- Show header 20px + document title 22px on one page.
- Line headers 11px.
- Builder grid is a third layout family vs record 3-pane.

**Taste diagnosis:** Invoice editor trapped between record chrome and list chrome. The paper should win.

**Design opportunity:** Quotes signature: list like CRM objects; builder as a document canvas + properties rail. No extra 22px title.

**Do not break:** Immutability after send, public URL, line-item field names, send/revoke actions.

---

## Automation

**Files:** `pages/crm/workflows/index.tsx`, workflow builder

**Current strengths**

- Templates + list + builder + history exist.
- Hairline panels are flatter than Home cards.

**Current weaknesses**

- `aurora-text-display-2` is a third header dialect.
- RoomShell tabs duplicate the rail.
- Native `window.confirm` for destroy.

**Taste diagnosis:** Feature page, not part of the same product.

**Design opportunity:** Automation signature: canvas + run history. PageHeader 28/34. No RoomShell.

**Do not break:** Draft dirty checks, toggle/delete, execution history, template POST, `can_manage`.

---

## Settings

**Files:** `layouts/settings/layout.tsx`, `settings/chrome.tsx`, profile / workspace / attributes / apps

**Current strengths**

- Best-aligned with Visual Law today: 28/34, 14px description, 900px measure, left nav groups.
- Search over a long IA.

**Current weaknesses**

- Radius 4 vs product 8–10.
- Attributes uses HairlineTable (second table).
- Apps nest marketplace cards inside settings cards.

**Taste diagnosis:** Calm admin console. Slightly tighter and flatter than ops pages. That split can stay if documented.

**Design opportunity:** Settings signature: nav + one form column. Cards only around a saveable group.

**Do not break:** Settings IA visibility, role gates, marketplace connect, form field names.

---

## Integrations + Activation + Ask Evo

**Files:** `settings/apps/*`, `activation-checklist.tsx`, `ask-evo-drawer.tsx`, `ask-evo-panel.tsx`

**Current strengths**

- Activation is non-modal with a named progressbar (P26).
- Ask Evo is capability-gated and context-scoped (P24).
- Apps grid is readable.

**Current weaknesses**

- Activation card competes with Home widgets.
- Ask Evo answers at 10–12px.
- Three Ask Evo surfaces (rail, record drawer, global drawer) with different density.
- Topbar Sparkle is not this drawer.

**Taste diagnosis:** AI bolted on as a small panel. Activation is a checklist card, not part of Home's signature.

**Design opportunity:** Activation as a Home band, not a nested card. Ask Evo body 13–14px. One header pattern for all Ask Evo surfaces.

**Do not break:** Activation endpoints, app flags, OAuth, Ask Evo `/ask-evo` + context fetch + scope reset.

---

## Cross-cutting Taste findings

| Problem | Where it shows | Law response |
|---|---|---|
| Hierarchy by boxes | Home, Settings apps, record rail | Surface law |
| Tiny text | Table headers, QRD, Ask Evo, nav groups | 12px floor |
| Generic SaaS | Home 2×2, list title+button+table | Screen signatures |
| Component-stack | DataWorkspace bands | Continuous workspace |
| Weak CTA | Home `h-8`, many ghosts | One 36px accent CTA |
| Table rhythm | 11px header / 13px body / hairline every row | 13/18 table, quieter rules |
| Empty space | Soft canvas around white islands | One surface |
| Visual noise | RoomShell + pills + chips + banners | One chrome band |
| Alignment | Mixed 4 / 8 / 10 / 12 / 20 radii | Radius table |
