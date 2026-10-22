# Application shell

## 1. Screen Identity

Screen ID: `SCR-SHELL-001`
Product area: Shell
Route: Not a single route. The authenticated Inertia layout wraps every non-auth, non-public page.
Route name: NOT APPLICABLE (layout chrome, not a named page)
Frontend file: `resources/js/layouts/app-layout.tsx`
Primary component: `AppLayout` → `AppSidebarLayout` (`resources/js/layouts/app/app-sidebar-layout.tsx`) → `AppShell` (`resources/js/components/app-shell.tsx`)
Layout: Canonical 64/240 sidebar shell. Leftover `resources/js/layouts/app/app-header-layout.tsx` and `resources/js/components/app-header.tsx` are unwired (`[CONFIRMED-CODE]`, comments P02/P28).
Authentication: Required for pages that use this layout. Guest pages use `AuthLayout` / `PublicLayout` (`resources/js/app.tsx`).
Permissions: Shared `auth.capabilities` are injected for every Inertia page; the shell itself does not gate render on a single permission.
Parent navigation: NOT APPLICABLE (this is the parent chrome)
Entry points: Any authenticated Inertia visit whose component name does not start with `auth/` or `public/`. Settings pages get `[AppLayout, SettingsLayout]`.
Exit points: Logout from the user menu; guest public URLs (`/q/{token}`, `/book/{slug}`, `/unsubscribe`) never mount this shell.
Runtime HTTP (owner, simple_mode=true): Observed on every 200 product page in `Screen/_evidence/runtime-index.json` (example `/dashboard` 200, component `home`). Shared prop keys include `errors`, `name`, `locale`, `translations`, `auth`, `workspace`, `simpleMode`, `nav`, `features`, `posthog`, `integrations`, `sidebarOpen`, `evoOpenTaskCount`, `evoOpenTasks`, `evoSearchIndex`. `[CONFIRMED-BOTH]`
Evidence: `resources/js/app.tsx`, `resources/js/layouts/app-layout.tsx`, `resources/js/layouts/app/app-sidebar-layout.tsx`, `resources/js/components/app-shell.tsx`, `app/Http/Middleware/HandleInertiaRequests.php`, `Screen/_evidence/dashboard.json`, `Screen/_evidence/runtime-index.json`.

## 2. Purpose

Provide the persistent product chrome around every authenticated room: icon/labeled rail, topbar, page body, global overlays (command OS, tasks, Ask Evo, quick-record peek), i18n hydration, PostHog identity, and toasts. The shell is the contract between Laravel shared Inertia props and the React surface.

## 3. Current UX Summary

A 64px collapsed / 240px expanded sidebar sits on the left (`[CONFIRMED-CODE]` `resources/js/components/ui/sidebar.tsx`). The sticky topbar holds search, Ask Evo sparkle, Create, Tasks bell, and the user chip. Page content fills `SidebarInset`. Global drawers/overlays mount at `AppLayout` so they survive Inertia page swaps. Local seed workspace Evotechly has `simple_mode: true`; feature flags `tickets`, `sms`, `ask_evo`, `ads`, `warmup`, `report_builder` are all false (`[CONFIRMED-BOTH]` `Screen/_evidence/dashboard.json`). Locale is `fr` with chrome translations hydrated from `lang/fr.json`.

## 4. Screen Anatomy

1. `createInertiaApp` (`resources/js/app.tsx`): title `{page} · EvoCrm`, layout switch, `TooltipProvider`, `Toaster`, orange progress `#E8530E`, `initializeTheme()` (light cabinet only).
2. `AppLayout`: `QuickRecordProvider` wraps everything; `HydrateI18n`; `AppSidebarLayout`; `PosthogIdentity`; page children; then `QuickRecordDrawer` and `AskEvoDrawer` as siblings so they overlay the whole product.
3. `AppSidebarLayout`: `AppShell variant="sidebar"` → `AppSidebar` + `AppContent` (`SidebarInset`) containing `AppSidebarHeader` then `{children}`.
4. `AppShell`: reads `usePage().props.sidebarOpen` (cookie `sidebar_state`) and wraps in `SidebarProvider` with `defaultOpen={isOpen}`. Header variant exists but is unused by `AppLayout`.
5. Settings pages insert `SettingsLayout` as a nested layout inside the page pane (still under the same topbar/rail).

