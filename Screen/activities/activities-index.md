# Activities work queue

## 1. Screen Identity

Screen ID: `SCR-ACTIVITY-001`
Product area: Activities / Communication
Route: `GET /crm/activities`
Route name: `crm.activities.index`
Related writes: `POST /crm/activities` (`crm.activities.store`), `POST /crm/activities/{activity}/complete` (`crm.activities.complete`), `POST /crm/activities/{activity}/attendance` (`crm.activities.attendance`)
Frontend file: `resources/js/pages/crm/activities/index.tsx`
Primary component: Inertia `crm/activities/index` wrapping `ActivityWorkQueue`
Layout: `AppLayout` + in-page `CrmShell` (`RoomShell` title `CRM`). `ActivitiesIndex.layout.breadcrumbs` = Activities → `/crm/activities`.
Authentication: same verified product group as Home.
Permissions: GET has no extra product permission. `store` / `complete` / `attendance` require `crm.edit` (`EnforceProductPermissions` + `crm.*` prefix). Complete also `authorize('update', $activity)`. `capabilities.can_create` = Gate create Activity; `can_complete` = `crm.edit`.
Parent navigation: Communication group **Activities** in full-mode sidebar (`app-sidebar.tsx` `href: '/crm/activities'`). **Not** in `SimpleMode::SIMPLE_NAV` — seed workspace `simple_mode=true` hides the rail item. Header Tasks overlay footer still links here. Command OS `nav-activities`. Home Today View all.
Entry points: `/crm/activities`, `?group=overdue|today|upcoming|completed|unscheduled`, `?scope=mine|all`, `?type=`, `?owner_id=`, `?create=1`, `?date=overdue|today` (legacy alias into group), Home work hrefs, Tasks overlay “Open activities”, command catalog `act` items, activation step first activity.
Exit points: RecordLink drawers (deal/contact/company); remaining on the same URL after complete/store (back/redirect).
Runtime HTTP (owner, simple_mode=true): **200**, component `crm/activities/index`, props include `queue`, `activities`, `members`, `filters`, `capabilities`, `recordCount`. [CONFIRMED-BOTH] `Screen/_evidence/runtime-index.json`.
Evidence: `ActivityController`, `ActivityWorkQueueQuery`, `activity-work-queue.tsx`, `tests/Feature/P15ActivitiesWorkQueueTest.php`, `tests/Feature/ActivitiesIndexTest.php`, `tests/Feature/ActivityCreateTest.php`, `tests/js/p15-activities-work-queue.ts`.

## 2. Purpose

The single Activity domain work queue: what is overdue, due today, upcoming, unscheduled, and a completed preview. Same `Activity` model as Home work and Tasks overlay complete posts. Not a calendar, not a CRM “tasks” table (`class Task` must not exist — P15 lock).

## 3. Current UX Summary

Full-height queue (`data-crm="activity-work-queue"`). Sticky group headers. Rows: complete control, truncated subject + type badge, due label (Overdue styled destructive), related RecordLinks, owner name, meeting attendance on `sm+`. Toolbar: My work / All, Open + group chips with counts, type `<select>`, assignee `<select>` when scope=all, Log activity composer toggle.

Default filters: `scope=mine`, `group=null` (Open grouped view), `create=false`. [CONFIRMED-CODE] `normalizeFilters`.

## 4. Screen Anatomy

- `CrmShell` room tabs: in **full** mode include Home, Leads, Captures, Contacts, Companies, Deals, Pipeline, Activities, Automation. In **simple mode** `crmTabs` keeps only Contacts and Deals — Activities tab is stripped even while this page is open. [CONFIRMED-CODE]
- Page header H1 Activities + subtitle “What needs you now — overdue, today, next.”
- Scope toggle (`role="group"` Assignee scope).
- Due group chips: Open (sum of open counts), Overdue, Today, Upcoming, Completed. Unscheduled is a section in Open view, not a chip.
- Type filter select (note, task, call, meeting, email).
- Optional owner select (All assignees + `members`).
- `ActivityComposer` when `filters.create` / `?create=1`.
- Group sections `data-activity-group={key}` with sticky header + count + View all (when grouped Open view `has_more`).
- Rows `data-activity-row` / complete `data-activity-complete`.
- Footer: count label; pagination only when a **single group** is selected and `paginator.last_page > 1`.

## 5. Data Displayed

