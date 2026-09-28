# Verify email

## 1. Screen Identity

Screen ID: `SCR-AUTH-005`
Product area: Auth
Route: Fortify verification notice (typically `GET /email/verify`); resend `Wayfinder` `send` from `@/routes/verification`; logout link
Route name: Fortify verify-email view
Frontend file: `resources/js/pages/auth/verify-email.tsx`
Primary component: `VerifyEmail`
Layout: AuthScreen title “Email verification”, description “Please verify your email address by clicking on the link we just emailed to you.”
Authentication: **Must be logged in** (unverified). Guest HEAD `/email/verify` **302** `/login`. `[CONFIRMED-UI]`. Owner crawl never hit this page because `email_verified_at` is set.
Permissions: Feature `Features::emailVerification()` enabled. Product routes use middleware `verified`.
Parent navigation: Automatic redirect when hitting `verified` routes with a null `email_verified_at`
Entry points: Post-register; stale session of an unverified user
Exit points: Resend; Log out; clicking the mailed signed URL (not this page)
Runtime HTTP (owner, simple_mode=true): Not in runtime-index (owner is verified). Guest `/email/verify` 302 login.
Evidence: `verify-email.tsx`, `FortifyServiceProvider::verifyEmailView`, `config/fortify.php` features, `routes/web.php` `middleware(['auth','verified',...])`.

## 2. Purpose

Prompt an authenticated but unverified user to confirm their inbox, and allow resending the verification email.

## 3. Current UX Summary

No email field (the address is already on the account). If `status === 'verification-link-sent'`, green AuthStatus with a hard-coded English paragraph. Primary “Resend verification email”. TextLink “Log out”. English-only (no `t()`).

## 4. Screen Anatomy

`Form {...send.form()}` centered. Spinner on processing. Logout uses Wayfinder `logout()` POST via TextLink (same as other Fortify pages).

## 5. Data Displayed

Prop `status?`. Does not show the user’s email address on the card `[CONFIRMED-CODE]`.

## 6. Primary Actions

Resend verification email.

## 7. Secondary Actions

Log out.

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

Button disabled while processing.

## 14. Forms

Empty body POST to Fortify send-notification.

## 15. Overlays

NOT PRESENT.

## 16. States

Default waiting. Status success after resend. Guest redirect. Verified users never stay here (Fortify redirects home).

## 17. Empty State

The whole page is a waiting state.

## 18. Error Handling

No field errors UI. Throttle on resend `[UNVERIFIED]`. Invalid/expired signed links are a different Fortify endpoint.

## 19. Feedback

AuthStatus only for exact `'verification-link-sent'`.

## 20. Navigation Behavior

Dashboard and CRM are behind `verified`, so unverified users bounce here. Auth layout, not AppLayout — no rail.

## 21. Entity Relationships

Current `User.email_verified_at`.

## 22. Business Rules

- Email verification feature on.
- Seed owner is already verified (`dashboard.json`).
- Product is unusable until verified (middleware).

## 23. Backend Dependencies

Fortify email verification, mailer, `verified` middleware.

## 24. Frontend Dependencies

Auth kit, verification send + logout Wayfinder, AuthStatus.

## 25. Responsive Behavior

AuthScreen. `NOT VERIFIED`.

## 26. Accessibility Observations

**CONFIRMED:** Head title, button, logout link.

**LIKELY ISSUE:** English-only; email address not shown so the user cannot confirm *which* inbox; status not `aria-live` beyond Callout.

**REQUIRES MANUAL TEST:** with an unverified user (not in seed crawl).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| AUTH-V-001 | MEDIUM | Email address not displayed | User may resend to the wrong memory of the address | verify-email.tsx |
| AUTH-V-002 | LOW | English copy | Inconsistent with login `t()` | page source |
| AUTH-V-003 | OBSERVATION | Unreachable in owner crawl | `[UNREACHABLE]` for this seed | verified_at set |

## 28. Consistency Comparison

Confirm-password is the other authenticated auth-card (re-auth). Verify is wait-for-mail. Login uses i18n; this does not.

## 29. Functional Preservation Contract

- Keep resend POST and status `'verification-link-sent'`.
- Keep logout.
- Keep verified middleware on the product group.

## 30. Design Input Contract

Purpose: complete email verification.
Primary goal: get the user to click the mailed link.
Primary actions: Resend.
Secondary: Log out.
Required information: status.
Must not remove: Fortify send + logout.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` signed verification URL and what happens if already verified.
- `[UNKNOWN]` throttle copy.
