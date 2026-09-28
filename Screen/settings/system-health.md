# System health

## 1. Screen Identity

Screen ID: SCR-SET-025
Product area: Settings / Developer
Route: `/settings/system-health`
Route name: `settings.system-health`
Frontend file: `resources/js/pages/settings/system-health.tsx`
Primary component: `SystemHealthSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `adminOnly: true`
- **GET:** `can-manage-settings` + EPP skip (safe)
- No mutations
Parent navigation: Settings IA **Developer**, title **System health**.
Entry points: settings nav.
Exit points: settings siblings. No deep links to queues.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Crawl `prop_keys` listed **`commands` only**. Current controller also passes **`integrations`** `[CONFIRMED-CODE]` — crawl/controller drift possible.
Evidence: `SystemHealthController`; `ScheduledCommandHealth`; `IntegrationHealth`; `system-health.tsx`; runtime-index.

## 2. Purpose

Show scheduler freshness (never/running/success/failed/stale) and workspace integration configuration/activity **without credentials**.

## 3. Current UX Summary

Two sections: scheduled commands table; integration cards grid.

## 4. Screen Anatomy

Header; “Scheduled commands” table (process, state badge, last success, last failure+error_type, duration); “Integrations” cards (label, state, detail, last activity).

## 5. Data Displayed

`commands[]`: command, label, cadence, state, last_started_at, last_success_at, last_failure_at, duration_ms, error_type.
`integrations[]`: key, label, state, detail, last_activity_at `[CONFIRMED-CODE]`.
Runtime confirmed `commands` `[CONFIRMED-UI]`; `integrations` `[UNVERIFIED]` at crawl time.

## 6. Primary Actions

NOT PRESENT (read-only).

## 7. Secondary Actions

NOT PRESENT. No retry/run buttons.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Service summary order `[UNVERIFIED]`.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full tables. No auto-refresh `[CONFIRMED-CODE]`.

## 14. Forms

NOT PRESENT.

## 15. Overlays

NOT PRESENT.

## 16. States

Command states: never, running, success, failed, stale with badges/icons. Integration state string with underscores replaced by spaces. Null timestamps “Not recorded”.

## 17. Empty State

NOT PRESENT. Empty arrays would yield empty tbody/grid `[CONFIRMED-CODE]`.

## 18. Error Handling

403 members. Service exceptions `[UNKNOWN]`. Failed/stale are data states not HTTP errors.

## 19. Feedback

NOT APPLICABLE.

## 20. Navigation Behavior

Stay. Breadcrumbs: Settings → System health.

## 21. Entity Relationships

Scheduler command log; workspace integrations (same providers as Apps). Not a live ping (copy: configuration and last known activity).

## 22. Business Rules

- Admin/owner only
- Credentials never shown (header)
- Stale = expected window passed without newer run (copy)
- Read-only

## 23. Backend Dependencies

`SystemHealthController`, `ScheduledCommandHealth`, `IntegrationHealth`.

## 24. Frontend Dependencies

Phosphor state icons, Badge, Card, settings header.

## 25. Responsive Behavior

Commands table `min-w-[760px]` + overflow-x-auto `[CONFIRMED-CODE]`. Integrations `sm:grid-cols-2`. Wide pane. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: section `aria-labelledby`; badge icons `aria-hidden`.
LIKELY ISSUE: no live region/refresh; empty tables lack empty copy.
REQUIRES MANUAL TEST: contrast of destructive badges.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-025-01 | MEDIUM | No refresh/retry | Stale view of queues | page read-only |
| SET-025-02 | LOW | No empty states | Blank sections | page |
| SET-025-03 | OBSERVATION | Crawl missing `integrations` key | Docs vs runtime mismatch | runtime-index vs controller |

## 28. Consistency Comparison

Developer group with Audit. Operational vs Audit legal. Unique health badges.

## 29. Functional Preservation Contract

- Command table with cadence and five states
- Integration cards without secrets
- Admin-only
- Read-only
- Stale definition copy

## 30. Design Input Contract

Purpose: ops freshness for this workspace.
Primary goal: see what is healthy vs failed/stale.
Required information: process, state, last success/failure, duration, integration state/detail/activity.
Required states: never, running, healthy, failed, stale; integration variants.
Must not remove: no credential display; admin gate.

## 31. Open Questions / Unknowns

- Why runtime-index omitted `integrations` `[UNKNOWN]`
- Command catalog list `[UNVERIFIED]` (`ScheduledCommandHealth`)
- Polling intended? `[UNKNOWN]`
