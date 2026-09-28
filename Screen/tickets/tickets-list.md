# Tickets list

## 1. Screen Identity

Screen ID: SCR-TICKET-001
Product area: Desk / Tickets
Route: `GET /crm/tickets`
Route name: `crm.tickets.index`
Frontend file: `resources/js/pages/crm/tickets/index.tsx`
Primary component: `TicketsIndex` → `CrmShell` + `CrmListShell` (`resultMode` default `domain`)
Layout: `CrmShell` chrome workspace, breadcrumbs Tickets. `[CONFIRMED-CODE]`
Authentication: auth + verified + permissions + `EnforceSimpleMode`. `[CONFIRMED-CODE]`
Permissions: GET ungated by named permission. POST store requires `crm.edit`. `[CONFIRMED-CODE]`
Parent navigation: Full-mode **More → Tickets**. `FULL_NAV` includes tickets. Simple-mode rail omits it. Command palette `nav-tickets` is **feature-gated** (`features.tickets`). `[CONFIRMED-CODE]`
Entry points: More menu (full); inbox ticket links; `?create=1`; layout toggle from board. `[CONFIRMED-CODE]`
Exit points: row → `/crm/tickets/{id}`; List/Board toggle → `/crm/tickets/board`. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **403**. `[CONFIRMED-UI]`
Evidence: `SimpleMode::blocks()` if path starts with `/crm/tickets`; `EnforceSimpleMode` `abort_if(..., 403)`; runtime-index `/crm/tickets` http 403. Full-mode implementation below is `[CONFIRMED-CODE]` only. `[CONFIRMED-BOTH]`

## 2. Purpose

List workspace support tickets (not the Chatwoot inbox). Filter by status/owner/priority/channel, create a ticket on a contact, switch to board. Desk stays the conversation surface. `[CONFIRMED-CODE]`

## 3. Current UX Summary

`[CONFIRMED-UI]` This crawl cannot render the list (403).
`[CONFIRMED-CODE]` Full mode: CRM list chrome with stage/status pills, search `q`, saved-filter slot (always `[]`), List/Board toggle, table of presented tickets, create drawer (also `?create=1`). Default query excludes closed unless `view=closed` or status=closed.

## 4. Screen Anatomy

- `CrmObjectHeader` via list shell: title Tickets, **Create ticket**, `TicketLayoutToggle` List|Board
- Stage pills from `Ticket::STATUSES` with per-status counts `[CONFIRMED-CODE]`
- Domain children: `ListViewTable` entity ticket OR empty state; `CrmListFooter`
- `CreateDrawer` subject, contact, priority, channel; optional hidden `deal_id` `[CONFIRMED-CODE]`
- `SkeletonList` while inertia loading `[CONFIRMED-CODE]`

## 5. Data Displayed

`tickets[]` from `Ticket::present()`: number, subject, status, status_label, priority, channel, channel_label, created_at (Africa/Algiers), last_activity_at, sla_due_at, sla_label, sla_breached, contact, company, owner. `[CONFIRMED-CODE]`

Columns (`ListViewConfig` ticket): Number, Ticket name, Status, Priority, Channel, Contact, Company (hidden default), Owner, Create date, SLA. `[CONFIRMED-CODE]`

Also: `contacts`, `members`, `savedFilters` **always `[]`**, `activeFilters` (view, status, owner, priority, channel, unassigned, unanswered, q), `listView`, `recordCount`, `paginator`, `stagePills`, `createOpen`, `createDefaults`. `[CONFIRMED-CODE]`

## 6. Primary Actions

- **Create ticket** opens drawer; POST `/crm/tickets` then redirect index (unless `from_board`). `[CONFIRMED-CODE]`
- Open row `/crm/tickets/{id}`. `[CONFIRMED-CODE]`

## 7. Secondary Actions

- List ↔ Board toggle. `[CONFIRMED-CODE]`
- Status pills / chrome filters. `[CONFIRMED-CODE]`
- Empty-state Create ticket. `[CONFIRMED-CODE]`
- Pre-fill contact/deal from `createDefaults`. `[CONFIRMED-CODE]`

## 8. Search

`q` matches `subject` LIKE or `number` LIKE. Ticket adapter `supportsQuery: true`, `searchParam: 'q'`. `[CONFIRMED-CODE]`

## 9. Filters

`constrain()`:
- `status` if in STATUSES; else if `view=closed` closed only; else **exclude closed**
- `view=my` → owner_id = current user
- `view=unassigned` or `unassigned=1` or `owner=unassigned` → owner null
- numeric `owner`
- `priority` low|medium|high
- `channel` whatsapp_cloud|email|manual
- `unanswered` → `first_response_at` null `[CONFIRMED-CODE]`

