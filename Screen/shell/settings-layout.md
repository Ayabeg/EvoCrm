# Settings layout chrome

## 1. Screen Identity

Screen ID: `SCR-SHELL-004`
Product area: Settings
Route: Nested chrome for every Inertia component whose name starts with `settings/`
Route name: `/settings` redirects to `profile.edit` (`/settings/profile`)
Frontend file: `resources/js/layouts/settings/layout.tsx`
Primary component: `SettingsLayout`
Layout: `[AppLayout, SettingsLayout]` (`resources/js/app.tsx`) — still has product rail + topbar
Authentication: `auth` middleware. Most destinations also `verified`. Security uses `RequirePassword` → `/user/confirm-password`.
Permissions: Destination visibility from `visibleSettingsDestinations` (capabilities, admin/owner flags, SMS feature). Route groups in `routes/settings.php` additionally use `can-manage-settings` + `EnforceProductPermissions`.
Parent navigation: Sidebar Settings leaf (`/settings`)
Entry points: Rail Settings; user menu Settings (`profile.edit`); command Navigate “Settings”
Exit points: Inner links to destinations; product rail to leave settings
Runtime HTTP (owner, simple_mode=true): `/settings` 302 `/settings/profile`; `/settings/profile` 200 component `settings/profile`; `/settings/security` 302 `http://127.0.0.1:8000/user/confirm-password`; `/settings/setup` 302 `/settings/setup/start`; `/settings/sms` 200 even though `features.sms` is false (nav hides SMS); `/settings/apps/meta` 302 `/settings/apps`. `[CONFIRMED-BOTH]` `Screen/_evidence/runtime-index.json`
Evidence: `resources/js/layouts/settings/layout.tsx`, `resources/js/lib/settings/ia.ts`, `routes/settings.php`, `routes/web.php` setup routes, `app/Http/Middleware/EnsureUserCanManageSettings.php`.

## 2. Purpose

Workspace settings information architecture: a searchable, grouped destination list (Personal / Workspace / CRM / Communication / Integrations / Developer) beside a constrained content pane.

## 3. Current UX Summary

`data-settings="workspace"` row: left aside `data-settings="nav"` (15.5rem on lg) with uppercase “Settings”, filter input, and grouped links; right pane `data-settings="pane"` with horizontal padding. On viewports below `lg`, the aside stacks on top, the link list is hidden, and a grouped `<select data-settings="mobile-select">` jumps via `router.visit`. Wide pages listed in `WIDE_SETTINGS_COMPONENTS` drop the `lg:max-w-[900px]` cap.

Owner + `simple_mode` hides SMS in the nav (`requiresSmsFeature` and `features.sms === false`) but the SMS route still 200s if opened. `[CONFIRMED-BOTH]`

## 4. Screen Anatomy

- Eyebrow: `t('Settings')`
- Filter: `type="search"` placeholder `Filter settings`, magnifying glass, `data-settings="search"`
- Mobile select: `Open a setting` sr-only
- Desktop nav: groups with `data-settings-scope` (`ME`, `WORKSPACE`, `CRM`, `CHANNEL`, `INTEGRATION`, `DEVELOPER`)
- Active link: `aria-current="page"`, brand left border, accent-soft background
- Pane: page component children

## 5. Data Displayed

`SETTINGS_DESTINATIONS` (live hrefs only; comment lists omitted: Teams, Email, Billing, API, Webhooks, Automation editor):

| Group | Titles | Gates |
| --- | --- | --- |
| Personal | Profile `/settings/profile`, Security `/settings/security`, Appearance `/settings/appearance` | none |
| Workspace | General `/settings/workspace` ownerOnly; Members `/settings/people` adminOnly; Meetings `/settings/meetings`; Setup `/settings/setup` | owner/admin as noted |
| CRM | Properties, Pipelines, Qualification, Quotas, Record layouts, Playbooks | permissions and/or adminOnly |
| Communication | WhatsApp (evolution), WhatsApp Cloud, WhatsApp Business, Meta, Channels, SMS | `settings.integrations`; SMS also `requiresSmsFeature` + adminOnly |
| Integrations | Apps, Connectors | `settings.integrations` |
| Developer | Permissions, Audit trail, System health | adminOnly |

`/settings/apps/meta` is a wide component but **not** a nav destination; crawl 302s to Apps.

Seed owner role `owner` → `canManageSettings` true, `isOwner` true. SMS filtered out.

## 6. Primary Actions

Open a destination (Inertia `Link` or mobile select). Filter the list.

## 7. Secondary Actions

None in the chrome (pages own save actions). Product Create/Search remain in the outer topbar.

## 8. Search

Client filter: case-insensitive substring over title, group, scope, href, keywords (`filterSettingsDestinations`). Empty query shows all authorized destinations. No server search.

## 9. Filters

The search box is the only filter. No scope chips.

## 10. Sorting

