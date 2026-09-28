# Qualification (lead score thresholds)

## 1. Screen Identity

Screen ID: SCR-SET-010
Product area: Settings / CRM
Route: `/settings/qualify`
Route names: `settings.qualify` GET, `settings.qualify.update` PUT
Frontend file: `resources/js/pages/settings/qualify.tsx`
Primary component: `QualifySettings`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `adminOnly: true`
- **GET/PUT:** `can-manage-settings` + EPP
- PUT EPP maps `settings.qualify*` → **`settings.integrations`** (generic `settings.` prefix) `[CONFIRMED-CODE]`
- `canManage` prop = `role->canManageSettings()`; fields disabled and save bar omitted if false (should not happen if middleware holds)
Parent navigation: Settings IA **CRM**, title **Qualification**.
Entry points: settings nav “Qualification”.
Exit points: settings siblings; lead convert path (copy).
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `thresholds`, `canManage`.
Evidence: `LeadScoreSettingsController`; `qualify.tsx`; runtime-index.

## 2. Purpose

Set numeric lead-score thresholds: Hold, Qualify, Convert (0–100), ordered hold ≤ qualify ≤ convert.

## 3. Current UX Summary

One required card with three number inputs and explanatory footer copy.

## 4. Screen Anatomy

Header “Qualification”; form card “Score thresholds”; Hold / Qualify / Convert; mute explanation; Save thresholds.

## 5. Data Displayed

`thresholds.hold|qualify|convert`; `canManage` `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save thresholds (PUT).

## 7. Secondary Actions

Cancel/reset.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Form processing on save bar when `canManage`.

## 14. Forms

Integers 0–100. Server `abort_if` hold > qualify or qualify > convert with 422 message `[CONFIRMED-CODE]`. Inputs have no `errors` binding `[CONFIRMED-CODE]`.

## 15. Overlays

NOT PRESENT.

## 16. States

Editable vs disabled. Processing.

## 17. Empty State

NOT APPLICABLE (workspace always has thresholds method) `[UNVERIFIED]` defaults.

## 18. Error Handling

422 order rule may surface as Inertia error page, not field errors `[UNVERIFIED]`. 403 non-admin.

## 19. Feedback

No toast; `back()` `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay on page. **No** `.layout` breadcrumbs `[CONFIRMED-CODE]`.

## 21. Entity Relationships

`Workspace.lead_score_settings`. Lead records / convert path (copy).

## 22. Business Rules

- Owner/admin only
- Ordered thresholds
- Crossing qualify marks lead; convert uses existing convert path (copy)

## 23. Backend Dependencies

`LeadScoreSettingsController`, workspace `leadScoreThresholds()`.

## 24. Frontend Dependencies

Settings chrome, `Input`.

## 25. Responsive Behavior

Standard form rows `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: labeled required inputs.
LIKELY ISSUE: 422 order errors not in-field.
REQUIRES MANUAL TEST: disabled fields for hypothetical canManage false.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-010-01 | MEDIUM | Order validation not shown in form | User may not know hold≤qualify≤convert failed | controller vs page |
| SET-010-02 | OBSERVATION | PUT requires `settings.integrations` | Odd coupling | EPP |
| SET-010-03 | LOW | No breadcrumbs | Weaker wayfinding | page |

## 28. Consistency Comparison

Same card pattern as General. CRM group.

## 29. Functional Preservation Contract

- Three thresholds 0–100
- Order rule
- Admin-only
- Copy describing hold/qualify/convert effects

## 30. Design Input Contract

Purpose: score gates for lead lifecycle.
Primary action: Save thresholds.
Required information: three numbers + meaning.
Required states: default, disabled, validation.
Must not remove: ordering constraint.

## 31. Open Questions / Unknowns

- Default threshold values `[UNVERIFIED]`
- Formula that produces the score `[UNKNOWN]` on this screen
