# User menu

## 1. Screen Identity

Screen ID: `OVR-SHELL-004`
Product area: Shell overlays
Route: Overlay. Settings link `GET /settings/profile` (`profile.edit`). Logout `POST /logout` (Fortify `AuthenticatedSessionController::logout`).
Route name: `profile.edit`; logout Wayfinder `logout()` → `/logout`
Frontend file: `resources/js/components/user-menu-content.tsx` (trigger in `app-sidebar-header.tsx`; identity row `resources/js/components/user-info.tsx`)
Primary component: `UserMenuContent`
Layout: `DropdownMenuContent align="end" className="w-64"`
Authentication: Rendered only if `auth.user` is truthy
Permissions: Profile is the current user; no extra gate. Logout always available.
Parent navigation: Topbar avatar (`SCR-SHELL-003`)
Entry points: Circular initials button `aria-label={t(':name account menu', { name })}`
Exit points: Settings (Inertia), Log out (POST button)
Runtime HTTP (owner, simple_mode=true): User `Evotechly Owner` / `owner@evosales.local` on every 200 page. `/settings/profile` 200. Logout not crawled. `[CONFIRMED-BOTH]`
Evidence: `user-menu-content.tsx`, `user-info.tsx`, `app-sidebar-header.tsx`, `resources/js/routes/index.ts` logout, `resources/js/routes/profile/index.ts`, Fortify.

## 2. Purpose

Identify the signed-in person and provide the two account exits: settings (profile) and log out.

## 3. Current UX Summary

Trigger: 36px round secondary button, `bg-ink` / `text-canvas`, initials from `useInitials(user.name)`, title = full name.

Menu: `UserInfo` (avatar + name + email), separator, Settings (GearSix) linking to `edit()` `/settings/profile`, separator, Log out (SignOut) `data-test="logout-button"`.

## 4. Screen Anatomy

`DropdownMenuLabel` (not a focusable item) wrapping `UserInfo showEmail`. One `DropdownMenuGroup` for Settings. Logout is a `Link as="button"` so Fortify POST works.

## 5. Data Displayed

- `user.name`, `user.email`
- `user.avatar` on `AvatarImage` (seed capture has no avatar field in the truncated user object — `[UNKNOWN]` if `avatar` is present on the User type at runtime)
- Initials fallback

No role, workspace name, or simple-mode indicator in the menu.

## 6. Primary Actions

- Settings → `/settings/profile` with `prefetch`, `onClick={cleanup}` (`useMobileNavigation`)
- Log out → POST `/logout` after `cleanup()` and `router.flushAll()`

## 7. Secondary Actions

None (no appearance, no workspace switcher, no 2FA shortcut). Appearance lives under Settings.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Fixed.

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Logout flushes Inertia cache (`router.flushAll`) so the next guest session does not reuse authenticated pages.

## 14. Forms

Logout is a method-spoofed button link, not a visible form.

## 15. Overlays

This dropdown only.

## 16. States

Open/closed. Missing user → trigger not rendered. Avatar image vs initials.

## 17. Empty State

NOT APPLICABLE.

## 18. Error Handling

Logout errors `[UNVERIFIED]`. Settings 200 for owner.

## 19. Feedback

No confirmation dialog on logout. `t('Settings')` / `t('Log out')` are translated; `UserInfo` email uses `text-muted-foreground` (token mix).

## 20. Navigation Behavior

Settings lands on Profile inside settings chrome (`SCR-SHELL-004`), not a dedicated “account” page. Logout Fortify `home` is `/dashboard` but guest will bounce to login on next `/`.

## 21. Entity Relationships

Current `User` only. Workspace is not switchable here.

## 22. Business Rules

- Single workspace per user in this product surface (workspace nested on user in share).
- Logout must POST (CSRF) — implemented as Inertia Link button.
- Mobile nav cleanup runs on both actions.

## 23. Backend Dependencies

Fortify logout, `ProfileController@edit`. Session cookie `evocrm-evotechly-session`.

## 24. Frontend Dependencies

shadcn dropdown, Phosphor, `UserInfo`, Wayfinder `logout`/`edit`, `useMobileNavigation`, `t()`.

## 25. Responsive Behavior

Trigger is always icon-sized. Menu `w-64`. `NOT VERIFIED` on mobile sheet (cleanup exists for mobile nav).

## 26. Accessibility Observations

**CONFIRMED:** trigger aria-label includes name; Settings/Log out have icons + text; logout test hook.

**LIKELY ISSUE:** `DropdownMenuLabel` identity block may be skipped by some SR users; no `aria-haspopup` extra on trigger beyond dropdown primitive; avatar `alt={user.name}` duplicates the name text.

**REQUIRES MANUAL TEST:** keyboard logout, focus return.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| USR-001 | LOW | Settings goes to Profile, same as rail Settings | Two entries, same dest | `edit()` vs `/settings` redirect |
| USR-002 | LOW | No workspace name/role in the menu | Owner vs member unclear | `UserMenuContent` |
| USR-003 | OBSERVATION | No logout confirm | Accidental click | no dialog |

## 28. Consistency Comparison

Auth pages use a centered card, not this menu. Rail Settings is a GearSix leaf; menu Settings is also GearSix. Command Navigate “Settings” goes to `/settings` (redirects to profile).

## 29. Functional Preservation Contract

- Keep identity (name + email).
- Keep Settings → profile.
- Keep POST logout + `router.flushAll`.
- Keep `data-test="logout-button"`.

## 30. Design Input Contract

Purpose: account menu.
Primary goal: open settings or sign out.
Primary actions: Settings, Log out.
Required information: name, email, initials.
Required components: avatar/initials trigger, identity header, two items.
Must not remove: logout POST, profile link.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` whether `user.avatar` is populated for the seed owner.
- `[UNVERIFIED]` logout redirect target in this app (Fortify default `/dashboard` then guest redirect).
