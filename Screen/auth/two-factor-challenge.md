# Two-factor challenge

## 1. Screen Identity

Screen ID: `SCR-AUTH-006`
Product area: Auth
Route: Fortify challenge (typically `GET/POST /two-factor-challenge`). Wayfinder `store` from `@/routes/two-factor/login`
Route name: Fortify two-factor login
Frontend file: `resources/js/pages/auth/two-factor-challenge.tsx`
Primary component: `TwoFactorChallenge`
Layout: AuthScreen; title/description **swap** via `setLayoutProps` between authentication-code and recovery-code modes
Authentication: Intermediate Fortify login session (`login.id`). Guest without that session: HEAD `/two-factor-challenge` **302** `/login`. `[CONFIRMED-UI]`. Owner seed `two_factor_confirmed_at: null` so this is skipped after password.
Permissions: Feature `Features::twoFactorAuthentication(['confirm'=>true,'confirmPassword'=>true])` enabled. Challenge limiter `two-factor` 5/min by `login.id`.
Parent navigation: Automatic after password when 2FA is confirmed
Entry points: Login POST when user has 2FA
Exit points: Continue → dashboard; toggle recovery mode (stays on page)
Runtime HTTP (owner, simple_mode=true): Not in runtime-index. Guest 302 login. Owner 2FA not enabled.
Evidence: `two-factor-challenge.tsx`, `FortifyServiceProvider` challenge view + rate limiter, `config/fortify.php`, `OTP_MAX_LENGTH = 6`.

## 2. Purpose

Finish login with a TOTP code or a one-time recovery code.

## 3. Current UX Summary

Default: 6-digit `InputOTP` (`REGEXP_ONLY_DIGITS`), errors on `code`. Submit “Continue”. Footer “or you can login using a recovery code”.

Recovery mode: text `recovery_code`, description about emergency codes, toggle back to authentication code. `resetOnError`; `resetOnSuccess={!showRecoveryInput}`.

English-only. Dynamic layout title/description.

## 4. Screen Anatomy

Single Form `store.form()`. Toggle is a `<button type="button">` styled as a brand underline, not a link.

## 5. Data Displayed

No user email/name on the card. No remaining-attempt count. OTP length 6.

## 6. Primary Actions

Submit code or recovery code.

## 7. Secondary Actions

Toggle recovery vs TOTP (clears errors and local `code` state).

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT PRESENT.

## 11. Selection

OTP slots.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

OTP `disabled={processing}`. Continue disabled while processing.

## 14. Forms

Mode A: `code` (6 digits). Mode B: `recovery_code` required text. Never both.

## 15. Overlays

NOT PRESENT.

## 16. States

TOTP vs recovery. Processing. Field errors. Missing challenge session → login redirect. 2FA not confirmed → page never shown.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

`errors.code` / `errors.recovery_code`. Rate limit 5/min. `resetOnError` clears fields after failed attempt `[CONFIRMED-CODE]`.

## 19. Feedback

No attempt counter. Spinner not used (unlike login) — only disabled button `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Must not be bookmarkable without the login.id session. After success, Fortify home `/dashboard`.

## 21. Entity Relationships

User 2FA secret / recovery codes configured under Settings Security (`SCR-SET-002`), which itself requires confirm-password.

## 22. Business Rules

- 2FA feature on with confirm + confirmPassword.
- Recovery codes are single-use (Fortify).
- Seed owner has `two_factor_confirmed_at: null`.

## 23. Backend Dependencies

Fortify 2FA challenge controller, session `login.id`, rate limiter.

## 24. Frontend Dependencies

InputOTP, Input, Button, FieldError, `setLayoutProps`, two-factor login Wayfinder.

## 25. Responsive Behavior

OTP centered. `NOT VERIFIED` mobile autocomplete `one-time-code` — **not set** on InputOTP `[CONFIRMED-CODE]`.

## 26. Accessibility Observations

**CONFIRMED:** Head title “Two-factor authentication”; layout description updates.

**LIKELY ISSUE:** OTP may lack an explicit `<label>`; no autocomplete=one-time-code; no spinner; English-only; toggle is a text button.

**REQUIRES MANUAL TEST:** actual 2FA user (not in crawl).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| AUTH-2-001 | HIGH | Unreachable for seed owner | Cannot QA in this crawl | `two_factor_confirmed_at` null; guest 302 |
| AUTH-2-002 | MEDIUM | No `autocomplete="one-time-code"` | SMS/password-manager OTP harder | two-factor-challenge.tsx |
| AUTH-2-003 | LOW | No spinner on Continue | Weaker pending state vs login | missing Spinner |

## 28. Consistency Comparison

Confirm-password is a single password field with spinner and test id. This page is OTP-centric. Security settings is where 2FA is turned on (password-gated).

## 29. Functional Preservation Contract

- Keep TOTP 6-digit + recovery toggle.
- Keep Fortify store POST and 5/min limiter.
- Keep layout title/description swap.
- Keep `resetOnError` behavior.

## 30. Design Input Contract

Purpose: second factor.
Primary goal: submit a valid code.
Primary actions: Continue, toggle recovery.
Required information: code or recovery code, errors.
Required components: OTP, recovery input, continue.
Required states: two modes, error, processing, redirect-if-no-challenge.
Must not remove: recovery path.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` recovery code formatting (spaces).
- `[UNKNOWN]` whether confirm-2FA during setup uses this same page (usually not).
