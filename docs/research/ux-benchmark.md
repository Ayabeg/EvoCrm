# EvoCRM UX benchmark

| | |
|---|---|
| **Status** | Approved research |
| **Audited revision** | `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2` |
| **Product** | EvoCRM — all-in-one sales OS (CRM + Desk + Outbound + Ads) |
| **Stack** | Laravel 13, Inertia 3, React 19, TypeScript, Tailwind 4 |
| **Authority** | EvoCRM tokens, typography, density, icons, and motion remain authority. Behavioral references only. Never import paint. |
| **Method** | CONSOLIDATE → NORMALIZE → MIGRATE → IMPROVE → POLISH. Not a rewrite. |

Preserve forever: Laravel controllers, Inertia contracts, permissions, models, route semantics, imports/exports/bulk, deal movement, workflow execution, quote lifecycle, Inbox/EvoDesk boundary, Ask Evo permissions, connectors.

Related: [`docs/design-system.md`](../design-system.md) · [`docs/evocrm-mobbin-contract.md`](../evocrm-mobbin-contract.md) · [`docs/implementation/MASTER-IMPLEMENTATION-PLAN.md`](../implementation/MASTER-IMPLEMENTATION-PLAN.md)

---

## 1. Product and foundations that already exist

Do not rebuild these. Redesign consolidates them onto one grammar.

| Foundation | Where it lives |
|---|---|
| App shell 64 / 240 grouped rail | `resources/js/components/app-sidebar.tsx`, `app-sidebar-header.tsx`, `layouts/app/app-sidebar-layout.tsx` |
| DataWorkspace suite | `resources/js/ds/workspace/{DataWorkspace,SavedViews,FilterBar,AdvancedFilterDrawer,DataTable,BulkActionBar}` |
| CrmListShell adapter | `resources/js/components/crm/crm-list-shell.tsx` |
| Full RecordShell / Ask Evo | `record-chrome.tsx`, `record-hub.tsx`, `ask-evo-panel.tsx` + show pages |
| Native Inbox + optional EvoDesk embed | `pages/desk/inbox.tsx`, `inbox-chrome.tsx` |
| Shared Deals / Pipeline engine | `/crm/deals` list · `/crm/deals/board` · `/leads` → board |
| Quotes | `/crm/quotes` list + show builder · public `/q/{token}` |
| Workflows | `/crm/workflows` structured table + `/automation` alias |
| Reports | `/reports`, `/crm/report-builder` |
| Settings + setup wizard | `layouts/settings/layout.tsx`, `/settings/setup` |
| Command palette | `components/crm/command-palette.tsx` |

---

## 2. Findings 1–12

### Finding 1 — DataWorkspace is an adapter shell

`DataWorkspace` owns chrome (header, saved views, filter bar, advanced drawer). `CrmListShell` mounts it with `rows={[]}` and `selectedIds={[]}`. Domain tables bypass row/selection ownership. The suite cannot enforce one list grammar until pages pass real rows and selection.

**Evidence:** `resources/js/components/crm/crm-list-shell.tsx`, `resources/js/ds/workspace/DataWorkspace.tsx`.

### Finding 2 — CrmListShell vs domain pages

Contacts, Companies, Deals list, Quotes, and Tickets go through `CrmListShell`. Companies (and leads/tickets/activities/segments/workflows) still wrap `CrmShell` (double chrome). Leads index is a raw `<table>` + `CrmObjectHeader`. Activities use `CrmListHeader`. Domain pages still own `ListViewTable`, page-local selection, and `components/crm/bulk-action-bar.tsx` (contacts + deals only).

**Evidence:** `pages/crm/contacts/index.tsx`, `companies/index.tsx`, `deals/index.tsx`, `quotes/index.tsx`, `leads/index.tsx`, `activities/index.tsx`.

### Finding 3 — Phosphor / Lucide + parallel app-header

`components.json` `"iconLibrary": "phosphor"`. Sidebar and topbar are Phosphor. Command palette, `record-chrome`, Ask Evo, activity composer, setup wizard, and leftover `app-header.tsx` still import `lucide-react`. `layouts/app/app-header-layout.tsx` + `app-header.tsx` are unused by `AppLayout`. Two families on one product is a principal consistency risk.

