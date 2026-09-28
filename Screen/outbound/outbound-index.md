# Outbound hub

## 1. Screen Identity

Screen ID: `SCR-OUT-001`
Product area: Outbound
Route: `/outbound`
Route name: `outbound.index`
Frontend file: `resources/js/pages/outbound/index.tsx`
Primary component: `OutboundIndex`
Layout: `AppLayout` (`resources/js/layouts/app-layout.tsx`) wrapping `OutboundShell` → `RoomShell` (`resources/js/components/crm/outbound-shell.tsx`, `resources/js/components/crm/room-shell.tsx`). Document title via Inertia `Head` = `"Outbound"`.
Authentication: `auth`, `verified` middleware on the authenticated group in `routes/web.php`. [CONFIRMED-CODE]
Permissions: GET is method-safe, so `EnforceProductPermissions` does not require `outbound.manage` to view. Mutations elsewhere in outbound require `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Application sidebar **More → Outbound** (`resources/js/components/app-sidebar.tsx` `MORE_ITEMS`). Command palette `nav-outbound` (`resources/js/lib/command-os.ts`). Outbound room primary tab **Overview** (`outboundTabs`, exact `/outbound`).
Entry points: Sidebar More, command palette, KPI/deep links from other outbound pages, `/outbound` URL.
Exit points: Room tabs to campaigns/sequences/templates/lists/activity/settings; KPI tiles to outbox/replies/suppressions/campaigns/sequences/domains; mailbox names to `/outbound/mailboxes`; recent-activity contact/sequence/campaign links; Roundcube external URL.
Runtime HTTP (owner, simple_mode=true): `200`, Inertia component `outbound/index`, page props `mail_stack`, `stats`, `mailboxHealth`, `recent` plus shared shell props. [CONFIRMED-UI] `Screen/_evidence/runtime-index.json`
Evidence: `Screen/_evidence/runtime-index.json`; `app/Http/Controllers/Outbound/OutboundController.php`; `resources/js/pages/outbound/index.tsx`.

## 2. Purpose

Workspace health dashboard for email/SMS/WhatsApp-cloud outbound: mail-stack status, KPI strip, mailbox health, and the latest 12 messages. It does not create campaigns or sequences; it orients the operator and links into the rest of the room.

## 3. Current UX Summary

A contextual room chrome (primary tabs, no Settings/Activity subtabs on Overview) then a short intro paragraph, live mail-stack strip with Roundcube link, an 8-tile KPI strip, a mailbox-health table, and a recent-activity table. Visual language is hairline tables, 13px type, Badge status chips. No create form on this page.

## 4. Screen Anatomy

1. Application shell: sidebar + header (breadcrumbs `Outbound`). [CONFIRMED-CODE]
2. `RoomShell` sr-only `h1` “Outbound” and primary nav: Overview, Campaigns, Sequences, Templates, Lists, Activity, Settings. [CONFIRMED-CODE]
3. Intro copy: mailboxes, domains, templates, sequences, campaigns, suppression, quiet hours; WhatsApp Cloud templates only. [CONFIRMED-CODE]
4. Live mail stack block: SMTP host:port, IMAP host:port, Roundcube note, configured vs `EVOSALES_MAIL_API_TOKEN` hint, “Open Roundcube” `<a target="_blank">`. [CONFIRMED-CODE]
5. `CrmKpiStrip` 8 tiles, `columns={4}`. [CONFIRMED-CODE]
6. Mailbox health table (5 columns). [CONFIRMED-CODE]
7. Recent activity table (5 columns, last 12 messages). [CONFIRMED-CODE]

No `OutboundPage` wrapper (the hub uses its own padding). [CONFIRMED-CODE]

## 5. Data Displayed

From `OutboundController::index` [CONFIRMED-CODE]:

- `mail_stack`: `configured`, `smtp_host`, `smtp_port`, `imap_host`, `imap_port`, `roundcube_url` (`config('evosales.mail_stack.*')` + `MailboxSync::configured()`).
- `stats`: mailbox counts (total/enabled), active sequences, active enrollments, sent 30d, deferred queued, replies 30d, suppressions, failed 30d, campaigns sending/sent, domains total/verified.
- `mailboxHealth`: id, name, from_address, `effective_status`, `imap_configured`, `sent_today`, `daily_limit`, `last_tested_at` (ordered default first).
- `recent`: latest 12 `OutboundMessage` with contact, sequence, campaign.

UI columns [CONFIRMED-CODE]:

- Mailbox health: Mailbox (name + from), Status badge, IMAP replies on/off, Sent today `n/limit`, Last test (raw timestamp or `never`).
- Recent: Direction (badge `reply` if in, else channel), Contact (or `to_address`), Subject, Source (sequence/campaign name or —), Status + defer_reason.

## 6. Primary Actions

- KPI tiles are links (`CrmKpiStrip` `href`): outbox, deferred outbox, replies, suppressions, failed outbox, campaigns, sequences, domains. [CONFIRMED-CODE]
- Open Roundcube (external). [CONFIRMED-CODE]
- Mailbox name → `/outbound/mailboxes`. [CONFIRMED-CODE]
- Recent contact → `/crm/contacts/{id}`; sequence/campaign → show pages. [CONFIRMED-CODE]

No POST from this screen.

## 7. Secondary Actions

NOT PRESENT on this page. Room-tab navigation is the secondary path.

## 8. Search

NOT PRESENT. No search field. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. KPI links apply status filters on Outbox, not on this page. [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT. Mailboxes ordered `is_default` desc; recent `latest()`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

- Recent hard-limited to 12; no paginator. [CONFIRMED-CODE]
- Full Inertia page load; no infinite scroll. [UNVERIFIED] not exercised beyond GET 200.
- Inertia progress bar color `#E8530E` globally. [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT.

