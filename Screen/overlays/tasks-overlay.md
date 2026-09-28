# Tasks overlay

## 1. Screen Identity

Screen ID: `OVR-SHELL-002`
Product area: Shell overlays
Route: Overlay. Complete action `POST /crm/activities/{activity}/complete` named `crm.activities.complete`. Footer link `/crm/activities`.
Route name: complete = `crm.activities.complete`; list = `crm.activities.index`
Frontend file: `resources/js/components/crm/tasks-overlay.tsx`
Primary component: `TasksOverlay`
Layout: Full-viewport dimmer + right `aside` `max-w-md` (`z-50`). Returns `null` when closed (unmounts).
Authentication: Uses shared Inertia props; complete endpoint requires auth + policy `update` on the activity.
Permissions: Overlay lists whatever `evoOpenTasks` returned (no extra client gate). Complete authorizes server-side.
Parent navigation: Header bell (`SCR-SHELL-003`)
Entry points: Tasks button; window event `openEvoTasks` (no other dispatcher in repo)
Exit points: Close button, dimmer click, footer “Open activities”
Runtime HTTP (owner, simple_mode=true): Not crawled as its own URL. Shared `evoOpenTaskCount: 7`, `evoOpenTasks._list: 7` on dashboard/harness. `/crm/activities` 200 in runtime-index. `[CONFIRMED-BOTH]`
Evidence: `tasks-overlay.tsx`, `HandleInertiaRequests.php` (`evoOpenTasks` query), `ActivityController::complete`, `app-sidebar-header.tsx`.

## 2. Purpose

Glanceable list of open workspace activities (not done), bucketed by due date, with one-click complete and an escape hatch to the Activities room.

## 3. Current UX Summary

Right drawer titled “Tasks” with subtitle `{n} open`. Tabs: Today / Overdue / Upcoming with counts. Rows: checkbox, subject, type, optional due formatted `en-GB` 24h. Empty: “No tasks in this view.” Footer `<a href="/crm/activities">` (full page load, **not** Inertia `Link`).

Default tab is `today` even if that bucket is empty (user must switch). `[CONFIRMED-CODE]`

## 4. Screen Anatomy

`role="dialog" aria-label="Tasks"`. Invisible flex-1 button `aria-label="Close tasks"`. Header Close text button. Tab `nav`. Scrollable list. Footer.

No focus trap, no `aria-modal`, no Escape handler `[CONFIRMED-CODE]`.

## 5. Data Displayed

From share (limit 40, order null due_at last then `due_at`):

- `id`, `type`, `subject` (fallback `'Activity'`), `due_at` ISO8601 or null

Queried but **dropped** in the map: `contact_id`, `deal_id`, `company_id`. Overlay cannot show related records.

Bucketing (`startOfDay` local browser time, not workspace `Africa/Algiers`):

- due day < today → overdue
- same day → today
- future or **missing due_at** → upcoming

Count in header is all open tasks, not the active tab.

## 6. Primary Actions

Complete: checkbox `onChange` → `router.post('/crm/activities/{id}/complete', {}, { preserveScroll: true })`. No optimistic removal; list updates only when Inertia re-shares props after the visit. `[CONFIRMED-CODE]`

## 7. Secondary Actions

Switch tabs. Close. Open activities (full navigation). Cannot create a task here (command “Log activity” / header Create does not include Task).

## 8. Search

NOT PRESENT.

## 9. Filters

Tabs only. No type filter, no owner filter. Shared query is workspace-wide, not “my tasks”.

## 10. Sorting

Server order preserved inside each bucket (due_at nulls last globally before bucketing, so undated tasks appear in Upcoming in that relative order).

## 11. Selection

No multi-select. Checkbox is complete, not select.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Hard cap 40. No “load more”. `now` is memoized on `open` so buckets freeze while the overlay stays open.

## 14. Forms

Checkbox is not a form; Inertia POST only.

## 15. Overlays

