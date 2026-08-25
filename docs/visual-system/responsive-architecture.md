# EvoSales Responsive Architecture

Audit and implementation guide for the responsive craft pass (PR #82+). This is an **architecture and UX pass**, not a visual redesign. Desktop visual hierarchy from PR #80 and Home command center (#81) is preserved.

Methodology references:
- [Responsive Craft](https://github.com/kylezantos/responsive-craft) — fluid default, structural breakpoints only, independent scroll regions, container-aware panels
- Responsive design principles — mobile-first behavior, touch targets, progressive disclosure

---

## 1. Application shell

| Surface | Current behavior | Issues found | Resolution |
|---------|------------------|--------------|------------|
| `AppSidebarLayout` | shadcn `SidebarProvider`; mobile sheet rail | Good baseline — `min-w-0 overflow-x-clip` on content | Keep |
| `AppSidebarHeader` | 52px command bar, search + actions | Fixed `max-w-2xl` search squeezed actions at 280–320px; ⌘K label overflow | `flex-1 min-w-0` search, hide shortcut below `sm`, tighter gaps |
| Main nav (`sidebar.tsx`) | Collapses to Sheet below 768px | More panel `w-[520px]` already capped with `max-w-[calc(100vw-1rem)]` | Keep |
| `h-app-workspace` | Was `calc(100vh - 52px)` in 4 files | Mobile browser chrome (address bar) caused jumpy heights | Token `--app-chrome-height` + `100dvh` fallback utility |

---

## 2. Three-panel workspace pattern

**Reference layout** (contact detail, now canonical across CRM records and Desk):

```text
┌───────────────────────────────────────────────────────────────┐
│                    Top command bar (52px)                     │
├───────┬───────────────────────────────────────┬───────────────┤
│       │                                       │               │
│ Main  │         Activity workspace            │ Deals /       │
│ Nav   │         (center, default focus)       │ Related       │
│       │                                       │               │
└───────┴───────────────────────────────────────┴───────────────┘
```

### Adaptive breakpoints (structural, not cosmetic)

| Viewport | Layout | Panel access |
|----------|--------|--------------|
| **< 768px** (mobile) | Single panel + tab switcher | Details · Activity · Related — default Activity |
| **768–1023px** (tablet) | Center + right grid; left via switcher | Folders/Inbox split for Desk; Details tab for records |
| **≥ 1024px** (desktop) | Three-column fluid grid `min(260px,22vw) \| 1fr \| min(280px,24vw)` | All panels visible, independent scroll |

Implementation: `AdaptiveWorkspaceShell` (`resources/js/components/crm/adaptive-workspace-shell.tsx`), consumed by `RecordShell` and Desk `FrontDesk`.

### Surfaces using the pattern

| Page | Left | Center | Right |
|------|------|--------|-------|
| Contact show | Properties, Ask Evo | Activity tabs | Deals kanban, associations |
| Company show | About, edit form | Activity | Contacts, deals |
| Deal show | About, stage move | Activity | Contact, company |
| Desk inbox | Folders, channels | Thread list | Conversation + composer |

---

## 3. Module rooms

| Surface | Layout | Issues | Status |
|---------|--------|--------|--------|
| `RoomShell` | Header + tab nav + scroll body | Fixed `100vh`; `px-6` on narrow phones | `h-app-workspace`, responsive padding |
| `CrmListShell` | Header + toolbar + table | Table overflow without horizontal scroll wrapper | `ListViewTable` wrapped in `overflow-x-auto` + `min-w-[640px]` |
| Home dashboard | `max-w-7xl` fluid grid | Already responsive (`lg:grid-cols-3`, chart overflow) | OK |
| Deals/Leads board | Horizontal kanban scroll | Intentional — columns scroll inside room | OK (pattern documented) |
| Outbound rooms | `RoomShell` + KPI strip | Inherits room shell fixes | OK |

---

## 4. Known debt (deferred)

These are documented for follow-up; not blockers for the first responsive PR.

| Category | Examples | Recommended fix |
|----------|----------|-----------------|
| Inline tables (~30) | Settings, ads, segments | Migrate to `ListViewTable` per `datatable-migration.md`; each gets `overflow-x-auto` |
| Fixed min-widths in filters | `filter-builder.tsx` `min-w-[7rem]` | Acceptable — wraps in flex; monitor 280px |
| Kanban column width | `w-[140px]` on board columns | Keep — horizontal scroll is correct pattern |
| Record layout context | Pre-existing TSC errors | Separate fix |
| Conversations page | Two-column `lg:grid` without mobile switcher | Apply `AdaptiveWorkspaceShell` in follow-up |
| Settings tables | `min-w-[640px]` | Already has overflow wrapper on Card |

---

## 5. Viewport matrix

Validate by **continuous resize** between these points, not only at exact widths.

| Width | Device class | Critical checks |
|-------|--------------|-----------------|
| 280px | Very narrow phone | Command bar fits; sidebar sheet opens; record tabs usable |
| 320px | Small phone | Search truncates; table scrolls horizontally |
| 375px | Mobile baseline | Single-panel record default = Activity |
| 430px | Large phone | Action chips wrap, no horizontal page scroll |
| 768px | Tablet portrait | Desk/record switch to 2-col (center+right) |
| 1024px | Tablet landscape / small laptop | Full 3-panel grid appears |
| 1280px | Laptop | Fluid rails scale; no fixed 1440px assumption |
| 1440px | Desktop baseline | Visual parity with pre-pass desktop |
| 1920px | Large desktop | `max-w-7xl` on Home constrains content; rooms fill width |
| 2560px | Ultrawide | Side rails cap via `min()` — center absorbs extra space |

---

## 6. Design forks (explicit choices)

| Decision | Options considered | Choice |
|----------|-------------------|--------|
| Mobile record layout | Stack all 3 panels vs tab switcher | **Tab switcher** — avoids mile-long scroll |
| Tablet record layout | 2-col left+center vs center+right | **Center+right** — activity + associations are co-primary |
| Desk panel order | Folders-left vs threads-left | **Folders \| Inbox \| Conversation** — matches shared-inbox mental model |
| Table overflow | Shrink columns vs horizontal scroll | **Scroll container** — preserves readable column widths |
| Height unit | `100vh` vs `100dvh` | **`100dvh` with `100vh` fallback** |

---

## 7. Files changed in this pass

- `resources/css/app.css` — `--app-chrome-height`, `.h-app-workspace`
- `resources/js/components/crm/adaptive-workspace-shell.tsx` — new
- `resources/js/components/crm/record-chrome.tsx` — `RecordShell` delegates to adaptive shell
- `resources/js/components/crm/room-shell.tsx` — workspace height + padding
- `resources/js/components/crm/list-view-table.tsx` — horizontal scroll wrapper
- `resources/js/components/crm/list-chrome.tsx` — responsive padding
- `resources/js/components/app-sidebar-header.tsx` — narrow viewport command bar
- `resources/js/pages/crm/{contacts,companies,deals}/show.tsx` — workspace height + padding
- `resources/js/pages/desk/inbox.tsx` — adaptive 3-panel desk

---

## 8. Testing checklist

```bash
npm run build
# Manual: resize browser 280 → 2560 on:
# - /crm/contacts/:id
# - /crm/companies/:id
# - /crm/deals/:id
# - /inbox
# - /crm/contacts (list table scroll)
# - / (home dashboard)
```

Confirm:
- No horizontal page scroll (only intentional inner scroll regions)
- Sticky command bar stays 52px
- Panel switcher hidden at ≥1024px
- Desk conversation composer stays pinned at bottom of right panel