`ActivityWorkQueueQuery::present`:

- `queue.groups.{overdue,today,upcoming,unscheduled?,completed}` each `{ key, label, count, items, has_more }`
- `queue.counts`: overdue, today, upcoming, unscheduled, completed, open, total — **authoritative for current scope/type/owner, not page-scoped**
- `queue.paginator`: page, last_page, per_page (40 single-group / 40 group limit / 8 completed preview), has_more
- `activities`: flattened visible items
- `members`: workspace users id/name
- `filters`: scope, group, type, owner_id, page, create
- `capabilities`: can_create, can_complete
- `recordCount`: selected group count or open count

Row fields: id, type, subject, due_at, completed_at, done, group, owner, related[], meta.attendance, can_complete. **Never `body`, never `amount_cents`.** Related order Deal → Contact → Company; secret deals omitted. [CONFIRMED-CODE] P15.

Timing: `ActivityTiming` + `DealAttentionEvaluator::now()` Africa/Algiers. Overdue = incomplete + due_at < now (not start-of-day). “Earlier today” before now is overdue; later today is today. [CONFIRMED-CODE]

## 6. Primary Actions

- Complete: `POST /crm/activities/{id}/complete` → `Activity::markDone()`. Focus moves to next row. Disabled if done, `!can_complete`, or `!capabilities.can_complete`.
- Log activity: toggles `create=1` query via Inertia GET; composer POSTs `/crm/activities` types `note|task|call|meeting|email`.
- Switch scope / group / type / owner (Inertia GET, `preserveScroll`, `router.cancelAll` + visit generation to drop stale responses).

## 7. Secondary Actions

- Meeting attendance (`MeetingAttendanceButtons`) → `POST .../attendance` with `show|no_show|...` (`Activity::ATTENDANCES`). Hidden on xs; meetings only, not done.
- RecordLink related records (drawer).
- View all on a group with `has_more` → same filters + that group (paginated).
- Pagination Previous/Next.

## 8. Search

NOT PRESENT. No `q` parameter. Filter is structured (scope/group/type/owner) only. Command palette can jump to the route but does not search activity subjects on this page.

## 9. Filters

Query string (`ActivityWorkQueueQuery::normalizeFilters` + `activity-work-queue.ts`):

| Param | Values | Default |
| --- | --- | --- |
| `scope` | `mine` \| `all` | `mine` (invalid → mine) |
| `group` | overdue, today, upcoming, unscheduled, completed | null (Open grouped) |
| `date` | overdue \| today | maps into `group` if group empty |
| `type` | note, task, call, meeting, email | null (all) |
| `owner_id` | member id | forced to current user when scope=mine |
| `page` | int ≥ 1 | 1 |
| `create` | `1` | false |

Mine scope hides other owners even if `owner_id` is passed. [CONFIRMED-CODE] P15 fixture F.

## 10. Sorting

Fixed per group: open groups `due_at` asc, `id` asc; unscheduled `created_at` desc; completed `completed_at` desc. No user sort control.

## 11. Selection

NOT PRESENT (no multi-select). Complete is per-row. `completingId` is a single in-flight complete.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

- Open grouped view: first 40 per open group (`GROUP_LIMIT`), 8 completed (`COMPLETED_PREVIEW`); `has_more` exposes View all.
- Single-group: `PAGE_SIZE` 40, footer pager.
- In-flight group change: “Updating queue…” when `pending && !matchesRequest`.
- No infinite scroll.

## 14. Forms

`ActivityComposer` (`activity-composer.tsx`): type chips Email/Call/Task/Event/Note. Call uses `LogCallForm` (direction/outcome, subject auto-built in controller). Others: subject required, optional body, datetime-local due for task/meeting. Hidden contact/deal/company/owner ids only if props passed — **queue composer is invoked with no record ids**, so logs are unlinked unless the user is on a record page composer. [CONFIRMED-CODE]

Attendance is a small button group, not a full form.

Validation: type in enum; subject max 180; related ids must belong to workspace (`findOrFail`).

## 15. Overlays

