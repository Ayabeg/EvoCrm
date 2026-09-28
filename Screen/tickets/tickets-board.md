# Tickets board

## 1. Screen Identity

Screen ID: SCR-TICKET-002
Product area: Desk / Tickets
Route: `GET /crm/tickets/board`
Route name: `crm.tickets.board`
Frontend file: `resources/js/pages/crm/tickets/board.tsx`
Primary component: `TicketBoard`
Layout: `CrmShell` workspace; breadcrumbs Tickets → Board. `[CONFIRMED-CODE]`
Authentication: same authenticated CRM group. `[CONFIRMED-CODE]`
Permissions: GET ungated; move POST `crm.edit`. `[CONFIRMED-CODE]`
Parent navigation: List/Board toggle; not a top-level rail item (rail goes to list). `[CONFIRMED-CODE]`
Entry points: `TicketLayoutToggle` Board; URL `?view=my`. `[CONFIRMED-CODE]`
Exit points: card → `ticket.url` `/crm/tickets/{id}`; Create ticket → `/crm/tickets?create=1` (full `window.location`); List toggle. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **403**. `[CONFIRMED-UI]`
Evidence: `SimpleMode::blocks` prefix `/crm/tickets`; runtime-index `/crm/tickets/board` 403. Implementation `[CONFIRMED-CODE]`.

## 2. Purpose

Kanban of ticket **statuses** (not deal stages): drag to persist status. All-open vs assigned-to-me. `[CONFIRMED-CODE]`

## 3. Current UX Summary

`[CONFIRMED-UI]` Not renderable in this crawl (403).
`[CONFIRMED-CODE]` Full mode: header Tickets + Create + All open | Assigned to me + List/Board. Columns per `Ticket::STATUSES` with counts. Cards: subject, number, company or contact, inactivity, SLA, owner. Drag POST `/crm/tickets/{id}/move`. Empty strip when no tickets.

## 4. Screen Anatomy

- `data-crm="ticket-board"`
- `CrmObjectHeader` primary Create ticket (`window.location.href`)
- View segmented control `data-testid="ticket-board-views"`
- `TicketLayoutToggle current="board"`
- Optional empty banner `data-crm="ticket-board-empty"`
- `PipelineKanban` columns `data-testid=ticket-column-{slug}`
- Cards `data-testid=ticket-card-{id}`
- Loading: 4 pulse columns `TicketBoardSkeleton` `[CONFIRMED-CODE]`

## 5. Data Displayed

`columns[]`: id (index+1), slug, name (`statusLabel`), count (in loaded set). `[CONFIRMED-CODE]`
`tickets[]` `presentBoard()`: number, subject, status, priority, company_name, contact_name, owner_name, inactive_days, is_inactive (≥2 days), sla_due_at, sla_label, sla_breached, url. `[CONFIRMED-CODE]`
`view`: `all` | `my`. `[CONFIRMED-CODE]`

Card hides medium priority; shows High/Low. SLA hidden if closed or label `—`. Association line prefers company then contact then “No company”. `[CONFIRMED-CODE]`

## 6. Primary Actions

- Drag card onto column → POST `/crm/tickets/{id}/move` `{ status: column.slug }` preserveScroll. `[CONFIRMED-CODE]`
- Open card (`onOpen` visit url or subject Link). `[CONFIRMED-CODE]`
- Create ticket (hard navigation to list create). `[CONFIRMED-CODE]`

## 7. Secondary Actions

- All open vs Assigned to me (`?view=my`). `[CONFIRMED-CODE]`
- List layout. `[CONFIRMED-CODE]`

## 8. Search

NOT PRESENT on board (list `q` is not reused). `[CONFIRMED-CODE]`

## 9. Filters

Only `view=my` (owner_id = user). Board query does **not** exclude closed — all statuses are columns, including Closed. `[CONFIRMED-CODE]` Contrast: list hides closed by default.

## 10. Sorting

`latest('id')` then grouped by status. No per-column sort. `[CONFIRMED-CODE]`

## 11. Selection

