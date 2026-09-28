# Login

## 1. Screen Identity

Screen ID: `SCR-AUTH-001`
Product area: Auth
Route: `GET /login`, `POST /login`
Route name: Fortify `login` (GET), store `POST /login` (Wayfinder `store` from `@/routes/login`)
Frontend file: `resources/js/pages/auth/login.tsx`
Primary component: `Login`
Layout: `AuthLayout` → `AuthScreen` (`resources/js/pages/auth/auth-screen.tsx`) because component name starts with `auth/`
Authentication: Guest. Authenticated owner crawl: **302** `http://127.0.0.1:8000/dashboard`. Unauthenticated HEAD this session: **200** (Inertia document, preloads `login-*.js`). `[CONFIRMED-UI]`
Permissions: Public. Throttle `login` limiter 5/min per email|ip (`FortifyServiceProvider`).
Parent navigation: `/` redirects here when guest (`routes/web.php` `home`)
Entry points: `/`, `/login`, expired session, logout, 2FA/confirm/verify redirects to login when unauthenticated
Exit points: Dashboard on success (`config/fortify.php` `'home' => '/dashboard'`); Register; Forgot password; Google `/auth/google` if enabled
Runtime HTTP (owner, simple_mode=true): 302 dashboard (`Screen/_evidence/runtime-index.json`). Guest 200 `[CONFIRMED-UI]` HEAD `/login`.
Evidence: `login.tsx`, `FortifyServiceProvider::loginView`, `config/fortify.php`, `auth-screen.tsx`, `google-auth-button.tsx`, `routes/web.php`.

## 2. Purpose

Authenticate an existing user with email/password (optional remember) and optionally Google OAuth when configured.

## 3. Current UX Summary

Centered 400px hairline card on `bg-canvas-soft`. Logo + “EvoCrm” link to `home()`. Title “Log in to your account”, description “Enter your email and password below to log in” (from `Login.layout`, translated via `t()`). Optional status callout. Optional Google button + separator “Or continue with email”. Form: email, password (with forgot link if `canResetPassword`), remember me, primary Log in. Footer “Don't have an account? Sign up”.

## 4. Screen Anatomy

`Head` title `Log in`. `AuthStatus` if `status`. `GoogleAuthButton` if `canLoginWithGoogle`. Inertia `Form {...store.form()}` `resetOnSuccess={['password']}`. Fields use `Label` + `Input`/`PasswordInput`/`Checkbox`. Submit `data-test="login-button"` with `Spinner` while processing.

## 5. Data Displayed

Props: `status?`, `canResetPassword` (Fortify `Features::resetPasswords()` — enabled), `canLoginWithGoogle` (`GoogleAuth::enabled()` — client id+secret filled). `[UNKNOWN]` Google flag on this machine; `.env.example` leaves secrets empty; dashboard `integrations.google.connected` is false (mailbox connect ≠ login client).

Shared guest Inertia still includes parent share keys with null user `[UNVERIFIED]` exact guest payload (Inertia 409 without version header).

## 6. Primary Actions

Submit POST `/login` (`email`, `password`, `remember`).

## 7. Secondary Actions

Forgot password (`password.request` → `/forgot-password`) if feature on. Sign up → `/register`. Continue with Google → full-page GET `/auth/google` (not Inertia; comment: extra scopes never requested from this button). Logo → `/` (redirects to login if still guest).

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

`processing` disables submit and shows spinner. Inertia progress bar still global.

## 14. Forms

| Field | Name | Constraints (UI) |
| --- | --- | --- |
| Email | `email` | required, type email, autofocus, autocomplete email, tab 1 |
| Password | `password` | required, current-password, tab 2, reset on success |
| Remember | `remember` | checkbox, tab 3 |

Submit tab 4. Forgot link tab 5 (same as Sign up tab 5 — duplicate tabIndex) `[CONFIRMED-CODE]`.

## 15. Overlays

NOT PRESENT. Password input may have show/hide (component `PasswordInput`).

## 16. States

Guest form. Processing. Field errors (`FieldError`). Status callout (e.g. reset email sent). Google visible/hidden. Authenticated visit redirects away.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

Server validation on `errors.email` / `errors.password`. Rate limit 5/min. Invalid credentials Fortify default. Google routes 404 if OAuth not configured (`GoogleAuth` comment).

## 19. Feedback

Success status via session `status` → green `Callout`. Spinner on submit. No toast on the auth card.

## 20. Navigation Behavior

Authenticated GET `/login` → dashboard (owner crawl). Guest `/` → login. After login → `/dashboard`. Register and forgot are sibling auth pages.

## 21. Entity Relationships

Authenticates `User`; loads `workspace` on subsequent Inertia shares.

## 22. Business Rules

- Username attribute `email`, lowercased (`fortify.lowercase_usernames`).
- Registration and reset features enabled.
- Google login uses the same callback as Gmail/Calendar reconnect but **does not** request extra scopes from this button (`web.php` comment).
- Remember me is Fortify standard.

## 23. Backend Dependencies

Laravel Fortify `AuthenticatedSessionController`, `FortifyServiceProvider` views, `GoogleController@redirect` (guest middleware), session, CSRF.

## 24. Frontend Dependencies

Inertia Form/Head, AuthScreen, GoogleAuthButton, PasswordInput, TextLink, FieldError, Button, Checkbox, Input, Label, Spinner, Wayfinder login/register/password, i18n.

## 25. Responsive Behavior

`[CONFIRMED-CODE]` `min-h-[100dvh]` center, `px-4 sm:px-6`, card `max-w-[400px]`. `NOT VERIFIED` on mobile keyboard.

## 26. Accessibility Observations

**CONFIRMED:** labels, required, autocomplete, Head title, logo sr-only title.

**LIKELY ISSUE:** duplicate tabIndex 5; Google is an `<a>` inside outline Button (leaves Inertia); description not tied via `aria-describedby`.

**REQUIRES MANUAL TEST:** password reveal, SR errors, remember checkbox.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| AUTH-L-001 | LOW | Duplicate tabIndex 5 | Odd tab order | login.tsx |
| AUTH-L-002 | OBSERVATION | Authenticated users never see this in the owner crawl | Documented 302 | runtime-index |
| AUTH-L-003 | LOW | Google hidden unless env secrets | Fine; easy to think Google is missing | `GoogleAuth::enabled` |

## 28. Consistency Comparison

Same AuthScreen as register/forgot/reset/2FA/confirm/verify. Product shell is not used. Public pages use PublicLayout or Blade.

## 29. Functional Preservation Contract

- Keep email/password/remember POST `/login`.
- Keep reset + register links.
- Keep Google as optional outline secondary, not the primary CTA.
- Keep throttle and guest/auth redirects.
- Keep `data-test="login-button"`.

## 30. Design Input Contract

Purpose: sign in.
Primary goal: reach `/dashboard` as the workspace user.
Primary actions: Log in.
Secondary: Google, forgot, sign up.
Required information: email, password, errors, status.
Required components: card, fields, primary button, optional Google.
Required states: error, processing, status, redirected-if-auth.
Must not remove: remember, Fortify POST, seed login path.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` `canLoginWithGoogle` on this local `.env`.
- `[UNVERIFIED]` exact validation copy in `fr`.
- Login was 200 before session (task); reconfirmed guest HEAD 200 vs owner 302.