Saved views array is empty — UI may still show default “all”. `[CONFIRMED-CODE]`

## 10. Sorting

`latest('id')`. Default list sort meta `created_at desc` not independently applied. `[CONFIRMED-CODE]`

## 11. Selection

NOT PASSED to `CrmListShell` (no `selection` prop). Domain mode — bulk not wired on this page. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

`CrmFilter::paginate` default **25** per page. Footer prev/next via `listPageHref`. Skeleton while loading. `[CONFIRMED-CODE]`

## 14. Forms

Store: `subject` required max 180; `contact_id` required workspace contact; `deal_id` optional, must belong to that contact (422 otherwise); `priority` default medium; `channel` default manual; `owner_id` = current user. Logs activity `ticket_opened`. `[CONFIRMED-CODE]`

## 15. Overlays

`CreateDrawer` “Create ticket”. `[CONFIRMED-CODE]`

## 16. States

Loading skeleton; empty; filtered empty; table; drawer open from `createOpen`. `[CONFIRMED-CODE]`
Runtime simple_mode: **403 page** (Laravel abort, not this component). `[CONFIRMED-UI]`

## 17. Empty State

Unfiltered: “No tickets yet” / “Create a ticket on a contact. Desk stays the inbox.” + Create ticket.
Filtered: “No tickets match these filters” / “Clear filters or pick another status…” no CTA. `[CONFIRMED-CODE]`

## 18. Error Handling

Validation; deal/contact 422/404. Simple mode 403. `[CONFIRMED-CODE]`

## 19. Feedback

Redirect to index after create. No toast in controller. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

Create from list → `crm.tickets.index`. Board create uses `from_board` → board. Toggle does not preserve filters (`href="/crm/tickets/board"`). `[CONFIRMED-CODE]`

## 21. Entity Relationships

Ticket → Contact (required), Company (copied), optional Deal, optional Thread, Owner, SLA timestamps. `[CONFIRMED-CODE]`

## 22. Business Rules

- Closed hidden unless asked. `[CONFIRMED-CODE]`
- Simple mode **blocks entire `/crm/tickets*` prefix**. `[CONFIRMED-CODE]`
- `features.tickets` false hides palette nav. `[CONFIRMED-CODE]`
- No TicketPolicy; workspace scoping on queries. `[CONFIRMED-CODE]`
- Seed seeder does not create tickets (`DatabaseSeeder` has no Ticket::). `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`TicketController::index|store`, `Ticket`, `CrmFilter`, `CrmHub`, `TicketSla` (on later updates), `Activity`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`CrmListShell`, `ListViewTable`, `TicketLayoutToggle`, `CreateDrawer`, `list-query`, `StagePills`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Shared list chrome; drawer. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: layout toggle `aria-current`; required asterisks on subject/contact. `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: 403 page a11y; table keyboard in full mode.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-TKT-001 | BLOCKER (this workspace) | simple_mode 403 | Tickets product invisible | runtime 403 `[CONFIRMED-UI]` |
| UX-TKT-002 | MEDIUM | `savedFilters` always [] | Saved-view chrome is hollow vs contacts | controller `[CONFIRMED-CODE]` |
| UX-TKT-003 | MEDIUM | Board toggle drops list filters | Lose q/status | `TicketLayoutToggle` `[CONFIRMED-CODE]` |
| UX-TKT-004 | LOW | Default list hides closed without a strong “Closed” view in header (view=closed exists) | Closed work hard to find | `constrain()` `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Closer to contacts list than leads (search, pagination, pills). Unlike contacts, no real saved filters, no bulk, no export. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep list/board split and create-on-contact.
- Keep default hide-closed, my/unassigned/unanswered/priority/channel/q.
- Keep SLA columns and status labels.
- Keep simple_mode 403 unless product turns tickets on.
- Keep deal_id must match contact.

## 30. Design Input Contract

Purpose: triage tickets as CRM cases.
Primary goal: find a ticket and open it or create one.
Primary actions: Create ticket, open row, switch board.
Secondary: search, status pills, owner/priority/channel.
Required information: number, subject, status, priority, channel, contact, owner, SLA.
Required components: list chrome, table, create drawer, list/board toggle.
Required states: loading, empty, filtered empty, populated, 403 simple mode.
Information priority: number + subject → status/SLA → contact.
Business-critical: SLA, status, contact, create.
Must not remove: Desk-is-inbox copy; closed default hide; simple_mode block.

## 31. Open Questions / Unknowns

- Full-mode screenshot of this list on this machine. `[UNKNOWN]` (blocked)
- Whether `view=closed` is exposed in FilterBar UI. `[UNVERIFIED]`
- Stage pill click wiring vs `status` query. `[UNVERIFIED]`
