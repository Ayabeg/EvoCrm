# Report builder

## 1. Screen Identity

Screen ID: SCR-REPORT-002
Product area: Reports
Route: `/crm/report-builder` (index). Also `/crm/report-builder/cross-object`, `/crm/report-builder/{savedReport}/run`. POST `/crm/report-builder`.
Route names: `crm.report-builder.index`, `crm.report-builder.cross-object`, `crm.report-builder.run`, `crm.report-builder.store`
Frontend file: `resources/js/pages/crm/report-builder.tsx` (single component for all three GETs)
Primary component: `ReportBuilder` Inertia `crm/report-builder`
Layout: `ReportsShell` title/pageTitle “Report builder”. Custom tab active (`href: '/crm/report-builder'` + `activePaths` includes itself and `/reports/funnels`). [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET method-safe (no `reports.manage` on view). POST store requires `reports.manage`. SimpleMode **blocks** path prefix `/crm/report-builder` → 403 including run and cross-object. [CONFIRMED-CODE]
Parent navigation: Reports tab Custom; SimpleMode FULL_NAV item “Report builder”; command palette `nav-report-builder` feature `report_builder` (hidden in simple). [CONFIRMED-CODE]
Entry points: Custom tab, full-mode rail extra, command palette, Reports shell. Funnels uses same Custom tab but different page. [CONFIRMED-CODE]
Exit points: Cross-object link (same component, different URL); Run link; Reports Overview tab. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): `/crm/report-builder` **403**. [CONFIRMED-UI]
Evidence: runtime-index `/crm/report-builder` 403. `SavedReportController`. `SimpleMode::blocks`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Save ad hoc CRM reports (deal/contact count or sum amount, optional group by stage/owner) and run them. Bonus cross-object view: reply rate by wilaya. Not the EvoViz rooms; a separate saved-report primitive used by schedules on SCR-REPORT-001. [CONFIRMED-CODE]

## 3. Current UX Summary

Narrow `max-w-4xl` column: underline link “Cross-object: reply rate by wilaya”; save form (name, entity, metric, group_by); list of saved reports with Run; optional result panel; optional wilaya groups panel. No delete, no filter builder UI despite backend `filters` validation. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Reports tabs (Custom active). [CONFIRMED-CODE]
2. Shell description “Save ad hoc CRM reports with filters and grouping.” [CONFIRMED-CODE]
3. Cross-object link `/crm/report-builder/cross-object`. [CONFIRMED-CODE]
4. POST form bordered card. [CONFIRMED-CODE]
5. Reports list rows. [CONFIRMED-CODE]
6. Result block if `result && activeReport`. [CONFIRMED-CODE]
7. Cross-object block if `crossObject.groups.length`. [CONFIRMED-CODE]

## 5. Data Displayed

Index props: `reports[]` `{id,name,entity,metric,group_by}` latest. [CONFIRMED-CODE]

Run: same list (unmapped models — still passed) + `result` from `ReportBuilder::run` `{ metric, value, groups?[] }` + `activeReport`. [CONFIRMED-CODE]

Cross-object: `crossObject` `{ metric, groups[{label,value,count}] }` via `replyRateByWilaya`. UI: “{label}: {value}% reply rate ({count} sent)”. [CONFIRMED-CODE]

List row: `{name} · {entity} · {metric}` (group_by not shown). [CONFIRMED-CODE]

## 6. Primary Actions

- **Save report** POST `/crm/report-builder` → `back()`. [CONFIRMED-CODE]
- **Run** GET `/crm/report-builder/{id}/run`. [CONFIRMED-CODE]

## 7. Secondary Actions

Cross-object link. Reports tabs (Overview etc.). [CONFIRMED-CODE]

No delete/edit. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT in UI. Store accepts optional `filters` array unused by the form. [CONFIRMED-CODE]

## 10. Sorting

