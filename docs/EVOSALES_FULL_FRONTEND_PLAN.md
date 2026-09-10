# EvoSales full frontend plan

Repo: `Mohamedbeghanem/EvoSales` `main`
Not EvoCrm. Do not copy EvoCrm pages.
Paint: Evotechly / EvoSales `#EC6025`. Never Salesforce blue. Never HubSpot teal. Never EvoCrm `#FF6A00`.
Structure only from Salesforce Lightning + HubSpot.
Keep every existing engine and route. Incremental commits on `main`.

## Rule
Each phase changes shared chrome or one room. No fake KPIs. No new PATCH when POST exists.

- Complete task: `POST /crm/activities/{id}/complete`
- Move deal: `POST /crm/deals/{id}/move`

## Already shipped (do not redo)
- Salesforce object tab order + Home first
- RoomShell tab chrome (`#EC6025` underline)
- Dense list headers + mark Create button
- Whole-row click: contacts, companies, deals, tickets, leads
- ⌘K live records + `/home`
- Topbar Tasks overlay + shared `evoOpenTasks` / `evoSearchIndex`
- Board column header amount + footer total / weighted
- Home widget grid from live props
- Record pages already 3-column in this repo

HEAD at plan time: `e6c8a36c`

## Reference IA (structure only)

### Salesforce Lightning
- Home: widget grid (KPIs, pipeline, today’s tasks, activity)
- Lists: object tabs, dense table, whole-row → record
- Global search + tasks overlay
- Record: highlight panel + activity timeline

### HubSpot
- Board: stage columns, header count + amount, footer total / weighted
- Record: slide-over or 3-col dossier (about / timeline / sidebar)
- Create: right sheet, not a new page
- Saved views under the object title

---

## Phase A — Shell (done + polish)
Files: `app-sidebar.tsx`, `app-sidebar-header.tsx`, `room-shell.tsx`, `crm-shell.tsx`
- Black rail, orange mark only on active + CTA
- Object tabs stay Salesforce order
- Command palette + Tasks stay mounted
Remaining: collapse groups to match Salesforce rooms (Home / CRM / Desk / Outbound / Ads / Reports / Settings) if the rail still feels like a dump of links

## Phase B — Home command center
Route: `/home`
Files: `resources/js/pages/home.tsx`, `dashboard-header.tsx`
- Wrap in `CrmShell` so Home is a real object tab
- Keep live widgets only (quota, pipeline, tasks, research brief)
- Filters stay on `/home` (not `/dashboard`)
- No invented charts

## Phase C — Lists (mostly done)
Routes: `/crm/contacts` `/crm/companies` `/crm/leads` `/crm/deals` `/crm/tickets` `/crm/activities`
Files: `list-view-table.tsx`, `list-chrome.tsx`, object `index.tsx`
Remaining:
- Activities list whole-row click if title-only
- Captures inbox row → lead/contact
- Saved-view tabs use mark underline (no `border-brand` teal leak)

## Phase D — Board (mostly done)
Route: `/crm/deals/board`
File: `resources/js/pages/crm/deals/board.tsx`
Remaining:
- Whole-card click → deal show (title link exists; card body should open the record without breaking drag)
- Keep `POST /crm/deals/{id}/move`

## Phase E — Record dossier
Routes: `/crm/contacts/{id}` `/crm/companies/{id}` `/crm/leads/{id}` `/crm/deals/{id}` `/crm/tickets/{id}`
- HubSpot 3-col: about | timeline | sidebar
- Salesforce highlight strip: name, owner, amount/status, next activity
- Do not replace controllers or form actions
- Create stays `CreateDrawer` (HubSpot sheet)

## Phase F — Desk
Routes: `/inbox`, conversation thread
- Salesforce service-console density: list | thread | context panel
- Inherit RoomShell tabs only; do not rewrite WhatsApp/Cloud send path

## Phase G — Outbound
Routes: `/outbound` `/outbound/campaigns` `/outbound/sequences` `/outbound/outbox` `/outbound/replies` mailboxes
- RoomShell already has Overview / Campaigns / Sequences / Activity / Settings
- List + create-sheet chrome only
- Do not rewrite send / warmup / mailbox engines

## Phase H — Ads
Routes: `/ads` `/ads/attribution` `/ads/audiences`
- HubSpot ads manager: account → campaign → ad set table
- Chrome + row click only
- Do not rewrite Meta sync

## Phase I — Reports
Routes: `/reports` `/reports/funnels` `/crm/report-builder` `/outbound/reports`
- Salesforce dashboard widgets from live props
- No client-side fake series

## Phase J — Auth + Settings
- Auth: hairline card + mark accent (already close)
- Settings: same tokens, no new visual language

---

## Build order (next work)
1. Home wrap in CrmShell + filter stay on `/home`
2. Activities + captures whole-row click
3. Board whole-card click
4. Record highlight strip consistency across 5 show pages
5. Desk list/thread density
6. Outbound + Ads list chrome
7. Reports widget polish
8. Auth/settings last

## Definition of done
- Every CRM list row opens a record
- Board header + footer show live amounts
- ⌘K finds live records
- Tasks overlay completes via existing POST
- Create is a sheet, not a full-page form
- No Salesforce blue, no HubSpot teal, no EvoCrm `#FF6A00`
- Ads / Outbound / Desk engines still the same endpoints

## Out of scope
- New product from EvoCrm files
- Pixel-clone of Lightning or HubSpot
- Deploy (needs host credentials)
