# Outbound sequence detail

## 1. Screen Identity

Screen ID: `SCR-OUT-007`
Product area: Outbound
Route: `/outbound/sequences/{sequence}`
Route name: `outbound.sequences.show`
Frontend file: `resources/js/pages/outbound/sequences/show.tsx`
Primary component: `SequenceShow` plus `SequenceStepEditor` (`resources/js/components/outbound/sequence-step-editor.tsx`)
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title = sequence name.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; mutations `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Sequences tab (prefix match).
Entry points: list name; Overview recent activity; reports outbound detail; `/outbound/sequences/1` crawl. [CONFIRMED-UI]
Exit points: contact links; Warmup/Quiet hours from Settings tab; workflows empty CTA; room tabs.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/sequences/show`, props `sequence`, `stepAnalytics`, `contacts`, `templates`, `mailboxes`, `filters`, `quietHours`, `warmup`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `SequenceController`; `EnrollmentController`; `show.tsx`; `sequence-step-editor.tsx`.

## 2. Purpose

Build the step timeline, enroll contacts (or a CRM list), pause/resume/cancel enrollments, and activate the sequence so the runner sends due steps.

## 3. Current UX Summary

Header with Edit + Activate/Pause. Optional inline rename form. Local tabs: Steps | Enroll | Settings. Steps: funnel list + visual step editor. Enroll: list picker, contact checkboxes, enrollment table. Settings: warmup/quiet-hours summary links.

## 4. Screen Anatomy

1. Room chrome. [CONFIRMED-CODE]
2. Title, description (`Email`/`WhatsApp Cloud` · active vs draft runner copy). [CONFIRMED-CODE]
3. Actions: Edit (client toggle), Activate/Pause sequence. [CONFIRMED-CODE]
4. Edit sequence HairlinePanel (name, description). [CONFIRMED-CODE]
5. Step funnel (when tab=steps and analytics length > 0). [CONFIRMED-CODE]
6. Local tab buttons Steps / Enroll / Settings (`aria-pressed`). [CONFIRMED-CODE]
7. **Steps:** `SequenceStepEditor` — numbered timeline, edit/remove, add step types. [CONFIRMED-CODE]
8. **Enroll:** empty CTA to workflows; enroll saved filter; checkbox grid of all contacts; HairlineTable of enrollments. [CONFIRMED-CODE]
9. **Settings:** warmup count + quiet hours window; links `/outbound/warmup`, `/outbound/quiet-hours`. [CONFIRMED-CODE]

Dead UI in file: `StepFields` helper is unused; editor uses `SequenceStepEditor` instead. [CONFIRMED-CODE]

## 5. Data Displayed

`sequence` loaded with `steps.mailbox`, `enrollments.contact`. [CONFIRMED-CODE]
`stepAnalytics`: per step position, name (subject or “Step n”), enrolled (enrollments with next_step >= position), **sent** (all sequence outbound sent — **not per-step**), step_type. [CONFIRMED-CODE]
`contacts`: all workspace contacts id/name/email/phone. [CONFIRMED-CODE]
`templates`: id, name, subject, body. [CONFIRMED-CODE]
`mailboxes`: enabled only. [CONFIRMED-CODE]
`filters`: contact SavedFilters. [CONFIRMED-CODE]
`quietHours`, `warmup` summary. [CONFIRMED-CODE]
Enrollment row: contact, status, next_step, next_run_at, pause/resume/cancel.

## 6. Primary Actions

- **Activate / Pause sequence** POST `.../toggle`. [CONFIRMED-CODE]
- **Add/Save/Remove step** POST/PUT/DELETE `.../steps` and `.../steps/{step}`. [CONFIRMED-CODE]
- **Enroll list** POST `.../enroll` with `saved_filter_id`. [CONFIRMED-CODE]
- **Enroll N contact(s)** POST `.../enroll` with `contact_ids[]`. [CONFIRMED-CODE]

## 7. Secondary Actions