This is the overlay. Can sit above the page; stacking vs command palette `[UNVERIFIED]`.

## 16. States

Closed (`null`). Open with rows. Open empty tab. Completing (no local pending UI — checkbox can flicker if the page re-renders).

## 17. Empty State

“No tasks in this view.” If all 7 are upcoming, Today still opens empty.

## 18. Error Handling

Complete 404 if workspace mismatch; 403 if policy denies. Overlay does not display those errors (relies on Inertia error bag / exception page). `[UNVERIFIED]` user-visible failure.

## 19. Feedback

No toast in the overlay. Header bell does not show a numeric badge. Copy is English despite `fr` locale.

## 20. Navigation Behavior

Footer is a raw `<a>` so it may full-reload. Overlay does not close itself after complete. Bell hidden <390px.

## 21. Entity Relationships

Activities may belong to contact/deal/company but IDs are not sent to the client. No links on rows.

## 22. Business Rules

- Open = `done = false` for the workspace, not assignee-specific.
- Complete uses `Activity::markDone()` after `authorize('update')`.
- Due-less tasks are upcoming, never today.
- Timezone is the browser local clock, not `workspace.timezone`.

## 23. Backend Dependencies

`HandleInertiaRequests` closures (run on every Inertia share — not lazy-skipped except when no workspace). `ActivityController::complete`.

## 24. Frontend Dependencies

Inertia `router`/`usePage` only. No design-system drawer.

## 25. Responsive Behavior

`w-full max-w-md` — on small screens the aside still maxes at md but the dimmer button takes leftover space. `[UNVERIFIED]` whether the overlay is usable when the bell is hidden. `NOT VERIFIED` viewport.

## 26. Accessibility Observations

**CONFIRMED:** dialog label; close label; checkbox `aria-label={`Complete ${subject}`}`.

**LIKELY ISSUE:** no focus trap; no Escape; no `aria-modal`; tab buttons lack `aria-selected`; dimmer is a full-height button (good) but focus order may start in the page behind; footer `<a>` vs Inertia.

**REQUIRES MANUAL TEST:** keyboard complete, screen reader tab counts.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| TSK-001 | HIGH | Completing does not remove the row until props refresh; overlay may look stuck | User reclicks | `preserveScroll` only, no local state |
| TSK-002 | MEDIUM | Default tab Today can be empty | Extra click | `useState('today')` |
| TSK-003 | MEDIUM | No related record; IDs stripped | Cannot jump to the deal/contact | share map |
| TSK-004 | MEDIUM | No a11y dialog pattern | Keyboard trap risk | component source |
| TSK-005 | LOW | Footer bypasses Inertia | Loses SPA shell smoothness | `<a href>` |
| TSK-006 | LOW | Timezone vs Africa/Algiers | Wrong bucket near midnight | `new Date()` local |

## 28. Consistency Comparison

Activities index is the full P15 work queue with groups overdue/today/upcoming/completed and a composer. Command Act items deep-link into that queue. This overlay is a thinner, English, cap-40 slice without completed.

## 29. Functional Preservation Contract

- Keep open-task share keys and 40 cap.
- Keep three buckets + complete POST + activities footer.
- Keep `openEvoTasks` listener.
- Keep workspace-wide open query (changing to “mine” would be a product change).

## 30. Design Input Contract

Purpose: clear or inspect open work without leaving the current room.
Primary goal: complete or open the queue.
Primary actions: complete, switch bucket, open activities.
Required information: subject, type, due, counts.
Required components: dialog, tabs, list, checkbox, close.
Required states: empty tab, populated, closed.
Must not remove: complete endpoint, open count, link to `/crm/activities`.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` seed task type mix (only `_item` sample id 6 captured).
- `[UNKNOWN]` `openEvoTasks` intended producer.
- Should complete `router.reload({ only: ['evoOpenTasks','evoOpenTaskCount'] })`? Not implemented.