## 5. Data Displayed

Shared Inertia props from `HandleInertiaRequests::share()` `[CONFIRMED-CODE]`:

| Key | Runtime (owner Evotechly) | Notes |
| --- | --- | --- |
| `name` | `EvoCrm · Evotechly` | App name, not just `config('app.name')` in the captured payload |
| `locale` | `fr` | |
| `translations` | chrome dictionary | empty when locale is `en` |
| `auth.user` | owner@evosales.local, role `owner` | full user + nested workspace |
| `auth.capabilities` | 16 keys, first sample `crm.view` | filtered `config('permissions.capabilities')` via `canPermission` |
| `workspace` | Evotechly, `simple_mode: true`, TZ `Africa/Algiers` | |
| `simpleMode` | `true` | `SimpleMode::enabled` |
| `nav` | 5 SIMPLE_NAV items, labels translated (`Accueil`, …) | |
| `features` | all operator flags false | |
| `posthog` | disabled in checked-in dashboard capture | production enablement remains environment-configured |
| `integrations` | meta unconfigured; google disconnected; smtp connected | lazy closure |
| `sidebarOpen` | `true` | cookie missing or `sidebar_state=true` |
| `evoOpenTaskCount` | `7` on dashboard/harness captures | open `Activity` rows, `done=false` |
| `evoOpenTasks` | up to 40 rows: id, type, subject, due_at | contact/deal/company ids queried but **not** mapped into the array `[CONFIRMED-CODE]` |
| `evoSearchIndex` | `[]` always | comment P16: search is GET `/crm/command/search` |

Parent `Inertia\Middleware::share` also supplies `errors` (and flash). Page-specific props sit beside these.

## 6. Primary Actions

- Navigate via rail (`SCR-SHELL-002`).
- Open Command OS from search / ⌘K / sparkle (`OVR-SHELL-001`).
- Create records from the Create dropdown (`OVR-SHELL-003`).
- Open Tasks overlay (`OVR-SHELL-002`).
- Open user menu (`OVR-SHELL-004`).
- Toggle rail (`SidebarTrigger`, also Ctrl/Cmd+B in sidebar primitive).

## 7. Secondary Actions

- Ask Evo drawer via command catalog item `ask-evo` (`OVR-SHELL-005`) — **not** via the sparkle in simple mode, because `features.ask_evo` is false and the drawer returns `null`.
- Quick-record peek (`OVR-SHELL-006`) from Command OS search hits and a few `RecordLink mode="drawer"` call sites (dashboard recent/work, activity work queue). Production lists still use full-record hrefs `[CONFIRMED-CODE]` harness comment.
- Toasts via Sonner `Toaster` (global, not chrome-specific).

## 8. Search

The topbar search field is a **read-only trigger** (`value=""`, `onClick` / `onFocus` open the command palette). Live record search is not in shared props (`evoSearchIndex` is empty). Remote search: `GET /crm/command/search?q=` (`CommandSearchController`). `[CONFIRMED-CODE]`

## 9. Filters

NOT APPLICABLE to the shell. Settings nested chrome has its own destination filter (`SCR-SHELL-004`).

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT APPLICABLE.

## 13. Pagination / Loading Strategy

Inertia visits swap `{children}` inside the persistent shell. `QuickRecordProvider` and overlay React state survive those visits as long as `AppLayout` remains mounted. Overlay fetchers (command search, peek, Ask Evo) use `fetch` + AbortController. Inertia progress bar color is `#E8530E`.

## 14. Forms

NOT APPLICABLE at shell level. Nested pages own forms.

## 15. Overlays

Mounted by this shell:

