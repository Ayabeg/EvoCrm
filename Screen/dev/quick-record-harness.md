# Quick-record drawer harness

## 1. Screen Identity

Screen ID: `SCR-DEV-001`
Product area: Dev / hidden
Route: `GET /crm/quick-record-drawer/harness`
Route name: `crm.quick-record-drawer.harness`
Frontend file: `resources/js/pages/crm/quick-record-drawer/harness.tsx`
Primary component: `QuickRecordDrawerHarness`
Layout: Default `AppLayout` (component name `crm/quick-record-drawer/harness` — not auth/public/settings)
Authentication: Same authenticated group as CRM (`auth`, `verified`, permissions, simple mode)
Permissions: No extra permission. Controller `abort_unless(app()->environment(['local', 'testing']), 404)`.
Parent navigation: **None.** Not in the rail, More, or Command OS.
Entry points: Direct URL only
Exit points: Opening a sample uses peek (`OVR-SHELL-006`); Open full from the drawer
Runtime HTTP (owner, simple_mode=true): **200**, component `crm/quick-record-drawer/harness`, props include `samples` plus full shared chrome. `[CONFIRMED-BOTH]` `Screen/_evidence/runtime-index.json`, `crm_quick-record-drawer_harness.json`
Evidence: `routes/web.php` (`if (app()->environment(['local', 'testing']))`), `QuickRecordHarnessController.php`, harness page, P09 tests.

## 2. Purpose

Safe local/testing host to open the five record types in the peek drawer without changing production list `rowHref`.

## 3. Current UX Summary

Page title “P09 drawer harness”. Heading `t('Quick record drawer')`. Explainer: production lists still open the full record; this page is local/testing only. Grid of five buttons (contact, company, lead, deal, quote) labeled with `type:id` or “No sample in this workspace”. Status line: `Open type:id` or “Drawer closed”.

## 4. Screen Anatomy

`data-ds="quick-record-drawer-harness"`. Max width 3xl, padding. Two-column grid `sm:grid-cols-2`. Does not import the contract test file (tests lock that out of the page).

## 5. Data Displayed

`samples`: latest id per type in the user’s workspace (`Contact|Company|Lead|Deal|Quote::forWorkspace->latest('id')->value('id')`), or null.

Shared chrome props as on any AppLayout page (`simpleMode: true`, `evoOpenTaskCount: 7` in the harness capture).

## 6. Primary Actions

Click a enabled sample → `openRecord({ type, id }, { opener: currentTarget })`.

## 7. Secondary Actions

None on the page (drawer provides close/open full).

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

`RECORD_TYPES` order: contact, company, lead, deal, quote.

## 11. Selection

One peek at a time via global provider.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Latest id only, not a list. Drawer handles loading.

## 14. Forms

NOT PRESENT.

## 15. Overlays

Uses global `QuickRecordDrawer`. Command/Tasks/Create still in the shell.

## 16. States

Button disabled when `id` is null. Drawer open/closed echoed as text.

## 17. Empty State

Per type: “No sample in this workspace” + disabled.

## 18. Error Handling

Production/staging: route unregistered **or** controller 404. Peek errors surface in the drawer.

## 19. Feedback

Open-state sentence. Focus opener restored by the drawer.

## 20. Navigation Behavior

Not linked from product IA. Bookmarkable on local. Inertia title “P09 drawer harness”.

## 21. Entity Relationships

Each button is the latest row of that type in workspace 1 (Evotechly).

## 22. Business Rules

- Register route only in local/testing.
- Do not change list row navigation.
- Do not ship contract assertions in the page bundle.

## 23. Backend Dependencies

`QuickRecordHarnessController`, five Eloquent models, environment check.

## 24. Frontend Dependencies

`useQuickRecord`, `RECORD_TYPES`, `t()`, Head.

## 25. Responsive Behavior

Grid 1 col → `sm:2`. `NOT VERIFIED` visually.

## 26. Accessibility Observations

**CONFIRMED:** native buttons, disabled when no sample, focus-visible ring.

**LIKELY ISSUE:** no page `h1` association with a nav landmark beyond default; status text not `aria-live`.

**REQUIRES MANUAL TEST:** keyboard into drawer and back to the same button.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| HAR-001 | OBSERVATION | Unreachable from nav | Intentional for prod; easy to forget locally | no rail item |
| HAR-002 | LOW | Status not live | SR users may miss open/close | plain `<p>` |

## 28. Consistency Comparison

Only dedicated peek launcher. Dashboard uses `RecordLink mode="drawer"` on a few cards; lists do not.

## 29. Functional Preservation Contract

- Keep local/testing-only registration and 404 otherwise.
- Keep five-type sample grid and `openRecord` with opener.
- Keep `data-ds="quick-record-drawer-harness"`.
- Do not wire this into SIMPLE_NAV.

## 30. Design Input Contract

Purpose: inspect peek without CRM list changes.
Primary goal: open each type.
Primary actions: five openers.
Required information: sample ids, drawer status.
Required components: heading, buttons, status.
Must not remove: environment guard.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` exact sample ids in this workspace (capture truncated `samples`).
- `[UNVERIFIED]` 404 in a non-local `APP_ENV` (not this machine).
