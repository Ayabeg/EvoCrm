# Header (topbar)

## 1. Screen Identity

Screen ID: `SCR-SHELL-003`
Product area: Shell
Route: Persistent topbar inside `AppContent`
Route name: NOT APPLICABLE
Frontend file: `resources/js/components/app-sidebar-header.tsx`
Primary component: `AppSidebarHeader`
Layout: Sticky `header.app-topbar` above page children
Authentication: Product session. Avatar omitted if `auth.user` is missing.
Permissions: Create → Quote item requires `crm.edit` via `canCreateQuote(capabilities)`. Other Create items are always listed.
Parent navigation: Application shell (`SCR-SHELL-001`)
Entry points: Every AppLayout page
Exit points: Create links, user-menu settings/logout, command/task overlays
Runtime HTTP (owner, simple_mode=true): Topbar present on `/dashboard` 200. `evoOpenTaskCount: 7`. `auth.capabilities` includes `crm.view` (16 total; quote create depends on `crm.edit` — list length captured, not full key list). `[CONFIRMED-BOTH]`
Evidence: `resources/js/components/app-sidebar-header.tsx`, `resources/js/lib/command-os.ts` (`canCreateQuote`), `Screen/_evidence/dashboard.json`.

## 2. Purpose

Canonical product topbar (P02/P16): one Command OS, one Create dropdown, one Tasks overlay, account menu, sidebar trigger. Comment in file: Search/⌘K and Sparkle open the **same** Command OS. Breadcrumbs are accepted then discarded.

## 3. Current UX Summary

Left: sidebar trigger (tooltip “Toggle sidebar”). If the rail is collapsed on desktop, a compact EvoCrm logo link to `/dashboard` appears (`hidden md:flex`). Then a read-only search field placeholder `Search EvoCRM…` with magnifying glass and `⌘K` hint.

Right (`ml-auto`): ghost Sparkle “Ask Evo”, primary Create button (Plus + “Create” from `sm`), ghost Bell “Tasks” (hidden below 390px), circular initials chip opening the user menu.

Below the header in the same component: `<CommandPalette>` and `<TasksOverlay>`.

## 4. Screen Anatomy

```
[SidebarTrigger] [Logo if collapsed] [Search trigger + ⌘K] …… [Sparkle] [Create ▾] [Bell] [Avatar]
CommandPalette (portal)
TasksOverlay (portal)
```

`void breadcrumbs` — `BreadcrumbItem[]` is never rendered. Leftover `AppHeader` still has `<Breadcrumbs>` but is unused.

## 5. Data Displayed

- `auth.user.name` for tooltip, aria-label, initials (`useInitials`).
- `auth.capabilities` for Quote create visibility.
- `evoOpenTaskCount` in Tasks `aria-label` only (`Tasks (7)` vs `Tasks`). **No visible numeric badge.**
- Search field always empty (`value=""`, `readOnly`).

## 6. Primary Actions

- Focus/click search or press Ctrl/Cmd+K → toggle Command OS (`useCommandPaletteShortcut`).
- Create → dropdown: Contact `/crm/contacts?create=1`, Company `/crm/companies?create=1`, Deal `/crm/deals?create=1`, Quote `/crm/quotes?create=1` if `crm.edit`.
- Tasks bell → `setTasksOpen(true)`.
- User chip → `UserMenuContent`.

## 7. Secondary Actions

- Sparkle: **also** `setPaletteOpen(true)` — not `openAskEvo()`.
- Sidebar toggle.
- Collapsed-rail logo → dashboard.
- Window event `openEvoTasks` also opens the tasks overlay. No in-repo dispatcher found besides this listener `[CONFIRMED-CODE]` grep.

## 8. Search

Fake input `data-command-trigger="search"`. Click always opens palette. Focus opens unless a 400ms suppress window after close (`COMMAND_FOCUS_OPEN_SUPPRESS_MS`) so closing the palette does not immediately reopen from the still-focused field.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT PRESENT.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

NOT APPLICABLE.

## 14. Forms

NOT PRESENT. Create items are GET links that open list pages with `?create=1` (runtime `/crm/contacts?create=1` and `/crm/deals?create=1` are 200 in the crawl).

## 15. Overlays

Owns Command Palette (`OVR-SHELL-001`) and Tasks Overlay (`OVR-SHELL-002`). Create and user menus are dropdowns (`OVR-SHELL-003`, `OVR-SHELL-004`).

## 16. States