- `CommandPalette` + `TasksOverlay` from `AppSidebarHeader` (`OVR-SHELL-001`, `OVR-SHELL-002`).
- Create dropdown (`OVR-SHELL-003`) and user dropdown (`OVR-SHELL-004`) in the header.
- `AskEvoDrawer` (`OVR-SHELL-005`) and `QuickRecordDrawer` (`OVR-SHELL-006`) from `AppLayout`.

Leftover header layout is not an overlay; it is dead code.

## 16. States

- Sidebar expanded vs collapsed vs mobile sheet (`useSidebar`).
- `simpleMode` true vs false (rail + feature flags).
- Authenticated user missing: header skips the avatar chip (`user ? …`).
- `evoOpenTaskCount` 0 vs N (aria-label only; no numeric badge in the button).
- PostHog enabled vs disabled from config.
- Guest: this layout is not used.

## 17. Empty State

NOT APPLICABLE for the shell itself. Nested overlays have their own empties.

## 18. Error Handling

- `EnforceSimpleMode` aborts 403 when `SimpleMode::blocks()` matches tickets/ads/warmup/report-builder/ask-evo/draft-email (`[CONFIRMED-CODE]`).
- Overlay fetch failures are local (command search status text, peek error pane, Ask Evo alert).
- Shared `errors` bag is available to pages.
- Inertia 409 on version mismatch is framework-level, not chrome-specific.

## 19. Feedback

- Inertia progress bar (brand orange).
- Sonner toasts (page actions).
- Tooltip on chrome icon buttons (`delayDuration={0}`).
- French chrome strings via `t()` after `HydrateI18n`.

## 20. Navigation Behavior

`/` → 302 `/dashboard` when authenticated, else `/login` (`routes/web.php` `home`). Authenticated Fortify `home` is `/dashboard`. Settings `/settings` → 302 `/settings/profile`. Layout selection is by Inertia component name prefix, not by URL.

## 21. Entity Relationships

Shell is not an entity screen. It reads `User`, `Workspace`, and open `Activity` rows for the task overlay. Peek/command/Ask Evo attach to CRM records without leaving the chrome.

## 22. Business Rules

- Simple mode is a workspace flag, not a user preference in the share payload (`workspace.simple_mode`).
- Operator surfaces blocked in simple mode: `/crm/tickets*`, `/ads*`, `/outbound/warmup`, `/crm/report-builder`, `desk.ticket.open`, route names ending `.ask`, containing `draft-email`, or `ask-evo` / `ask-evo.context`.
- `evoSearchIndex` must stay empty on every page (P16).
- Theme is light-cabinet only (`initializeTheme` strips dark preference).
- Sidebar width contract: 240px labeled, 64px icon, mobile sheet 240px; cookie `sidebar_state` max-age 7 days.

## 23. Backend Dependencies

- `HandleInertiaRequests`
- `SimpleMode`, `Integrations`
- `Activity` query for tasks
- `EnforceSimpleMode`, `EnforceProductPermissions` on the authenticated `web.php` group
- Fortify session for `auth.user`
- Cookie `sidebar_state`

## 24. Frontend Dependencies

`@inertiajs/react`, Phosphor icons (rail/header), Radix/shadcn sidebar, Aurora command palette, Sonner, PostHog identity, i18n helper, Wayfinder route helpers inside overlays, DS quick-record module.

## 25. Responsive Behavior

`[CONFIRMED-CODE]` not viewport-crawled:

- `min-h-[100dvh]` shell.
- Rail: icon tooltips when collapsed; labeled list when expanded or mobile sheet.
- Topbar search width `min(100%,200px)` / `sm:240px` / `lg:280px`; ⌘K hint `hidden sm:inline`.
- Create label `hidden sm:inline`.
- Tasks bell `hidden min-[390px]:block`.
- Quick-record drawer `max-sm:w-full sm:w-[min(92vw,520px)] lg:w-[480px]`.
- Settings nested nav: list `hidden lg:flex`; mobile `<select>` `lg:hidden`.

Mark `NOT VERIFIED` for actual device breakpoints beyond the classes above.

## 26. Accessibility Observations

