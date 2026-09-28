# Audit trail

## 1. Screen Identity

Screen ID: SCR-SET-024
Product area: Settings / Developer
Route: `/settings/audit`
Route name: `settings.audit`
Frontend file: `resources/js/pages/settings/audit.tsx`
Primary component: `AuditSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `adminOnly: true`
- **GET:** `can-manage-settings` (`settings.php` group)
- EPP returns **null** for `settings.audit*` (no extra capability) `[CONFIRMED-CODE]`
- Members 403 (feature test) `[CONFIRMED-CODE]` tests/Feature/AuditTrailTest.php
Parent navigation: Settings IA **Developer**, title **Audit trail**.
Entry points: settings nav.
Exit points: settings siblings. No row links.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Prop: `events`.
Evidence: `AuditTrailController`; `audit.tsx`; runtime-index.

## 2. Purpose

Read the last 200 workspace audit events (logins, imports, merges, quotes, permission changes — header copy).

## 3. Current UX Summary

Header plus a table: When, Actor, Action, Summary. No filters.

## 4. Screen Anatomy

Header; Card table thead uppercase; empty row or event rows.

## 5. Data Displayed

`events[]`: id, action, summary, actor (name/email), ip, created_at. **`ip` is not shown** `[CONFIRMED-CODE]`. Actor fallback “System”. Dates via `Intl` medium+short `[CONFIRMED-BOTH]`.

## 6. Primary Actions

NOT PRESENT (read-only).

## 7. Secondary Actions

NOT PRESENT.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

`latest('id')` `[CONFIRMED-CODE]`. No UI sort.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Hard `limit(200)` — no pager `[CONFIRMED-CODE]`. Older events dropped from UI.

## 14. Forms

NOT PRESENT.

## 15. Overlays

NOT PRESENT.

## 16. States

Empty “No audit events yet.” vs rows.

## 17. Empty State

Table colspan message `[CONFIRMED-CODE]`.

## 18. Error Handling

403 members. No load-error UI.

## 19. Feedback

NOT APPLICABLE.

## 20. Navigation Behavior

Stay. **No** `.layout` breadcrumbs `[CONFIRMED-CODE]`.

## 21. Entity Relationships

`AuditEvent` with actor User. Written by permission updates, Meta disconnect, etc.

## 22. Business Rules

- Owner/admin only
- 200 most recent
- IP stored but hidden
- Read-only

## 23. Backend Dependencies

`AuditTrailController`, `AuditEvent`.

## 24. Frontend Dependencies

Settings header, Card, table.

## 25. Responsive Behavior

Wide pane; table `w-full` may overflow `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: table headers.
LIKELY ISSUE: no caption; dates not `time datetime`.
REQUIRES MANUAL TEST: 200-row performance.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-024-01 | HIGH | No search/filter/pagination | Cannot find an event | page + limit 200 |
| SET-024-02 | LOW | IP hidden | Support/debug harder | controller vs columns |
| SET-024-03 | LOW | No breadcrumbs | Inconsistent Developer pages | page |

## 28. Consistency Comparison

Developer group with System health. Simpler than Permissions. Unlike CRM lists, no HairlineTable.

## 29. Functional Preservation Contract

- Latest 200 events
- When, actor, action, summary
- Empty state
- Admin-only
- Read-only (no delete)

## 30. Design Input Contract

Purpose: accountability log.
Primary goal: scan recent sensitive actions.
Required information: timestamp, actor, action, summary.
Required states: empty, populated.
Must not remove: admin gate; 200 cap unless replaced with pagination; no token secrets in summaries `[UNVERIFIED]`.

## 31. Open Questions / Unknowns

- Full action taxonomy `[UNKNOWN]`
- Retention beyond 200 `[UNKNOWN]`
- Why IP collected if unused `[UNKNOWN]`
