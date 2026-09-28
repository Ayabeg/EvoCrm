# Outbound outbox

## 1. Screen Identity

Screen ID: `SCR-OUT-011`
Product area: Outbound / Activity
Route: `/outbound/outbox`
Route name: `outbound.outbox.index`
Frontend file: `resources/js/pages/outbound/outbox.tsx`
Primary component: `Outbox`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Outbox"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET only. [CONFIRMED-CODE]
Parent navigation: Primary tab **Activity** (href `/outbound/outbox`, also active on replies) + Activity subtab **Outbox**. [CONFIRMED-CODE]
Entry points: Activity tab; Overview KPIs (all / deferred / failed).
Exit points: contact, sequence, campaign links; Replies subtab.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/outbox`, props `messages`, `status`, `counts`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `OutboxController.php`; `outbox.tsx`.

## 2. Purpose

Single log of every outbound dispatch attempt: queued, deferred (quiet hours or daily cap), sent, failed — with open/click counts.

## 3. Current UX Summary

Filter chips All/queued/deferred/sent/failed with counts, then a wide native table (8 columns). Read-only.

## 4. Screen Anatomy

1. Room chrome + Activity subtabs Outbox | Replies. [CONFIRMED-CODE]
2. Title + description. [CONFIRMED-CODE]
3. Pill buttons `FILTERS`. [CONFIRMED-CODE]
4. Table: To, Subject, Mailbox, Source, Status, Opened, Clicked, Sent. [CONFIRMED-CODE]

## 5. Data Displayed

Latest 100 direction=out messages with contact, mailbox, sequence, campaign. [CONFIRMED-CODE]
`counts`: queued (queued and not future-deferred), deferred (queued + deferred_until > now), sent, failed. [CONFIRMED-CODE]
`status` query string.
Row extras: replied badge on subject; defer_reason + deferred_until; failure_reason truncated; open_count / click_count.

## 6. Primary Actions

- Filter chips `router.get('/outbound/outbox', { status } | {}, { preserveState: true })`. [CONFIRMED-CODE]
- Contact / sequence / campaign links. [CONFIRMED-CODE]

## 7. Secondary Actions

NOT PRESENT (no retry/cancel message). [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

Status: `''` all, `queued`, `deferred` (special), `sent`, `failed`. [CONFIRMED-CODE]
Deferred is not a stored status; it is queued + future `deferred_until`. [CONFIRMED-CODE]

## 10. Sorting

`latest()` only. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

`limit(100)` no paginator. [CONFIRMED-CODE]
All chip label sums the four counts (not “all rows in DB” if >100). [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT.

## 15. Overlays

NOT PRESENT.

## 16. States

- Active chip styling. [CONFIRMED-CODE]
- Empty: “Nothing here yet.” [CONFIRMED-CODE]
- Status badges sent/failed/other. [CONFIRMED-CODE]
- Replied badge. [CONFIRMED-CODE]

## 17. Empty State

Table copy only; filters still shown. [CONFIRMED-CODE]

## 18. Error Handling

Unknown `status` values other than deferred/empty apply `where('status', $status)` (may empty). [CONFIRMED-CODE]

## 19. Feedback

NOT PRESENT.

## 20. Navigation Behavior

Query `?status=` preserved. Breadcrumbs Outbox (not nested under Activity). [CONFIRMED-CODE]
Overview deferred KPI uses `/outbound/outbox?status=deferred`. [CONFIRMED-CODE]

## 21. Entity Relationships

OutboundMessage → Contact, Mailbox, Sequence, Campaign. Opens/clicks from tracking routes. Replies set `replied_at`.

## 22. Business Rules

- Outbox is **the** send log (campaign copy). [CONFIRMED-CODE]
- Queued count excludes still-deferred rows so chips don’t double-count. [CONFIRMED-CODE]
- All chip total = queued+deferred+sent+failed (may exceed 100 listed). [CONFIRMED-CODE]
- No inbound messages (direction out only). [CONFIRMED-CODE]

## 23. Backend Dependencies

`OutboxController`, `OutboundMessage`.

## 24. Frontend Dependencies

Outbound*, Badge, Link, router.

## 25. Responsive Behavior

Filter `flex-wrap`; table overflow-x. Not HairlineTable. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: filter controls are `<button type="button">`. [CONFIRMED-CODE]
LIKELY ISSUE: selected filter is color-only (`bg-canvas-soft`) without `aria-pressed`. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-100 | HIGH | No retry, inspect body, or pagination beyond 100. | Cannot operate failures from the log. | GET-only, limit 100 [CONFIRMED-CODE] |
| UX-OUT-101 | MEDIUM | All count can disagree with visible rows. | Distrust. | counts vs limit [CONFIRMED-CODE] |
| UX-OUT-102 | LOW | Filter chips not `aria-pressed`. | AT users. | `outbox.tsx` [CONFIRMED-CODE] |
| UX-OUT-073 | OBSERVATION | Native table vs HairlineTable. | Mobile. | [CONFIRMED-CODE] |

## 28. Consistency Comparison

Closest to campaign messages table. Replies is sibling under Activity. Hub recent activity is a 12-row preview of mixed in/out.

## 29. Functional Preservation Contract

Must keep: four status buckets + deferred semantics; counts; mailbox/source; defer and failure reasons; open/click counts; replied badge; 100-row honesty; query filter.

## 30. Design Input Contract

- Purpose: audit sends.
- Primary goal: find deferred/failed and why.
- Required information: recipient, subject, mailbox, source, status, tracking, timestamps.
- Must not remove: deferred_until explanation; failure_reason.

## 31. Open Questions / Unknowns

- Seed message mix. [UNKNOWN]
- Whether `preserveState: true` keeps stale table — [UNVERIFIED]
