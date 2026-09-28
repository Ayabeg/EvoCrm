# Outbound quiet hours

## 1. Screen Identity

Screen ID: `SCR-OUT-014`
Product area: Outbound / Settings
Route: `/outbound/quiet-hours`
Route name: `outbound.quiet-hours.edit`
Frontend file: `resources/js/pages/outbound/quiet-hours.tsx`
Primary component: `QuietHoursEdit`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Quiet hours"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; POST update `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Settings subtab **Quiet hours**.
Entry points: subtab; sequence show Settings links.
Exit points: room tabs. POST `back()`.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/quiet-hours`, prop `quietHours`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `QuietHoursController.php`; `quiet-hours.tsx`; `config/evosales.php` `quiet_hours`.

## 2. Purpose

Set the workspace window when automated outbound is blocked. Default 21:00–08:00 Africa/Algiers.

## 3. Current UX Summary

Single form: starts_at, ends_at, timezone, enabled checkbox, Save. No preview of “currently quiet?”.

## 4. Screen Anatomy

1. Settings chrome. [CONFIRMED-CODE]
2. Title + description. [CONFIRMED-CODE]
3. Form `md:grid-cols-2`. [CONFIRMED-CODE]

## 5. Data Displayed

`quietHours`: starts_at/ends_at first 5 chars of workspace activeQuietHours or first quietHours or config defaults; timezone default Africa/Algiers; enabled default true if no row. [CONFIRMED-CODE]
Config: `EVOSALES_QUIET_START` default 21:00, `EVOSALES_QUIET_END` 08:00. [CONFIRMED-CODE]

## 6. Primary Actions

- **Save quiet hours** POST `/outbound/quiet-hours`. [CONFIRMED-CODE]

## 7. Secondary Actions

NOT PRESENT.

## 8. Search

NOT APPLICABLE.

## 9. Filters

NOT APPLICABLE.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT APPLICABLE.

## 13. Pagination / Loading Strategy

Single workspace row `updateOrCreate`. [CONFIRMED-CODE]

## 14. Forms

starts_at `H:i` required; ends_at `H:i`; timezone `timezone` rule; enabled sometimes boolean with hidden `0` + checkbox `1` (`boolean('enabled', true)`). [CONFIRMED-CODE]
Inputs are text, not `type="time"`. [CONFIRMED-CODE]
No client validation beyond HTML required. [CONFIRMED-CODE]
No `errors.*` display. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT.

## 16. States

Processing. Enabled checkbox defaultChecked from prop. [CONFIRMED-CODE]
Overnight window (21:00–08:00) is valid conceptually; UI does not explain wrap-past-midnight. [CONFIRMED-CODE]

## 17. Empty State

NOT APPLICABLE — always shows a form with defaults. [CONFIRMED-CODE]

## 18. Error Handling

Invalid timezone/time format: Laravel validation, not shown in UI. [CONFIRMED-CODE]

## 19. Feedback

No toast. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stay on page. Breadcrumbs Quiet hours. [CONFIRMED-CODE]
Sequence settings deep-link here. [CONFIRMED-CODE]

## 21. Entity Relationships

Workspace `quietHours` has-one/many (`updateOrCreate` on workspace_id). Consumed by dispatcher/campaign runner/warmup peer pings (copy on warmup page).

## 22. Business Rules

- Automated outbound blocked in window when enabled. [CONFIRMED-CODE]
- Default enabled true if no record. [CONFIRMED-CODE]
- Timezone default Africa/Algiers. [CONFIRMED-CODE]
- Manual mailbox tests still send immediately? [UNVERIFIED] dispatcher may still honor quiet hours.

## 23. Backend Dependencies

`QuietHoursController@edit|update`, Workspace quietHours relation, `config('evosales.quiet_hours')`.

## 24. Frontend Dependencies

Outbound*, Button, Input, Label, Form.

## 25. Responsive Behavior

`md:grid-cols-2`. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: Labels; enabled has htmlFor. [CONFIRMED-CODE]
LIKELY ISSUE: time fields not `type="time"` so no picker; timezone free text easy to fail validation. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-130 | MEDIUM | Free-text timezone and H:i without errors. | Save fails silently. | form vs validate timezone [CONFIRMED-CODE] |
| UX-OUT-131 | LOW | No “is it quiet right now?” indicator. | Hard to debug deferred outbox. | page has no clock [CONFIRMED-CODE] |
| UX-OUT-012 | MEDIUM | Warmup subtab 403 simple_mode. | [CONFIRMED-BOTH] |

## 28. Consistency Comparison

Simplest settings form in outbound. Unlike mailboxes, no HairlinePanel wrapper.

## 29. Functional Preservation Contract

Must keep: starts/ends H:i, timezone, enabled hidden+checkbox pattern, defaults 21:00–08:00 Africa/Algiers, workspace updateOrCreate, description of automated-block.

## 30. Design Input Contract

- Purpose: legal/operational send window (Algeria).
- Primary goal: change hours without breaking overnight wrap.
- Required information: start, end, tz, enabled.
- Must not remove: default window and timezone.

## 31. Open Questions / Unknowns

- How QuietHoursGuard treats wrap-around and disabled flag. [UNVERIFIED]
- Seed workspace quiet hours values. [UNKNOWN]
