# Permissions

## 1. Screen Identity

Screen ID: SCR-SET-023
Product area: Settings / Developer
Route: `/settings/permissions`
Route names: `settings.permissions` GET; `settings.permissions.update` PUT
Frontend file: `resources/js/pages/settings/permissions.tsx`
Primary component: `PermissionsSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `adminOnly: true` (owner **and** admin see it)
- **GET:** controller `abort_unless canManageSettings()` (owner/admin) — **not** `can-manage-settings` middleware on this route (web.php outer group) `[CONFIRMED-CODE]`
- **PUT:** EPP `settings.permissions` + controller `canPermission('settings.permissions')` + target must be **member** role
- Capability default: **owner true, admin false, member false** (`config/permissions.php`)
- `canManage` prop = `settings.permissions` — **admins can open the page but cannot save grants** `[CONFIRMED-CODE]`
Parent navigation: Settings IA **Developer**, title **Permissions**.
Entry points: settings nav (owner/admin).
Exit points: settings siblings.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `matrix`, `members`, `canManage`.
Evidence: `PermissionsController`; `permissions.tsx`; `config/permissions.php`; runtime-index.

## 2. Purpose

Show role-default capability matrix and let owners grant extra capabilities to **member** users.

## 3. Current UX Summary

Read-only matrix table (Owner/Admin/Member Yes/—) then member list with `<details>` checkboxes for capabilities that members do not get by default.

## 4. Screen Anatomy

Header; matrix table; “Member overrides” list: name, email, role badge; member details+form; non-members note “Role defaults apply”.

## 5. Data Displayed

`matrix[]` key, label, owner, admin, member booleans from config. `members[]` id, name, email, role, permissions[]. `canManage` `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save grants (PUT) for members.

## 7. Secondary Actions

Open/close details. Checkboxes.

## 8. Search

NOT PRESENT.

## 9. Filters

Only capabilities with `!row.member` are grantable `[CONFIRMED-CODE]`.

## 10. Sorting

Matrix = config order. Members by name `[CONFIRMED-CODE]`.

## 11. Selection

Multi-check `permissions[]`.

## 12. Bulk Actions

NOT PRESENT (per member save).

## 13. Pagination / Loading Strategy

Full lists. Processing disables save.

## 14. Forms

PUT `/settings/permissions/{id}` permissions array subset of configured keys. 422 if target not member.

## 15. Overlays

NOT PRESENT (`details/summary` disclosure).

## 16. States

canManage false disables checkboxes/save. Empty members `[UNVERIFIED]`. Owner/admin rows not editable.

## 17. Empty State

NOT PRESENT for zero members.

## 18. Error Handling

403 missing capability; 404 wrong workspace; 422 non-member `[CONFIRMED-CODE]`. No field errors UI.

## 19. Feedback

No toast; audit `permissions.updated` `[CONFIRMED-CODE]`. `back()`.

## 20. Navigation Behavior

Stay. Breadcrumbs: Settings → Permissions.

## 21. Entity Relationships

`User.permissions` JSON vs role defaults. Enforced by `canPermission` / EPP across product. Audit trail.

## 22. Business Rules

- Role defaults from config (not editable here)
- Only extra grants on members
- Owner typically unique holder of `settings.permissions`
- Admins see matrix but cannot grant (unless given the cap — cannot, they are not members)
- Matrix includes crm.*, desk.manage, reports.manage, automation.manage, ads.manage, outbound.manage, settings.integrations/people/pipelines/attributes/permissions

## 23. Backend Dependencies

`PermissionsController`, `config/permissions.php`, `AuditLogger`.

## 24. Frontend Dependencies

Settings header, Card table, Badge, details/summary.

## 25. Responsive Behavior

Wide pane; grant grid `sm:grid-cols-2`; matrix may overflow `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: summary keyboardable.
LIKELY ISSUE: matrix “Yes”/“—” not announced as headers scope; checkboxes tiny.
REQUIRES MANUAL TEST: admin vs owner.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-023-01 | MEDIUM | Admin nav item with no save | Looks broken | adminOnly vs settings.permissions default |
| SET-023-02 | LOW | No success toast | Unclear save | controller |
| SET-023-03 | OBSERVATION | Cannot grant to admins | Admins stuck on role defaults | abort member only |

## 28. Consistency Comparison

Developer group. Table like Audit. Unique matrix.

## 29. Functional Preservation Contract

- Role default matrix
- Member extra grants
- Owner-only save (capability)
- Audit on update
- Disabled UI when cannot manage
- Admin can view

## 30. Design Input Contract

Purpose: explain and extend member capabilities.
Primary action: Save grants.
Required information: capability labels, role defaults, per-member checks.
Required states: owner editor, admin read-only, member rows, processing.
Must not remove: member-only edits; server enforcement; config-driven matrix.

## 31. Open Questions / Unknowns

- Should admins be hidden from nav? `[UNKNOWN]`
- Interaction with People role change (grants persist?) `[UNVERIFIED]`
