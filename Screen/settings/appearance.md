# Appearance settings

## 1. Screen Identity

Screen ID: SCR-SET-003
Product area: Settings / Personal
Route: `/settings/appearance`
Route name: `appearance.edit` (`Route::inertia`)
Frontend file: `resources/js/pages/settings/appearance.tsx`
Primary component: `Appearance`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions: No IA `permission` / `adminOnly` / `ownerOnly`.
Parent navigation: Settings IA **Personal**, scope `ME`, title `Appearance`.
Entry points: settings nav “Appearance”.
Exit points: settings siblings.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Page props are shared shell only (no extra keys).
Evidence: `routes/settings.php`; `appearance.tsx`; `appearance-tabs.tsx`; `hooks/use-appearance.tsx`; runtime-index.

## 2. Purpose

Choose Light / Dark / System Cabinet theme for **this browser**. Not a workspace setting.

## 3. Current UX Summary

Header plus one “Display” card containing `AppearanceTabs` (segmented control) and explanatory copy. No Save button — clicks persist immediately to `localStorage` + cookie.

## 4. Screen Anatomy

1. App + settings chrome
2. `SettingsPageHeader` “Appearance” / “Cabinet for this browser. Light Cabinet is the EvoCrm default.”
3. `SettingsCard` “Display”, description “Applies to this device only.”
4. Tab group Light / Dark / System with Phosphor icons

## 5. Data Displayed

No Inertia page props beyond shell `[CONFIRMED-BOTH]`. Theme from `localStorage` key `appearance` and cookie `[CONFIRMED-CODE]`.

## 6. Primary Actions

Select Light, Dark, or System (`updateAppearance`) `[CONFIRMED-CODE]`. `data-test="appearance-light|dark|system"`.

## 7. Secondary Actions

NOT PRESENT.

## 8. Search

NOT PRESENT on page.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

Exclusive appearance mode (`aria-pressed`) `[CONFIRMED-CODE]`.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

NOT APPLICABLE. Client store + `useSyncExternalStore`.

## 14. Forms

NOT PRESENT. No server POST.

## 15. Overlays

NOT PRESENT.

## 16. States

Pressed tab vs idle. `app.tsx` `initializeTheme()` “Light Cabinet only — strips any stale dark preference on load” `[CONFIRMED-CODE]` — may fight Dark/System until user re-selects `[UNVERIFIED]` interaction.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

NOT APPLICABLE (no server). Storage failures `[UNKNOWN]`.

## 19. Feedback

Visual pressed state only. No toast `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stays on page. Breadcrumbs: “Appearance settings”.

## 21. Entity Relationships

Device preference only. Not stored on User/Workspace.

## 22. Business Rules

- Per-browser
- Values: `light` | `dark` | `system`
- `app.tsx` comment claims Light Cabinet default on load

## 23. Backend Dependencies

Inertia route only — no controller.

## 24. Frontend Dependencies

`AppearanceTabs`, `useAppearance`, settings chrome, `@/routes/appearance`.

## 25. Responsive Behavior

Inline-flex tab group may wrap poorly on very small widths `[NOT VERIFIED]`. Settings chrome as usual `[CONFIRMED-CODE]`.

## 26. Accessibility Observations

CONFIRMED: `role="group"` `aria-label="Appearance"`, `aria-pressed`, icon `aria-hidden`.
LIKELY ISSUE: tabs are `button` not `tablist`/`tab`.
REQUIRES MANUAL TEST: keyboard cycling, dark contrast.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-003-01 | MEDIUM | `initializeTheme()` comment says it strips dark on load | Dark/System may not stick across refresh | `app.tsx` vs `use-appearance.tsx` |
| SET-003-02 | OBSERVATION | No Save affordance | Users used to Save bar on other settings | `appearance.tsx` |

## 28. Consistency Comparison

Personal group, but no `SettingsSaveBar`. Unique client-only persistence.

## 29. Functional Preservation Contract

- Three modes
- Device-only copy
- Immediate apply
- Test IDs on tabs
- Remain ungated beyond auth+verified

## 30. Design Input Contract

Purpose: visual Cabinet for this device.
Primary goal: pick light/dark/system.
Primary action: tab select.
Required information: current mode + Light Cabinet explanation.
Required components: header, display card, three-mode control.
Required states: each mode pressed.
Must not remove: local persistence, Light as product default messaging.

## 31. Open Questions / Unknowns

- Does `initializeTheme` actually reset dark on every load in production? `[UNVERIFIED]`
- Cookie vs localStorage precedence `[UNVERIFIED]` (both written in `use-appearance.tsx`)