**Evidence:** `resources/js/components/app-sidebar.tsx`, `app-header.tsx`, `components/crm/command-palette.tsx`, `record-chrome.tsx`.

### Finding 4 — Saved views tab limit

`SavedViews` pins `views.slice(0, 3)` and overflows the rest into a menu. HubSpot/Attio/Airtable keep visible view tabs as the primary way to switch worksets; a hard three-pill cap hides operator views. Overflow is acceptable only after a meaningful visible set, not as the default ceiling.

**Evidence:** `resources/js/ds/workspace/SavedViews.tsx` (`const pinned = views.slice(0, 3)`).  
**Mobbin:** HubSpot contacts saved views + chips — [2c2951a8](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4). HubSpot deals list views — [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d).

### Finding 5 — No universal Quick Record Drawer

Create is `CreateDrawer`. Show is a full `RecordShell` workspace. Nothing peeks a record from list, pipeline, inbox, activities, or command. Approved target: KEEP the full workspace; ADD `QuickRecordDrawer` (identity, status, owner, essentials, associations, recent, next action, shortcuts). Not deep edit. URL / back explicit.

**Evidence:** `create-drawer.tsx`; no `QuickRecordDrawer` / `RecordDrawer` in `resources/js`.  
**Mobbin:** HubSpot 3-pane contact — [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1). Salesforce inspector depth — [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6).

### Finding 6 — Inbox / EvoDesk boundary

Native CRM inbox is the product IA (`data-inbox="native"`). EvoDesk iframe is a fallback (`embedUrl && !useNative`), not the layout. Contact facts live in `InboxContactSidebar`. Do not replace native IA with the embed. Do not delete the embed path.

**Evidence:** `pages/desk/inbox.tsx`, `inbox-chrome.tsx`, `docs/desk-iframe-headers.md`.

### Finding 7 — `/leads` → board; one deal engine

`Route::redirect('/leads', '/crm/deals/board')`. Deal list is `/crm/deals`. Pipeline is `/crm/deals/board`. `/crm/leads` is a **different inbound lead object**, not a second deal board. Orphan `pages/leads/board.tsx` + `LeadBoardController` have no web route. Reject a separate Lead Board product.

**Evidence:** `routes/web.php`, `pages/crm/deals/board.tsx`, `pages/leads/board.tsx`.  
**Mobbin:** Deals board — [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1). Closed columns — [b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe).

### Finding 8 — Quotes create is a compact drawer

Quote create is `CreateDrawer` posting `/crm/deals/{id}/quotes` (needs a deal). Show page is already the line-item editor inside `RecordShell`. Approved: keep compact create; do not pretend the drawer is a Stripe split builder. Builder/lifecycle polish belongs on the show page (Stripe + HubSpot / PandaDoc pattern, EvoCRM tokens).

**Evidence:** `pages/crm/quotes/index.tsx`, `pages/crm/quotes/show.tsx`.

### Finding 9 — Workflows need test-before-activate

Workflows are a structured table + create drawer + templates (`pages/crm/workflows/index.tsx`). Toggle posts `/crm/workflows/{id}/toggle` with no test / dry-run / last-run step. Approved automation grammar is Shopify Flow + HubSpot + Zapier — **structured, not an n8n canvas default**. Activate must not be a silent flip.

**Evidence:** `pages/crm/workflows/index.tsx` toggle form.

### Finding 10 — Command / Ask Evo not fully unified

Topbar search and Sparkle both open the command palette. Palette sections are Records + Navigate only (Lucide). No Create section (topbar Create is a separate dropdown). No Ask Evo section. Home nav item targets `/home`; authenticated home is `/dashboard` (`/` is named `home` and redirects). Ask Evo on records is a separate panel with its own POSTs.