- Edit sequence PUT `.../{sequence}`. [CONFIRMED-CODE]
- Enrollment Pause/Resume/Cancel POST `/outbound/enrollments/{id}/pause|resume|cancel`. [CONFIRMED-CODE]
- Links to contact show, workflows, warmup, quiet hours. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. Contact enroll list is an unscrolled-search checkbox grid (`max-h-56 overflow-y-auto`). [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT besides picking a saved CRM list to enroll. [CONFIRMED-CODE]

## 10. Sorting

Steps by position in editor. Contacts `orderBy first_name`. Enrollments as loaded with sequence (no explicit order in show load). [CONFIRMED-CODE]

## 11. Selection

Client `selected: number[]` checkboxes `contact_ids[]`. Enroll button disabled if none selected. [CONFIRMED-CODE]
No select-all. [CONFIRMED-CODE]

## 12. Bulk Actions

Enroll selected contacts is the bulk action. List enroll is bulk via filter. No bulk pause of enrollments. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

All contacts, all enrollments, all steps. No paginator. [CONFIRMED-CODE] Risk of large payloads. [CONFIRMED-CODE]

## 14. Forms

**Sequence update:** name, description. [CONFIRMED-CODE]

**Add step** (`SequenceStepEditor`): step_type email | whatsapp_cloud | call | meeting; wait hours; mailbox (email); subject A/B; body; WA template/language; meeting_url; notes for call/meeting; optional template_id prefill. Channel derived from type (`whatsapp_cloud` else `email` — **SMS not in editor types**). [CONFIRMED-CODE]
Validation includes channel in email,whatsapp_cloud,sms; step_type includes sms; subject_b; on_reply_step/on_no_reply_step/variant_key accepted on add but **not in the editor UI**. [CONFIRMED-CODE] [UNREACHABLE] reply-branch fields.

**Enroll:** contact_id | contact_ids[] | saved_filter_id; empty → error `contact_id` “Pick at least one contact.” Single-contact path rethrows ValidationException; bulk skips suppressed and toasts. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. Step edit is inline. No confirm on Remove step. [CONFIRMED-CODE]

## 16. States

- Sequence active vs draft description. [CONFIRMED-CODE]
- Local tab. [CONFIRMED-CODE]
- Editing sequence panel. [CONFIRMED-CODE]
- Step editing id | 'new' | null. [CONFIRMED-CODE]
- Empty enrollments CTA. [CONFIRMED-CODE]
- Enrollment badges active/finished/other. [CONFIRMED-CODE]
- Processing on forms. [CONFIRMED-CODE]
- Filters.length === 0 hides list enroll. [CONFIRMED-CODE]

## 17. Empty State

- No steps: “No steps yet. Add an automated email, call, meeting, or WhatsApp template.” [CONFIRMED-CODE]
- No enrollments: copy + Create workflow link; table empty “Nobody enrolled yet.” [CONFIRMED-CODE]
- Contacts grid can be empty with no extra copy. [CONFIRMED-CODE]

## 18. Error Handling

- Workspace/step mismatch 404. [CONFIRMED-CODE]
- Single enroll validation bubbles; bulk toast skipped count. [CONFIRMED-CODE]
- Enroll form does not display `errors.contact_id`. [CONFIRMED-CODE]
- Remove step no confirm — accidental delete. [CONFIRMED-CODE]

## 19. Feedback

- Enroll toast success/error via `Inertia::flash`. [CONFIRMED-CODE]
- Other mutations silent `back()`. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stay on show. Breadcrumbs Sequences + “Sequence” href `#`. [CONFIRMED-CODE]
Settings tab link to `/outbound/warmup` 403 in simple_mode. [CONFIRMED-UI] [CONFIRMED-CODE]

## 21. Entity Relationships

Sequence → SequenceStep (mailbox, template), Enrollment → Contact. SavedFilter for list enroll. QuietHours and Mailbox warmup are workspace-level, displayed not edited here.

## 22. Business Rules

- Activate sequence: runner sends due steps every minute (copy). [CONFIRMED-CODE] scheduler [UNVERIFIED]
- Enrollment pause only if active; resume sets next_run_at now if null; cancel clears next_run_at. [CONFIRMED-CODE]
- Suppressed contacts skipped on bulk enroll. [CONFIRMED-CODE]
- Step analytics `sent` counts **all** sequence sent messages for every step (likely inflated). [CONFIRMED-CODE]
- First new step delay 0, subsequent default 24h. [CONFIRMED-CODE]
- Call/meeting steps stored with channel email (channelFor). [CONFIRMED-CODE]
- SMS sequences cannot add SMS steps in the editor UI. [CONFIRMED-CODE]

## 23. Backend Dependencies

`SequenceController` show/update/toggle/addStep/updateStep/removeStep/enroll; `EnrollmentController`; `SequenceEnrollment`; `CrmFilter`; models Sequence, SequenceStep, Enrollment, Contact, Mailbox, OutboundTemplate, SavedFilter, OutboundMessage.

## 24. Frontend Dependencies

`SequenceStepEditor`, Hairline*, Outbound*, Badge, Button, Input, Label, NativeSelect, Textarea, Inertia Form/Link/router, React useState.

## 25. Responsive Behavior

Contact grid `md:grid-cols-3`; step form `md:grid-cols-2`; HairlineTable mobile. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: local tabs `aria-pressed`; step editor `data-testid="sequence-step-editor"`; numbered markers. [CONFIRMED-CODE]
LIKELY ISSUE: tab buttons are not a tablist/tabpanel pattern; checkboxes unlabeled beyond wrapping label (OK); Remove step unlabeled danger besides text. [CONFIRMED-CODE]
REQUIRES MANUAL TEST: long contact list keyboard.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-051 | HIGH | Sequence Pause vs enrollment Pause. | Mis-operation. | show actions vs EnrollmentActions [CONFIRMED-CODE] |
| UX-OUT-060 | HIGH | Step editor has no SMS type while create allows SMS sequences. | Cannot author SMS steps after create. | `STEP_TYPES` vs store channel [CONFIRMED-CODE] |
| UX-OUT-061 | MEDIUM | Funnel `sent` is sequence-wide, repeated on every step. | Misleading analytics. | `SequenceController::show` [CONFIRMED-CODE] |
| UX-OUT-062 | MEDIUM | All contacts loaded; no search. | Unusable at scale. | contacts query + max-h-56 grid [CONFIRMED-CODE] |
| UX-OUT-063 | MEDIUM | Remove step has no confirm. | Data loss. | `sequence-step-editor.tsx` [CONFIRMED-CODE] |
| UX-OUT-064 | LOW | Reply-branch / variant_key fields exist in API not UI. | Hidden capability. | addStep validate vs editor [CONFIRMED-CODE] |
| UX-OUT-065 | MEDIUM | Settings → Warmup 403 in simple_mode. | Broken in-room link. | [CONFIRMED-BOTH] |
| UX-OUT-041 | LOW | Breadcrumb href `#`. | [CONFIRMED-CODE] |

## 28. Consistency Comparison

Local tabs similar to some CRM show pages. Step timeline unique. Enroll checkboxes unlike campaign audience select. HairlineTable matches list pages.

## 29. Functional Preservation Contract

Must keep: step CRUD including email A/B subject, WA template, call/meeting; enroll by ids and saved filter with suppression skip toast; enrollment pause/resume/cancel; sequence activate; funnel display (even if counts stay honest); quiet hours/warmup summary; workspace 404.

## 30. Design Input Contract

- Purpose: operate one sequence.
- Primary goal: define steps and enroll the right people without emailing suppressed contacts.
- Required information: steps with delay/channel/content, enrollment status/next run, activation state, quiet hours.
- Must not remove: bulk skip toast; enrollment state machine; template prefill.

## 31. Open Questions / Unknowns

- How `on_reply_step` is executed (IMAP poller) — UI missing. [UNVERIFIED]
- Seed sequence 1 step/enrollment counts. [UNKNOWN]
- Performance with full contact dump. [UNVERIFIED]
