# Properties (custom attributes)

## 1. Screen Identity

Screen ID: SCR-SET-008
Product area: Settings / CRM
Route: `/settings/attributes`
Route names: `settings.attributes` GET; `store` POST; `update` PUT; `destroy` DELETE
Frontend file: `resources/js/pages/settings/attributes.tsx`
Primary component: `AttributeSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.attributes'` `[CONFIRMED-CODE]`
- **GET:** EPP skips safe methods — any verified user who knows the URL can **read** `[CONFIRMED-CODE]`
- **POST/PUT/DELETE:** `settings.attributes` `[CONFIRMED-CODE]`
- Defaults: owner/admin true, member false
Parent navigation: Settings IA **CRM**, title **Properties**.
Entry points: settings nav “Properties”.
Exit points: create/edit drawers; settings siblings.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Prop: `definitions`.
Evidence: `CustomAttributeController`; `attributes.tsx`; `EnforceProductPermissions`; runtime-index.

## 2. Purpose

Define workspace custom fields on Contact, Company, and Deal (key, label, type, group, required, list options) and inspect fill rate.

## 3. Current UX Summary

Header + “New attribute”, tables grouped by entity, create drawer, edit drawer with fill-rate bar and delete.

## 4. Screen Anatomy

1. Header “Properties”
2. Per-entity `HairlineTable`: Label (+ required badge), Key, Group, Type, Fill, Edit
3. `CreateDrawer` new definition
4. `CreateDrawer` edit + delete

## 5. Data Displayed

`definitions[]`: id, entity, key, label, type, options, group, required, fill_rate {filled,total,percent} `[CONFIRMED-BOTH]`.

## 6. Primary Actions

New attribute; Save definition; Save changes; Delete.

## 7. Secondary Actions

Cancel drawers; Edit opens drawer.

## 8. Search

NOT PRESENT on definitions.

## 9. Filters

Client groups by entity; hides entity sections with zero items `[CONFIRMED-CODE]`. No filter UI.

## 10. Sorting

Server: entity, group nulls last, group_name, label `[CONFIRMED-CODE]`.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full list. No paginator.

## 14. Forms

Create: entity contact|deal|company, key required alpha_dash, label, group, type text|number|date|list, options if list, required checkbox.
Edit: cannot change entity/key; label/group/type/options/required.
`select` type coerced to `list` `[CONFIRMED-CODE]`.

## 15. Overlays

Two `CreateDrawer`s (create, edit). Delete is in-edit form, **no confirm dialog** `[CONFIRMED-CODE]`.

## 16. States

Empty: “No attributes yet. Start with Contact.”
Processing on submit. Fill-rate bar in edit.

## 17. Empty State

HairlinePanel copy when `byEntity.length === 0` `[CONFIRMED-CODE]`.

## 18. Error Handling

Validation via Inertia errors — **DefinitionForm does not render `errors`** `[CONFIRMED-CODE]` `[BROKEN]` likely silent fail. 403 on mutate without capability. 404 wrong workspace definition.

## 19. Feedback

No toasts in controller; `back()` `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay on page. Breadcrumbs: Properties.

## 21. Entity Relationships

`CustomAttributeDefinition` per workspace. Values on records; fill rates via `CustomAttributes`. Record layouts and pipeline required_properties consume keys.

## 22. Business Rules

- Unique (workspace, entity, key) upsert on create
- Key/entity immutable after create
- Types: text, number, date, list (+ legacy select)
- GET not capability-gated (nav is)

## 23. Backend Dependencies

`CustomAttributeController`, `CustomAttributes`, `CustomAttributeDefinition`.

## 24. Frontend Dependencies

`CreateDrawer`, hairline table, `NativeSelect`, settings header.

## 25. Responsive Behavior

Table `minWidth="36rem"`. Wide pane `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: labels on form fields.
LIKELY ISSUE: no confirm on delete; errors not shown.
REQUIRES MANUAL TEST: drawer focus.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-008-01 | HIGH | Form ignores Inertia `errors` | Invalid key/label fails invisibly | `DefinitionForm` |
| SET-008-02 | MEDIUM | Delete without confirm | Accidental data-model loss | edit drawer |
| SET-008-03 | LOW | GET unguarded | Members can view definitions via URL | EPP safe-method skip |

## 28. Consistency Comparison

Wide table + drawer like Members. CRM group. Unlike Pipelines, no `canManage` prop — UI always shows mutate controls (server 403).

## 29. Functional Preservation Contract

- CRUD definitions
- Entity grouping + fill rate
- List options comma-separated
- Required flag
- Nav gated on `settings.attributes`

## 30. Design Input Contract

Purpose: workspace field dictionary.
Primary actions: New, Edit, Delete.
Required information: entity, key, label, type, group, required, fill.
Required states: empty, per-entity tables, drawers, processing.
Must not remove: immutable keys; contact/company/deal; fill rate.

## 31. Open Questions / Unknowns

- Does deleting a definition delete stored values? `[UNKNOWN]`
- Member GET by URL accepted product-wise? `[UNKNOWN]`
