# P02 — Active shell normalization

**PR:** Finish the shipped 64/240 shell: leftover header out of the mental model, one topbar job per control, `/home` → `/dashboard`.  
**Baseline:** `main` @ `1b1c10d` (P00 #203 + P01 #205).  
**Date:** 2026-09-14.

Thin chrome cleanup only. No DataWorkspace, Command OS, Settings IA, or visual redesign.

---

## What changed

| Surface | Before | After |
|---|---|---|
| Command Home | `href: '/home'` (no such route) | `href: '/dashboard'` |
| Rail / collapsed logo Home | Already `/dashboard` | Unchanged |
| Search / ⌘K | Opens command palette | Unchanged |
| Sparkle | `title` Ask Evo, `aria-label` AI; opens palette | Both labels **Ask Evo**; still opens the same palette |
| Create | Dropdown `?create=1` links | Unchanged |
| Notify / Tasks | Bell labeled Notifications → dropdown → Tasks overlay | **One Tasks button** opens the overlay directly |
| `app-header` / `app-header-layout` | Unused leftover, unmarked | `@deprecated` comments; still not wired; **not deleted** |

`AppLayout` still imports `app-sidebar-layout` only. 64/240 widths, simple mode, collapse cookie, `/inbox` active paths, and Create `?create=1` are unchanged.

---

## `/home` fix

Authenticated Home is `/dashboard`. `/` is the named `home` route and redirects. There is no `/home` route.

P01 left the command item for this PR. Command Navigate → Home now visits `/dashboard`. Sidebar Home was already `/dashboard`. Collapsed-rail logo link was already `/dashboard`.

`crm-shell.tsx` still treats `/home` as an incoming pathname for active-state matching. That is not a nav href; left alone.

---

## Tasks decision

**Keep the Tasks overlay as the single topbar notify/tasks entry.**

| Option | Why not / why |
|---|---|
| Overlay (picked) | Already the live operator surface; command already has Activities; overlay footer still links to `/crm/activities` |
| Topbar link to `/crm/activities` | Would drop the quick-complete overlay until P15 and add a second tasks destination next to the Communication rail item |

The Notifications dropdown that only contained Tasks is gone. There is one Bell, labeled Tasks, that opens `TasksOverlay`. No second topbar link to `/crm/activities`. Activities stay on the rail and in the command Navigate list.

P15 still owns folding the overlay into the activities work queue.

---

## Ask Evo vs command

Sparkle remains an **entry** to the command palette. It does not mount `AskEvoPanel` in the topbar. Ask-section / contextual Ask Evo wait for **P16 / P24**.

---

## Deprecations

| Artifact | P02 action | Delete |
|---|---|---|
| `components/app-header.tsx` | `@deprecated` comment; still unused by `AppLayout` | **P28** — P01 tests still require the file |
| `layouts/app/app-header-layout.tsx` | Same | **P28** |
| `TasksOverlay` | Kept as the one topbar tasks surface | Shrink in P15, not here |

---

## Tests run

Recorded after this PR's implementation. See the PR body if a later commit updates counts.

| Command | Intent |
|---|---|
| `php artisan test --filter=P02` | New lock + leftover header unused |
| `php artisan test --filter=P01` | Phosphor / overlay path; `/home` assertion removed |
| `php artisan test --filter=P04` | 64/240 + topbar labels |
| `php artisan test --filter=Wave0` | Shell chrome |
| `php artisan test --filter=SimpleMode` | Simple mode nav / guards |
| `npm run types:check` | TS |
| `npm run build` | Production bundle |

New lock: `tests/Feature/P02ActiveShellNormalizationTest.php`.

---

## Visual / a11y / responsive (source)

- Icon-only topbar controls have `aria-label` / `title`: Ask Evo, Create, Tasks, account menu, Search.
- Tasks count is included in the accessible name when `evoOpenTaskCount > 0`.
- `data-chrome="notify"` still `hidden` below 390px; search remains the flex-1 control at 375.
- Mobile rail still `<SheetContent>` at 240px.

**Live authenticated browser pass:** not run in this environment (no seeded operator session). Reviewer should click Search, ⌘K, Sparkle, Create, Tasks, and the mobile Sheet at 375 / 768 / 1280.

---

## Deferred

| Item | Phase |
|---|---|
| Command Ask / Create sections | P16 |
| Contextual Ask Evo (not a second topbar panel) | P24 |
| Delete `app-header*` and other leftovers | P28 |
| Fold Tasks overlay into the activities queue | P15 |
| DataWorkspace row ownership | P03 |
| Settings IA | P21 |