`SETTINGS_GROUP_ORDER` then destination array order. Empty groups omitted.

## 11. Selection

Active: exact path, or prefix match except Profile (`SETTINGS_PROFILE_HREF` never prefix-matches, so `/settings/profile/x` would not keep Profile active). Mobile select value from first matching authorized item.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full destination catalog is client-side. Page content is a normal Inertia visit.

## 14. Forms

Chrome has the filter input and mobile select only.

## 15. Overlays

None of its own. Outer shell overlays still work. Security destination usually opens confirm-password (`SCR-AUTH-007`) before the page.

## 16. States

- Query empty vs matches vs no matches (`No matching settings` `role="status"` / empty select option)
- Wide vs narrow pane
- Admin vs member vs owner visibility
- SMS feature on/off

## 17. Empty State

“No matching settings” when the filter removes every authorized destination.

## 18. Error Handling

Unauthorized URLs 403 via middleware (members hitting people/workspace/etc.). Simple mode does not 403 most settings; SMS is feature-hidden only in nav. `/settings/apps/meta` redirects away.

## 19. Feedback

Active styles; hover on links; focus-visible brand border on the search field. No toast in the layout.

## 20. Navigation Behavior

`/settings` → `/settings/profile`. Setup nav href `/settings/setup` → controller `start()` redirects to `/settings/setup/start`. Security → password confirm. Leaving settings uses the product rail.

## 21. Entity Relationships

Destinations configure workspace, CRM schema, channels, integrations, and the current user. No record list.

## 22. Business Rules

- `adminOnly` uses `['owner','admin'].includes(auth.user.role)` — not a capability string.
- `ownerOnly` workspace general.
- Permission destinations require the named capability in `auth.capabilities`.
- SMS requires `features.sms` **and** integrations permission **and** admin.
- Comment: no empty taxonomy / fake capability destinations.

## 23. Backend Dependencies

`routes/settings.php`, additional settings routes in `web.php` (attributes, pipelines, channels, evolution, whatsapp, apps, connectors, meta, record-layouts, permissions, setup). `EnsureUserCanManageSettings`. `RequirePassword` for security.

## 24. Frontend Dependencies

`@/lib/settings/ia`, `useSimpleMode` (SMS flag only), `useCurrentUrl`, `t()`, Phosphor magnifying glass, Inertia Link/router.

## 25. Responsive Behavior

`[CONFIRMED-CODE]`: column on small screens (`flex-col` / `lg:flex-row`); desktop nav `hidden lg:flex`; mobile select `lg:hidden`; pane `px-4 lg:px-6`. `NOT VERIFIED` visually.

## 26. Accessibility Observations

**CONFIRMED:** filter `sr-only` label; `aria-current`; `role="status"` empty; nav aria-label; optgroups on mobile.

**LIKELY ISSUE:** mobile select has no visible label beyond sr-only; search is not a landmark; two “Settings” labels (rail + inner eyebrow).

**REQUIRES MANUAL TEST:** keyboard through long nav; filter + mobile select sync.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| SETL-001 | MEDIUM | Security always detours through confirm-password | Extra step; crawl never rendered `settings/security` | runtime 302 |
| SETL-002 | LOW | SMS reachable by URL while hidden in simple mode | IA vs backend mismatch | nav filter vs `/settings/sms` 200 |
| SETL-003 | LOW | Apps Meta not in the destination catalog | Nested page only via redirect/other links | `WIDE_SETTINGS_COMPONENTS` vs `SETTINGS_DESTINATIONS` |
| SETL-004 | OBSERVATION | Setup href is `/settings/setup` which immediately redirects | Extra hop | `OAuthSetupController::start` |

## 28. Consistency Comparison

Unlike the product rail, settings uses text-only grouped lists and a local filter. Outer Command OS is a second way to jump to `/settings` but not to individual destinations (no per-page command items).

## 29. Functional Preservation Contract

- Keep the six groups and every live destination in `SETTINGS_DESTINATIONS`.
- Keep visibility gates (owner/admin/permission/SMS).
- Keep filter + mobile select.
- Keep wide-pane exceptions.
- Keep `/settings` → profile redirect.
- Do not invent destinations for Teams/Email/Billing/API/Webhooks.

## 30. Design Input Contract

Purpose: find and open a settings destination.
Primary goal: reach the right admin surface quickly.
Primary actions: search, open destination.
Required information: grouped titles, active route, authorization.
Required components: aside, filter, group lists, pane.
Required states: empty filter results, mobile select, wide pane.
Must not remove: Profile/Security/Appearance; owner Workspace general; Members; channel/integration entries the backend serves.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` exact capability list for the seed owner (whether `settings.attributes` / `settings.integrations` are present — crawl shows 16 capabilities starting with `crm.view`).
- `[UNVERIFIED]` member-role nav (no member session in the crawl).
- Should `/settings/sms` 403 in simple mode to match the nav?
