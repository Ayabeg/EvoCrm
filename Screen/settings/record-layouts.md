# Record layouts

## 1. Screen Identity

Screen ID: SCR-SET-012
Product area: Settings / CRM
Route: `/settings/record-layouts`
Route name: `settings.record-layouts` GET
Frontend file: `resources/js/pages/settings/record-layouts.tsx`
Primary component: `RecordLayoutsSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.attributes'` **and** `adminOnly: true`
- **GET:** `can-manage-settings` + controller `abort_unless canManageSettings` `[CONFIRMED-CODE]`
- Saving workspace default uses CRM record-layout APIs (`RecordLayoutController`) which EPP maps `crm.record-layouts*` → `settings.attributes` `[CONFIRMED-CODE]`
Parent navigation: Settings IA **CRM**, title **Record layouts**.
Entry points: settings nav.
Exit points: entity tabs; customize editor; settings siblings.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Prop: `layouts`.
Evidence: `RecordLayoutSettingsController`; `record-layouts.tsx`; runtime-index.

## 2. Purpose

Set workspace-default card order/visibility for contact, company, and deal record hubs. Personal layouts still override (`RecordLayoutProvider` mode `workspace`).

## 3. Current UX Summary

Entity tab strip (Contacts / Companies / Deals), then shared record-layout editor + “Save as workspace default”.

## 4. Screen Anatomy

1. Header
2. Client tabs (not URL)
3. `RecordLayoutCustomizeButton`
4. Save as workspace default
5. `RecordLayoutEditor`
6. Helper copy about personal overrides

## 5. Data Displayed

`layouts` Record keyed by `contact|company|deal` of `RecordLayoutState | null` (workspace default rows `user_id` null, `is_workspace_default`) `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save as workspace default; customize (editor).

## 7. Secondary Actions

Switch entity tab.

## 8. Search

NOT PRESENT (editor internals `[UNVERIFIED]`).

## 9. Filters

Entity tab filter.

## 10. Sorting

Card order is the layout (editor). Tab order fixed Contacts, Companies, Deals.

## 11. Selection

Entity tab; editor card visibility `[UNVERIFIED]` details.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

`savingDefault` disables save button. Editor `key={entity}` remounts provider.

## 14. Forms

No page-level form. Save goes through `useRecordLayoutContext().saveWorkspaceDefault()` `[CONFIRMED-CODE]`.

## 15. Overlays

Possibly customize UI from `RecordLayoutEditor` `[UNVERIFIED]` (shared CRM overlay).

## 16. States

Null seed layout (no default yet). Saving… label. Tab selected style.

## 17. Empty State

NOT PRESENT as dedicated; editor handles empty seed `[UNVERIFIED]`.

## 18. Error Handling

403 members. Save errors `[UNKNOWN]` in context.

## 19. Feedback

Button label Saving… `[CONFIRMED-CODE]`. Toast `[UNKNOWN]`.

## 20. Navigation Behavior

Client-only entity switch (no query). Breadcrumbs: Record layouts.

## 21. Entity Relationships

`RecordLayout` workspace defaults. Personal layouts on records. Custom attributes appear as cards `[UNVERIFIED]`.

## 22. Business Rules

- Admin/owner GET
- Defaults apply to members **without** a personal layout (copy)
- Nav also needs `settings.attributes`

## 23. Backend Dependencies

`RecordLayoutSettingsController`, `RecordLayout` model, CRM `RecordLayoutController` for writes.

## 24. Frontend Dependencies

`RecordLayoutProvider`, `RecordLayoutEditor`, `RecordLayoutCustomizeButton`, `cn` tabs.

## 25. Responsive Behavior

Tab buttons wrap `flex`. Wide pane `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: none of the tabs have `aria-selected`/`role=tab` `[CONFIRMED-CODE]` LIKELY ISSUE.
REQUIRES MANUAL TEST: editor keyboard reorder.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-012-01 | MEDIUM | Entity not in URL | Refresh loses tab | `useState('contact')` |
| SET-012-02 | LOW | Tabs not a tablist | A11y | `record-layouts.tsx` |

## 28. Consistency Comparison

Reuses CRM hub editor rather than SettingsCard forms. Unique in CRM settings.

## 29. Functional Preservation Contract

- Three entities
- Workspace default save
- Personal-override copy
- Admin + settings.attributes nav
- Shared editor behavior with record hubs

## 30. Design Input Contract

Purpose: org-wide record hub layout.
Primary action: Save as workspace default.
Secondary: customize cards; switch entity.
Required information: current default layout per entity.
Required states: contact/company/deal, saving, no default.
Must not remove: mode=workspace; override semantics.

## 31. Open Questions / Unknowns

- Exact editor capabilities (hide/reorder/required) `[UNVERIFIED]` — see record-layout-editor
- Ticket layouts? Not in ENTITIES `[CONFIRMED-CODE]`