## 15. Overlays

NOT PRESENT on this screen. Global overlays (command palette, user menu) are shell-level (`OVR-SHELL-*`).

## 16. States

- Mail stack configured vs not (copy changes). [CONFIRMED-CODE]
- Empty mailbox health row. [CONFIRMED-CODE]
- Empty recent activity row. [CONFIRMED-CODE]
- Status badges: `active` default, `warming` secondary, else outline. [CONFIRMED-CODE]
- Direction in vs out. [CONFIRMED-CODE]
- Deferred reason subtitle. [CONFIRMED-CODE]

## 17. Empty State

- Mailboxes: “No mailbox yet — add one under Mailboxes, enable it, and send a test.” [CONFIRMED-CODE]
- Recent: “Nothing sent yet. Create a mailbox, then enroll contacts in a sequence or send a campaign.” [CONFIRMED-CODE]
No illustrations or CTAs besides copy.

## 18. Error Handling

- Workspace scoping via `forWorkspace`. [CONFIRMED-CODE]
- GET 200 for seed owner. [CONFIRMED-UI]
- No page-level error UI. Validation N/A.
- Unauthenticated would redirect to login via `auth` middleware. [CONFIRMED-CODE] [UNVERIFIED] not recrawled logged-out.

## 19. Feedback

- No toasts from this controller. [CONFIRMED-CODE]
- KPI numeric values only; no success banners.

## 20. Navigation Behavior

- Stays in Outbound room; Overview tab exact-match so `/outbound/campaigns` does not highlight Overview. [CONFIRMED-CODE]
- Breadcrumbs: `{ title: 'Outbound', href: '/outbound' }`. [CONFIRMED-CODE]
- `/outbound/reports` is a route redirect to `/reports/outbound`, not this hub. [CONFIRMED-CODE]
- Simple mode: hub is **not** blocked; sidebar More is hidden in simple mode (`showMore = !simpleMode`), so entry is URL, command palette, or in-room tabs after arriving. [CONFIRMED-CODE]

## 21. Entity Relationships

Workspace → Mailbox, Sequence, Enrollment, OutboundMessage, OutboundCampaign, OutboundDomain, Suppression. Messages link Contact, Sequence, Campaign.

## 22. Business Rules

- Stats sent/failed/replies use 30-day windows; deferred is queued with `deferred_until > now()`. [CONFIRMED-CODE]
- Campaigns “live” = status `scheduled` or `sending`. [CONFIRMED-CODE]
- Domains verified count uses `OutboundDomain::STATUS_VERIFIED`. [CONFIRMED-CODE]
- WhatsApp copy constraint: official Cloud templates only (informational on this page). [CONFIRMED-CODE]
- Simple mode does not 403 `/outbound`. [CONFIRMED-UI]

## 23. Backend Dependencies

- `App\Http\Controllers\Outbound\OutboundController`
- Models: `Mailbox`, `Sequence`, `Enrollment`, `OutboundMessage`, `OutboundCampaign`, `OutboundDomain`, `Suppression`
- `App\Services\Outbound\MailboxSync`
- Config `evosales.mail_stack`
- Middleware: `auth`, `verified`, `EnforceProductPermissions`, `EnforceSimpleMode`

## 24. Frontend Dependencies

