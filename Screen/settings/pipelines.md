# Deal pipelines

## 1. Screen Identity

Screen ID: SCR-SET-009
Product area: Settings / CRM
Route: `/settings/pipelines`
Route names: `settings.pipelines` GET; store/update/destroy pipeline; stages store/update/destroy; `stages.reorder`
Frontend file: `resources/js/pages/settings/pipelines.tsx`
Primary component: `PipelineSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.pipelines'`
- **GET:** `Gate::viewAny` = any user with `workspace_id` `[CONFIRMED-CODE]` (not EPP)
- **Mutations:** `can-manage-settings` middleware **and** `settings.pipelines` (EPP) **and** `PipelinePolicy` `[CONFIRMED-CODE]`
- `canManage` prop = `role->canManageSettings()` (owner/admin)
Parent navigation: Settings IA **CRM**, title **Pipelines**.
Entry points: settings nav “Pipelines”.
Exit points: expand stages; settings siblings. Deal board consumes pipelines (`/crm/deals/board`).
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `pipelines`, `dealProperties`, `canManage`.
Evidence: `PipelineController`; `PipelinePolicy`; `pipelines.tsx`; runtime-index.

## 2. Purpose

Create deal pipelines, set default, edit stages (name, win %, required properties), add/delete empty stages, delete empty non-default pipelines.

## 3. Current UX Summary

Optional “Add pipeline” card if `canManage`, then a card per pipeline with counts and a disclosure “Manage N stages”.

## 4. Screen Anatomy

1. Header “Deal pipelines”
2. Add pipeline form (name, default checkbox)
3. Pipeline cards: name, Default badge, stages_count, deals_count, Delete / Make default
4. Expanded stages: inline patch form, deal count, delete if 0 deals, add stage form

## 5. Data Displayed

Pipeline: id, name, is_default, stages_count, deals_count, stages[].
Stage: id, name, slug, position, probability, is_won, is_lost, deals_count, required_properties.
`dealProperties` catalog keys/labels `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Create pipeline; Make default; Save stage; Add stage; Delete pipeline/stage (when allowed).

## 7. Secondary Actions

Show/hide stages. Cancel none (no save bar).

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Admin index order from `PipelineManager` `[UNVERIFIED]` exact order. Stages by position in manager `[UNVERIFIED]`. **Reorder endpoint exists; no drag UI** `[CONFIRMED-CODE]`.

## 11. Selection

Required-property checkboxes per stage.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full list. Nested forms POST with `_method`.

## 14. Forms

Create pipeline: name required, is_default.
Stage patch: name, probability 0–100, required_properties[] + hidden `required_properties_present`.
Add stage: name, probability.
Make default: patch `is_default=1`.
Delete: POST `_method=delete`.

## 15. Overlays

NOT PRESENT. Deletes have **no confirm** `[CONFIRMED-CODE]`.

## 16. States

`canManage` false: read-only stage names, no add/delete/create.
Cannot delete default or pipelines/stages with deals (`PipelinePolicy::delete`; UI hides delete if deals_count>0).
Empty pipelines array: no empty component — just missing cards `[CONFIRMED-CODE]`.

## 17. Empty State

NOT PRESENT.

## 18. Error Handling

403 policy/capability. Validation `[UNVERIFIED]` not shown in UI. `is_won`/`is_lost` accepted by API but **not in UI** `[CONFIRMED-CODE]`.

## 19. Feedback

No toasts; `back()` `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay on page. Breadcrumbs: Pipelines.

## 21. Entity Relationships

`Pipeline` / `Stage` / deals. `StagePropertyGate` catalog from deal custom attributes. Board and deal create use default pipeline.

## 22. Business Rules

- Default unique (controller clears others)
- Cannot delete default or in-use pipeline
- Cannot delete stage with deals (UI); destroyStage supports `migrate_to_stage_id` unused in UI
- Required properties enforced when moving deals (`StagePropertyGate`) `[UNVERIFIED]` on this screen
- Members with `settings.pipelines` see nav but `canManage` false unless admin/owner — **capability without role cannot mutate** `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`PipelineController`, `PipelineManager`, `StagePropertyGate`, `PipelinePolicy`.

## 24. Frontend Dependencies

`Card`, `Input`, `Label`, `Badge`, `Button`, `Form`.

## 25. Responsive Behavior

Pipeline header `grid-cols-4` may crush on mobile `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`. Wide pane.

## 26. Accessibility Observations

CONFIRMED: labels on add forms.
LIKELY ISSUE: stages toggle is unstyled `button` without `aria-expanded`; 4-col grid.
REQUIRES MANUAL TEST: many nested forms.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-009-01 | MEDIUM | Reorder API without UI | Cannot change stage order in settings | `reorderStages` vs page |
| SET-009-02 | MEDIUM | No delete confirm | Accidental pipeline/stage delete | `pipelines.tsx` |
| SET-009-03 | LOW | No empty state | Blank page if none | page |
| SET-009-04 | OBSERVATION | Member grant `settings.pipelines` shows nav but read-only | Confusing | `canManage` vs IA |

## 28. Consistency Comparison

CRM group. Less chrome than Properties (no SettingsCard). Unique nested stage editor.

## 29. Functional Preservation Contract

- List pipelines + stage disclosure
- Create / default / delete empty non-default
- Stage name, probability, required properties, add, delete empty
- `canManage` read-only mode
- Nav `settings.pipelines`

## 30. Design Input Contract

Purpose: sales board structure.
Primary actions: create pipeline, edit stages, set default.
Required information: name, default, stage counts, deal counts, win %, required fields.
Required states: manage vs view, default locked, in-use locked.
Must not remove: default uniqueness; in-use delete guard; required properties.

## 31. Open Questions / Unknowns

- Stage reorder intended later? `[UNKNOWN]`
- Won/lost flags editable anywhere? `[UNKNOWN]`
