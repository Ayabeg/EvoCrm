# Register

## 1. Screen Identity

Screen ID: `SCR-AUTH-002`
Product area: Auth
Route: `GET /register`, `POST /register`
Route name: Fortify registration (Wayfinder `store` from `@/routes/register`)
Frontend file: `resources/js/pages/auth/register.tsx`
Primary component: `Register`
Layout: `AuthLayout` / `AuthScreen` (`Register.layout` title “Create an account”)
Authentication: Guest. Owner crawl **302** dashboard. Guest HEAD **200** (preload `register-*.js`). `[CONFIRMED-UI]`
Permissions: Public. Feature `Features::registration()` enabled in `config/fortify.php`.
Parent navigation: Login “Sign up”
Entry points: `/register`, login footer
Exit points: On success Fortify home `/dashboard` after `CreateNewUser` provisions a workspace; login link
Runtime HTTP (owner, simple_mode=true): 302 `/dashboard`. Guest 200.
Evidence: `register.tsx`, `app/Actions/Fortify/CreateNewUser.php`, `FortifyServiceProvider::registerView`, `WorkspaceProvisioner`.

## 2. Purpose

Create a user (name, email, password) and provision a workspace named from `config('evosales.company', 'Evotechly')`, then identify analytics `USER_SIGNED_UP`.

## 3. Current UX Summary

Same card chrome. Optional Google with separator “Or register with email”. Fields: name, email, password, confirm password (`passwordrules` attribute from server). Primary “Create account” `data-test="register-user-button"`. Footer “Already have an account? Log in”.

## 4. Screen Anatomy

Inertia `Form {...store.form()}` `resetOnSuccess={['password','password_confirmation']}` `disableWhileProcessing`. `FieldError` per field. Spinner on submit.

## 5. Data Displayed

Props: `passwordRules` string (`Password::defaults()->toPasswordRulesString()`), `canLoginWithGoogle`. No marketing copy beyond layout description “Enter your details below to create your account”.

## 6. Primary Actions

Submit registration POST.

## 7. Secondary Actions

Google (if enabled). Log in link. Logo home.

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

`disableWhileProcessing` + spinner.

## 14. Forms

| Field | UI |
| --- | --- |
| name | required, autofocus, autocomplete name, placeholder Full name |
| email | required, email |
| password | required, new-password, `passwordrules` |
| password_confirmation | required, new-password, `passwordrules` |

Server: `profileRules()` + `passwordRules()` in `CreateNewUser`.

## 15. Overlays

NOT PRESENT.

## 16. States

Processing, field errors, Google on/off, authenticated redirect.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

Per-field errors. Duplicate email `[UNVERIFIED]` copy. Password rule failures. Rate limiting `[UNKNOWN]` beyond Fortify defaults.

## 19. Feedback

Spinner. Analytics identify after create (not user-visible). No success screen — redirect.

## 20. Navigation Behavior

Owner already-in session never sees the form (302). Email verification feature is enabled; whether new users must verify before dashboard depends on `verified` middleware on `/dashboard` — **yes** the product group uses `verified`. Unverified users would hit `SCR-AUTH-005` `[CONFIRMED-CODE]`. Seed owner has `email_verified_at` set.

## 21. Entity Relationships

Creates `User` then `Workspace` via `WorkspaceProvisioner` (user becomes owner of a new tenant). Not an invite-accept flow (invites live in Settings People).

## 22. Business Rules

- Registration feature on.
- Workspace name from config company default Evotechly.
- Passwords hashed via User model cast (not shown in action; `User::create` with password).
- Google register uses same button component.

## 23. Backend Dependencies

Fortify `CreateNewUser`, `WorkspaceProvisioner`, `ProductAnalytics`, Fortify register routes.

## 24. Frontend Dependencies

Same auth kit as login + register Wayfinder.

## 25. Responsive Behavior

Same AuthScreen. `NOT VERIFIED` viewport.

## 26. Accessibility Observations

**CONFIRMED:** labels, required, autocomplete, passwordrules attribute.

**LIKELY ISSUE:** `passwordrules` may be ignored by browsers; confirm field tab 4 / submit 5 / login 6.

**REQUIRES MANUAL TEST:** password manager, French labels.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| AUTH-R-001 | MEDIUM | Public self-serve signup always provisions a **new** workspace, not join-existing | Duplicate tenants if someone meant an invite | `WorkspaceProvisioner` in `CreateNewUser` |
| AUTH-R-002 | OBSERVATION | Authenticated crawl 302 | Form not in owner evidence | runtime-index |

## 28. Consistency Comparison

Login has remember + forgot; register has confirm password + password rules. Both optional Google. People invites are a different path (`settings/people`).

## 29. Functional Preservation Contract

- Keep name/email/password/confirm POST.
- Keep `passwordRules` plumbing.
- Keep workspace provision + analytics identify.
- Keep `data-test="register-user-button"`.
- Keep registration feature flag behavior.

## 30. Design Input Contract

Purpose: create an account.
Primary goal: new user + workspace.
Primary actions: Create account.
Secondary: Google, log in.
Required information: four fields, errors, password rules.
Required components: auth card, Google optional.
Must not remove: confirmation field, provisioner side effect.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` whether registration should be disabled in production Evotechly deployments.
- `[UNVERIFIED]` post-register redirect if email verification is pending.
