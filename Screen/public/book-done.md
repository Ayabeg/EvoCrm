# Public meeting booked

## 1. Screen Identity

Screen ID: `SCR-PUB-003`
Product area: Public / Meetings
Route: `GET /book/{slug}/done`
Route name: `meetings.public.done`
Frontend file: `resources/js/pages/public/book-done.tsx`
Primary component: `PublicBookDone`
Layout: `PublicLayout`
Authentication: Guest. Unknown slug **404** (same `resolve()` as book). `[CONFIRMED-UI]` `/book/does-not-exist/done` 404
Permissions: Enabled schedule required even for the thank-you page
Parent navigation: Redirect from `meetings.public.store` only (no in-app link)
Entry points: POST success flash `booked_at`
Exit points: None (no CTA)
Runtime HTTP (owner, simple_mode=true): Not in runtime-index. Probe 404.
Evidence: `MeetingBookController::done`, `book-done.tsx`.

## 2. Purpose

Confirm that a meeting was booked, showing host, when, and timezone, and stating that email confirmation was sent.

## 3. Current UX Summary

Compact `max-w-md p-6`: uppercase EvoCrm, h1 `You're booked`, body “Meeting with {host} · {when}.” or “Meeting confirmed”, mute line “A confirmation was sent to your email. Times are {timezone}.”

`when` comes from **session** `booked_at`. Direct GET without flash renders `when: null` — host/timezone still show, time omitted. `[CONFIRMED-CODE]`

## 4. Screen Anatomy

`Head` title `Meeting booked`. No form. No buttons.

## 5. Data Displayed

`host.name`, `when` (ISO-ish from activity meta `starts_at` or posted starts_at), `timezone` from schedule. Client formats `when` with `dateLocale()` and `timeZone: timezone`.

## 6. Primary Actions

NOT PRESENT (terminal page).

## 7. Secondary Actions

NOT PRESENT (no “add to calendar”, no reschedule, no book another).

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT PRESENT.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Static.

## 14. Forms

NOT PRESENT.

## 15. Overlays

NOT PRESENT.

## 16. States

Happy path with `when`. Missing flash (`when` null) still 200 if slug valid. 404 disabled schedule.

## 17. Empty State

If `when` is null the sentence has no time; still claims email was sent (which may be false if the user only opened `/done`). `[CONFIRMED-CODE]`

## 18. Error Handling

404. No error UI for missing session.

## 19. Feedback

The entire page is the success feedback. Mail send is asserted in copy (`meeting-booked` mailable exists in `resources/views/mail/`).

## 20. Navigation Behavior

Refresh keeps the page but session flash may be gone (`with('booked_at')` is flash). Back button returns to the book form.

## 21. Entity Relationships

The activity created on store; this page does not re-fetch it — only session + schedule/user name.

## 22. Business Rules

- Done URL is guessable (`/book/{slug}/done`) but time is flash-only.
- Schedule must still be enabled to see the thank-you (disabling the schedule 404s the confirmation URL).

## 23. Backend Dependencies

`MeetingBookController::done`, session flash, `MeetingSchedule`.

## 24. Frontend Dependencies

Head, `t()`, `dateLocale`.

## 25. Responsive Behavior

Simple padded column. `NOT VERIFIED`.

## 26. Accessibility Observations

**CONFIRMED:** h1.

**LIKELY ISSUE:** success not `role="status"`; no next action; English/French via `t()`.

**REQUIRES MANUAL TEST:** real booking.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| PUB-D-001 | MEDIUM | Flash-only `when`; reload drops the time | Looks incomplete | `session('booked_at')` |
| PUB-D-002 | LOW | No calendar ICS / Google link | User must wait for email | page source |
| PUB-D-003 | LOW | Copy always says email was sent | Misleading on direct GET | book-done.tsx |

## 28. Consistency Comparison

Quote accept stays on the same URL with an accepted state (no flash). Unsubscribe is a one-shot GET. This is a dedicated success route.

## 29. Functional Preservation Contract

- Keep done route + flash `booked_at`.
- Keep host/when/timezone rendering.
- Keep 404 for disabled slugs.
- Keep email confirmation claim only if mail still sends.

## 30. Design Input Contract

Purpose: reassure the booker.
Primary goal: show the appointment facts.
Primary actions: none (optional future calendar).
Required information: host, time, timezone, email notice.
Required states: with time, without time, 404.
Must not remove: success heading, timezone disclaimer.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` mail actually sent in local.
- `[UNKNOWN]` ICS attachment in `meeting-booked` mailable.
