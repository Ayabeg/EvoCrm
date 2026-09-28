# Public meeting book

## 1. Screen Identity

Screen ID: `SCR-PUB-002`
Product area: Public / Meetings
Route: `GET /book/{slug}`, `POST /book/{slug}` (throttle `20,1`)
Route name: `meetings.public.show`, `meetings.public.store`
Frontend file: `resources/js/pages/public/book.tsx`
Primary component: `PublicBook`
Layout: `PublicLayout` (no rail)
Authentication: Guest. Unknown slug HEAD **404**. `[CONFIRMED-UI]`
Permissions: `MeetingSchedule` where `slug` and `enabled` (else 404)
Parent navigation: Settings Meetings (host slug); optional `?deal=` query
Entry points: `/book/{slug}`, deal-context `?deal=`
Exit points: Successful POST redirects `meetings.public.done` with flash `booked_at` (`SCR-PUB-003`)
Runtime HTTP (owner, simple_mode=true): Not in runtime-index. Probe `/book/does-not-exist` 404.
Evidence: `MeetingBookController.php`, `book.tsx`, `routes/web.php`, `AlgerianPhone`.

## 2. Purpose

Let a prospect pick a slot on an enabled meeting schedule and submit identity (name, email, Algerian mobile) to create the booking.

## 3. Current UX Summary

Eyebrow EvoCrm, h1 “Book {host}” or “Book a meeting”. Intro or `{slot_minutes} min` · timezone. Optional location_note. Calendar connected copy vs “working hours only”. Days with slot chips; selected chip inverts ink. Empty: “No open slots in the next days.” After pick, a form appears (not before).

## 4. Screen Anatomy

Client state `picked: Slot | null`. Form `action={`/book/${schedule.slug}`}` method post. Hidden `starts_at`, optional `deal_id`. Fields first/last/email/phone/note. Submit “Confirm meeting”.

## 5. Data Displayed

`host.name`, `schedule` {slug, intro, slot_minutes, timezone, location_note, calendar_connected}, `days[]` {date, label, slots[{starts_at, ends_at, label, date}]}, `deal_id`. Selected time formatted with `dateLocale()` and `schedule.timezone`.

## 6. Primary Actions

Pick slot. Confirm meeting.

## 7. Secondary Actions

Change slot (re-pick). No timezone switcher (host TZ only).

## 8. Search

NOT PRESENT.

## 9. Filters

Days with zero slots are omitted from the list (`null` render). No range picker.

## 10. Sorting

Days/slots as `MeetingSlotFinder` grouped by date.

## 11. Selection

Single slot (`picked.starts_at`).

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

All days from `slots($schedule)` in one payload. Submit `disabled={processing}`.

## 14. Forms

| Field | Rules (server) |
| --- | --- |
| starts_at | required date |
| first_name | required max 80 |
| last_name | nullable max 80 |
| email | required email max 180 |
| phone | required; must `AlgerianPhone::normalize` else error “Enter an Algerian mobile (+213).” |
| note | nullable max 500 |
| deal_id | nullable integer (also `?deal=` on GET) |

UI marks first, email, phone required; last/note optional. Phone placeholder `+213 5…`.

## 15. Overlays

NOT PRESENT.

## 16. States

No slots. Slots without pick (no form). Picked + form. Processing. Validation errors (Inertia `errors.phone` etc. — **the form does not render `FieldError`** `[CONFIRMED-CODE]`). 404.

## 17. Empty State

“No open slots in the next days.”

## 18. Error Handling

404 disabled/missing schedule. Phone normalize fail `back()->withErrors(['phone'])`. Throttle 20/min. Slot collision `[UNVERIFIED]` in `MeetingBooker`. Errors may be invisible without FieldError.

## 19. Feedback

Selected summary “Selected: {when}”. Processing disables submit. Success is a redirect, not an inline thank-you.

## 20. Navigation Behavior

POST → GET `/book/{slug}/done` with session `booked_at`. Refreshing book page loses pick (client state). Deal id preserved hidden if present.

## 21. Entity Relationships

Creates an activity via `MeetingBooker` (contact likely upserted from email/phone) `[UNVERIFIED]` exact contact merge. Optional deal_id.

## 22. Business Rules

- Schedule must be enabled.
- Phone must be Algerian mobile.
- Busy times hidden only if Google calendar connected.
- Throttle 20 POSTs per minute.

## 23. Backend Dependencies

`MeetingBookController`, `MeetingSlotFinder`, `MeetingBooker`, `AlgerianPhone`, `MeetingSchedule`.

## 24. Frontend Dependencies

Inertia Form/Head, Button, Input, Label, `t()`, `dateLocale`.

## 25. Responsive Behavior

`max-w-xl p-6`, slot chips wrap. `NOT VERIFIED`.

## 26. Accessibility Observations

**CONFIRMED:** labels, required attributes, h1/h2 days.

**LIKELY ISSUE:** slot buttons have no `aria-pressed`; form errors not shown; no field-level error components; timezone not announced as a live region when picking.

**REQUIRES MANUAL TEST:** real enabled slug (unknown in crawl).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| PUB-B-001 | HIGH | Server errors not displayed | Failed phone/slot looks like a no-op | no FieldError |
| PUB-B-002 | MEDIUM | Form hidden until a slot is picked | Easy to miss that identity is required | `picked ? Form` |
| PUB-B-003 | OBSERVATION | 404 on unknown slug in crawl | No happy-path screenshot | probe |

## 28. Consistency Comparison

Auth forms show FieldError; this public form does not. Quote accept has a single button. Settings Meetings is the host configuration (`SCR-SET-006`).

## 29. Functional Preservation Contract

- Keep slug show/store/done triangle.
- Keep Algerian phone rule and throttle.
- Keep calendar-connected copy.
- Keep optional deal_id.
- Keep slot picker then identity form.

## 30. Design Input Contract

Purpose: book a meeting.
Primary goal: confirm a slot with valid identity.
Primary actions: pick slot, confirm.
Required information: host, timezone, slots, identity fields.
Required components: slot chips, form, empty copy.
Required states: empty slots, picking, submitting, 404.
Must not remove: +213 phone, enabled-schedule 404, throttle.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` seed schedule slug if any.
- `[UNVERIFIED]` slot horizon (“next days”) length.
- How Inertia prints `errors.phone` without FieldError (maybe none).