NOT PRESENT (drag uses dataTransfer id). `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

Loads **all** matching tickets (`get()`), not paginated. `[CONFIRMED-CODE]` Inertia loading skeleton.

## 14. Forms

Move: `status` required in STATUSES; workspace 404 otherwise; `Ticket::moveTo` (sets resolved_at on closed, resets SLA if reopened). Logs `ticket_status` activity if status changed. `[CONFIRMED-CODE]`

Create is not on this page; `from_board` is a store flag unused by this board’s Create button (uses GET create=1 on list). `[CONFIRMED-CODE]`

## 15. Overlays

NOT PRESENT (no create drawer on board). `[CONFIRMED-CODE]`

## 16. States

Loading skeleton; empty board + CTA; per-column `PipelineKanbanEmpty` “No tickets”; dragging/over column highlight; toast on move error. `[CONFIRMED-CODE]`
Runtime: 403. `[CONFIRMED-UI]`

## 17. Empty State

“No tickets yet” / “Create a ticket on a contact. Desk stays the inbox.” + Create ticket. Kanban still renders columns when tickets.length>0 even if a column is empty. `[CONFIRMED-CODE]`

## 18. Error Handling

`toast.error('Could not move this ticket. Try again.')` on move error. Same-status drop no-ops. `[CONFIRMED-CODE]`

## 19. Feedback

Move preserveScroll; toast on failure only. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

Create uses **full page** load to `/crm/tickets?create=1` (not Inertia). `[CONFIRMED-CODE]` Card click Inertia visit.

## 21. Entity Relationships

Same ticket graph as list; board payload is flattened names. `[CONFIRMED-CODE]`

## 22. Business Rules

- Status columns = New, Waiting on contact, Waiting on us, Closed. `[CONFIRMED-CODE]`
- Inactive styling at ≥2 days. `[CONFIRMED-CODE]`
- Simple mode 403. `[CONFIRMED-CODE]`
- `view=my` still includes closed tickets assigned to the user. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`TicketController::board|move`, `Ticket::STATUSES|presentBoard|moveTo`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`PipelineKanban*`, `TicketLayoutToggle`, `stageUnderlineColor`, sonner toast. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Kanban `overflow-x-hidden`; `min-h-[22rem]`. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED. Horizontal board on phone likely cramped. `[LIKELY ISSUE]`

## 26. Accessibility Observations

CONFIRMED: view links `aria-current`; subject links. `[CONFIRMED-CODE]`
LIKELY ISSUE: HTML5 drag-drop without keyboard alternative on this board (list path exists). `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: drop target announcements.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-TKT-101 | BLOCKER (this workspace) | 403 simple_mode | Board unreachable | runtime `[CONFIRMED-UI]` |
| UX-TKT-102 | MEDIUM | Create uses `window.location` | Full reload vs Inertia drawer on list | `board.tsx` `[CONFIRMED-CODE]` |
| UX-TKT-103 | MEDIUM | Board shows Closed column; list hides closed | Divergent “open work” mental model | board vs constrain `[CONFIRMED-CODE]` |
| UX-TKT-104 | LOW | No search on board | Must return to list | `[CONFIRMED-CODE]` |
| UX-TKT-105 | LOW | Loads all tickets | Scale risk | `get()` `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Shares `PipelineKanban` with deals board but columns are statuses not pipeline stages; no amount/forecast; no pipeline picker. Orphan `pages/leads/board.tsx` is deals, not this. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep four status columns and drag `POST .../move`.
- Keep All open / Assigned to me.
- Keep SLA + inactive + number on cards.
- Keep list/board toggle.
- Keep simple_mode 403.

## 30. Design Input Contract

Purpose: move ticket status visually.
Primary goal: drag or open a ticket.
Primary actions: drag move, open, create.
Secondary: my/all, list toggle.
Required information: subject, number, status column, owner, SLA, inactivity.
Required components: kanban, view toggle, create.
Required states: loading, empty, dragging, error toast, 403.
Information priority: column → subject → SLA.
Business-critical: move persistence, SLA, assignment view.
Must not remove: status slugs, Desk-is-inbox empty copy.

## 31. Open Questions / Unknowns

- Full-mode board with real tickets. `[UNKNOWN]`
- Whether `from_board` create path is reachable from any UI. `[UNREACHABLE]` unless another client posts it