- Quick Record from related RecordLinks (`OVR-SHELL-006`). Page must not contain `ActivityRecordDrawer` / `DataWorkspace` (P15 lock).
- **Tasks overlay (`OVR-SHELL-002`)** relationship:
  - Opened from topbar Tasks (bell-adjacent control in `app-sidebar-header.tsx`), not from this page.
  - Data: shared Inertia `evoOpenTasks` / `evoOpenTaskCount` from `HandleInertiaRequests` — **all incomplete workspace activities**, limit 40, not mine-filtered, not P15 grouped.
  - Client buckets with `new Date()` / local startOfDay (`tasks-overlay.tsx`) — **not** Africa/Algiers `ActivityTiming`.
  - Complete posts the **same** `/crm/activities/{id}/complete` route.
  - Footer `<a href="/crm/activities">Open activities</a>` is the handoff into this screen.
  - P02: header contains `<TasksOverlay` and must **not** `href="/crm/activities"` in the header chrome itself (only overlay footer).
- Command palette can include activity act items pointing at this queue.

## 16. States

- Default mine Open queue (seed owner 200).
- Empty Open: “Log a call, task, or note…” (mine) or “No open activities match this view.” (all).
- Empty group: “Nothing assigned to you…” / “No activities in this group.” / “No completed activities.”
- Pending visit.
- Completing (button disabled, aria-pressed).
- View-only: `can_complete false`, complete POST 403, composer hidden. [CONFIRMED-CODE]
- Create composer expanded (`?create=1`).
- Stale visit ignored (`isStaleActivityQueueVisit`).

## 17. Empty State

Plain `<p role="status">` in the scroll body — not the illustrated `EmptyState` used by Inbox. No illustration.

## 18. Error Handling

Complete `onError` → `toast.error('Could not complete this activity.')`. Store uses Form/Inertia validation errors on composer inputs ([UNVERIFIED] exact field rendering on this page). Attendance 404 if not a meeting or wrong workspace. Cross-workspace activity 404.

## 19. Feedback

Sonner toast on complete failure. Completed rows get line-through + mute. Group overdue headers use `text-destructive`. No success toast on complete (list refresh is the feedback).

## 20. Navigation Behavior

Inertia GET for filters (`activityQueueHref`). Complete POST preserveScroll. Store `back()`. No activity show route — identity is the queue row. Simple-mode operators reach this URL from Home / overlay / command, not from the slim SIMPLE_NAV rail.

## 21. Entity Relationships

- `Activity` belongs to workspace, optional owner, contact, deal, company.
- Completing an overdue deal activity clears P12 `overdue_activity` (P15 + P17 tests).
- Inbox CRM context composer also uses `DealAttentionEvaluator` / due_at (P15 lock mentions `InboxCrmContextComposer`).
- Meetings: `MeetingLifecycle::markAttendance`.
- Home `work` is `dashboardWork()` — same presenter, mine, limit 6, no complete UI.

## 22. Business Rules

- One Activity domain; no Task model; no Date.now overdue on this page.
- Default My work.
- Counts are full-set for filters, not the current page.
- Body never serialized.
- Restricted associations omitted from `related` (P15 H).
- Complete requires update policy + `crm.edit`.
- Types limited to note, task, call, meeting, email.
- Clock: Africa/Algiers.

## 23. Backend Dependencies

- `App\Http\Controllers\Crm\ActivityController`
- `App\Services\Crm\ActivityWorkQueueQuery`
- `App\Services\Crm\ActivityTiming`
- `App\Services\Crm\ActivityRecorder` (store)
- `App\Services\Meetings\MeetingLifecycle` (attendance)
- `App\Models\Activity`
- Tests listed in §1 plus `tests/Feature/EvoCrmP6ActivityComposerTest.php`, `tests/Feature/MeetingReminderTest.php` (attendance).

## 24. Frontend Dependencies

- `pages/crm/activities/index.tsx`
- `components/crm/activity-work-queue.tsx`
- `components/crm/activity-composer.tsx`
- `components/crm/meeting-attendance.tsx`
- `lib/activity-work-queue.ts`
- `components/crm/crm-shell.tsx` / `room-shell.tsx`
- `RecordLink`, sonner toast
- Adjacent: `components/crm/tasks-overlay.tsx`, `HandleInertiaRequests` evoOpenTasks

## 25. Responsive Behavior

[CONFIRMED-CODE] `overflow-x-hidden`; header/row padding `px-4 sm:px-6`; attendance `hidden sm:block`; wrap filters. [NOT VERIFIED] viewports.

## 26. Accessibility Observations

