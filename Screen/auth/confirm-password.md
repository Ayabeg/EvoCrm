# Confirm password

## 1. Screen Identity

Screen ID: `SCR-AUTH-007`
Product area: Auth
Route: `GET/POST /user/confirm-password` (Fortify). Wayfinder `store` from `@/routes/password/confirm`
Route name: Fortify confirm-password
Frontend file: `resources/js/pages/auth/confirm-password.tsx`
Primary component: `ConfirmPassword`
Layout: AuthScreen title “Confirm password”, description “This is a secure area of the application. Please confirm your password before continuing.” (English in `layout` object; AuthScreen will `t()` those strings)
Authentication: **Authenticated.** Guest HEAD **302** `/login`. Owner opening Settings Security: **302** from `/settings/security` → `http://127.0.0.1:8000/user/confirm-password`. `[CONFIRMED-BOTH]`
Permissions: Any authenticated user hitting a `RequirePassword` route
Parent navigation: Redirect from password-confirmed pages (Security)
Entry points: `/settings/security` (`routes/settings.php` `RequirePassword`); other Fortify confirmPassword gates (2FA setup uses `confirmPassword => true`)
Exit points: After POST, intended redirect back to the original URL (Fortify). Logout not on this page.
Runtime HTTP (owner, simple_mode=true): `/settings/security` 302 confirm-password. Direct confirm-password not listed as 200 in the crawl (the crawl captured the security redirect, not the follow). Guest confirm 302 login.
Evidence: `confirm-password.tsx`, `FortifyServiceProvider::confirmPasswordView`, `routes/settings.php`, runtime-index security row, `config/fortify.php` 2FA `confirmPassword`.

## 2. Purpose

Re-authenticate with the current password before a sensitive settings action.

## 3. Current UX Summary

Single password field, autofocus, autocomplete current-password, placeholder “Password”. Primary “Confirm password” `data-test="confirm-password-button"` with spinner. Labels/title in English in the page; layout strings go through `t()`.

## 4. Screen Anatomy

`Form {...store.form()} resetOnSuccess={['password']}`. `FieldError` on password. No “forgot password” (user is already in a session).

## 5. Data Displayed

No extra props. User identity is not shown on the card (unlike the product user menu).

## 6. Primary Actions

Submit current password.

## 7. Secondary Actions

Logo home (authenticated home → dashboard, which **escapes** the confirm flow). `[CONFIRMED-CODE]` AuthScreen always links logo to `home()`.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT PRESENT.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Button disabled + spinner while processing.

## 14. Forms

`password` only.

## 15. Overlays

NOT PRESENT. This page replaces the settings pane (full AuthLayout, **not** nested in SettingsLayout) because the component is `auth/confirm-password`.

## 16. States

Idle, processing, `errors.password`, guest redirect, already-confirmed skip `[UNVERIFIED]` timeout window.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

Wrong password → field error. Session expired → login. Throttle `[UNKNOWN]`.

## 19. Feedback

Spinner. No status callout.

## 20. Navigation Behavior

Critical: user leaves the product shell. After success they should return to `/settings/security`. Logo click can dump them on dashboard without confirming.

## 21. Entity Relationships

Confirms the current `User` password; unlocks Security (2FA, password change).

## 22. Business Rules

- Fortify password confirmation timeout applies (framework default, often 3 hours) `[UNVERIFIED]` exact seconds in this app.
- Security is the crawl-proven gate.
- 2FA feature also requires confirmPassword for enable/disable.

## 23. Backend Dependencies

Fortify ConfirmablePasswordController, `RequirePassword` middleware, session.

## 24. Frontend Dependencies

Auth kit, PasswordInput, confirm store Wayfinder. **No `t()` on field label/button** (English).

## 25. Responsive Behavior

AuthScreen. `NOT VERIFIED`.

## 26. Accessibility Observations

**CONFIRMED:** label, autofocus, test id.

**LIKELY ISSUE:** leaving AppLayout loses context of *why* (Security); English field label; logo escape hatch.

**REQUIRES MANUAL TEST:** successful confirm returns to security; timeout expiry.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| AUTH-C-001 | MEDIUM | Full-screen auth card instead of an in-settings modal | Context switch; crawl never rendered security | 302 + AuthLayout |
| AUTH-C-002 | LOW | Logo goes home and abandons confirm | User loses the security task | AuthScreen `home()` |
| AUTH-C-003 | LOW | Mixed i18n | Layout translated, fields not | confirm-password.tsx |

## 28. Consistency Comparison

Login has remember/forgot/Google; this is password-only reauth. Settings security is the destination, not this page.

## 29. Functional Preservation Contract

- Keep POST `/user/confirm-password`.
- Keep `data-test="confirm-password-button"`.
- Keep RequirePassword on security (and 2FA confirmPassword).
- Keep AuthLayout (component prefix `auth/`).

## 30. Design Input Contract

Purpose: step-up authentication.
Primary goal: unlock the intended settings page.
Primary actions: Confirm password.
Required information: password, errors.
Required components: password field, submit.
Required states: error, processing, guest redirect.
Must not remove: Fortify confirm contract.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` confirm timeout configuration.
- `[UNVERIFIED]` other RequirePassword routes besides security.
- Did the crawl follow the 302 to render confirm-password as 200? Not listed as its own path in runtime-index.
