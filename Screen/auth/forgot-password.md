# Forgot password

## 1. Screen Identity

Screen ID: `SCR-AUTH-003`
Product area: Auth
Route: `GET /forgot-password`, `POST` Fortify email broker (`Wayfinder` `email` from `@/routes/password`)
Route name: Fortify request-link view
Frontend file: `resources/js/pages/auth/forgot-password.tsx`
Primary component: `ForgotPassword`
Layout: AuthScreen — title “Forgot password”, description “Enter your email to receive a password reset link”
Authentication: Guest. Owner crawl **302** dashboard. Guest HEAD **200**. `[CONFIRMED-UI]`
Permissions: Feature `Features::resetPasswords()` enabled. Login hides the entry if that feature were off (`canResetPassword`).
Parent navigation: Login “Forgot your password?”
Entry points: `/forgot-password`, login password-row link
Exit points: “Or, return to log in”; after submit stays on page with `status`
Runtime HTTP (owner, simple_mode=true): 302 dashboard. Guest 200.
Evidence: `forgot-password.tsx`, `FortifyServiceProvider::requestPasswordResetLinkView`, `config/fortify.php` features.

## 2. Purpose

Start the password reset broker: email a signed reset link.

## 3. Current UX Summary

Single email field (autocomplete **off**, autofocus). Primary “Email password reset link” `data-test="email-password-reset-link-button"`. Optional success `AuthStatus`. Text link back to login. No Google.

## 4. Screen Anatomy

`Form {...email.form()}`. Grid gap-5. `FieldError` on email. Spinner when processing.

## 5. Data Displayed

Prop `status?` from session. No “if this email exists” copy in the React tree — Fortify typically always shows a generic status `[UNVERIFIED]` exact string.

## 6. Primary Actions

Submit email for reset link.

## 7. Secondary Actions

Return to log in.

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

Button `disabled={processing}`.

## 14. Forms

Email only, type email, placeholder `email@example.com`. **Not** `required` in JSX (unlike login) `[CONFIRMED-CODE]`.

## 15. Overlays

NOT PRESENT.

## 16. States

Idle, processing, error, status success, auth redirect.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

`errors.email`. Invalid email format. Unknown addresses usually still 200 with status (Fortify anti-enumeration) `[UNVERIFIED]`.

## 19. Feedback

Green `Callout` for `status`. Spinner.

## 20. Navigation Behavior

Does not auto-redirect to login after send. Reset link lands on `SCR-AUTH-004`.

## 21. Entity Relationships

Looks up `User` by email via password broker `users`.

## 22. Business Rules

- Reset feature enabled.
- Mail must be configured or the job fails silently to the user `[UNKNOWN]` local mailer.
- Login gate `canResetPassword` matches this feature.

## 23. Backend Dependencies

Fortify password broker, mail, `ResetUserPassword` for the next step.

## 24. Frontend Dependencies

Auth kit, `login` + `password.email` Wayfinder, AuthStatus.

## 25. Responsive Behavior

AuthScreen. `NOT VERIFIED`.

## 26. Accessibility Observations

**CONFIRMED:** label, autofocus.

**LIKELY ISSUE:** email not `required` in HTML; autocomplete off may fight password managers; no `aria-describedby` for status.

**REQUIRES MANUAL TEST:** status announcement.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| AUTH-F-001 | LOW | Email not marked required | Empty submit round-trip | forgot-password.tsx |
| AUTH-F-002 | OBSERVATION | Owner crawl 302 | No authenticated screenshot | runtime-index |

## 28. Consistency Comparison

Thinner than login (no password, no Google). Reset password page shows email read-only + new passwords.

## 29. Functional Preservation Contract

- Keep POST email broker.
- Keep status callout and login link.
- Keep `data-test="email-password-reset-link-button"`.
- Keep feature-flag alignment with login.

## 30. Design Input Contract

Purpose: request a reset email.
Primary goal: send a link.
Primary actions: submit email.
Secondary: back to login.
Required information: email, status, errors.
Must not remove: Fortify broker.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` whether local mail is logged (log driver) or dropped.
- `[UNVERIFIED]` French status string.
