# W0 BEFORE visual audit

**Agent:** 03 · Visual Baseline Auditor  
**Build:** `89eb457` (main, includes PR #284 hierarchical sidebar)  
**Date:** 6 October 2026  
**Host:** local VM only (`http://127.0.0.1:8000`). Production (`app.evocrmapp.com`) and `desk.evotechly.com` were not opened.  
**Compared to:** EvoCRM Product Layout Blueprint V1 (sidebar 224 / 56, no global top bar, first kanban card near y ≈ 148 at 1440, one workspace header, one scroll owner).

## How this capture was made

1. Repo setup: PHP 8.3 + Composer + `npm install` / `npm run build`. `.env` copied from `.env.example`.
2. Local-only env edits (not product code): `EVOSALES_INBOX_URL` and `EVODESK_URL` cleared so `/inbox` is the **native** CRM desk; PostHog key cleared so the capture does not phone home.
3. SQLite + `php artisan migrate --force` + `php artisan db:seed --force` (`DatabaseSeeder` then `VisualQaSeeder`).
4. Seeded Evotechly workspace flipped to Full Mode (`simple_mode = false`) after seed. Default provisioner value is Simple Mode on.
5. Login: `owner@evosales.local` / `password` (README local seed).
6. Headless Playwright matrix via `scripts/product-rebuild/capture.mjs --out artifacts/product-rebuild/00-baseline`.

### Seeded data used (Evotechly workspace)

| Object | Count | First id used |
|---|---|---|
| Contacts | 22 (list page shows 15) | 1 Amine Benali |
| Companies | 10 | 1 Clinique El Djazair |
| Leads | 16 | 1 Clinic website intake |
| Deals | 15 | 1 Clinic website intake |
| Quotes | **1** (sparse, valid) | 1 |
| Inbox threads | 8 | 1 (Amine Benali, open) |

No hand-crafted records. Sparse Quotes is the seeder’s real state.

Simple Mode was captured once: `dashboard-simple__1440x1000__fr__light.png` (rail drops Outbound / Ads / Tickets / Reports / Automation).

## Chrome vs Blueprint (1440×1000, FR, light, Full Mode)

Measured from Playwright layout + screenshot geometry. `[data-slot="sidebar"]` itself reports 0×0 (wrapper); **sidebar width is 1440 − top-bar width = 212px** on every 1440 frame except Quotes, which uses a 40px top strip and the same 212px rail.

| Route | Top bar h | Sidebar w | First useful content y | Dup. primary (orange) | Toolbar rows | Nested scroll | Overflow 1440 | FR/EN mix |
|---|---|---|---|---|---|---|---|---|
| Dashboard | 52 | 212 | **70** (H1 “Bonjour Evotechly”) | Global **Créer** + page **Nouvelle affaire** | 0 (greeting is the header) | 1 (page) | none | Nav FR; stages New/Qualified/Demo/Proposal EN |
| Contacts | 52 | 212 | **259** (first table row) | **Créer** + **Créer un contact** | 4 (title, views, filters, columns) | 1 | none | “Contacts” / “Leads” sit in FR chrome |
| Companies | 52 | 212 | **307** (first row) | **Créer** + page create | 4 | 1 | none | same nav mix |
| Leads | 52 | 212 | **263** (first row) | **Créer** + page create | 5 | 1 | none | Title/status “New”; nav “Leads” |
| Deals list | 52 | 212 | **767** (first row) | **Créer** + **Créer une affaire** | 5 | 1 | 19 overflowing children (KPI/attention) | FR chrome, EN stage leftovers |
| Deals board | 52 | 212 | **843** (first kanban card) | **Créer** + **Créer une affaire** | 6 | **6** | 41 overflowing children | same |
| Contact record | 52 | 212 | **111** (H1 Amine Benali) | Global Créer only (actions are ghost) | 0 | 1 | none | Ask Evo / “This record” / “Who is this?” EN |
| Company record | 52 | 212 | identity row under 52px bar (selector miss in metrics) | Global Créer | 0 | 1 | none | same three-column grammar |
| Lead record | 52 | 212 | path “New” / EN status bar ~y 120 | **Créer** + orange **New** + **Mark Status as Complete** | 2 | 1 | none | **Mostly English page** |
| Deal record | 52 | 212 | **62** (back link, not the work) | Global Créer; stage is select + Déplacer | 0 | 2 | none | “Ask Evo”, “This record”, DZD in Ask Evo |
| Inbox list | 52 | 212 | **94** (folder rail + list) | Global Créer | 1 (Inbox / Conversations / Tickets / Canaux) | 1 | none | empty pane “Vous êtes à jour” while 8 threads listed |
| Inbox thread | 52 | 212 | **203** (first bubble) | **Créer** + **Ouvrir un ticket** + **Envoyer** | 1 | 2 | 2 | conversation ~⅓ of canvas |
| Quotes | **40** | 212 | **219** (the one seeded row) | **Créer un devis** (no extra top-bar Créer) | 3 | 1 | none | status “Sent” EN; 1-row sparse |
| Quote detail | 52 | 212 | **83** (title) | **Save lines** + **Envoyer le devis** (two oranges) | 0 | 1 | none | “Save lines”, mm/dd/yyyy |
| Settings | 52 | 212 | **185** (modal form) | Global Créer behind the modal | 0 | 3 | none | Settings is a **modal**, not a page |
| Dashboard Simple | 52 | 212 | 70 | same as dashboard | 0 | 1 | none | rail filtered; “Leads” gone |

Blueprint targets for the same 1440 frame: **no top bar**, sidebar **224 expanded / 56 collapsed**, workspace header ≤ 124px, **first kanban card ≤ 200px (goal ≈ 148)**.

### Overflow at other viewports (FR light)

| Viewport | What breaks |
|---|---|
| 1280×900 | Deals list/board still clip KPI/attention; inbox thread composer wraps |
| 1024×768 | Contacts / Companies / Leads / Quotes tables overflow horizontally; inbox thread wraps |
| 768×1024 | **Sidebar stays expanded (~212px)** and steals ~28% of width. Contacts/Leads/Quotes columns clip. Deals board still expanded. |
| 430×932 / 390×844 | Deals board: first card is **below the fold** (KPI + “À traiter” + views + 4 filters + stage strip). Quote detail and Settings overflow. Lead record path wraps. |

## Per-route notes

### Dashboard (`/dashboard`)
Greeting is the largest type. Two oranges (top-bar Créer, page Nouvelle affaire). Pipeline is drawn twice (donut “Répartition” + bar “Pipeline”). Compact money (`620 k DA`, `2,3 M DA`) next to list amounts in full DA. Workspace-ready 4/5 banner sits above KPIs. First useful content is the greeting, not a “today” list.

### Contacts (`/crm/contacts`)
Healthiest list: views, search, dense 37px rows, first row at y=259 (Blueprint wants the grid under a ≤124px header, so ~y 148–176). Two oranges. Lead-status column is almost all “—”. At 768 the rail stays open and the last columns clip.

### Companies (`/crm/companies`)
Same DataWorkspace grammar as Contacts. First row y=307 (taller title/filter stack). Seeded 10 companies, full enough.

### Leads (`/crm/leads`)
List (not the old `/leads` board — that route redirects to `/crm/deals/board`). Status cell is English “New”. Five toolbar bands.

### Deals list / Deals board
**Worst workspace.** Order above the work: title + KPI strip (Bande / Upside / Backtest) + 9-row “À traiter” + view tabs + Liste/Tableau + search + 4 filters + stage-count strip, then the grid/board. First list row y=767; first card y=**843** (Blueprint ≈ 148, max 200). Board has **6 nested scrollers**. Mobile 390 shows **no cards** — only chrome.

### Contact / Company / Deal records
Three equal columns. Contact: enrichment empty state, attributes form with its own Save, Ask Evo card, Desk+WhatsApp repeating the thread, action chips with no primary. Deal: stage is `<select>` + Déplacer (not a path). Ask Evo still prints `220000 DZD` while the fiche shows `220 000 DA`. Deal “first useful” metric latched onto the back link (y=62); the actual next-action block sits lower.

### Lead record
A different grammar from contact/deal: English path (New / Contacted / Nurturing / Unqualified / Converted) and orange **Mark Status as Complete**. Centre is almost empty (“Open Desk or WhatsApp from the rail…”). This is the noisiest FR/EN page in the set.

### Inbox list + open thread
Native desk (iframe desk URL cleared). 8 seeded WhatsApp threads. Folders mix work queues (Tous, Non assigné, Assignés à moi) **and** channels (WhatsApp, WhatsApp Business, Email…). With nothing selected the right pane says the operator is caught up. Open thread: list + conversation + context. Conversation is the narrow middle; context repeats the contact. Composer actions wrap (“Insérer un modèle / Envoyer et résoudre / Envoyer”).

### Quotes / Quote detail
One seeded quote — sparse empty canvas under a single row, noted as valid. Quotes top bar is 40px and **omits** the global Créer (inconsistent). Detail: document preview is the strongest document surface; **Save lines** is an English orange sibling of **Envoyer le devis**. Expiry widget is `mm/dd/yyyy`.

### Settings (`/settings` → profile)
**Modal 800-ish over a dimmed app**, own 25-item nav, clipped at the bottom (SMS / extra WhatsApp items). Blueprint D16 wants a full page. WhatsApp / WhatsApp Cloud / WhatsApp Business still listed separately.

## Locale / theme variants (1440)

| Variant | Evidence |
|---|---|
| EN Contacts / Deal / Inbox / Dashboard | Chrome flips (Home, Create, Inbox). Hierarchical caps become SELL / PROSPECT / SERVE. |
| AR Contacts / Deal / Inbox / Dashboard | `dir=rtl`, rail on the **right**, checkboxes/start edge mirrored. Arabic chrome present; stage names and some record copy stay Latin/EN. |
| Dark Contacts / Deal / Inbox / Dashboard | True-black canvas. Rail and page merge (both ~#000). Icons remain visible on this build (better than the 30 Sep “invisible dark icons” note). |

## Scorecard (/10)

| Axis | Score | One line of evidence |
|---|---|---|
| Shell | **3** | 52px top bar + 212px dark rail on every page; Blueprint wants 0 top bar and a 224/56 light cabinet. |
| Navigation | **5** | PR #284 hierarchy is real (VENDRE / CRM / Pipeline) and Simple Mode filters the rail, but CAPS sections, Menu/Agents/Search pill, and Settings-as-modal fight wayfinding. |
| Workspace density | **3** | Deals board first card at y=843/1000; Contacts/Leads waste 250–300px of stacked toolbars before the first row. |
| Lists | **6** | Contacts/Companies/Leads are the strongest surfaces (views + 37px rows), then collapse at 768 because the rail will not collapse. |
| Records | **4** | Three competing columns, no path on deals, Ask Evo as a card, lead record still mostly English. |
| Pipeline | **2** | KPI + 9-row attention list + filters before any card; 6 nested scrollers; mobile never reaches a card. |
| Inbox | **5** | Native desk + 8 threads work; conversation is the squeezed middle; empty state lies; queues are half channels. |
| Documents | **4** | One seeded quote (honest sparse); two oranges on the detail; English “Save lines”; list status “Sent”. |
| Mobile | **3** | 390 top bar packs logo + 5 utilities + orange Créer; board/filters stack; Settings/quote overflow. |
| RTL | **6** | AR mirroring of rail and tables works at 1440; Latin stage names and EN leftovers stay LTR-in-RTL. |
| Dark | **6** | Dark Cabinet applies cleanly and icons are readable; rail and canvas are the same black so the frame disappears. |
| Product coherence | **3** | Five header grammars (greeting, DataWorkspace, inbox sub-tabs, record back-link, settings modal) plus FR/EN/DA/DZD drift. |

**Mean: 4.2 / 10.** The product has real rooms (list, board, inbox, quote) and a working hierarchical rail, but it still has no shared frame.

## 10 worst findings (this local baseline)

1. **Deals board first card at y=843** (target ≤ 200 / ≈ 148). Same preamble on the list (first row y=767).
2. **Global 52px top bar** is still there and still mostly empty (search lives in the rail). Quotes secretly uses a 40px bar and drops Créer.
3. **Dark 212px sidebar always expanded**, including 768 and 1024. Target 224 / 56, light, collapsing to a rail.
4. **Two (sometimes three) orange primaries** on one screen: top-bar Créer + page create; quote **Save lines** + **Envoyer le devis**; lead **New** + **Mark Status as Complete**.
5. **Pipeline has 6 nested scrollers** and 41 overflowing children at 1440; the page and the board both scroll.
6. **Lead record is an English island** inside a French app (path labels, Ask Evo, “Open in Inbox”).
7. **Inbox conversation is not the main surface**: four columns after a 212px rail; “Vous êtes à jour” while 8 conversations sit in the list.
8. **Settings is a height-capped modal** with a clipped 25-item nav and three WhatsApp entries.
9. **Mobile board is chrome-only** at 390×844 — KPI, attention, views, and four filters consume the first screen.
10. **Money and language drift:** `220 000 DA` beside Ask Evo `220000 DZD`; compact `2,3 M DA` on Accueil; “Sent” / “Save lines” / “Leads” in FR chrome.

## Console errors

`artifacts/product-rebuild/00-baseline/console-errors.json` — **103/103 routes recorded zero `error`, `pageerror`, or `requestfailed` events.** Warnings were also empty. Local Vite production build + PostHog disabled. This is the console baseline, not a claim that production is clean (the Blueprint’s live Inbox CSP banner is an iframe/desk concern we deliberately did not load).

## Routes that could not be captured

**None.** All requested routes returned HTTP 200 with seeded ids:

`/dashboard`, `/crm/contacts`, `/crm/companies`, `/crm/leads`, `/crm/deals`, `/crm/deals/board`, `/crm/contacts/1`, `/crm/companies/1`, `/crm/leads/1`, `/crm/deals/1`, `/inbox`, `/inbox?thread=1`, `/crm/quotes`, `/crm/quotes/1`, `/settings` (profile modal).

`/leads` is a server redirect to `/crm/deals/board`; the Leads **list** is `/crm/leads` and that is what was shot.

## Reuse

```bash
# AFTER sheet, same matrix
node scripts/product-rebuild/capture.mjs --out artifacts/product-rebuild/01-after
```

Flags: `--base-url`, `--email`, `--password`, `--only contacts,dashboard`, `--skip-sheet`.
