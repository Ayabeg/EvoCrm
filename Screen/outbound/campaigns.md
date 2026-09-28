# Outbound campaigns list

## 1. Screen Identity

Screen ID: `SCR-OUT-008`
Product area: Outbound
Route: `/outbound/campaigns`
Route name: `outbound.campaigns.index`
Frontend file: `resources/js/pages/outbound/campaigns/index.tsx`
Primary component: `CampaignsIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Campaigns"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; POST store/send-now/cancel `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Primary tab **Campaigns**.
Entry points: room tab; Overview KPI; lists page campaign names.
Exit points: name → show; store always redirects to show. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/campaigns/index`, props `campaigns`, `filters`, `templates`, `mailboxes`, `audience_size`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `CampaignController`; `campaigns/index.tsx`.

## 2. Purpose

Create one-shot broadcast campaigns (newsletter path) to a CRM audience using a template and mailbox; list progress; send-now or cancel from the table.

## 3. Current UX Summary

Long create form (audience, mailbox, template-driven subject/body, mode draft/schedule/send_now) then a native HTML table of campaigns with send-now/cancel.

## 4. Screen Anatomy

1. Room chrome. [CONFIRMED-CODE]
2. Title “Broadcast campaigns” + quiet hours/suppression/caps copy. [CONFIRMED-CODE]
3. New campaign form. [CONFIRMED-CODE]
4. Table: Campaign, Audience, Mailbox, Status, Progress, actions. [CONFIRMED-CODE]

## 5. Data Displayed

Campaigns with savedFilter, template, mailbox, `messageCounts()`. [CONFIRMED-CODE]
Row: name, template or “Custom body”, scheduled_at if draft/scheduled, audience list name or “All contacts with email”, audience_count / suppressed_count, mailbox name, status badge, `sent · pending · failed · opened · clicked`.
`audience_size` for default option label. [CONFIRMED-CODE]
Enabled mailboxes only in picker. [CONFIRMED-CODE]

## 6. Primary Actions

- **Create draft / Schedule / Queue campaign** POST `/outbound/campaigns` (`mode`). [CONFIRMED-CODE]
- Open show. [CONFIRMED-CODE]
- **Send now** on draft/scheduled rows POST `.../send-now`. [CONFIRMED-CODE]

## 7. Secondary Actions

- **Cancel** confirm, POST `.../cancel` for draft/scheduled/sending. [CONFIRMED-CODE]
- Destroy exists in backend but **no list UI**. [UNREACHABLE] `CampaignController::destroy`

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT. Audience is a create-time select, not a list filter. [CONFIRMED-CODE]

## 10. Sorting

`latest()`. No UI sort. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

All campaigns. [CONFIRMED-CODE] Template picker is React state; changing template remounts subject/body via `key`. [CONFIRMED-CODE]

## 14. Forms

Fields: name; saved_filter_id optional (empty = all contacts with email); mailbox_id optional (default enabled); template_id hidden from state; subject; body; body_html; mode draft|scheduled|send_now; scheduled_at required if scheduled (datetime-local). [CONFIRMED-CODE]
Server: body required unless template supplies body; `errors.body` shown. [CONFIRMED-CODE]
Store creates STATUS_DRAFT, then scheduled or expand() for send_now. Redirect to show. Send_now toast about runner, quiet hours, caps. [CONFIRMED-CODE]

## 15. Overlays

`window.confirm` for cancel. [CONFIRMED-CODE]

## 16. States

- Empty table copy. [CONFIRMED-CODE]
- Status badges sent / sending|scheduled / else outline. [CONFIRMED-CODE]
- Mode-dependent scheduled_at field and button label. [CONFIRMED-CODE]
- Processing. [CONFIRMED-CODE]
- No enabled mailboxes: only “Default enabled mailbox” option. [CONFIRMED-CODE]

## 17. Empty State

“No campaigns yet. Create one above — pick a list, a template, and a mailbox.” [CONFIRMED-CODE]

## 18. Error Handling

- `errors.body` inline. Other store errors not shown. [CONFIRMED-CODE]
- send-now only if `editable()` (draft/scheduled). [CONFIRMED-CODE]
- cancel only if `cancellable()`. [CONFIRMED-CODE]

## 19. Feedback

Send_now from **create** flashes success toast. Send-now from **table** is silent `back()` (and stays on index). [CONFIRMED-CODE]
Cancel silent. [CONFIRMED-CODE]

## 20. Navigation Behavior

Successful store → `outbound.campaigns.show`. Table actions stay on index. [CONFIRMED-CODE]
Breadcrumbs: Campaigns. [CONFIRMED-CODE]

## 21. Entity Relationships

OutboundCampaign → SavedFilter, OutboundTemplate, Mailbox, OutboundMessage, creator user. Audience from `CampaignService::audience`.

## 22. Business Rules

- One-shot, not a sequence. Every recipient becomes OutboundMessage. [CONFIRMED-CODE]
- Quiet hours, suppression, daily caps apply (copy + send_now toast). [CONFIRMED-CODE]
- Statuses: draft, scheduled, sending, sent, cancelled. [CONFIRMED-CODE]
- Default audience = contacts with email (`audience_size`). [CONFIRMED-CODE]
- Progress pending = queued + deferred counts. [CONFIRMED-CODE]

## 23. Backend Dependencies

`CampaignController@index|store|sendNow|cancel`, `CampaignService`, models listed above.

## 24. Frontend Dependencies

Outbound*, Badge, Button, Input, Label, Inertia Form/Link/router, React useState. Native select/textarea.

## 25. Responsive Behavior

Form grids `md:grid-cols-3`; table `overflow-x-auto` (not HairlineTable). [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: Labels present. [CONFIRMED-CODE]
LIKELY ISSUE: native `<select>`/`<textarea>` not associated via htmlFor/id; table no caption. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-070 | MEDIUM | Create form is the entire top of the list — heavy vs empty/list scanning. | Slow to find existing campaigns. | `campaigns/index.tsx` [CONFIRMED-CODE] |
| UX-OUT-071 | LOW | Table send-now has no toast; create send_now does. | Inconsistent feedback. | store vs sendNow [CONFIRMED-CODE] |
| UX-OUT-072 | LOW | Destroy API unused in UI. | Drafts linger. | destroy() [CONFIRMED-CODE] |
| UX-OUT-073 | OBSERVATION | Native table unlike sequences HairlineTable. | Inconsistent mobile. | [CONFIRMED-CODE] |

## 28. Consistency Comparison

Create-on-list like templates/mailboxes. Redirect-to-show like typical Laravel resource, unlike sequences.

## 29. Functional Preservation Contract

Must keep: audience list vs all-email; mailbox + template prefill; draft/schedule/send_now; body-or-template validation; list progress counts; send-now/cancel with unsent-drop warning; redirect after create.

## 30. Design Input Contract

- Purpose: launch broadcasts.
- Primary goal: queue a campaign to the right list from the right mailbox.
- Required information: name, audience, mailbox, content, schedule mode, live counts.
- Must not remove: suppression/quiet hours/cap honesty; outbox logging.

## 31. Open Questions / Unknowns

- Seed campaign 1 status. [UNKNOWN] show 200 [CONFIRMED-UI]
- `audience()` definition (email required, suppressed excluded?) — CampaignService not fully read. [UNVERIFIED]