CONFIRMED: H1; group `aria-labelledby`; complete `aria-label` Complete/Completed :subject; `aria-pressed`; Enter/Space complete; type/owner `sr-only` labels; pagination `nav aria-label`; status roles on empty/pending.

LIKELY ISSUE: complete control is an icon-only circle; type chips in composer are English (“Event”, “Save task”); unscheduled group has no toolbar chip.

REQUIRES MANUAL TEST: focus move after complete; meeting attendance on mobile (hidden).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ACTIVITY-001 | HIGH | Activities omitted from simple-mode sidebar (`SIMPLE_NAV` 5 items: home, contacts, deals, inbox, quotes) | Seed operators cannot find the queue except via Home, overlay, or command | `SimpleMode.php`; `dashboard.json` nav `_list: 5` |
| UX-ACTIVITY-002 | MEDIUM | `CrmShell` simpleMode tabs drop Activities, so the open page’s room chrome does not include itself | Disorienting CRM tabs (Contacts/Deals only) while title is Activities | `crm-shell.tsx` filter `['Contacts', 'Deals']` |
| UX-ACTIVITY-003 | HIGH | Tasks overlay buckets with browser `Date` start-of-day; queue uses Algiers `due_at < now` | Same activity can be Today in overlay and Overdue on this page (P15 K) | `tasks-overlay.tsx` vs `ActivityTiming::isOverdue` |
| UX-ACTIVITY-004 | MEDIUM | Overlay `evoOpenTaskCount` is all undone workspace activities (seed 7); queue default is mine | Badge count disagrees with My work | `HandleInertiaRequests`; `dashboard.json` evoOpenTaskCount 7 vs work.counts |
| UX-ACTIVITY-005 | LOW | No subject/contact search | Cannot find “Hekko” except by scrolling groups | `activity-work-queue` filters |
| UX-ACTIVITY-006 | MEDIUM | Queue composer does not attach contact/deal | Activities logged from this screen are often unscheduled orphans | `ActivityWorkQueue` `<ActivityComposer />` with no ids |
| UX-ACTIVITY-007 | OBSERVATION | Home cannot complete (UX-HOME-003) while this screen and overlay can | Three surfaces, two interaction models | P15 vs P17 locks |
| UX-ACTIVITY-008 | LOW | Unscheduled work has no chip; only appears inside Open | Easy to miss undated notes | `OPEN_GROUP_ORDER` vs chip list |

## 28. Consistency Comparison

- Stronger complete UX than Home; weaker than record timelines (no body preview).
- Inbox CRM context shows tasks/notes for a contact but is not this queue.
- Type labels capitalized English vs i18n `t()` on chrome.
- Room chrome inconsistent with DeskShell (inbox has persistent Inbox/Conversations tabs).

## 29. Functional Preservation Contract

- [ ] GET `/crm/activities` Inertia `crm/activities/index` with `queue` groups/counts/paginator, `filters`, `capabilities`, no `body`.
- [ ] Default scope mine; All + owner filter.
- [ ] Groups overdue/today/upcoming/unscheduled/completed with P12/P15 clock.
- [ ] Complete + attendance + store routes and policies.
- [ ] `?create=1` composer.
- [ ] Related RecordLinks permission-safe.
- [ ] Pagination on single group; visit-generation against stale Inertia.
- [ ] Same complete endpoint as Tasks overlay.
- [ ] No second Task model / Date.now overdue / DataWorkspace drawer.

## 30. Design Input Contract

Purpose: execute and log seller work in time buckets.
Primary goal: clear overdue then today.
Primary actions: complete, filter group/scope, log activity.
Secondary: attendance, open related record, paginate, all-assignees.
Required information: subject, type, due/completed time, related labels, owner, group counts, can_complete.
Required components: header+filters, composer, grouped list, complete control, footer counts.
Required states: grouped open, single group, empty, pending, view-only, create open.
Information priority: overdue > today > upcoming > unscheduled > completed.
Business-critical: Algiers overdue predicate, mine default, no body leak, complete permission.
Must not remove: My work/All, group counts, complete, composer types, attendance for meetings.

## 31. Open Questions / Unknowns

- [UNKNOWN] Whether product intends Activities in simple-mode rail (code currently no).
- [UNVERIFIED] Seed queue contents beyond prop keys (no `activities.json` dump).
- [UNKNOWN] Should overlay reuse `ActivityWorkQueueQuery::dashboardWork`?
- [UNVERIFIED] Composer validation error UX on this page.
