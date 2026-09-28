# Segment membership history

## 1. Screen Identity

Screen ID: SCR-SEGMENT-002
Product area: CRM / Segments
Route: `GET /crm/segments/{segment}`
Route name: `crm.segments.show`
Frontend file: `resources/js/pages/crm/segments/show.tsx`
Primary component: `SegmentShow`
Layout: `CrmShell` workspace; breadcrumbs Segments → History (`href: ''`). `[CONFIRMED-CODE]`
Authentication: authenticated CRM group; not simple-mode blocked. `[CONFIRMED-CODE]`
Permissions: GET ungated. `[CONFIRMED-CODE]`
Parent navigation: list “History” link only (row click does not land here). `[CONFIRMED-CODE]`
Entry points: `/crm/segments/{id}`; runtime `/crm/segments/1` 200. `[CONFIRMED-UI]`
Exit points: All segments; Current members (`/crm/contacts|deals?filter_id=`); contact rows. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/segments/show`. `[CONFIRMED-UI]`
Evidence: props `segment`, `history`. `[CONFIRMED-UI]`

## 2. Purpose

Inspect enter/exit membership history for a saved filter. Current members live on the filtered object list, not this page. `[CONFIRMED-CODE]` (header description)

## 3. Current UX Summary

Header = segment name + “Membership history…” + All segments + Current members. Table: Contact, Entered, Exited, Status (current|exited). `[CONFIRMED-BOTH]`

## 4. Screen Anatomy

- `CrmObjectHeader` + two secondary links
- Empty `CrmEmptyState` or table `aria-label="Membership history"`
- `CrmListFooter` noun “events” `[CONFIRMED-CODE]`

## 5. Data Displayed

`segment`: id, name, entity. `[CONFIRMED-CODE]`
`history[]` from `contact_segment_memberships`: id, contact_id, contact_name (`displayName()` or “Unknown contact”), entered_at, exited_at, status current if exited_at null else exited. `[CONFIRMED-CODE]`
Deal segments still read **contact** membership rows (same table). `[CONFIRMED-CODE]`

## 6. Primary Actions

- Open contact `/crm/contacts/{contact_id}` (row click or name link). `[CONFIRMED-CODE]`
- Current members list with `filter_id`. `[CONFIRMED-CODE]`

## 7. Secondary Actions

- All segments. `[CONFIRMED-CODE]`

## 8. Search

NOT PRESENT. `[CONFIRMED-CODE]`

## 9. Filters

NOT PRESENT (no current vs exited chip). `[CONFIRMED-CODE]`

## 10. Sorting

`orderByDesc('id')` on membership rows. `[CONFIRMED-CODE]`

## 11. Selection

NOT PRESENT. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

All rows `get()` — no pagination. `[CONFIRMED-CODE]`

## 14. Forms

NOT PRESENT on show. Update/delete live on list. `[CONFIRMED-CODE]`

## 15. Overlays

NOT PRESENT. `[CONFIRMED-CODE]`

## 16. States

Empty history; populated table. 404 if wrong workspace or entity not contact/deal. `[CONFIRMED-CODE]`

## 17. Empty State

“No history yet” / “No enter or exit history for this segment.” No CTA. `[CONFIRMED-CODE]`

## 18. Error Handling

`abort_unless` 404. `[CONFIRMED-CODE]`

## 19. Feedback

NOT PRESENT. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

Does not include edit/delete. Breadcrumb History href is empty string. `[CONFIRMED-CODE]`

## 21. Entity Relationships

`contact_segment_memberships` ↔ Contact ↔ SavedFilter. Workflows `segment.entered|exited` use the same filter id. `[CONFIRMED-CODE]`

## 22. Business Rules

- History is membership events, not the live count from list. `[CONFIRMED-CODE]`
- Deal entity still shows contact names/links. `[CONFIRMED-CODE]`
- Simple mode: reachable. `[CONFIRMED-UI]`

## 23. Backend Dependencies

`SegmentController::show`, `SavedFilter`, `Contact`, `contact_segment_memberships`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`CrmShell`, `CrmObjectHeader`, `CrmEmptyState`, `CrmListFooter`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Table min-width 480. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: table `aria-label="Membership history"`; contact links. `[CONFIRMED-CODE]`
LIKELY ISSUE: timestamps raw from DB, not formatted. `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: empty state.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-SEG-101 | MEDIUM | Deal segments show contact history only | Wrong object for deal filters | show() query `[CONFIRMED-CODE]` |
| UX-SEG-102 | MEDIUM | No edit/delete on detail | Extra hop to list | show.tsx `[CONFIRMED-CODE]` |
| UX-SEG-103 | LOW | Unformatted entered_at/exited_at | Hard to scan | history map `[CONFIRMED-CODE]` |
| UX-SEG-104 | LOW | History breadcrumb href `''` | Broken crumb | layout `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Thinner than lead/ticket show (no Path, no properties editor). Closer to a report of events. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep membership event table and contact links.
- Keep Current members `filter_id` escape.
- Keep 404 isolation.
- Keep honesty that current members are on the list, not here.

## 30. Design Input Contract

Purpose: audit who entered/exited a segment.
Primary goal: open a contact from an event.
Primary actions: open contact, open current members.
Secondary: back to all segments.
Required information: contact, entered, exited, status.
Required components: header, history table, empty.
Required states: empty, populated, 404.
Information priority: contact → status → timestamps.
Business-critical: contact_id integrity.
Must not remove: distinction history vs live members.

## 31. Open Questions / Unknowns

- Whether segment 1 on local DB is contact or deal. `[UNKNOWN]`
- Who writes `contact_segment_memberships` (job/command). `[UNVERIFIED]`
- Empty vs populated on this crawl (200 only). `[UNKNOWN]`