**CONFIRMED (code):**

- Rail `nav aria-label="EvoCrm"`; settings `nav aria-label={t('Settings')}`.
- Icon rail uses tooltips; labeled rail shows text.
- Search input has `aria-label`.
- Sparkle/Create/Tasks have `aria-label`.
- User chip `aria-label` via `:name account menu`.
- Sidebar trigger tooltip “Toggle sidebar” (English, not `t()`).

**LIKELY ISSUE:**

- Breadcrumbs prop is discarded (`void breadcrumbs`) so there is no page landmark in the topbar.
- Tasks overlay is a custom `role="dialog"` without focus trap / `aria-modal` (see `OVR-SHELL-002`).
- Create dropdown items are not capability-filtered except Quote.

**REQUIRES MANUAL TEST:** keyboard order through topbar, mobile sheet, overlay stacking (command vs peek vs Ask Evo).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| SHELL-001 | HIGH | Sparkle is labeled Ask Evo but opens Command OS; Ask Evo drawer is null in simple mode | Sparkle does not ask | `app-sidebar-header.tsx`, `ask-evo-drawer.tsx` `if (!features.ask_evo) return null`, `features.ask_evo: false` |
| SHELL-002 | MEDIUM | Breadcrumbs accepted then voided | No location trail | `void breadcrumbs` |
| SHELL-003 | MEDIUM | Command catalog still lists Companies/Leads/Pipeline/… in simple mode | Users can navigate to surfaces hidden from the rail | `command-os.ts` `REQUIRED_NAVIGATE` vs `SIMPLE_NAV` |
| SHELL-004 | LOW | Leftover header layout still in tree | Risk of accidental import | `app-header-layout.tsx` `@deprecated` |
| SHELL-005 | OBSERVATION | `evoOpenTasks` omits contact/deal/company ids even though queried | Overlay cannot deep-link to the related record | `HandleInertiaRequests.php` map |

## 28. Consistency Comparison

Auth uses `AuthScreen` card on canvas-soft, no rail. Public quote/book use `PublicLayout` (no chrome). Unsubscribe is a Blade page, not Inertia. Settings add a second inner nav. Dead starter-kit header still uses Lucide, unlike Phosphor chrome.

## 29. Functional Preservation Contract

- Keep 64/240 collapsible rail with cookie persistence.
- Keep shared Inertia keys listed in §5 (including empty `evoSearchIndex`).
- Keep simple-mode feature flags and 403 blocks.
- Keep global Command OS, Create, Tasks, user menu, peek provider, Ask Evo mount point.
- Keep settings as nested layout inside this shell.
- Keep light-only theme initialization.
- Do not wire `app-header-layout` as a second product chrome.

## 30. Design Input Contract

Purpose: persistent authenticated workspace chrome.
Primary goal: move between rooms and invoke global create/search/tasks without losing context.
Primary actions: rail navigation, search/command, create, tasks, account.
Secondary actions: Ask Evo, record peek, sidebar collapse.
Required information: workspace identity, open-task count, current path, capabilities, simple-mode flags.
Required components: sidebar, topbar, page inset, command palette, tasks overlay, create menu, user menu, peek drawer, Ask Evo drawer, toaster.
Required states: expanded/collapsed/mobile rail; simple vs full nav; overlay open/closed; missing user.
Information priority: current room > search/create > tasks > account.
Business-critical: simple-mode 403s, permission-safe command search, task completion path, logout.
Must not remove: rail destinations that exist in SIMPLE_NAV/FULL product groups; Create items; ⌘K; settings entry; logout.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` whether any dispatcher besides the bell currently fires `openEvoTasks` (listener exists; no `dispatchEvent` found).
- `[UNKNOWN]` visual French strings on the rail in the browser (props say `Accueil`; overlay copy is often hard-coded English).
- `[UNVERIFIED]` stacking order when command palette, peek, and Ask Evo are opened in sequence.
- Whether `name` shared as `EvoCrm · Evotechly` is middleware or a later append — captured payload differs from `config('app.name')` alone.
