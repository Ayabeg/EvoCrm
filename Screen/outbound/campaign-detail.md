# Outbound campaign detail

## 1. Screen Identity

Screen ID: `SCR-OUT-009`
Product area: Outbound
Route: `/outbound/campaigns/{campaign}`
Route name: `outbound.campaigns.show`
Frontend file: `resources/js/pages/outbound/campaigns/show.tsx`
Primary component: `CampaignShow`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title = campaign name.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; POST send-now/schedule/cancel `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Campaigns tab.
Entry points: list; lists page; create redirect; `/outbound/campaigns/1` 200. [CONFIRMED-UI]
Exit points: contact links in messages; room tabs; cancel stays; destroy would go index but no UI.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/campaigns/show`, props `campaign`, `messages`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `CampaignController::show`; `campaigns/show.tsx`.

## 2. Purpose

Inspect one campaign’s audience/mailbox/status, metric tiles, schedule or send, read-only content, and the latest 100 outbound messages with tracking flags.

## 3. Current UX Summary

Header actions Send now (if draft/scheduled) and Cancel (if draft/scheduled/sending). 8 metric tiles. Optional schedule form. Content block. Messages table.

## 4. Screen Anatomy

1. Room chrome. [CONFIRMED-CODE]
2. Title; description: list name or all-email, mailbox or default, status. [CONFIRMED-CODE]
3. Actions. [CONFIRMED-CODE]
4. Metric grid `md:grid-cols-4`: Audience, Suppressed (skipped), Sent, Pending, Failed, Opened, Clicked, Replied. [CONFIRMED-CODE]
5. Schedule form if draft or scheduled. [CONFIRMED-CODE]
6. Content: subject + body pre-wrap (not HTML preview). [CONFIRMED-CODE]
7. Messages table: To, Status, Opened, Clicked, Replied, Sent. [CONFIRMED-CODE]

No edit of body on this page. [CONFIRMED-CODE]
No destroy button. [CONFIRMED-CODE]

## 5. Data Displayed

Campaign array + counts, relations savedFilter, template, mailbox. [CONFIRMED-CODE]
Messages: last 100 direction=out with contact. [CONFIRMED-CODE]
Row: contact name + to_address, status badge, defer_reason, failure_reason (truncated title), opened/clicked/replied yes/—, sent_at.

## 6. Primary Actions

- **Send now** POST `.../send-now` if editable. [CONFIRMED-CODE]
- **Schedule** POST `.../schedule` datetime-local `scheduled_at` after now. [CONFIRMED-CODE]

## 7. Secondary Actions

- **Cancel** confirm; drops queued messages; status cancelled. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT on messages.

## 10. Sorting

Messages `latest()`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Messages `limit(100)` — no paginator, no “showing 100 of n”. [CONFIRMED-CODE]

## 14. Forms

Schedule only: `scheduled_at` required date after now. [CONFIRMED-CODE]
If not editable, send-now/schedule no-op on server. [CONFIRMED-CODE]

## 15. Overlays

`window.confirm` cancel. [CONFIRMED-CODE]

## 16. States

- editable = draft|scheduled. [CONFIRMED-CODE]
- cancellable includes sending. [CONFIRMED-CODE]
- Empty messages copy. [CONFIRMED-CODE]
- Message status badges. [CONFIRMED-CODE]

## 17. Empty State

“No messages yet — send now or wait for the schedule.” [CONFIRMED-CODE]

## 18. Error Handling

- Workspace 404. [CONFIRMED-CODE]
- Schedule validation `after:now` — no errors rendered in form. [CONFIRMED-CODE]
- Cancel confirm copy: unsent dropped. [CONFIRMED-CODE]

## 19. Feedback

No toasts on send-now/schedule/cancel from show. [CONFIRMED-CODE]

## 20. Navigation Behavior

`back()` after mutations. Breadcrumbs Campaigns + “Campaign” `#`. [CONFIRMED-CODE]

## 21. Entity Relationships

Campaign → messages → contact. Tracking tokens used elsewhere (`outbound.track.open/click`) populate opened/clicked. [CONFIRMED-CODE] tracking routes public.

## 22. Business Rules

- Send now calls `CampaignService::expand` if editable. [CONFIRMED-CODE]
- Cancel deletes queued out messages then STATUS_CANCELLED; sent remain. [CONFIRMED-CODE]
- Destroy (unused in UI) same queued delete then delete campaign if editable. [CONFIRMED-CODE]
- Pending tile = queued + deferred. [CONFIRMED-CODE]
- HTML body not shown — text body only. [CONFIRMED-CODE]

## 23. Backend Dependencies

`CampaignController@show|sendNow|schedule|cancel|destroy`, `CampaignService`, `OutboundMessage`.

## 24. Frontend Dependencies

Outbound*, Badge, Button, Input, Label, Form, Link, router.

## 25. Responsive Behavior

Metrics 1-col then `md:grid-cols-4`; table overflow-x. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: schedule Label. [CONFIRMED-CODE]
LIKELY ISSUE: metric tiles not a list/description list; yes/— tracking not announced as time. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-080 | MEDIUM | Content not editable after create; no HTML preview. | Cannot fix a typo without undocumented API. | show.tsx read-only body [CONFIRMED-CODE] |
| UX-OUT-081 | MEDIUM | Messages capped at 100 silently. | Incomplete audit of large sends. | `limit(100)` [CONFIRMED-CODE] |
| UX-OUT-072 | LOW | No delete draft control. | Clutter. | destroy unused [CONFIRMED-CODE] |
| UX-OUT-082 | LOW | Opened/clicked/replied are boolean not timestamps despite model having times. | Less forensic value. | show.tsx [CONFIRMED-CODE] |
| UX-OUT-041 | LOW | Breadcrumb `#`. | [CONFIRMED-CODE] |

## 28. Consistency Comparison

Metric tiles similar to hub KPIs but not `CrmKpiStrip`. Messages table similar to Outbox, without mailbox/source columns.

## 29. Functional Preservation Contract

Must keep: eight counts; send-now/schedule/cancel rules; unsent drop on cancel; message log with failure/defer; contact links; read-only subject/body; 100-row cap must remain honest if kept.

## 30. Design Input Contract

- Purpose: operate and audit one broadcast.
- Primary goal: start or stop sending and see who got what.
- Required information: status, audience, mailbox, metrics, content, per-recipient status.
- Must not remove: cancellable-while-sending; suppression skip count.

## 31. Open Questions / Unknowns

- Seed campaign 1 message volume. [UNKNOWN]
- Whether `expand` is synchronous (toast on create says runner within a minute). [UNVERIFIED]
