# Outbound replies

## 1. Screen Identity

Screen ID: `SCR-OUT-012`
Product area: Outbound / Activity
Route: `/outbound/replies`
Route name: `outbound.replies.index`
Frontend file: `resources/js/pages/outbound/replies.tsx`
Primary component: `Replies`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Replies"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET only. Qualify POST is `crm.leads.qualify` (CRM permission `crm.edit` for non-safe). [CONFIRMED-CODE]
Parent navigation: Activity subtab **Replies**.
Entry points: subtab; Overview replies KPI.
Exit points: contact show; lead show; Qualify posts to lead.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/replies`, props `replies`, `imapNote`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `ReplyController.php`; `replies.tsx`.

## 2. Purpose

List inbound `OutboundMessage` rows (email replies polled via IMAP) and jump to the related contact/lead, with a qualify shortcut.

## 3. Current UX Summary

Page description **is** `imapNote` (server capability string). Four-column table: From, Subject, Lead, Received. No empty-state row if zero replies.

## 4. Screen Anatomy

1. Activity chrome Outbox | Replies. [CONFIRMED-CODE]
2. Title “Replies”; description = imapNote. [CONFIRMED-CODE]
3. Table. [CONFIRMED-CODE]
4. Per lead: link + Qualify form or Qualified badge. [CONFIRMED-CODE]

## 5. Data Displayed

Last 100 direction=in with contact (+ leads id/title/status), mailbox, parent. [CONFIRMED-CODE]
UI uses contact name, subject, primaryLead (first non-qualified else first), created_at.
`body`, mailbox, parent loaded but **not rendered**. [CONFIRMED-CODE]
`imapNote`: if `imap_open` exists, poller copy; else PHP ext-imap missing. [CONFIRMED-CODE]

## 6. Primary Actions

- Open contact. [CONFIRMED-CODE]
- Open lead. [CONFIRMED-CODE]
- **Qualify** POST `/crm/leads/{id}/qualify` preserveScroll. [CONFIRMED-CODE]

## 7. Secondary Actions

NOT PRESENT (no reply-from-here, no mark read). [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

`latest()`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Limit 100. [CONFIRMED-CODE]

## 14. Forms

Qualify only (CRM, not Outbound controller). [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT.

## 16. States

- Lead missing: “—”. [CONFIRMED-CODE]
- Lead not qualified: Qualify button. [CONFIRMED-CODE]
- Qualified badge. [CONFIRMED-CODE]
- Contact missing: From “—”. [CONFIRMED-CODE]

## 17. Empty State

NOT PRESENT. Empty `replies.map` yields empty tbody with header only. [CONFIRMED-CODE]

## 18. Error Handling

IMAP missing is informational, not an error banner. [CONFIRMED-CODE]
Qualify errors not handled on this page. [CONFIRMED-CODE]

## 19. Feedback

NOT PRESENT besides badge change after reload. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stay on page after qualify (`preserveScroll`). Breadcrumbs Replies. [CONFIRMED-CODE]

## 21. Entity Relationships

Inbound OutboundMessage → Contact → Lead(s); mailbox; parent outbound message. IMAP poller pauses/branches enrollments (service, not this UI). [CONFIRMED-CODE]

## 22. Business Rules

- Replies require IMAP on mailbox + `outbound:poll-replies` + ext-imap. [CONFIRMED-CODE]
- Sends still work without imap. [CONFIRMED-CODE]
- primaryLead prefers non-qualified. [CONFIRMED-CODE]
- WhatsApp/SMS inbound not mentioned on this page. [CONFIRMED-CODE]

## 23. Backend Dependencies

`ReplyController`, `OutboundMessage`, `function_exists('imap_open')`. Qualify: lead controller (outside Outbound/).

## 24. Frontend Dependencies

Outbound*, Badge, Button, Form, Link.

## 25. Responsive Behavior

Table overflow-x. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: none extra.
LIKELY ISSUE: no empty message; reply body inaccessible; Qualify unlabeled beyond button text. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-110 | HIGH | Reply **body is never shown**; parent subject unused. | Cannot triage from this screen. | props vs JSX [CONFIRMED-CODE] |
| UX-OUT-111 | MEDIUM | No empty state. | Blank table looks broken. | `replies.map` only [CONFIRMED-CODE] |
| UX-OUT-112 | LOW | Description is a sysadmin IMAP note, not user-facing replies help. | Jargon. | `imapNote` as description [CONFIRMED-CODE] |
| UX-OUT-100 | MEDIUM | Cap 100, no search. | Missed replies. | [CONFIRMED-CODE] |

## 28. Consistency Comparison

Much thinner than desk inbox (`SCR-INBOX-001`). Qualify pattern similar to leads. Sibling of Outbox under Activity.

## 29. Functional Preservation Contract

Must keep: inbound-only list; contact/lead links; qualify when not qualified; imap capability note; workspace scope.

## 30. Design Input Contract

- Purpose: see who replied to outbound.
- Primary goal: open the person and qualify the lead.
- Required information: from, subject, related lead, when.
- Should preserve (currently unused but loaded): body, parent, mailbox — redesign may surface them.
- Must not remove: IMAP honesty if ext missing.

## 31. Open Questions / Unknowns

- Seed inbound rows. [UNKNOWN]
- Whether qualify route exists and succeeds from this page. [UNVERIFIED]
- PHP ext-imap on this herd-lite PHP 8.5. [UNKNOWN]
