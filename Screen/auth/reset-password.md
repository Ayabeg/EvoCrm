# Reset password

## 1. Screen Identity

Screen ID: `SCR-AUTH-004`
Product area: Auth
Route: `GET /reset-password/{token}`, `POST` Fortify update (`Wayfinder` `update` from `@/routes/password`)
Route name: Fortify reset view
Frontend file: `resources/js/pages/auth/reset-password.tsx`
Primary component: `ResetPassword`
Layout: AuthScreen title “Reset password”, description “Please enter your new password below”
Authentication: Guest with a token. Authenticated owner would typically still be redirected away from Fortify guest middleware `[UNVERIFIED]` for this path. Guest HEAD `/reset-password/fake` **200** (preload `reset-password-*.js`) even with a fake token — token is validated on POST, not GET. `[CONFIRMED-UI]`
Permissions: Reset feature enabled
Parent navigation: Email link from forgot-password
Entry points: Signed/reset URL with `token` + `email` query
Exit points: After success → Fortify home `/dashboard` (then login if the session is not created — Fortify usually logs in) `[UNVERIFIED]`
Runtime HTTP (owner, simple_mode=true): Not in runtime-index. Guest fake token GET 200.
Evidence: `reset-password.tsx`, `FortifyServiceProvider::resetPasswordView`, `ResetUserPassword` action.

## 2. Purpose

Set a new password using the broker token.

## 3. Current UX Summary

Email field **read-only** (value from props). Password + confirm with `passwordrules`. Primary “Reset password” `data-test="reset-password-button"`. Form `transform` injects `token` and `email` into the payload. Resets password fields on success.

## 4. Screen Anatomy

`Form {...update.form()}`. Labels Email / Password / Confirm password (English hard-coded, not `t()`). `[CONFIRMED-CODE]`

## 5. Data Displayed

Props: `token`, `email`, `passwordRules`. Email visible but not editable.

## 6. Primary Actions

Submit new password.

## 7. Secondary Actions

None (no login link on this page). Logo still goes `home()`.

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

Submit disabled while processing + spinner.

## 14. Forms

Hidden-via-transform: `token`, `email`. Visible: read-only email, password, password_confirmation. Autocomplete new-password.

## 15. Overlays

NOT PRESENT.

## 16. States

Processing, field errors (email/password/confirmation), invalid token on POST `[UNVERIFIED]` UI.

## 17. Empty State

NOT APPLICABLE. Fake token still renders the form.

## 18. Error Handling

`errors.email`, `errors.password`, `errors.password_confirmation`. Expired/invalid token typically errors on email/token `[UNVERIFIED]`.

## 19. Feedback

Spinner. No status callout (unlike forgot).

## 20. Navigation Behavior

GET with any token string renders. User is expected to arrive from mail. No in-app link.

## 21. Entity Relationships

Updates `User.password` via `ResetUserPassword`.

## 22. Business Rules

- Token in route, email from query/prop, both posted.
- Password rules same as register.
- Email cannot be changed on this screen (prevents hijack of the token to another inbox in the UI; server still validates pairing).

## 23. Backend Dependencies

Fortify reset, password broker, `ResetUserPassword`.

## 24. Frontend Dependencies

Auth kit, PasswordInput, password update Wayfinder.

## 25. Responsive Behavior

AuthScreen. `NOT VERIFIED`.

## 26. Accessibility Observations

**CONFIRMED:** labels, read-only email, autofocus password.

**LIKELY ISSUE:** English-only strings vs `fr` chrome; read-only email may still be tabbable; no `t()` unlike login.

**REQUIRES MANUAL TEST:** expired token message.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| AUTH-Z-001 | MEDIUM | Copy not passed through `t()` | French workspace sees English | reset-password.tsx |
| AUTH-Z-002 | LOW | GET does not validate token | Fake URLs look real | HEAD `/reset-password/fake` 200 |
| AUTH-Z-003 | LOW | No login link if the user landed here by mistake | Dead-end except logo | page source |

## 28. Consistency Comparison

Register uses `t()` and Google; this page is English-only and token-specific. Confirm-password is a similar password-only card but for authenticated users.

## 29. Functional Preservation Contract

- Keep token+email transform POST.
- Keep read-only email.
- Keep password rules + confirmation.
- Keep `data-test="reset-password-button"`.

## 30. Design Input Contract

Purpose: finish reset.
Primary goal: set password and enter the app.
Primary actions: Reset password.
Required information: email, new password, errors.
Must not remove: token plumbing.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` whether successful reset signs the user in.
- `[UNKNOWN]` mail template URL shape (query vs path email).
