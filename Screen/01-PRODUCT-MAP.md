# EvoCRM product map

Evidence date: 2026-09-21. Branch `main` HEAD `04fe5a4467652f494ab83764624e8f1e9afb7be0`. Localhost `http://127.0.0.1:8000`. Seed owner `owner@evosales.local`. Workspace **Evotechly** has `simple_mode: true` on this local SQLite database `[CONFIRMED-BOTH]`.

This document describes the **existing** product. It is not a redesign brief.

## Primary product purpose

EvoCRM is Evotechly’s all-in-one sales OS: one workspace, one login, four rooms (CRM, Desk/Inbox, Outbound, Ads) plus Reports, Automation, and Settings. `[CONFIRMED-CODE]` README.md, `docs/OBJECT_MODEL.md`.

It is Algeria-first: timezone `Africa/Algiers`, dial `+213`, default locale French (`APP_LOCALE=fr`) with English fallback. Currency display is DZD (amounts stored as cents). `[CONFIRMED-CODE]`

## Primary user types visible in implementation

| Type | Evidence | Notes |
|------|----------|-------|
| Workspace **owner** | `App\Enums\WorkspaceRole`, seed user | All capabilities true via `User::canPermission`. Can manage people, workspace, permissions. |
| Workspace **admin** | same enum | `canManageSettings()` true. Capability defaults in `config/permissions.php`. Cannot grant member permissions (`settings.permissions` owner-only default). |
| Workspace **member** | seed `sara@evosales.local` | Default: `crm.view` + `reports.manage` only. Extra capabilities stored on `users.permissions` JSON. |
| Unauthenticated guest | Fortify + public routes | Login/register/reset; public quote `/q/{token}`; public booking `/book/{slug}`; unsubscribe. |
| Public quote/booking visitor | `Public\QuoteAcceptanceController`, `MeetingBookController` | Not a workspace user. |
| Mobile API client | `routes/api.php` Sanctum `/api/v1` | Parallel to web; not an Inertia screen. |

There is **no billing product surface** in routes or settings IA. `[CONFIRMED-CODE]` `resources/js/lib/settings/ia.ts` comment: Teams, Email, Billing, API, Webhooks omitted on purpose.

## Major product modules

```
EvoCRM workspace
│
├── Auth / identity (Fortify + optional Google)
├── Home / operating dashboard
├── CRM Sales Hub
│   ├── Contacts
│   ├── Companies
│   ├── Deals (list + board)
│   ├── Leads (list + qualify; /leads redirects to deals board)
│   ├── Quotes
│   ├── Tickets (blocked in simple mode)
│   ├── Activities / tasks
│   ├── Segments (saved-filter audiences)
│   └── Record layouts / custom attributes
├── Desk
│   ├── Inbox (EvoDesk iframe + native fallback + thread history)
│   └── Conversation history (/conversations)
├── Outbound Center (mailboxes, domains, templates, sequences, campaigns, lists, outbox, replies, suppressions, quiet hours, warmup)
├── Ads Center (Meta campaigns/ad sets/ads/audiences/attribution; blocked in simple mode)
├── Reports (category rooms, dashboards, widgets, funnels, report builder)
├── Automation (workflows)
├── Command OS (⌘K search / create / act / Ask Evo)
└── Settings (Personal / Workspace / CRM / Communication / Integrations / Developer)
```

## Relationships between modules

- **Contact** is the person identity shared by CRM, Desk threads, Outbound enrollments, Ads lead forms. `[CONFIRMED-CODE]` OBJECT_MODEL.md
- **Deal** is the pipeline object; Quotes hang off deals; board and list are two views of the same engine.
- **Lead** is pre-pipeline; qualify can create/link a Deal (`deals.lead_id` unique).
- **Inbox** embeds EvoDesk (`workspace.inbox_url`, default `https://desk.evotechly.com`). Clearing the URL uses native CRM desk. `[CONFIRMED-CODE]` README; `[CONFIRMED-UI]` `/inbox` props `embedUrl`, `configuredUrl`.
- **Ask Evo** is blocked in simple mode (`SimpleMode::blocks` on `ask-evo` routes). Local seed has `features.ask_evo: false`. `[CONFIRMED-BOTH]`
- **Simple mode** is a workspace flag (`workspaces.simple_mode`, migration default true for new rows). It shrinks nav to Home/Contacts/Deals/Inbox/Quotes and 403s tickets, ads, warmup, report-builder, Ask Evo mutations. `[CONFIRMED-CODE]` `App\Support\SimpleMode`

