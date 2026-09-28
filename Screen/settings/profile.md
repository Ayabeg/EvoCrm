# Profile settings

## 1. Screen Identity

Screen ID: SCR-SET-001
Product area: Settings / Personal
Route: `/settings/profile`
Route name: `profile.edit` (GET), `profile.update` (PATCH), `profile.destroy` (DELETE)
Frontend file: `resources/js/pages/settings/profile.tsx`
Primary component: `Profile`
Layout: `[AppLayout, SettingsLayout]` for any `settings/*` Inertia page (`resources/js/app.tsx`). Settings pane is **not** in `WIDE_SETTINGS_COMPONENTS` (`lg:max-w-[900px]`).
Authentication: GET/PATCH `auth`. DELETE `auth` + `verified`.
Permissions: No capability, `ownerOnly`, or `adminOnly` on the IA destination. Any signed-in user.
Parent navigation: Settings IA group **Personal**, scope `ME`, title `Profile`. Sidebar Settings leaf `/settings` 302s here.
Entry points: `/settings` redirect; settings nav “Profile”; AppLayout sidebar Settings (`resources/js/components/app-sidebar.tsx`); command palette `/settings`.
Exit points: Settings nav siblings; Delete account success → `/`; sidebar CRM destinations.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]` (`Screen/_evidence/runtime-index.json`). `/settings` **302** → `/settings/profile`.
Evidence: `resources/js/lib/settings/ia.ts`; `routes/settings.php`; `app/Http/Controllers/Settings/ProfileController.php`; runtime-index.

## 2. Purpose

Let the signed-in user change their display name and email, re-send email verification, and permanently delete their user account.

## 3. Current UX Summary

Single-column settings pane: page header, “Personal information” card with name/email + Save bar, then a “Delete account” card wrapping `DeleteUser`. Copy is first-person account, not workspace.

## 4. Screen Anatomy

1. App shell (sidebar + header) `[CONFIRMED-CODE]`
2. Settings chrome: title “Settings”, filter search, grouped nav (desktop) / select (lg:hidden) `[CONFIRMED-CODE]`
3. Pane: `SettingsPageHeader` title “Profile”, description “Name and email for this EvoCrm login.” `[CONFIRMED-CODE]`
4. Card “Personal information” (`required` badge): Name, Email, optional unverified-email block, Save/Cancel bar (`data-test="update-profile-button"`)
5. Card “Delete account”: warning + destructive dialog

## 5. Data Displayed

- `auth.user.name`, `auth.user.email`, `auth.user.email_verified_at` `[CONFIRMED-CODE]`
- Page props: `mustVerifyEmail`, `status` `[CONFIRMED-BOTH]` (runtime keys include both)
- Unverified copy + “Re-send the verification email” when `mustVerifyEmail && email_verified_at === null`

## 6. Primary Actions

- Save profile (PATCH `profile.update`) `[CONFIRMED-CODE]`
- Delete account (DELETE `profile.destroy` after password confirm in dialog) `[CONFIRMED-CODE]`

## 7. Secondary Actions

- Cancel/reset on Save bar (`type="reset"`) `[CONFIRMED-CODE]`
- Re-send verification (`verification.send`) `[CONFIRMED-CODE]`

## 8. Search

NOT PRESENT on the page. Settings **nav** filter (`data-settings="search"`) filters destinations only `[CONFIRMED-CODE]`.

## 9. Filters

NOT PRESENT (page). Nav filter only.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

NOT PRESENT. Inertia Form `processing` disables Save `[CONFIRMED-CODE]`.

## 14. Forms

**Profile** — PATCH via `ProfileController.update.form()`, `preserveScroll`. Fields: `name` required, `email` required type=email. Changing email clears `email_verified_at` server-side `[CONFIRMED-CODE]`.

**Delete account** — DELETE with `password` in modal (`DeleteUser`). Requires verified email middleware on the route.

## 15. Overlays

Delete-account `Dialog` (title, description, password, confirm) `[CONFIRMED-CODE]`.

## 16. States

- Default filled from `auth.user`
- Unverified email banner
- `status === 'verification-link-sent'` success text
- Processing / field errors (`InputError` + `SettingsFormRow` error)

## 17. Empty State

NOT APPLICABLE (always has user fields).

## 18. Error Handling

Validation errors on name/email; delete password errors focus password input `[CONFIRMED-CODE]`. HTTP 401/419 unobserved `[UNKNOWN]`.

## 19. Feedback

`Inertia::flash('toast', success Profile updated.)` `[CONFIRMED-CODE]`. Verification-link-sent inline. Global `Toaster` in `app.tsx`. Delete success is a full logout redirect — no toast `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay on `/settings/profile` after update. Delete → `/` after session invalidate. Breadcrumbs: “Profile settings” `[CONFIRMED-CODE]`.

## 21. Entity Relationships

User (self) only. Email uniqueness/verification is Fortify/Laravel MustVerifyEmail `[CONFIRMED-CODE]`. Workspace membership is not edited here.

## 22. Business Rules

- Any authenticated user may GET/PATCH profile `[CONFIRMED-CODE]`
- DELETE requires verified email `[CONFIRMED-CODE]`
- Dirty email resets verification timestamp `[CONFIRMED-CODE]`
- People UI tells users to use Profile → Delete account for self-removal `[CONFIRMED-CODE]` (`PeopleController`)

## 23. Backend Dependencies

`ProfileController`, `ProfileUpdateRequest`, `ProfileDeleteRequest`, session auth.

## 24. Frontend Dependencies

`@/components/settings/chrome`, `@/components/delete-user`, `@/components/ui/input`, `@/actions/.../ProfileController`, `@/routes/profile`, `@/routes/verification`.

## 25. Responsive Behavior

Settings nav stacks (border-b) below `lg`; pane padding `px-4` / `lg:px-6`. Form rows become two-column from `sm` `[CONFIRMED-CODE]`. Viewport not measured `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: labeled inputs (`htmlFor`/`id`), required asterisks, `Head` title.
LIKELY ISSUE: name `InputError` is `sr-only` while email uses row `error` — name errors may be announced only to SR `[CONFIRMED-CODE]`.
REQUIRES MANUAL TEST: dialog focus trap, delete password field.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-001-01 | LOW | Name errors are `sr-only` | Sighted users may miss name validation | `profile.tsx` |
| SET-001-02 | OBSERVATION | Delete copy says “all of its resources” without workspace-owner warning | Last owner may not understand workspace impact | `delete-user.tsx` `[UNVERIFIED]` product intent |

## 28. Consistency Comparison

Matches other Personal cards (Security, Appearance): header + `SettingsCard` + save bar. Delete is unique among settings pages.

## 29. Functional Preservation Contract

- Name + email edit with validation
- Email-change re-verification
- Resend verification
- Password-gated account delete + logout
- No extra permission to open the page
- Settings IA “Profile” remains the `/settings` landing page

## 30. Design Input Contract

Purpose: maintain the login identity.
Primary goal: keep name/email accurate.
Primary actions: Save profile; Delete account.
Secondary: resend verification.
Required information: name, email, verification status.
Required components: header, personal-info form, delete danger zone.
Required states: default, unverified, validation error, processing, verification sent.
Information priority: identity fields, then danger zone.
Business-critical: email uniqueness/verification; delete confirmation.
Must not remove: PATCH/DELETE endpoints, verification resend, password confirm on delete.

## 31. Open Questions / Unknowns

- What happens if the last workspace owner deletes their account? `[UNKNOWN]`
- Whether unverified users can reach DELETE in the UI (route is verified; GET profile is not) `[UNVERIFIED]`
