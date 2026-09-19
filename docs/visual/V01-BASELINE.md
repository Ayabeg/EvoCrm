# V01 — Populated / source baseline

**Status:** Recorded before V01 paint.  
**Base:** merged V00 `main` `037918794347db944e27d47547ecdaaaed0bf7e8`  
**Method:** Source-true audit of the live shell recorded before V01 paint. Populated 1440 / 1280 / 1024 / 768 photography ran after implementation (seeded local `owner@evosales.local`) and is recorded in `V01-IMPLEMENTATION.md`.

**Taste read:** authenticated B2B CRM chrome redesign for all-day operators, Apple restraint + HubSpot list usability + EvoCRM orange, restyling Aurora + `ds` only. Dials 4 / 3 / 7. No landing-page Taste.

---

## Active shell (authoritative)

| Surface | File | Notes |
|---|---|---|
| Layout | `layouts/app/app-sidebar-layout.tsx` | Sidebar + content + topbar |
| Frame | `app-shell.tsx` + `ui/sidebar.tsx` | Collapse cookie `sidebar_state`. 64 / 240 already locked |
| Rail | `app-sidebar.tsx` | Phosphor. Groups Home / CRM / Communication / Sales / Automation / More. Settings anchored |
| Topbar | `app-sidebar-header.tsx` | Search + ⌘K, Sparkle (opens Command OS), Create, Tasks, profile |
| Command OS | `crm/command-palette.tsx` → `aurora/command-palette.tsx` | P16 orchestration. Presentation only in V01 |
| Duplicate chrome | `crm/room-shell.tsx` via `CrmShell` / `DeskShell` / ads / reports / outbound | Still mounts on Activities, Automation, Inbox, Tickets, Segments, imports. Contacts / Companies / Leads / Deals / Quotes lists already omit it |

Compatibility shells stay. V01 demotes RoomShell visually. It does not delete it.

---

## Shell dimensions (1440 source)

| Measure | Live | V00 target |
|---|---|---|
| Collapsed rail | 64px (`SIDEBAR_WIDTH_ICON`) | 64 |
| Expanded rail | 240px (`SIDEBAR_WIDTH`) | 240 |
| Mobile sheet | 240px | 240 |
| Topbar | 44px &lt;640, 52px ≥640 (`--app-chrome-height`) | Compact. Avoid a tall header |
| Page pad | PageHeader `px-4` / `md:px-8` (32). RoomShell `px-4` / `sm:px-6` | 32 where composition permits |
| Content canvas | `--aurora-shell-bg` = `#F7F7F5` | Canvas `#F7F7F5` |
| Rail surface | Paper `#F7F7F5` | Paper or white. Law keeps paper |
| App frame | Full viewport. Not a floating rounded card | Keep occupying the viewport |

---

## Sidebar behavior

- Collapse persists via cookie. Simple-mode leaf swap is capability-gated.
- Expanded rows: 36px (`h-9`), 13px labels. Collapsed: 48px hit, centered icons, tooltips.
- Active: accent-soft wash + ink. Icon fill. **No orange text.** Soft, generic SaaS.
- Group labels: **11px uppercase** (`text-[11px]`). Below type floor.
- Logo: 28px mark + 13px wordmark when expanded. Compact mark when collapsed. Topbar repeats the mark when collapsed.
- More: custom panel with `--evosales-*` literals, 11px uppercase header.
- Settings: last item, not in a boxed group.
- Focus: `ring-sidebar-ring` (orange). Preserve.

---

## Topbar

- Sticky, frosted (`backdrop-filter` + 86% paper). Visual Law forbids glassmorphism.
- Search: `Input size="sm"` (28px), pill, MagnifyingGlass, `Search EvoCRM…`, ⌘K at 11px (`--text-section-label`). Opens Command OS on click/focus (P16).
- Sparkle: ghost icon, `Ask Evo` name, opens Command OS (not the Ask Evo drawer). Do not retarget.
- Create: primary **icon-only**, `rounded-full`. Menu: Contact / Company / Deal / Quote (`?create=1`, quote gated).
- Tasks: ghost Bell. Hidden below 390px.
- Profile: 11px initials on ink circle.
- Breadcrumbs accepted and discarded.

