# Security settings

## 1. Screen Identity

Screen ID: SCR-SET-002
Product area: Settings / Personal
Route: `/settings/security`
Route name: `security.edit` (GET), `user-password.update` (PUT `/settings/password`)
Frontend file: `resources/js/pages/settings/security.tsx`
Primary component: `Security`
Layout: `[AppLayout, SettingsLayout]`; not wide (`lg:max-w-[900px]`).
Authentication: `auth` + `verified` + Laravel `RequirePassword` (`password.confirm`).
Permissions: IA destination has no `permission` / `adminOnly` / `ownerOnly`. Any verified user after password confirm.
Parent navigation: Settings IA **Personal**, scope `ME`, title `Security`.
Entry points: settings nav “Security”; after `/user/confirm-password` when session password is stale.
Exit points: settings siblings; 2FA disable/enable Fortify routes; confirm-password screen.
Runtime HTTP (owner, simple_mode=true): **302** → `http://127.0.0.1:8000/user/confirm-password` `[CONFIRMED-UI]`. The security Inertia page was **not rendered** in the crawl.
Evidence: `routes/settings.php`; `SecurityController`; `resources/js/pages/settings/security.tsx`; runtime-index.

## 2. Purpose

Change the login password and manage two-factor authentication for this user.

## 3. Current UX Summary

Two stacked cards: “Update password” (current / new / confirm + save bar) and “Two-factor authentication” (`ManageTwoFactor`). Copy: “Password and two-factor settings for this login.”

## 4. Screen Anatomy

1. App + settings chrome `[CONFIRMED-CODE]`
2. `SettingsPageHeader` “Security”
3. Password `Form` → `SettingsCard` required + `SettingsSaveBar` (`data-test="update-password-button"`)
4. 2FA card: enable/disable, recovery codes, setup modal when Fortify 2FA is enabled

## 5. Data Displayed

Controller props `[CONFIRMED-CODE]`:
- `canManageTwoFactor`
- `passwordRules` (HTML `passwordrules` attribute)
- `twoFactorEnabled`, `requiresConfirmation` when Fortify 2FA is on

Runtime page props: **not observed** (redirect) `[UNVERIFIED]`.

## 6. Primary Actions

- Update password (PUT `user-password.update`, throttle `6,1`) `[CONFIRMED-CODE]`
- Enable / Disable 2FA via Fortify wayfinder `enable`/`disable` `[CONFIRMED-CODE]`

## 7. Secondary Actions

- Cancel/reset password form
- View recovery codes; 2FA setup modal `[CONFIRMED-CODE]`

## 8. Search

NOT PRESENT on page. Settings nav filter only.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Form `processing`; 2FA setup fetches QR/manual key client-side `[CONFIRMED-CODE]`.

## 14. Forms

Password: `current_password`, `password`, `password_confirmation`. `resetOnError` those fields; `resetOnSuccess`; focus first error field. `preserveScroll`.

2FA: Fortify forms, not this controller’s update.

## 15. Overlays

`TwoFactorSetupModal`; password confirm is a **separate screen** (`SCR-AUTH-007`) before this page `[CONFIRMED-CODE]`.

## 16. States

- Password form idle / processing / field errors
- 2FA enabled vs disabled
- `canManageTwoFactor === false` → `ManageTwoFactor` returns `null` (empty 2FA card body) `[CONFIRMED-CODE]`
- RequirePassword redirect when confirmation expired `[CONFIRMED-BOTH]`

## 17. Empty State

NOT APPLICABLE for password. 2FA card can be visually empty if feature flag off.

## 18. Error Handling

Validation errors; throttle 6/minute on password PUT `[CONFIRMED-CODE]`. Confirm-password failures live on the auth screen `[UNVERIFIED]`.

## 19. Feedback

Toast “Password updated.” `[CONFIRMED-CODE]`. 2FA UI copy is inline.

## 20. Navigation Behavior

GET without recent password confirmation 302s to `password.confirm` then intended URL `[CONFIRMED-CODE]`. Breadcrumbs: “Security settings”.

## 21. Entity Relationships

User credentials and Fortify 2FA state. Not workspace-scoped.

## 22. Business Rules

- Must be verified
- Must re-confirm password (session) to view
- Password PUT throttled
- 2FA UI gated by `Features::canManageTwoFactorAuthentication()`

## 23. Backend Dependencies

`SecurityController`, `PasswordUpdateRequest`, `TwoFactorAuthenticationRequest`, Fortify Features, `RequirePassword` middleware.

## 24. Frontend Dependencies

`ManageTwoFactor`, `PasswordInput`, settings chrome, `SecurityController.update.form()`, `@/routes/security`.

## 25. Responsive Behavior

Same settings chrome as Personal pages `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: labeled password fields, `passwordrules`, `aria` on appearance is N/A; 2FA buttons.
LIKELY ISSUE: three password fields with similar autocomplete — standard.
REQUIRES MANUAL TEST: 2FA modal, confirm-password round-trip, SR announcement of toast.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-002-01 | MEDIUM | Every visit 302s to confirm-password in this crawl | Extra step; users may think Security is broken | runtime-index 302 |
| SET-002-02 | LOW | Empty 2FA card if Fortify 2FA off | Header with no controls | `ManageTwoFactor` null return |

## 28. Consistency Comparison

Same card/save-bar pattern as Profile. Unique: password.confirm gate; 2FA.

## 29. Functional Preservation Contract

- Password change with current password
- Throttle
- 2FA enable/disable/recovery when Fortify allows
- password.confirm before view
- Personal nav item remains

## 30. Design Input Contract

Purpose: protect the login.
Primary goal: rotate password; optional 2FA.
Primary actions: Save password; Enable/Disable 2FA.
Required information: current password, new password, confirmation, 2FA status.
Required components: password card, 2FA card, confirm-password gate.
Required states: redirected (unconfirmed), form, 2FA on/off, errors.
Must not remove: current-password check, throttle, Fortify 2FA, confirm middleware.

## 31. Open Questions / Unknowns

- Confirm-password timeout duration in this install `[UNKNOWN]`
- Whether 2FA is enabled in local Fortify config `[UNVERIFIED]` (page never rendered)
