# Workspace general (Simple mode)

## 1. Screen Identity

Screen ID: SCR-SET-004
Product area: Settings / Workspace
Route: `/settings/workspace`
Route name: `settings.workspace` (GET), `settings.workspace.update` (PUT)
Frontend file: `resources/js/pages/settings/workspace.tsx`
Primary component: `WorkspaceSettings`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `ownerOnly: true` `[CONFIRMED-CODE]` (`ia.ts`)
- **GET/PUT:** `can-manage-settings` (owner **or** admin) **plus** controller `abort_unless` role === Owner → **403 for admins** even if they guess the URL `[CONFIRMED-CODE]`
- Mutations also hit `EnforceProductPermissions` → `settings.integrations` (generic `settings.*` fallback) `[CONFIRMED-CODE]`
Parent navigation: Settings IA **Workspace**, scope `WORKSPACE`, title **General**.
Entry points: settings nav “General” (owners only).
Exit points: settings siblings.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Extra prop: `simple_mode`.
Evidence: `WorkspaceSettingsController`; `routes/settings.php`; `ia.ts`; runtime-index.

## 2. Purpose

Owner toggle for workspace `simple_mode`: launch surface vs full product (tickets, ads, warmup, Ask Evo, report builder).

## 3. Current UX Summary

One Preferences card: select “On - Home, Contacts, Deals, Inbox, Quotes” vs “Off - full product”, then Save.

## 4. Screen Anatomy

1. App + settings chrome
2. Header “General” with simple-mode explanation
3. PUT form → `SettingsCard` “Preferences” required + save bar
4. Native `<select id="simple_mode">` values `1` / `0`

## 5. Data Displayed

`simple_mode: boolean` from `workspace.simple_mode` `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save (PUT `/settings/workspace`) `[CONFIRMED-CODE]`.

## 7. Secondary Actions

Cancel/reset on save bar.

## 8. Search

NOT PRESENT on page.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

Single select (boolean encoded as `'1'`/`'0'`).

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Form `processing` on save bar.

## 14. Forms

PUT `simple_mode` required boolean. Laravel `boolean` validation; HTML select strings `'1'`/`'0'` `[CONFIRMED-CODE]`. Redirect GET `settings.workspace`.

## 15. Overlays

NOT PRESENT.

## 16. States

Default from prop. Processing. Validation `[UNVERIFIED]` (single required field). Admin 403 `[CONFIRMED-CODE]` not observed in owner crawl.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

403 owner-only. 403 if missing `settings.integrations` on PUT `[CONFIRMED-CODE]`. No inline error UI for `simple_mode` `[CONFIRMED-CODE]`.

## 19. Feedback

No toast in controller — silent redirect `[CONFIRMED-CODE]`. User must infer save from reload.

## 20. Navigation Behavior

Redirect to same route. Breadcrumbs: “General”. Nav item hidden for non-owners.

## 21. Entity Relationships

`Workspace.simple_mode` drives `SimpleMode::features()` (`sms`, tickets, ads, warmup, report_builder, ask_evo) and `SimpleMode::blocks()` 403s `[CONFIRMED-CODE]`.

## 22. Business Rules

- Owner-only mutate/view (controller)
- Nav ownerOnly
- Admin can-manage-settings middleware would pass, then 403
- Turning off restores full nav/features; on keeps launch rail
- SMS settings nav uses `requiresSmsFeature` which is **off** when simple_mode is on (`features.sms = !$simple_mode`)

## 23. Backend Dependencies

`WorkspaceSettingsController`, `EnsureUserCanManageSettings`, `EnforceProductPermissions`, `WorkspaceRole::Owner`.

## 24. Frontend Dependencies

Settings chrome, Inertia `Form` PUT.

## 25. Responsive Behavior

Standard settings pane `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: label `htmlFor="simple_mode"`, required asterisk.
LIKELY ISSUE: no live confirmation after save.
REQUIRES MANUAL TEST: owner vs admin vs member.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-004-01 | MEDIUM | No success toast | Unclear if save worked | `WorkspaceSettingsController::update` |
| SET-004-02 | LOW | Nav vs URL: admin hidden in nav but middleware is can-manage-settings then 403 | Confusing if linked | controller vs `ia.ts` |
| SET-004-03 | OBSERVATION | PUT gated as `settings.integrations` | Owner without that cap (unusual) cannot save | EPP fallback |

## 28. Consistency Comparison

Same card/save-bar as Qualify/Meetings. Unique owner-only.

## 29. Functional Preservation Contract

- Owner-only GET/PUT
- Boolean simple_mode
- Copy listing blocked surfaces
- Redirect back to General
- Hide nav for non-owners

## 30. Design Input Contract

Purpose: choose launch vs full product.
Primary action: Save simple mode.
Required information: current on/off + consequence copy.
Required components: header, preferences select, save bar.
Required states: on, off, processing, 403.
Must not remove: owner gate; effect on tickets/ads/warmup/Ask Evo/report builder/SMS nav.

## 31. Open Questions / Unknowns

- Should admins read simple_mode even if they cannot write? `[UNKNOWN]` product
- PUT requiring `settings.integrations` intentional? `[UNKNOWN]`