---

## Page geometry / typography

| Role | Live | Law |
|---|---|---|
| Page | PageHeader 28/34/600. Home still 22px `text-page-title` | 28/34/650 |
| Section | mixed 16–18 | 18/26/600 |
| Body | 13–14 | 14/20/400 |
| Label / table | 13, headers often **11** | 13/18 and 12–13 header |
| Metadata / groups | **11 / 10** | Floor **12** |
| Controls | Aurora default 36 / radius 8 already in `app.css` | 36 / 8 |
| Inputs | default `h-9` (36). Topbar search uses `sm` | 36 |

Token deltas still live:

| Token | Live | Law |
|---|---|---|
| Accent hover | `#CF4A0C` | `#D74908` |
| Accent soft | `rgba(232, 83, 14, 0.10)` | `#FFF1EA` |
| Success | `#16A34A` | `#24845B` |
| Warning | `#D97706` | `#C77A11` |
| Danger | oklch destructive | `#D92D20` |
| Border strong | color-mix | `#D6D6D1` |
| Dialog radius | `--aurora-radius-3` 20 | 12 |
| Menu / popover | 8 / 16 mix | 10 |
| Drawer | no radius (good) | 0 |

---

## Visual hierarchy / noise

- Hierarchy is announced by boxes and stacked chrome, not type.
- Topbar glass + paper rail + paper canvas = low contrast frame.
- RoomShell on Inbox / Activities / Automation reads as a **second product nav** (title + tabs) under the global rail.
- Badge `default` maps to Aurora **cyan**.
- Command OS: 10px uppercase sections, 11px descriptions, 16px panel radius, 44px rows, left orange bar on selected.
- Create is a round orange plus. Unmistakable color, weak label.
- Utility icons sit in a row of equally loud circles.

---

## Command trigger

- One surface. ⌘K, search field, and Sparkle all open Command OS.
- Search semantics stay P16. V01 paints only.

---

## Responsive (source)

| Viewport | Expected live behavior |
|---|---|
| 1440 | Expanded or collapsed 64/240. Full search field. Create + utilities visible |
| 1280 | Same chrome. Content column shrinks |
| 1024 | Rail still desktop unless collapsed. P25 no page H-overflow |
| 768 | Sheet nav 240. Topbar 44–52. Search flexes. Tasks hide &lt;390 |

---

## Duplicated chrome

| Route | Global rail | Extra |
|---|---|---|
| Dashboard / Contacts / Companies / Leads / Deals / Pipeline / Quotes | Yes | None (good) |
| Activities / Automation / Tickets / Segments / imports | Yes | `CrmShell` → RoomShell “CRM” tabs |
| Inbox / Conversations | Yes | `DeskShell` → RoomShell “Inbox” tabs |
| Ads / Reports / Outbound | Yes | Domain RoomShell (keep; not V01 destinations) |

---

## Shell / content boundary

Content is `aurora-page-shell` on canvas. Lists wrap DataWorkspace in a white island. V01 must not restyle list/dashboard/settings **content**. Shared tokens (type floor, button, badge, dialog) may inherit. That temporary inconsistency is expected.

---

## V01 action from this baseline

1. Close token deltas in `app.css` / bridge.
2. Paint rail + topbar + Command OS.
3. Demote RoomShell to contextual nav without removing tabs/hrefs.
4. Semantic type roles + 12px floor for **shared** chrome (not every 11px on future screens).
5. Button / input / badge / popover / dialog paint via tokens and adapters.
6. Then populated visual QA. The screenshot wins if a source finding is wrong.