- `@/components/crm/outbound-shell` `OutboundShell`
- `@/components/crm/crm-kpi-strip`
- `@/components/ui/badge`
- Inertia `Link`, `Head` (via shell)
- `RoomShell` / `outboundTabs`

## 25. Responsive Behavior

- Page padding `px-4 py-3 md:px-5 md:py-4`. [CONFIRMED-CODE]
- KPI strip: 2 cols default, `min-[430px]:grid-cols-2 xl:grid-cols-4`. [CONFIRMED-CODE]
- Tables `overflow-x-auto` (native tables, not HairlineTable). [CONFIRMED-CODE]
- Room tabs `overflow-x-auto`. [CONFIRMED-CODE]
- Mail-stack header stacks on small screens (`flex-wrap`). [CONFIRMED-CODE]
Viewport crawl: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED:

- Room `h1` is `sr-only`. Visible heading is `h2` “Live mail stack” / section titles, not a page `h1`. [CONFIRMED-CODE]
- Primary nav `aria-label="{title} sections"`. [CONFIRMED-CODE]
- KPI strip `aria-label="Key figures"`. [CONFIRMED-CODE]
- Roundcube link has `rel="noopener noreferrer"`. [CONFIRMED-CODE]

LIKELY ISSUE:

- Native tables have no `<caption>` / no `aria` on status-only cells. [CONFIRMED-CODE]
- Last-test timestamps are raw (likely ISO), not localized for screen readers. [CONFIRMED-CODE]

REQUIRES MANUAL TEST: keyboard order through KPI links and tables; focus rings.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-001 | MEDIUM | In simple mode, Outbound is not on the rail (`SIMPLE_NAV` omits it; More menu hidden). Hub still works at `/outbound`. | Operators must know the URL or command palette. | `SimpleMode.php`, `app-sidebar.tsx` [CONFIRMED-CODE] |
| UX-OUT-002 | LOW | Last test / message timestamps rendered as raw strings. | Harder to scan. | `index.tsx` `{box.last_tested_at ?? 'never'}` [CONFIRMED-CODE] |
| UX-OUT-003 | OBSERVATION | Recent activity capped at 12 with no “view all”. | Operator must know to open Outbox. | `OutboundController` `limit(12)` [CONFIRMED-CODE] |
| UX-OUT-004 | LOW | Settings tab href is `/outbound/mailboxes`, not a settings overview. | Fine if expected; Overview does not explain Settings grouping. | `room-shell.tsx` [CONFIRMED-CODE] |

## 28. Consistency Comparison

Matches other rooms (`RoomShell` + KPI strip + hairline tables) used by Ads/Reports-style rooms. Unlike Contacts, there is no saved-filter bar. Unlike Campaigns/Sequences, no inline create. Mail stack copy is unique to this hub and Mailboxes.

## 29. Functional Preservation Contract

A redesign MUST keep:

- Authenticated GET `/outbound` hub with mail-stack status and Roundcube URL.
- KPI figures: sent 30d, deferred, replies 30d, suppressed, failed 30d, campaigns live/sent, sequences active/enrolled, domains verified/total — and navigation to those screens.
- Mailbox health: name, from, effective status, IMAP on/off, sent today vs daily limit, last test.
- Recent 12 messages with contact/source/status/defer reason.
- Empty copy for no mailboxes / no messages.
- Outbound room primary tabs including Overview exact match.
- Honest “WhatsApp Cloud templates only” constraint in copy.

## 30. Design Input Contract

- Purpose: outbound operations overview.
- Primary goal: see whether sending is healthy and jump to the right room.
- Primary actions: follow KPIs and mailbox/activity links; open Roundcube.
- Secondary actions: room tabs.
- Required information: mail-stack config state, 8 KPIs, mailbox health, recent messages.
- Required components: room chrome, KPI strip, two tables, empty rows.
- Required states: configured/unconfigured stack, empty mailboxes, empty activity, warming/active/disabled badges, deferred.
- Information priority: (1) whether mail can send (2) volume/failures (3) mailbox health (4) latest traffic.
- Business-critical: deferred/failed counts, mailbox daily cap, suppression count.
- Must not remove: Roundcube link, IMAP flag, defer_reason, workspace scoping.

## 31. Open Questions / Unknowns

- Exact seed KPI numbers and mailbox rows on this machine: GET 200 confirmed, payload values not dumped. [UNKNOWN]
- Whether Roundcube URL is reachable from the operator’s browser. [UNVERIFIED]
- How `last_tested_at` is serialized (ISO vs formatted). [UNKNOWN]
- Visual density at 1280 vs 375: NOT VERIFIED.
