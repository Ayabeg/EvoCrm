# Ticket detail

## 1. Screen Identity

Screen ID: SCR-TICKET-003
Product area: Desk / Tickets
Route: `GET /crm/tickets/{ticket}`
Route name: `crm.tickets.show`
Frontend file: `resources/js/pages/crm/tickets/show.tsx`
Primary component: `TicketShow`
Layout: App record chrome (no `CrmShell`); breadcrumbs Tickets → Ticket. `[CONFIRMED-CODE]`
Authentication: authenticated CRM group + `EnforceSimpleMode`. `[CONFIRMED-CODE]`
Permissions: GET ungated; PUT update `crm.edit`; Ask `crm.tickets.ask` blocked in simple mode (`*.ask`); attach thread POST `crm.edit`. Reply uses `/desk/threads/{id}/reply` (`desk.manage` on non-safe desk routes). `[CONFIRMED-CODE]`
Parent navigation: list/board cards; inbox `href={`/crm/tickets/${selected.ticket.id}`}`. `[CONFIRMED-CODE]`
Entry points: `/crm/tickets/{id}`; Desk. `[CONFIRMED-CODE]`
Exit points: Back to Tickets; Open in Desk / inbox; contact/deal links. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **404** for `/crm/tickets/1`. `[CONFIRMED-UI]`
Evidence: runtime-index path `/crm/tickets/1` http 404. This is **not** the simple-mode 403 seen on `/crm/tickets` and `/crm/tickets/board`.

**Why 404 vs 403:** `SubstituteBindings` runs in the web stack **before** route middleware `EnforceSimpleMode`. Missing Ticket id 1 (seeder creates **no** tickets) aborts 404 first. If a ticket existed, `SimpleMode::blocks()` (`str_starts_with($path, '/crm/tickets')`) would **403** the show URL. `[CONFIRMED-CODE]` `[CONFIRMED-UI]`

Full-mode UI below is `[CONFIRMED-CODE]`.

## 2. Purpose

Salesforce Path on a HubSpot-like ticket: properties, attached Desk/WhatsApp thread (or attach one), Ask Evo, associations. `[CONFIRMED-CODE]` (`TicketPath` comment)

## 3. Current UX Summary

Record frame: back, identity (subject, kind=number, contact · company · owner, status badge), Path (New → Waiting on contact → Waiting on us → Closed). Left properties; center conversation or attach-thread; right Ask Evo + associations. `[CONFIRMED-CODE]`
Runtime: 404 HTML, not this page. `[CONFIRMED-UI]`

## 4. Screen Anatomy

- `RecordBack` “Back to Tickets”
- `RecordIdentity` kind = ticket.number
- `RecordPath` `label="Ticket path"`
- Left About: facts Number/Status/Channel/SLA; inline subject; priority select; owner select
- Center if thread: `DeskGlass` header + messages + reply/note composer POST `/desk/threads/{id}/reply`
- Center else: attach-thread (`data-ticket="attach-thread"`) + Open WhatsApp
- Right: Ask Evo, Contact, Deal, Quotes (if any), Desk + WhatsApp
- Loading `SkeletonRecord` `[CONFIRMED-CODE]`

## 5. Data Displayed

`ticket` `presentRecord()`: present() + thread_id, deal, resolved_at. `[CONFIRMED-CODE]`
`path` `TicketPath::present`. `[CONFIRMED-CODE]`
`askEvo` `RecordInsight::forTicket`. `[CONFIRMED-CODE]`
`thread` id/subject/channel; `messages` last 80 (body, direction, type, created_at Africa/Algiers). `[CONFIRMED-CODE]`
`attachableThreads` up to 20 contact threads not already ticketed. `[CONFIRMED-CODE]`
`members`; `associations` contact/company/deal/quotes. `[CONFIRMED-CODE]`

## 6. Primary Actions

- Path select / Mark complete → PUT `{ status: step }` `[CONFIRMED-CODE]`
- Reply / private note on attached thread `[CONFIRMED-CODE]`
- Attach thread POST `/crm/tickets/{id}/thread` `[CONFIRMED-CODE]`
- Open WhatsApp `/inbox` `[CONFIRMED-CODE]`

## 7. Secondary Actions

- Inline subject; priority/owner selects PUT `[CONFIRMED-CODE]`
- Ask Evo (hidden if `!features.ask_evo`; POST blocked in simple mode) `[CONFIRMED-CODE]`
- Related contact/deal/quotes/desk `[CONFIRMED-CODE]`

## 8. Search

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 9. Filters

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 10. Sorting

Messages `orderBy('id')` limit 80. `[CONFIRMED-CODE]`

## 11. Selection

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

Skeleton on inertia loading. Messages capped at 80, no pager. `[CONFIRMED-CODE]`