- `paletteOpen` / `tasksOpen`
- `collapsed` (`!isMobile && state === 'collapsed'`)
- Quote item present or absent
- Tasks button hidden under 390px
- User missing → no avatar

## 17. Empty State

Search never shows results itself. Tasks overlay empty copy lives in the overlay.

## 18. Error Handling

NOT PRESENT at header level. Palette shows “Search unavailable…” on remote failure.

## 19. Feedback

Tooltips (Ask Evo, Tasks, Toggle sidebar). Processing states live in overlays/pages. No unread/task badge on Bell.

## 20. Navigation Behavior

Create uses Inertia `Link`. Company/Deal create remain in the menu even in simple mode (Companies is not on the rail). Header is `sticky top-0 z-20` — overlays use z-50.

## 21. Entity Relationships

Create links target list rooms, not a specific record. Tasks overlay lists workspace-open activities.

## 22. Business Rules

- One command surface: search, ⌘K, sparkle.
- Quote create gated on `crm.edit` (same helper as command catalog).
- Contact/Company/Deal create **not** gated in this dropdown (command catalog **does** require `crm.edit` for all create items). Divergence `[CONFIRMED-CODE]`.
- Breadcrumbs must not appear (tests lock leftover header out of AppLayout).

## 23. Backend Dependencies

Shared `auth`, `evoOpenTaskCount`. Create URLs are existing list routes. Tasks complete posts to `/crm/activities/{id}/complete`.

## 24. Frontend Dependencies

Phosphor (`Bell`, `MagnifyingGlass`, `Plus`, `Sparkle`), shadcn Button/Dropdown/Input, `CommandPalette`, `TasksOverlay`, `UserMenuContent`, `useCommandPaletteShortcut`, `canCreateQuote`, `t()`.

## 25. Responsive Behavior

`[CONFIRMED-CODE]`: gaps/padding `px-3 sm:px-4`; search width steps; Create text `hidden sm:inline`; ⌘K `hidden sm:inline`; Tasks `hidden min-[390px]:block`; collapsed logo `hidden md:flex`. `NOT VERIFIED` on device.

## 26. Accessibility Observations

**CONFIRMED:** search `aria-label`; icon buttons labeled; Tasks count in aria-label; user menu named; `data-chrome` hooks (`menu`, `search`, `ai`, `notify`).

**LIKELY ISSUE:** Sparkle accessible name is “Ask Evo” but action opens search; Tasks hidden under 390px with no alternate entry except `openEvoTasks` / command Act items; “Toggle sidebar” untranslated.

**REQUIRES MANUAL TEST:** keyboard from trigger into palette; restoring focus after close (search trigger is excluded from restore).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| HDR-001 | HIGH | Ask Evo control is not Ask Evo | Misaligned affordance | Sparkle `setPaletteOpen(true)` |
| HDR-002 | MEDIUM | Create Contact/Company/Deal ignore `crm.edit`; Command OS create items do not | Different gates | header dropdown vs `commandCreateItems` |
| HDR-003 | MEDIUM | Breadcrumbs unused | No trail | `void breadcrumbs` |
| HDR-004 | LOW | No visible task count | Count only in aria-label | `evoOpenTaskCount` unused in children |
| HDR-005 | LOW | Bell disappears <390px | No tasks control on small phones | `min-[390px]:block` |

## 28. Consistency Comparison

Command OS Create section can include “Log activity”; header Create cannot. Settings layout has its own search for destinations. Auth pages have no topbar.

## 29. Functional Preservation Contract

- Keep search + ⌘K + sparkle opening the same Command OS.
- Keep Create destinations including `?create=1` query contract.
- Keep Tasks overlay wiring and `openEvoTasks`.
- Keep user menu.
- Keep sidebar trigger.
- Do not start rendering breadcrumbs without a product decision (currently intentionally unused).

## 30. Design Input Contract

Purpose: global actions for the current workspace.
Primary goal: search or create without leaving the room.
Primary actions: Search, Create, Tasks, Account.
Secondary: Ask Evo (intended), sidebar toggle.
Required information: user identity, open-task count, create permissions.
Required components: search trigger, create menu, bell, avatar, command palette, tasks overlay.
Required states: palette/tasks open; collapsed rail logo; missing quote capability.
Must not remove: ⌘K, Create items that exist today, logout path (via user menu), tasks overlay.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` whether `crm.edit` is in the 16 capabilities for the seed owner (capture listed `_item: crm.view` only).
- `[UNKNOWN]` who is supposed to dispatch `openEvoTasks`.
- Should sparkle call `openAskEvo()` when `features.ask_evo` is true, and hide when false?
