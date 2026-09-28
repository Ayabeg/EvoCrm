# Playbooks

## 1. Screen Identity

Screen ID: SCR-SET-013
Product area: Settings / CRM
Route: `/settings/playbooks`
Route names: `settings.playbooks` GET; `store` POST; `update` PUT; `destroy` DELETE
Frontend file: `resources/js/pages/settings/playbooks.tsx`
Primary component: `PlaybookSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `adminOnly: true`
- **All routes:** `can-manage-settings`
- EPP **explicitly returns null** for `settings.playbooks*` and `settings.audit*` — mutations do **not** need `settings.integrations` `[CONFIRMED-CODE]`
Parent navigation: Settings IA **CRM**, title **Playbooks**.
Entry points: settings nav.
Exit points: contact/deal hubs show scripts (copy).
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Prop: `playbooks`.
Evidence: `PlaybookController`; `playbooks.tsx`; `EnforceProductPermissions`; runtime-index.

## 2. Purpose

CRUD short call/email scripts attached to contact or deal records.

## 3. Current UX Summary

Create card (name, entity, body) then a list of cards each with update form + delete.

## 4. Screen Anatomy

Header; “New playbook” SettingsCard + save bar; list of Cards or empty; each: name input, hidden entity, textarea, Update, Delete.

## 5. Data Displayed

`playbooks[]`: id, entity contact|deal, name, body (position loaded but unused in UI) `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save playbook; Update; Delete.

## 7. Secondary Actions

Cancel on create save bar.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT. No entity tabs.

## 10. Sorting

Server: entity, position, name `[CONFIRMED-CODE]`. No reorder UI (position auto on create).

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full list. Redirect GET after mutate.

## 14. Forms

name required max 120; entity contact|deal; body required max 4000 `[CONFIRMED-CODE]`. Update cannot change entity (hidden). Delete no confirm.

## 15. Overlays

NOT PRESENT.

## 16. States

Empty `SettingsEmptyState`. Processing on create save bar; update/delete buttons no processing disable except native Form `[UNVERIFIED]`.

## 17. Empty State

“No playbooks yet” + description `[CONFIRMED-CODE]`.

## 18. Error Handling

Validation `[UNVERIFIED]` not shown on create fields (no errors render). 403 members. 404 wrong workspace.

## 19. Feedback

No toasts; redirect `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay on index. **No** `.layout` breadcrumbs `[CONFIRMED-CODE]`.

## 21. Entity Relationships

`Playbook` workspace-scoped. Shown on contact/deal records `[UNVERIFIED]` hub UI.

## 22. Business Rules

- Admin/owner only
- Entity locked after create
- Company/ticket playbooks not supported

## 23. Backend Dependencies

`PlaybookController`, `Playbook` model.

## 24. Frontend Dependencies

Settings chrome empty state, `Card`, `Input`, `Label`.

## 25. Responsive Behavior

Wide pane. Textareas full width `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: create field labels.
LIKELY ISSUE: update inputs unlabeled; delete unlabeled beyond button text.
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-013-01 | MEDIUM | Delete without confirm | Accidental script loss | page |
| SET-013-02 | LOW | Entity not editable later | Must delete/recreate | hidden entity |
| SET-013-03 | LOW | No search | Many scripts hard to scan | page |

## 28. Consistency Comparison

Create uses SettingsCard; list uses generic Card. CRM group.

## 29. Functional Preservation Contract

- Create name/entity/body
- Update name/body
- Delete
- Empty state
- Admin-only; playbooks EPP exception

## 30. Design Input Contract

Purpose: coaching scripts on records.
Primary actions: create, update, delete.
Required information: name, record type, script body.
Required states: empty, list, processing.
Must not remove: contact/deal only; 4000 body cap.

## 31. Open Questions / Unknowns

- `position` used on records? `[UNKNOWN]`
- i18n of scripts `[UNKNOWN]`