## Major CRM objects

See `Screen/03-ENTITY-MAP.md` and `docs/OBJECT_MODEL.md`. Headline objects: Workspace, User, Contact, Company, Lead, Pipeline, Stage, Deal, DealLineItem, Product, Quote, QuoteItem, Activity, Ticket, Thread, Message, SavedFilter/Segment, Workflow, Mailbox, Sequence, OutboundCampaign, AdCampaign.

## Global functionality

| Capability | Where | Notes |
|------------|-------|-------|
| App shell (rail + topbar) | `AppSidebarLayout` | Canonical chrome. `app-header.tsx` unused by AppLayout. `[CONFIRMED-CODE]` |
| Command palette ⌘K | Header search + Sparkle | Same Command OS. Search is `GET /crm/command/search`. Shared `evoSearchIndex` is always `[]`. |
| Global Create | Header dropdown | Contact/Company/Deal + Quote if `crm.edit`. Navigates to list `?create=1`. |
| Tasks overlay | Bell in header | Open incomplete `Activity` rows; count `evoOpenTaskCount`. |
| i18n | `HandleInertiaRequests` chrome translations | Locale `fr` on local. |
| Appearance | cookie `appearance` + localStorage | Light Cabinet vs Dark Cabinet. Cookie not encrypted (`appearance`, `sidebar_state`). |
| PostHog | shared props | Enabled when key set; local crawl had key present. |
| List workspace | DataWorkspace + list-query URL contract | q, page, view, filter_id, filter_groups, sort, direction + chrome filters. |
| Quick record / peek | `GET /crm/records/{type}/{id}/peek` | Drawer/harness. |

## Application hierarchy

Authenticated Inertia pages use `resources/js/layouts/app-layout.tsx` → sidebar layout. Settings pages nest `layouts/settings/layout.tsx`. Auth uses `auth-layout`. Public booking/quote use `public-layout`.

## Primary workflows (see Screen/04-WORKFLOW-MAP.md)

1. Sign in → Home
2. Create contact/company/deal from Create or list drawer
3. Open record hub (detail) → edit inline / attributes / activity / Ask Evo
4. Move deal on board
5. Qualify lead → deal
6. Quote from deal → send public link
7. Inbox reply (desk.manage) or embed EvoDesk
8. Outbound sequence/campaign send (scheduler commands, not only UI)
9. Settings: connect Meta/Google/Evolution; manage people
10. Import/export/merge/bulk on CRM lists

## Secondary / easy-to-miss surfaces

- `/crm/contacts/duplicates` and merge pair route `/crm/contacts/merge/{survivor}/{absorbed}` (bare `/crm/contacts/merge` 404)
- `/crm/leads/captures` (CSV/URL/maps ingest)
- `/crm/quick-record-drawer/harness` (local/dev)
- `/conversations` vs dead page path `/crm/conversations`
- `/leads` and `/automation` aliases
- `/desk` alias of inbox
- Public `/q/{token}`, `/book/{slug}`, tracking pixels
- Mobile `/api/v1/*`
- Report category URLs `/reports/{sales|pipeline|outbound|ads}`
- Password-confirm gate on `/settings/security`

## Local runtime product shape (this machine)

Because `simple_mode` is true:

- Shared `nav` has 5 items: Accueil, Contacts, Deals, Inbox, Quotes `[CONFIRMED-UI]`
- Features tickets/sms/ask_evo/ads/warmup/report_builder all false
- `/crm/tickets*`, `/ads*`, `/outbound/warmup`, `/crm/report-builder` HTTP 403
- Sidebar **code** still has More menu (Leads, Tickets, Segments, Ads, Reports, Outbound) when `simpleMode` is false; with simple mode the rail filters to allowed IDs and hides More `[CONFIRMED-CODE]` `app-sidebar.tsx`

Turning simple mode off is Settings → General (`/settings/workspace`) `simple_mode` field `[CONFIRMED-CODE]`. This audit did **not** toggle it (non-destructive). Full-mode screens are specified from code.