## 14. Forms

Update: subject, priority, status (via moveTo), owner_id (nullable), deal_id (nullable). Changing priority on open ticket without first_response recalculates `sla_due_at`. `[CONFIRMED-CODE]`

Attach: `thread_id` required; must be contact’s thread; 422 “That Desk thread already has a ticket.” Manual channel promoted to WhatsApp Cloud when attaching. `[CONFIRMED-CODE]`

Reply: `body` required; `as_note=1` for notes. `[CONFIRMED-CODE]`

## 15. Overlays

Ask Evo drawer (mobile). No convert-style dialog. `[CONFIRMED-CODE]`

## 16. States

Loading; open path; closed path (disabled); thread attached vs attach CTA; empty messages; no attachable threads; Ask Evo off. `[CONFIRMED-CODE]`
Runtime crawl: 404. Simple mode if ticket existed: 403. `[CONFIRMED-UI]` `[CONFIRMED-CODE]`

## 17. Empty State

No thread: “Open WhatsApp / attach thread” + contact name already set. No attachable: “No Desk thread on this contact yet.” Thread with no messages: “Thread is attached. Reply on WhatsApp below.” `[CONFIRMED-CODE]`

## 18. Error Handling

Workspace mismatch 404; attach taken 422; simple mode 403; missing seed id 404. `[CONFIRMED-CODE]`

## 19. Feedback

PUT preserveScroll; reply `resetOnSuccess={['body']}`. No toast in show controller. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

Back `/crm/tickets`. Desk history `/conversations?thread=`. Closed path ignores further selects. `[CONFIRMED-CODE]`

## 21. Entity Relationships

Ticket–Contact–Company–Deal–Quotes; Ticket–Thread–Messages–Channel. One thread per ticket uniqueness. `[CONFIRMED-CODE]`

## 22. Business Rules

- Path complete when status closed. `[CONFIRMED-CODE]`
- Inbound on closed ticket reopens to waiting_on_us (model `receiveInbound`) — not this UI. `[CONFIRMED-CODE]`
- SLA first-response clock; breach notify WhatsApp (`TicketSlaWhatsApp`). `[CONFIRMED-CODE]`
- Simple mode blocks show URL once binding succeeds. `[CONFIRMED-CODE]`
- Ask Evo UI gated by `features.ask_evo`. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`TicketController::show|update|attachThread`, `TicketPath`, `TicketSla`, `AskEvoController::ticket`, `InboxController::reply`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

Record chrome/hub/path, `DeskGlass`, `InlineRecordField`, `AskEvoPanel`, `Textarea`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Ask Evo trigger `md:hidden`; conversation `min-h-[22rem]`. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: Path `aria-label="Ticket path"`; reply/note tabs are buttons without tabs semantics. `[CONFIRMED-CODE]`
LIKELY ISSUE: Reply/Note not `role="tab"`. `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: 404 page; composer keyboard.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-TKT-201 | BLOCKER (this workspace) | `/crm/tickets/1` 404; even valid ids 403 in simple_mode | Cannot QA show | runtime + SimpleMode `[CONFIRMED-BOTH]` |
| UX-TKT-202 | HIGH | Show is a second conversation UI vs `/inbox` | Split desk | thread composer `[CONFIRMED-CODE]` |
| UX-TKT-203 | MEDIUM | Messages capped 80 oldest-first | Long threads truncated without cue | limit 80 `[CONFIRMED-CODE]` |
| UX-TKT-204 | LOW | Quotes listed as text not links | Dead end | show.tsx quotes `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Same Path + identity as lead detail. Lead has Convert; ticket has thread. Lead activity is a stub; ticket activity is the thread. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep Path statuses and PUT status.
- Keep attach-thread uniqueness and WhatsApp composer.
- Keep SLA fact + priority-driven due date.
- Keep owner/priority/subject edits.
- Keep simple_mode block and honest 404 for missing ids.

## 30. Design Input Contract

Purpose: work one ticket’s status and conversation.
Primary goal: reply or close Path.
Primary actions: Path, reply/note, attach thread.
Secondary: owner, priority, associations.
Required information: number, subject, status, SLA, thread, contact.
Required components: Path, properties, conversation or attach, associations.
Required states: loading, no thread, thread, closed, 403, 404.
Information priority: Path → conversation → SLA → contact.
Business-critical: thread attach, SLA, status.
Must not remove: Desk open-in-inbox, one-thread rule.

## 31. Open Questions / Unknowns

- First real ticket id in this DB if any. `[UNKNOWN]`
- Quote association click target intended. `[UNKNOWN]`
- Whether deal_id can be set from this show UI (update supports it; no control). `[CONFIRMED-CODE]` `[UNREACHABLE]` from this page
