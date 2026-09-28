# EvoCRM current UX audit

Not a redesign. Severity is **user impact of the current product**, not implementation priority.

Runtime: owner, French locale, simple_mode=true, populated seed, localhost 2026-09-21. Member/admin/empty-list/mobile viewports: REQUIRES MANUAL TEST unless code-cited.

---

## Information architecture

**Discoverability `[CONFIRMED-BOTH]`**

- Simple mode rail is short (5 destinations). Leads, companies, activities, reports, outbound, settings still exist at URLs; companies/activities/outbound are **not** on simple rail. User can still Command-OS or type URL. Companies list 200 without nav item — hidden module.
- Full-mode More dump hides high-frequency objects (Leads, Tickets) behind overflow while Pipeline is a first-class rail item.
- Settings IA is strong (grouped, searchable) `[CONFIRMED-CODE]`.
- `/leads` vs `/crm/leads` naming collision with README.

**Terminology `[CONFIRMED-CODE]`**

- Product name EvoCrm vs leftover EvoSales in docker-compose APP_NAME default, seed emails `@evosales.local`, some docs.
- Inbox vs Desk vs EvoDesk vs conversations vs threads.
- Pipeline (deals board) vs Pipelines (settings) vs Leads pipeline README.
- Quotes vs Deals amounts both DZD.

## Interaction consistency

| Pattern | Contacts | Companies | Deals | Leads | Quotes | Tickets |
|---------|----------|-----------|-------|-------|--------|---------|
| CrmListShell + DataWorkspace | yes | yes | yes | yes | yes | yes (code) |
| savedFilters in crawl props | yes | yes | yes | **no** | yes | `[UNVERIFIED]` 403 |
| bulk in crawl props | yes | **no** | yes | no | no | |
| export route | yes | no | yes | no | no | |
| create drawer `?create=1` | yes | yes | yes | store exists, drawer? | yes if crm.edit | POST exists |
| import | yes | no | yes | captures instead | no | no |
| board sibling | no | no | yes | leftover page | no | yes |

Lead list is a thinner workspace than contacts. `[CONFIRMED-UI]` prop keys.

## Data density

- Home operating dashboard: multiple regions (KPI, attention, work, pipeline, recent, activation) — dense but intentional `[CONFIRMED-UI]` props.
- Record hubs pack associations + timeline + ask evo + enrichment.
- Settings cards are sparse/readable.
- Kanban cards: contact/company, DZD, next task `[CONFIRMED-CODE]`.

## Feedback

- Inertia errors object shared.
- Toasts: sonner + toast components (duplication risk).
- 403 SimpleMode is a generic abort page, not an in-app “enable full mode” empty state `[CONFIRMED-UI]` tickets/ads returned NO_PAGE HTML.
- Login validation 422 JSON when Accept JSON.

## Forms

- Create drawers vs settings form rows vs record inline fields — three form grammars.
- Required markers on settings (`*` brand).
- Quote create depends on deal first — empty state copy exists `[CONFIRMED-CODE]` i18n strings in login payload (“A quote needs a deal first”).

## Tables

Shared DataWorkspace: sort/filter/search/selection/pagination. Ticket lists may still use domain resultMode (CrmListShell comment). `[CONFIRMED-CODE]`

## Detail views

Record hub pattern for CRM objects; quote show is slimmer (crawl props only `quote`). `[CONFIRMED-UI]`

## Accessibility (no lab audit)

CONFIRMED in code: aria-label on search, create, ask evo, tasks; aria-current on rail; sr-only logo when collapsed; More Escape; command trigger.

LIKELY ISSUE: icon-only collapsed rail relies on tooltips; Create on xs hides text (`hidden sm:inline`); Tasks hidden below 390px (`hidden min-[390px]:block`) — no tasks control on very narrow `[CONFIRMED-CODE]`.

REQUIRES MANUAL TEST: focus order, contrast in dark cabinet, screen reader on kanban drag, iframe desk.

---

## Issue register

