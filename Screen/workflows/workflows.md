# Automation — workflows index / builder / history

## 1. Screen Identity

Screen ID: SCR-WF-001
Product area: Automation
Route: `GET /crm/workflows` **and** `GET /automation`
Route names: `crm.workflows.index`, `automation`
Frontend file: `resources/js/pages/crm/workflows/index.tsx`
Primary component: `WorkflowsIndex` (`CrmShell` default chrome `room` + `RoomShell` CRM tabs)
Layout: breadcrumbs `{ title: 'Automation', href: '/crm/workflows' }`. `[CONFIRMED-CODE]`
Authentication: authenticated CRM group. Not simple-mode blocked. `[CONFIRMED-CODE]`
Permissions: GET ungated. **All writes** (`store`, `update`, `templates`, `toggle`, `destroy`) require `automation.manage` via `EnforceProductPermissions` (includes name `automation`). UI hides manage controls unless `capabilities.can_manage`. `[CONFIRMED-CODE]`
Parent navigation: Sidebar group Automation → Workflows (`/crm/workflows`, `activePaths: ['/automation']`). Command palette `nav-automation` → `/crm/workflows`. CrmShell tab “Automation”. `[CONFIRMED-CODE]`
Entry points: rail; palette; outbound sequence show link; `/automation`. `[CONFIRMED-CODE]`
Exit points: none to a dedicated show route (editor is a drawer). History uses query `?view=history`. Execution record links to contact/deal/ticket when visible. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/workflows/index` on `/crm/workflows`. `[CONFIRMED-UI]`
Evidence: props `workflows`, `templates`, `stages`, `sequences`, `segments`, `condition_fields`, `members`, `ticket_statuses`, `capabilities`, `view`, `executions`. `[CONFIRMED-UI]`
`/automation` was **not** in `runtime-index.json`. Same controller method as `/crm/workflows` `[CONFIRMED-CODE]`; HTTP `[UNVERIFIED]` on this crawl (expected 200).

## 2. Purpose

Author structured workflows the runner can execute: when / if / then / else. Apply Evo templates. Toggle active (cancels pending delays). Inspect execution history. `[CONFIRMED-CODE]`

## 3. Current UX Summary

Surface “Automation” / “Structured workflows the runner can execute…”. Tabs Workflows | History. Workflows view: Evo templates list + workflow rows (name, trigger, status Draft/On, last modified, Edit / Turn on|off / Delete). Create/Edit drawer with `WorkflowBuilder` + “Review configuration” (does not run). History view: `WorkflowExecutionHistory` (filters, 25 per page). `[CONFIRMED-CODE]` Runtime 200 with templates/executions/view keys. `[CONFIRMED-UI]`

## 4. Screen Anatomy

- `data-workflow="page"`
- `SurfaceHeader` + Create workflow (`data-workflow="create"`) if can_manage and not history
- Nav `aria-label="Automation sections"`
- Templates `HairlinePanel`
- List `data-workflow="list"`
- Drawer `data-workflow="editor-form"` + `data-workflow="review-configuration"`
- History: execution table + inspect drawer `[CONFIRMED-CODE]`

## 5. Data Displayed

Workflow rows: id, name, trigger, trigger_stage, trigger_stage_id, trigger_status, trigger_status_label, trigger_saved_filter_id, action, action_config, condition_*, else_*, active, template_key, delay_minutes, timestamps. `[CONFIRMED-CODE]`
Templates from `EvoWorkflowTemplates::all()` (five starters: new contact task, deal qualified task, new contact enroll, gros deal DZD branch, Alger branch). `[CONFIRMED-CODE]`
`stages` default pipeline; `sequences`; `segments` contact saved filters; `condition_fields`; `members`; `ticket_statuses`; `capabilities.{can_manage,has_mailbox,has_sequences}`; `view` workflows|history; `executions` page (data, paginator, filters, selected, contract). `[CONFIRMED-CODE]`

## 6. Primary Actions

- **Create workflow** opens drawer; POST `/crm/workflows` (new rows `active` false in client payload). `[CONFIRMED-CODE]`
- **Edit** PUT `/crm/workflows/{id}` `[CONFIRMED-CODE]`
- **Use template** POST `/crm/workflows/templates` `{ template_key }` `[CONFIRMED-CODE]`
- **Turn on/off** POST `.../toggle` with confirm; off cancels pending executions `[CONFIRMED-CODE]`
- **Delete** DELETE with confirm (history removed) `[CONFIRMED-CODE]`

## 7. Secondary Actions

- History tab `?view=history`; execution filters `history_workflow_id`, `history_status`, `history_page`, `execution` `[CONFIRMED-CODE]`
- Dirty-close confirm; beforeunload `[CONFIRMED-CODE]`
- Exclusive action lock (`beginExclusiveAction`) `[CONFIRMED-CODE]`

## 8. Search

NOT PRESENT on the workflow list. History has workflow/status filters, not free text. `[CONFIRMED-CODE]`

## 9. Filters

History only: workflow id + execution status. `[CONFIRMED-CODE]`

## 10. Sorting

Workflows `latest('updated_at')`. Executions `latest(run_at)` then id. `[CONFIRMED-CODE]`

## 11. Selection

NOT PRESENT on list. History selects one execution via query. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

Workflows: all rows. Executions: 25 / `history_page`. `mutating` disables buttons. `[CONFIRMED-CODE]`

## 14. Forms

Validated triggers: contact.created, deal.stage_changed, deal.created, enrollment.finished, segment.entered/exited, enrollment.replied, lead.scored, lead.qualified, meeting.booked/no_show, ticket.created/status_changed/sla_breached. `[CONFIRMED-CODE]`

Actions: create_task, enroll_sequence, send_webhook, set_property, assign_owner, create_deal, send_email, notify_user. `[CONFIRMED-CODE]`

Operators: eq, neq, gt, gte, lt, lte, contains, is_set, is_empty. `[CONFIRMED-CODE]`

Delay 0–43200 minutes. Webhook URL required when action send_webhook. Stage required for deal.stage_changed. Saved filter required for segment enter/exit. Client `validateWorkflowDraft` before submit. `[CONFIRMED-CODE]`

## 15. Overlays

Create/Edit `CreateDrawer` sm:max-w-2xl. History inspect drawer. Native `confirm()` for toggle/delete/dirty. `[CONFIRMED-CODE]`

## 16. States

Empty list: “No workflows yet. Use an Evo template or create one.” History empty via `CrmEmptyState` in history component. Saving…; disabled when !can_manage; Draft vs On badges. `[CONFIRMED-CODE]`

## 17. Empty State

See §16. Templates still show when list empty. `[CONFIRMED-CODE]`

## 18. Error Handling

Client field errors + Inertia `page.props.errors`. Stage must belong to default pipeline. `[CONFIRMED-CODE]` `[UNVERIFIED]` server 422 UI

## 19. Feedback

Redirects to index (drops unsaved query). Toggle confirm copy explains pending cancel. Review configuration explicitly does not run. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

`/automation` and `/crm/workflows` same Inertia page. CrmShell Automation tab `match` is **only** `/crm/workflows` (+ prefix) — **`/automation` does not highlight** that tab. Sidebar `activePaths: ['/automation']` does. History links stay on `/crm/workflows?view=history`. `[CONFIRMED-CODE]`

## 21. Entity Relationships

Workflow → Stage, SavedFilter (segment triggers), Sequence, Ticket statuses, members; WorkflowExecution → contact/deal/ticket. `[CONFIRMED-CODE]`

## 22. Business Rules

- Save ≠ enable; create posts `active: false`. `[CONFIRMED-CODE]`
- Toggle off cancels pending delayed runs; does not rewrite completed/failed. `[CONFIRMED-CODE]`
- Delete removes execution history. `[CONFIRMED-CODE]`
- `send_email` / enroll need mailbox/sequences (`capabilities`). `[CONFIRMED-CODE]`
- Simple mode: page allowed; ticket triggers still authored even if tickets 403. `[CONFIRMED-CODE]`
- GET `/automation` does not require `automation.manage`; POST to `/crm/workflows` does. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`WorkflowController`, `Workflow`, `WorkflowExecution`, `EvoWorkflowTemplates`, `WorkflowExecutionPresenter` (+ redactor), `Ticket::statusLabel`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`WorkflowBuilder`, `workflow-authoring.ts`, `WorkflowExecutionHistory`, `workflow-execution.ts`, `CreateDrawer`, `HairlinePanel`, `SurfaceHeader`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

List grid collapses to stacked on small screens; `md:grid-cols-[...]`. Drawer wide. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: section nav `aria-label`; confirm dialogs. `[CONFIRMED-CODE]`
LIKELY ISSUE: template/list action buttons without `aria-busy` while mutating (disabled only). `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: builder field errors, history inspect drawer.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-WF-001 | MEDIUM | Dual URLs; CrmShell tab ignores `/automation` | Wrong tab highlight | crm-shell vs route `[CONFIRMED-CODE]` |
| UX-WF-002 | MEDIUM | No dedicated workflow show URL | Hard to share one workflow | index-only `[CONFIRMED-CODE]` |
| UX-WF-003 | MEDIUM | Ticket-triggered workflows while tickets 403 in simple_mode | Authoring dead paths | SimpleMode vs triggers `[CONFIRMED-CODE]` |
| UX-WF-004 | LOW | Store redirect strips `view=history` | Kick out of history after unrelated save | `redirect()->route('crm.workflows.index')` `[CONFIRMED-CODE]` |
| UX-WF-005 | OBSERVATION | Templates copy still says “EvoSales” | Brand drift | `EvoWorkflowTemplates` `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Not a CRM object list (`CrmListShell`). Closer to settings/tools. History is an in-page mode, not `/crm/workflows/{id}`. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep `/crm/workflows` and `/automation` on the same index.
- Keep template apply, create (draft), edit, toggle (cancel pending), delete.
- Keep when/if/then/else builder + review-does-not-run.
- Keep execution history pagination/filters/redaction.
- Keep `automation.manage` on writes.
- Keep trigger/action/operator enums — do not invent new ones in UI.

## 30. Design Input Contract

Purpose: define and inspect automations.
Primary goal: create or toggle a valid workflow.
Primary actions: Create, Use template, Turn on/off, Save.
Secondary: History inspect, Delete, Edit.
Required information: name, trigger, condition, action, else, delay, active, last modified, execution status.
Required components: templates, list, builder drawer, history table.
Required states: empty, draft, active, mutating, dirty confirm, history empty, cannot manage.
Information priority: name + trigger + on/off → configuration summary → history.
Business-critical: toggle cancel semantics, webhook URL, segment/stage requirements.
Must not remove: review-not-run copy; pending-cancel confirm; history inspectability when Draft.

## 31. Open Questions / Unknowns

- Localhost `/automation` HTTP (not crawled). `[UNVERIFIED]`
- Seeded workflow/template/execution counts. `[UNKNOWN]`
- Owner `can_manage` true on this crawl (owner role) — `[UNVERIFIED]` capabilities value not dumped
- Whether `send_email` is disabled in builder when `!has_mailbox`. `[UNVERIFIED]` (capabilities passed)