List `latest()` (created). [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT (run is per-row link). [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

All saved reports. Inertia Form/Link. [CONFIRMED-CODE]

## 14. Forms

Save report:

| Field | Control | Rules |
| --- | --- | --- |
| name | Input required placeholder “Report name” | required string max 120 |
| entity | select default deal | `deal` \| `contact` |
| metric | select default count | `count` \| `sum_amount` |
| group_by | select default empty | `` \| `stage` \| `owner` |

POST `crm.report-builder.store` creates `user_id` + workspace `savedReports`. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. [CONFIRMED-CODE]

## 16. States

- Empty reports: form only, empty `map`. [CONFIRMED-CODE]
- After run: result panel. [CONFIRMED-CODE]
- Cross-object: groups panel or hidden. [CONFIRMED-CODE]
- Simple mode 403 all subpaths. [CONFIRMED-UI]
- Run 404 if other workspace. [CONFIRMED-CODE]
- POST 403 without `reports.manage`. [CONFIRMED-CODE]

## 17. Empty State

NOT PRESENT as dedicated copy; empty list is just no rows. Description implies grouping/filters that UI barely supports. [CONFIRMED-CODE]

## 18. Error Handling

Validation 422 not displayed in component. 403 simple mode / permission. 404 wrong workspace on run. `sum_amount` on contacts may fail inside builder — [UNVERIFIED] without reading `ReportBuilder`. [CONFIRMED-CODE]

## 19. Feedback

No toast on save (`back()`). Result panel is the run feedback. [CONFIRMED-CODE]

## 20. Navigation Behavior

Custom tab stays active on run and cross-object (prefix `/crm/report-builder`). Funnels also marks Custom active while this page is not funnels. Save stays on current URL. [CONFIRMED-CODE]

## 21. Entity Relationships

SavedReport owned by user/workspace. ScheduledReport on Reports rooms can reference `saved_report_id`. Cross-object uses outbound/contact geography, not SavedReport. [CONFIRMED-CODE]

## 22. Business Rules

- Entity/metric/group enums enforced server-side. [CONFIRMED-CODE]
- Simple mode hides nav feature and 403s URL. [CONFIRMED-CODE]
- GET index does not require reports.manage; POST does. [CONFIRMED-CODE]
- `group_by` empty string posted — backend `nullable in:stage,owner` (empty may coerce null) [UNVERIFIED]. [CONFIRMED-CODE]

## 23. Backend Dependencies

`SavedReportController`, `SavedReport`, `App\Services\Crm\ReportBuilder`. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`ReportsShell`, `Button`, `Input`, Inertia `Form`/`Link`. [CONFIRMED-CODE]

## 25. Responsive Behavior

`mx-auto max-w-4xl`. Form stacked. Viewport NOT VERIFIED (403). [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: selects have no `<label>` (placeholder/name only). Link underline for cross-object and Run. [CONFIRMED-CODE]
LIKELY ISSUE: unlabeled form controls; h1 sr-only Reports vs pageTitle h2 Report builder. [CONFIRMED-CODE]
REQUIRES MANUAL TEST: 403 page. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-RB-001 | BLOCKER | 403 simple_mode | Custom tab dead | runtime-index [CONFIRMED-UI] |
| UX-RB-002 | HIGH | Description promises filters; no filter UI | Cannot slice reports | form vs validate `filters` [CONFIRMED-CODE] |
| UX-RB-003 | MEDIUM | No delete/rename | List only grows | no destroy route in web.php for saved reports [CONFIRMED-CODE] |
| UX-RB-004 | MEDIUM | No save confirmation | Unclear if POST worked | `back()` no toast [CONFIRMED-CODE] |
| UX-RB-005 | LOW | `group_by` not shown in list | Cannot tell grouping | list JSX [CONFIRMED-CODE] |
| UX-RB-006 | OBSERVATION | Funnels shares Custom tab | Two products one tab | reports-shell [CONFIRMED-CODE] |

## 28. Consistency Comparison

Far more primitive than analytics rooms (no EvoViz, no window). Schedules on SCR-REPORT-001 consume these saved reports. Ads audiences forms are similarly sparse. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: three GET routes + POST store; entity/metric/group enums; run result + groups; cross-object wilaya reply rates; Custom tab activation; simple-mode 403; workspace 404 on run; reports.manage on store.

## 30. Design Input Contract

Purpose: Save and run simple CRM aggregations.
Primary goal: Create a named report and see its value/groups.
Primary actions: Save; Run; open cross-object.
Required information: name, entity, metric, grouping, result, wilaya rates.
Required components: save form, report list, result panel.
Required states: empty list, result, cross-object, 403.
May NOT be removed: POST contract, run URL, cross-object metric.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- `ReportBuilder::run` behavior for contact+sum_amount and empty group_by. [UNVERIFIED]
- Whether saved reports appear in command palette. [UNKNOWN]