| UX-ID | Screen(s) | Observed | Evidence | User consequence | Severity | Consistency |
|-------|-----------|----------|----------|------------------|----------|-------------|
| UX-001 | Nav vs modules | Simple mode hides Companies/Activities/Outbound/Reports/Leads but URLs work | SimpleMode::SIMPLE_NAV; crawl 200 companies | Features feel missing | HIGH | IA |
| UX-002 | `/leads` | Redirects to deals board not lead list | crawl 302; web.php | Operators following README/docs land on wrong object | HIGH | terminology |
| UX-003 | Tickets/Ads/Warmup/Report builder | 403 HTML, no product explanation | crawl; SimpleMode::blocks | Looks broken, not “upgrade workspace mode” | HIGH | feedback |
| UX-004 | Header Create | No Lead/Ticket/Activity/Company is present wait Company IS present | header links contact, company, deal, quote | Cannot create lead from global Create | MEDIUM | create |
| UX-005 | Breadcrumbs | Header accepts breadcrumbs then voids them | app-sidebar-header | No wayfinding on deep records except record-path | MEDIUM | nav |
| UX-006 | Tasks on narrow | Bell hidden `<390px` | header class | Cannot open tasks overlay on small phones without other entry | MEDIUM | responsive |
| UX-007 | Ask Evo / Sparkle | Sparkle still opens palette; Ask Evo routes 403 in simple mode | SimpleMode; header | Dead-end AI affordance | MEDIUM | |
| UX-008 | Merge URL | `/crm/contacts/merge` 404 | crawl | Guessable REST URL fails | LOW | |
| UX-009 | Conversations path | `/crm/conversations` 404 vs `/conversations` | crawl | Inbox activePath includes conversations but path is easy to get wrong | LOW | |
| UX-010 | Dual table/empty/toast kits | aurora vs ui vs crm | component inventory | Visual/interaction drift across rooms | MEDIUM | |
| UX-011 | AppHeader unused | comment in app-header.tsx | code | Maintenance trap | OBSERVATION | |
| UX-012 | FULL_NAV extras never on full rail | warmup/report-builder/sms only in FULL_NAV extraLeaves which run in simpleMode | app-sidebar + SimpleMode | Full-mode users must More→Outbound to find warmup | MEDIUM | |
| UX-013 | Lead list thinner | no savedFilters/bulk in props | crawl | Leads feel second-class vs contacts | MEDIUM | lists |
| UX-014 | Quote show slim | only `quote` domain prop | crawl | Less hub than contact/deal | OBSERVATION | detail |
| UX-015 | EvoSales leftover | seed email, docker APP_NAME default | seeder, compose | Brand inconsistency | LOW | |
| UX-016 | Security confirm-password intercept | 302 away from settings | crawl | Extra step undocumented in nav | OBSERVATION | |
| UX-017 | Meta apps page | redirects to marketplace when unconfigured | crawl 302 | Deep link evaporates | LOW | |
| UX-018 | Iframe desk | third-party frame; embed failure states in props | inbox props | Operators may see desk-could-not-be-framed | HIGH if embed fails; `[UNVERIFIED]` visual | |
| UX-019 | Kanban vs list deal split | two surfaces same engine | code | Good; naming Pipeline vs Deals still confusing with Leads | MEDIUM | |
| UX-020 | Member experience | not crawled | — | Unknown whether 403s/nav match | OBSERVATION | REQUIRES TEST |

BLOCKER count: 0 (product loads and core CRM works for owner).
HIGH: UX-001, UX-002, UX-003, UX-018 (conditional).
---

## Pattern comparison (second pass)

PAGE HEADERS: CRM lists via DataWorkspace title + primary CTA; Settings via SettingsPageHeader 28/34 typography; Home via dashboard-header (V02 dirty files).

PRIMARY CTAs: list “Create {noun}”; header Create; settings Save bar.

EMPTY STATES: multiple components.

TOASTS: mixed.

DELETE: various dialogs; no single confirm primitive mandated.

RESPONSIVE: settings mobile select; rail collapsible; Tasks breakpoint 390px. Viewports NOT VERIFIED in browser (no DevTools MCP). HTTP anatomy verified.