**Evidence:** `app-sidebar-header.tsx`, `components/crm/command-palette.tsx`, `ask-evo-panel.tsx`.  
**Mobbin:** AI rail shape — [7783b0d6](https://mobbin.com/screens/7783b0d6-ca17-40ef-89ea-bc8752e3a6fb).

### Finding 11 — Settings IA is not scoped by operator job

Live groups: You / Workspace / Integrations / CRM / Admin. Approved IA: **Personal / Workspace / CRM / Communication / Automation / Integrations / Developer**. Max two nav levels. Danger actions stay scoped to the object they destroy. Get started (`/settings/setup`) is a wizard, not proof of activation.

**Evidence:** `layouts/settings/layout.tsx`.

### Finding 12 — Home vs Reports

Home (`/dashboard`, `pages/home.tsx`) is the operating surface: KPIs, Needs attention, `GuidedActions`, pipeline, quota, activity. Reports (`/reports`, report builder) are analysis. Do not turn Home into Salesforce widget soup. Do not hide Reports inside Home. Activation (first CRM outcome) is missing as a durable Home checklist — wizard-dismiss is not onboarded.

**Evidence:** `pages/home.tsx`, `HomeController` / `HomeDashboardBuilder`.  
**Mobbin:** HubSpot guided home — [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748). Salesforce home anti-pattern — [7dac13de](https://mobbin.com/screens/7dac13de-4760-4219-9f58-dabea6659236).

---

## 3. Benchmark matrix

Behavioral references only. Never import paint (no HubSpot teal, no Salesforce blue, no Linear purple, no Pipedrive green).

| Surface | Reference pattern | Adopt | Reject |
|---|---|---|---|
| **Shell** | Linear | Grouped rail, command-first topbar, 64/240, collapse + tooltips | Second header product (`app-header`), black Wave-0 rail as a second theme |
| **Dashboard** | Shopify + Stripe + HubSpot | Attention first, real KPIs, guided next action | Salesforce widget soup [7dac13de](https://mobbin.com/screens/7dac13de-4760-4219-9f58-dabea6659236) |
| **DataWorkspace** | HubSpot + Attio + Airtable | Saved views, chips, advanced drawer, bulk bar, list\|board | Per-object list shells; domain tables bypassing selection |
| **Records** | HubSpot + Attio | Full workspace KEEP; Quick Record Drawer ADD | Peek-only product; deep edit in the drawer |
| **Pipeline** | Pipedrive + HubSpot | One deal engine; column = stage+count+total+weighted; card attention | Separate Lead Board; drag-only move |
| **Inbox** | Intercom + Front + HubSpot | Native thread + CRM context | Embed as IA; Slack rail [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) |
| **Activities** | Linear + Asana | Work queue (overdue / today / upcoming) | Dump list with no grouping |
| **Automation** | Shopify Flow + HubSpot + Zapier | Structured trigger → condition → action; test-before-activate | n8n canvas as default |
| **Quotes** | Stripe + HubSpot / PandaDoc | Compact create; split builder on show; send/revoke/accept | Treating the create drawer as the builder |
| **Settings** | Stripe + Vercel + Shopify + Linear | IA by scope; max 2 levels; scoped danger | Flat dump; global danger zone |
| **Integrations** | Shopify + Zapier | Directory with status / connect / disconnect | Env-var wall |
| **Command** | Linear + Slack + Notion | Navigate · Records · Create · Ask | Lucide island; `/home` dead href |
| **Onboarding** | Shopify + Linear + Stripe | Durable checklist to first CRM outcome | Wizard-dismiss = onboarded |
| **AI** | Contextual Intercom / HubSpot | Ask Evo on the record + command section | Second AI product; Breeze / Copilot / Einstein names |
| **Micro-UX** | Linear + Stripe + WAI-ARIA / WCAG | See `micro-ux-benchmark.md` | Color-only status; tooltip-only critical actions; per-page primitives |

---

## 4. Mobbin evidence (user pack)

Cite these screens for **density and IA only**. Tokens stay EvoCRM (`#E8530E`, Geist, paper).

| Surface | Copy from the screen | Mobbin |
|---|---|---|
| Sales home | Guided actions left, activity feed right, trophy empty when caught up | [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748) |
| Sales workspace | Summary / Leads / Deals / Tasks / Schedule tabs | [87dcd39f](https://mobbin.com/screens/87dcd39f-a9aa-461e-9fb6-5aec87d0e017) |
| Deals list | Saved views, filter chips, list/board toggle, Create deal, amount column, pagination | [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d) |
| Deals workspace | Preset views (Open / Stalled / No activity), stage bar, health score, next meeting | [d947de05](https://mobbin.com/screens/d947de05-912e-49f9-8db7-c846ac7e50ee) |
| Deals board | Stage columns, card (name, company, amount, close date), inactivity line, High/Low, column Total + Weighted | [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1) |
| Deals board (closed) | Closed Won / Closed Lost columns | [b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe) |
| Board editor | Compact vs Default cards, priority + associations, inactive after N days | [d9777088](https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860) |
| Contacts list | Saved views, filters, Create contact | [70e7b2e2](https://mobbin.com/screens/70e7b2e2-e7ca-4ee4-9fd8-bb7d881a8d27) |
| Contacts saved views + chips | View pills + filter chips | [2c2951a8](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4) |
| Bulk action bar | Sticky bulk under filters | [fedf5525](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4) |
| Advanced filters | Drawer, not a second inline band | [edbed4a5](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900) |
| Contact record | 3-pane + Note / Email / Call / Task / Meet | [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1) |
| Contact activities | Type chips, upcoming vs month groups | [f93e89bd](https://mobbin.com/screens/f93e89bd-1b63-4d1d-92d6-9753e9f4c8ba) |
| Log call | Acceptance, direction, datetime, comment, associations | [344a79cd](https://mobbin.com/screens/344a79cd-4663-471c-b710-dd920abd0718) |
| AI rail shape | Persistent right summary, collapse, Ask a question | [7783b0d6](https://mobbin.com/screens/7783b0d6-ca17-40ef-89ea-bc8752e3a6fb) |
| Lead record (Salesforce) | Path + Convert / Change Owner / Edit | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) |
| Contact inline edit (Salesforce) | About + Get in Touch pencils | [d61b0a8f](https://mobbin.com/screens/d61b0a8f-84b6-4c8f-b9a8-a3d2186b0e78) |
| Activity composer | Email / Call / Task / Event icon row | [45c8db2b](https://mobbin.com/screens/45c8db2b-5cd1-4b82-8df9-5cfd9135acef) |
| Leads list (Salesforce) | Recently Viewed, numbered rows, bulk | [f7b32108](https://mobbin.com/screens/f7b32108-1960-4bc8-8509-c53f92e72ebb) |
| Contacts list (Salesforce) | Team list views, filter panel | [5c41cc89](https://mobbin.com/screens/5c41cc89-1e24-4ccb-9318-43eac73e3ad4) |
| Sequences list | Manage / Analyze / Automate / Scheduled | [d0f633b6](https://mobbin.com/screens/d0f633b6-cdf7-4c10-ba54-3a80a9df20f5) |
| Sequence create | Template vs scratch vs dynamic | [e417eb18](https://mobbin.com/screens/e417eb18-bbd1-472c-893a-6489696e54c7) |
| Sequence steps | Vertical steps, delay, A/B | [0a34649c](https://mobbin.com/screens/0a34649c-a49d-475b-9a2a-9da4128bc112) |

**Anti-patterns (do not copy):** Salesforce home widget soup [7dac13de](https://mobbin.com/screens/7dac13de-4760-4219-9f58-dabea6659236) · Slack Channel on the record [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) · HubSpot CMS / datasets [1b68fa46](https://mobbin.com/screens/1b68fa46-fe8c-41ba-a4cf-06d9de230388) · LinkedIn Connect sequence step [e417eb18](https://mobbin.com/screens/e417eb18-bbd1-472c-893a-6489696e54c7) · names Breeze, Copilot, Einstein.

---

## 5. Redesign implications (not a rewrite)

| Do | Do not |
|---|---|
| Consolidate DataWorkspace so it owns rows, selection, bulk slot, list\|board | Fork a second list shell per object |
| Add Quick Record Drawer; keep full RecordShell | Replace show pages with a drawer-only CRM |
| One icon family (Phosphor) | Ship Lucide and Phosphor on the same screen |
| One deal engine; `/leads` stays a redirect | Resurrect `pages/leads/board.tsx` as a product |
| Structured workflows + test-before-activate | Default n8n canvas |
| Settings IA by scope | Invent new settings URLs |
| Durable Home activation checklist | Treat `/settings/setup` dismiss as onboarded |
| Unify Command + Create + Ask Evo | Invent a second AI product |

Backend stays. EvoCRM paint stays. Mobbin is pattern + density only.
