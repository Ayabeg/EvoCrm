# Meetings (booking schedule)

## 1. Screen Identity

Screen ID: SCR-SET-006
Product area: Settings / Workspace
Route: `/settings/meetings`
Route name: `settings.meetings` GET, `settings.meetings.update` PUT
Frontend file: `resources/js/pages/settings/meetings.tsx`
Primary component: `MeetingSettings`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`. **No** `can-manage-settings`.
Permissions: IA destination has **no** `permission` / `adminOnly` / `ownerOnly` — every verified user. PUT is **not** in the EPP `can-manage-settings` group (`settings.php` meetings routes sit outside) `[CONFIRMED-CODE]`.
Parent navigation: Settings IA **Workspace**, title **Meetings**.
Entry points: settings nav “Meetings”.
Exit points: public booking URL (`schedule.url`); Google Calendar status copy; settings siblings.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `schedule`, `whatsapp`, `whatsapp_cloud_connected`.
Evidence: `MeetingScheduleController`; `meetings.tsx`; runtime-index.

## 2. Purpose

Configure the user’s public booking page (slug, hours, days, slot length) and workspace WhatsApp Cloud template names for meeting/quote/SLA messages.

## 3. Current UX Summary

Read-only “Booking link” card, then a large Availability form including WhatsApp template fields. Timezone copy is always Africa/Algiers.

## 4. Screen Anatomy

1. Header “Meetings”
2. Card “Booking link”: URL + Google Calendar connected or not
3. PUT form card “Availability”: live checkbox, slug, intro, slot, work start/end, weekday checkboxes, location, WhatsApp Cloud templates + language + Meta variable help

## 5. Data Displayed

`schedule`: slug, url, enabled, slot_minutes, timezone, work_start/end, weekdays, location_note, intro, calendar_connected.
`whatsapp`: booked, reminder, quote, sla, language.
`whatsapp_cloud_connected` boolean `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save availability (PUT) `[CONFIRMED-CODE]`.

## 7. Secondary Actions

Open public booking link (new navigation via `<a href={schedule.url}>`). Cancel/reset.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

Weekday multi-check; slot select 30/45/60; language fr/ar/en.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Single form; save bar has no `processing` passed (`<SettingsSaveBar />`) `[CONFIRMED-CODE]` — Save not disabled while submitting.

## 14. Forms

Validated `[CONFIRMED-CODE]`: slug required alpha_dash unique; enabled boolean; slot in allowed; work_end after work_start; weekdays min 1 values 1–7; location/intro max 180; WA templates regex `^[A-Za-z0-9_]*$`; language fr|ar|en. Timezone forced `MeetingSchedule::TIMEZONE`.

## 15. Overlays

NOT PRESENT.

## 16. States

Calendar connected vs not. WhatsApp Business connected vs “use phone WhatsApp text”. Enabled checkbox. Validation errors on slug uniqueness `[CONFIRMED-CODE]` — **not bound to Inputs** in the React form (`InputError` unused) `[CONFIRMED-CODE]`.

## 17. Empty State

NOT APPLICABLE (`MeetingSchedule::forUser` always present) `[UNVERIFIED]` create-on-read.

## 18. Error Handling

Slug taken → `withErrors(['slug'])` `[CONFIRMED-CODE]` but UI has no error display `[BROKEN]` likely.

## 19. Feedback

No toast on success; `back()` `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay on page. Public URL is a user-level booking page (`SCR-PUB-002`). **No** `MeetingSettings.layout` breadcrumbs object `[CONFIRMED-CODE]`.

## 21. Entity Relationships

Per-user `MeetingSchedule`. Workspace `meeting_wa_templates`. Google Calendar via connectors. WhatsApp Business integration for Cloud templates. Meetings land on contact timeline (header copy).

## 22. Business Rules

- Any verified user edits **their** schedule
- WhatsApp template names are **workspace**-level (all users share) `[CONFIRMED-CODE]` — surprising on a personal meetings page
- Timezone always Africa/Algiers
- Empty template name skips Cloud

## 23. Backend Dependencies

`MeetingScheduleController`, `MeetingSlotFinder`, `MeetingSchedule`, `Integration::PROVIDER_WHATSAPP_BUSINESS`.

## 24. Frontend Dependencies

Settings chrome, `Input`, `t()` i18n.

## 25. Responsive Behavior

Work start/end `sm:grid-cols-2`. Weekdays wrap `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: fieldset/legend Days; labeled inputs.
LIKELY ISSUE: validation errors not shown; save not disabled while processing.
REQUIRES MANUAL TEST: time inputs, public link.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-006-01 | HIGH | Slug errors not rendered | Duplicate slug looks like a no-op | controller vs `meetings.tsx` |
| SET-006-02 | MEDIUM | Workspace WA templates on personal page | One user overwrites org templates | `update()` workspace fill |
| SET-006-03 | LOW | Save bar ignores `processing` | Double submit | `meetings.tsx` |

## 28. Consistency Comparison

Card + save bar like General. Unique: public URL + weekday fieldset. Missing breadcrumbs unlike most settings pages.

## 29. Functional Preservation Contract

- Public URL display
- Enable page, slug, hours, days, slot, location, intro
- Calendar-connected messaging
- WA template names + language + variable help
- Africa/Algiers timezone copy

## 30. Design Input Contract

Purpose: publish a booking page and set reminder templates.
Primary action: Save availability.
Secondary: open public link.
Required information: URL, hours, days, slot, calendar status, WA templates.
Required states: enabled/disabled, calendar on/off, Cloud connected/not, validation.
Must not remove: unique slug, timezone, weekday min 1, template regex.

## 31. Open Questions / Unknowns

- Should WA templates live under WhatsApp Business instead? `[UNKNOWN]`
- Exact public URL pattern `[UNVERIFIED]` (`publicUrl()`)
