# Aurora Audit

> **Status after PR #101 + PR #114 (architectural baseline).**
> P0 token cycle and mobile Sheet composition are **fixed**. The vendored
> revision is pinned in `resources/js/components/ui/aurora/SOURCE.json`
> (`fa53183f7e9a790391198424b8b90afb4b5fa50c`). The live rail is **240px**
> (desktop and mobile Sheet). Home no longer uses raw `--aurora-*`.
> Treat sections below as the original discovery record. Current decisions
> and remaining work live in [`AURORA-INTEGRATION-REPORT.md`](./AURORA-INTEGRATION-REPORT.md).

## Aurora Status

**FOUND AND BRIDGED.** P0 light-mode `--sidebar` ↔ `--aurora-nav-bg` cycle
and `SheetHeader`-outside-`SheetContent` are resolved. Do not re-open them.

Aurora is a real, third-party shadcn-compatible registry. It is vendored into this repository, remapped through an EvoTechly token bridge, and consumed by most canonical `@/components/ui/*` adapters. It is **not** invented locally. It is also **not** fully installed: many official registry primitives and all domain blocks except Command Palette / Prompt Input are absent. The official Aurora Sidebar block is **not** the EvoCRM rail and is not installed.

---

## Actual Aurora Location

### Authoritative upstream

| Property | Value | Evidence |
|----------|-------|----------|
| Project | [dinglebear-ai/aurora](https://github.com/dinglebear-ai/aurora) | GitHub README, `docs/visual-system/aurora-adoption.md` |
| Public registry | `https://aurora.tootie.tv/r/{name}.json` | `components.json` `registries.@aurora` |
| Install | `npx shadcn@latest add @aurora/<item>` | Aurora README + adoption doc |
| License | AGPL-3.0-only (upstream) | Aurora README |
| Not used | `@ticketmaster/aurora` (styled-components) | Explicitly excluded in adoption doc |

### In this repository (vendored)

| Path | Role |
|------|------|
| `components.json` | `@aurora` registry namespace |
| `resources/js/components/aurora.css` | Vendored Aurora token contract (`--aurora-*`) |
| `resources/js/components/aurora-components.css` | Vendored `@layer aurora-components` styles |
| `resources/css/aurora-evotechly-bridge.css` | EvoTechly remaps of `--aurora-*` |
| `resources/css/app.css` | Import order + Brand Book `--evosales-*` + EvoDesk `--sidebar-*` |
| `resources/js/components/ui/aurora/*` | 31 vendored Aurora UI primitives |
| `resources/js/components/aurora/command-palette.tsx` | Vendored Aurora Command Palette block |
| `resources/js/components/aurora/prompt-input.tsx` | Vendored Aurora Prompt Input block |
| `resources/js/lib/aurora/shadcn-bridge.ts` | shadcn variant → Aurora variant map |
| `resources/js/lib/aurora/portal-container.tsx` | Optional Radix portal container (catalog previews) |
| `docs/visual-system/aurora-adoption.md` | Prior adoption plan (Phase 1–7 marked Done) |

No Git submodule. No `node_modules` Aurora package. No `@aurora` npm dependency. Aurora is **copied source**, not an installed versioned package.

---

## Package / Version

| Question | Answer |
|----------|--------|
| npm package | **None.** Not in `package.json` or lockfile. |
| Registry URL | `https://aurora.tootie.tv/r/{name}.json` (mutable discovery URL) |
| Pinned git SHA | **Pinned** in `resources/js/components/ui/aurora/SOURCE.json` (`fa53183f7e9a790391198424b8b90afb4b5fa50c`). |
| Local copy | Source files under `resources/js/components/ui/aurora/` and `resources/js/components/aurora.css` |
| App stack fit | shadcn + Radix + Tailwind v4 + CVA + React 19 (matches Aurora) |

Exact upstream commit of the vendored files is recorded in `SOURCE.json`.

---

## Ownership hierarchy (from existing architecture)

The user-requested hierarchy and the previously written adoption doc disagree. Existing repo architecture is:

```text
EVOTECHLY BRAND BOOK          docs/brandbook/*  +  :root --evosales-*
        ↓
PRODUCT IDENTITY / TOKENS     --evosales-*, --sidebar-*, --text-*
        ↓
AURORA DESIGN SYSTEM          aurora.css + ui/aurora/*  (implementation)
        ↓  aurora-evotechly-bridge.css
REUSABLE UI PRIMITIVES        @/components/ui/* adapters
        ↓
EVOCRM PRODUCT PATTERNS       AppSidebar, list views, AdaptiveWorkspaceShell
        ↓
EVOCRM SCREENS                pages/*
```

**Conflict (documented, not invented):**

- `docs/visual-system/aurora-adoption.md` lists Aurora first, Brand Book second.
- `docs/brandbook/design-tokens.md` forbids Aurora teal/navy and says Brand Book hex values are the shipped identity.
- The **bridge file exists specifically so Brand Book wins on identity** (orange mark, true-black dark, Geist) while Aurora wins on component architecture.

**Correct ownership (from the files that actually run):**

| Concern | Authority | Why |
|---------|-----------|-----|
| Color / type / brand mark | Brand Book (`--evosales-*`, Geist, `#EC6025`) | `app.css` + `docs/brandbook/design-tokens.md` |
| EvoDesk rail | Brand Book `--sidebar-*` (true black, never navy) | `app.css` comments + brand tokens |
| Component API, a11y, motion, overlay primitives | Aurora (`ui/aurora/*`, `--aurora-*` after bridge) | Vendored components read `--aurora-*` only |
| Product IA (CRM rooms, pins, More panel) | EvoCRM | `app-sidebar.tsx` — not the Aurora Sidebar block |

When they conflict, **do not replace EvoTechly identity with Aurora navy/cyan**. The bridge is the existing resolution.

---

## Aurora Tokens

Values below are from `resources/js/components/aurora.css` (vendored contract) and, where remapped, from `resources/css/aurora-evotechly-bridge.css`. **No values invented.**

### Surfaces (Aurora defaults → bridge)

| Token | Aurora dark default | Bridge `:root` (light) | Bridge `.dark` |
|-------|---------------------|------------------------|----------------|
| `--aurora-page-bg` | `#07131c` | `var(--evosales-canvas-soft)` | `var(--evosales-canvas-soft)` |
| `--aurora-nav-bg` | `#07111a` | `var(--sidebar)` **(cycle — see P0)** | `var(--sidebar)` |
| `--aurora-panel-medium` | `#102330` | `var(--evosales-canvas)` | `var(--evosales-canvas)` |
| `--aurora-panel-strong` | `#13293a` | `var(--evosales-canvas)` | `var(--evosales-canvas)` |
| `--aurora-control-surface` | `#0c1a24` | `var(--evosales-canvas-soft)` | `#171717` |
| `--aurora-hover-bg` | `#17364b` | ink 4% mix | `#1f1f1f` |
| `--aurora-shell-bg` | two cyan radials on page-bg | two **orange** radials on canvas-soft | `var(--evosales-canvas-soft)` |

### Brand / accent

| Token | Aurora default | Bridge |
|-------|----------------|--------|
| `--aurora-accent-primary` | `#29b6f6` cyan | `var(--evosales-mark)` `#EC6025` |
| `--aurora-accent-button` | `#1da8e6` | `var(--evosales-mark)` |
| `--aurora-accent-foreground` | `#051520` | `#ffffff` |
| `--aurora-focus-ring` | cyan mix | orange mix |
| `--axon-orange` | `#ff9645` | `var(--evosales-mark)` |

Aurora rose (`--aurora-accent-pink*`) remains in the contract; not Brand Book. Used only if a component requests the rose variant.

### Status (unchanged from Aurora muted palette)

| Token | Dark | Light (`.light` in aurora.css) |
|-------|------|--------------------------------|
| `--aurora-success` | `#7dd3c7` | `#2d7d6e` |
| `--aurora-warn` | `#c6a36b` | `#8a6914` |
| `--aurora-error` | `#c78490` | `#9c3545` |
| `--aurora-info` | `#72c8f5` | `#0f7db8` |
| `--aurora-neutral` | `#91a8b6` | `#6f8793` |

Each has `-surface` / `-border` / `-foreground` mixes.

### Text

| Token | Aurora dark | Bridge |
|-------|-------------|--------|
| `--aurora-text-primary` | `#e6f4fb` | `var(--evosales-ink)` |
| `--aurora-text-muted` | `#a7bcc9` | `var(--evosales-mute)` |

### Typography (Aurora scale; faces remapped)

| Token | Aurora value | Bridge |
|-------|--------------|--------|
| `--aurora-font-display` | Manrope | `var(--font-sans)` Geist |
| `--aurora-font-sans` | Inter | Geist |
| `--aurora-font-mono` | JetBrains Mono | `ui-monospace, Menlo, monospace` |
| `--aurora-type-body` | `14px` | unchanged |
| `--aurora-type-body-sm` | `13px` | unchanged |
| `--aurora-type-control` | `13px` | unchanged |
| `--aurora-type-table` | `13px` | unchanged |
| `--aurora-type-label` | `12px` | unchanged |
| `--aurora-type-caption` | `11px` | unchanged |
| `--aurora-type-micro` | `10.5px` | unchanged |
| `--aurora-weight-body` | `480` | unchanged |
| `--aurora-weight-ui` | `560` | unchanged |
| `--aurora-weight-label` | `650` | unchanged |
| `--aurora-weight-heading` | `760` | unchanged |

Utility classes: `.aurora-text-body`, `-body-sm`, `-ui`, `-caption`, `-eyebrow`, `-label`, `-control`, `-table`, `-meta`, `-code`, `-section`, `-display-1/2`, `-display-hero`, `-lead`.

Brand Book product scale (`--text-page-title`, `--text-ui`, etc.) remains in `app.css` `@theme` and is a **separate** scale.

### Spacing (Aurora)

| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `10px` |
| `--space-4` | `12px` |
| `--space-5` | `16px` |
| `--space-6` | `20px` |
| `--space-7` | `24px` |

### Radii

| Token | Aurora.css | Bridge |
|-------|------------|--------|
| `--aurora-radius-1` | `14px` | `12px` |
| `--aurora-radius-2` | `18px` | `16px` |
| `--aurora-radius-3` | `22px` | `20px` |
| `--radius-pill` | `999px` | unchanged |
| `--radius` (shadcn) | `14px` | `0.5rem` (Brand Book) |

### Borders

| Token | Aurora dark | Bridge |
|-------|-------------|--------|
| `--aurora-border-default` | `#1d3d4e` | `var(--evosales-hairline)` |
| `--aurora-border-strong` | `#24536c` | ink 18% mix / `#2a2a2a` dark |

### Elevation / shadows

| Token | Aurora dark | Bridge light | Bridge dark |
|-------|-------------|--------------|-------------|
| `--aurora-shadow-medium` | `0 12px 24px rgba(0,0,0,0.18)` | `0 1px 2px / 0 4px 12px` | `0 2px 8px / 0 8px 20px` |
| `--aurora-shadow-strong` | `0 20px 38px rgba(0,0,0,0.26)` | `0 2px 8px / 0 12px 24px` | `0 4px 16px / 0 16px 32px` |
| `--aurora-highlight-medium` | inset 1px white 3.5% | inset white 72% | inset white 4% |
| `--aurora-overlay` | `rgba(4,10,14,0.72)` | `rgba(17,17,17,0.18)` | `rgba(0,0,0,0.72)` |

Brand Book also defines `--sidebar-overlay: rgba(0,0,0,0.8)` for the rail (not an Aurora token).

### Motion

| Token | Value |
|-------|-------|
| `--motion-ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--motion-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--motion-duration-instant` | `100ms` |
| `--motion-duration-fast` | `160ms` |
| `--motion-duration-medium` | `240ms` |
| `--motion-duration-slow` | `360ms` |

`prefers-reduced-motion` is handled in `aurora.css` for `.aurora-*` trees.

### Breakpoints

**Aurora token file does not define viewport breakpoints.** No `--aurora-breakpoint-*` exists.

EvoCRM structural breakpoints (from `docs/visual-system/responsive-architecture.md` + `use-mobile.tsx`):

| Viewport | Shell |
|----------|-------|
| `< 768px` | Aurora `Sheet` mobile nav (`useIsMobile` = `max-width: 767px`) |
| `768–1023px` | Collapsed icon rail (`md:block`) |
| `≥ 1024px` | Full / icon-collapsible rail |

Container queries are recommended in the adoption doc; not provided as Aurora primitives in the vendored CSS.

### Z-index (Aurora.css)

| Token | Value |
|-------|-------|
| `--z-sidebar` | `30` |
| `--z-popover` | `40` |
| `--z-modal` | `50` |
| `--z-toast` | `60` |

Vendored `Sheet` uses Tailwind `z-50` (not these tokens).

### Sizing (sidebar — EvoCRM, not Aurora)

| Token | Value |
|-------|-------|
| `--sidebar-width` | `240px` (runtime, `sidebar.tsx`; Brand Book / Apple cabinet) |
| `--sidebar-width-icon` | `3.5rem` |
| Mobile sheet width | `min(var(--sidebar-width), 92vw)` bound to **240px** (PR #114). Aurora default `min(396px, 92vw)` remains for non-nav Sheets. |

Official Aurora Sidebar block uses `240px` / `60px` inline. **Not installed.**

---

## Aurora Components

### Installed in this repo (`resources/js/components/ui/aurora/`)

| Requested | Present | File |
|-----------|---------|------|
| Button | Yes | `button.tsx` |
| Input | Yes | `input.tsx` |
| Select | Yes | `select.tsx` + `native-select.tsx` |
| Checkbox | Yes | `checkbox.tsx` |
| Radio | **No** (upstream has `radio-group.tsx`; not vendored) | — |
| Switch | Yes | `switch.tsx` |
| Tabs | Yes | `tabs.tsx` (includes `PillGroup`) |
| Table | Partial | `data-table.tsx` only — no `table.tsx` |
| DataGrid | No — `data-table.tsx` is the closest | |
| Badge | Yes | `badge.tsx` |
| Dialog | Yes | `dialog.tsx` |
| Drawer | **CSS only** (`.aurora-drawer-*` in `aurora-components.css`). No `drawer.tsx`. Upstream has `registry/aurora/ui/drawer.tsx`. |
| Dropdown | Yes | `dropdown-menu.tsx` |
| Popover | Yes | `popover.tsx` |
| Tooltip | Yes | `tooltip.tsx` |
| Command | Block, not primitive | `resources/js/components/aurora/command-palette.tsx`. Upstream also has `command.tsx` (not vendored). |
| Search | No dedicated primitive | Input used as search |
| Card | Yes | `card.tsx` |
| Sidebar | **Not the official block** | EvoCRM uses shadcn `ui/sidebar.tsx` + Aurora `Sheet` for mobile |
| Navigation | No Aurora nav primitive installed | `app-sidebar.tsx` is product chrome |
| Breadcrumb | Yes | `breadcrumb.tsx` |
| Pagination | Yes | `pagination.tsx` |
| Toast | Yes | `toast.tsx` (plus shadcn `sonner.tsx` still present) |
| Alert | No Aurora Alert | Local `ui/alert.tsx` (shadcn). Upstream has `banner` / `callout` (callout **is** vendored). |
| Empty State | Yes | `empty-state.tsx` |
| Skeleton | Yes | `skeleton.tsx` |
| Error State | No dedicated primitive | Upstream `ErrorPage` block not installed |
| Form | Partial | `field.tsx` + `label.tsx` |

Also vendored (not on the requested list): `avatar`, `callout`, `combobox`, `listbox`, `progress`, `separator`, `spinner`, `stat-card`, `textarea`.

Also vendored as **blocks**: `command-palette`, `prompt-input`.

### Official Aurora UI that exists upstream and is **not** vendored here

From [dinglebear-ai/aurora `registry/aurora/ui/`](https://github.com/dinglebear-ai/aurora/tree/main/registry/aurora/ui) (this audit): accordion, alert-dialog, aspect-ratio, attachment, banner, bubble, button-group, calendar, carousel, chart, chat-message, chat-sidebar, collapsible, color-picker, command, component-card, context-menu, copy-button, date-picker, description-list, direction, drawer, filter-bar, hover-card, input-group, input-otp, item, kbd, marker, menubar, message, message-scroller, multi-select, navigation-menu, number-input, operation-icon, progress-ring, radio-group, range-slider, rating, resizable-panels, scroll-area, search-results, segmented, slider, spotlight, status-dot, status-indicator, stepper, table, tag-input, timeline, toggle, toggle-group, toolbar.

### Official Aurora Sidebar block (not installed)

[`registry/aurora/blocks/workspace/sidebar/sidebar.tsx`](https://github.com/dinglebear-ai/aurora/blob/main/registry/aurora/blocks/workspace/sidebar/sidebar.tsx):

- Desktop `<nav>` rail only (`240px` / `60px`)
- `items: SidebarItem[]` + `onSelect(id)` — **not** Inertia `<Link>` routing
- **No mobile Sheet / drawer / overlay**
- Background `var(--aurora-panel-strong)`, not EvoDesk `--sidebar`

Replacing `AppSidebar` with this block would change product IA and drop mobile navigation. That is a **major architectural rewrite** — out of scope (Phase 11–12 / stop condition 8).

---

## Responsive System

| Concern | Actual implementation |
|---------|----------------------|
| Breakpoints | EvoCRM `768` / `1024` — **not** Aurora tokens |
| Responsive containers | Tailwind + `@container` recommended in docs; not an Aurora primitive |
| Grid / stack | Tailwind / product shells. No Aurora Stack/Grid component vendored |
| Sidebar | shadcn `Sidebar` + EvoDesk tokens |
| Drawer | Aurora Sheet (Radix Dialog) used as mobile nav; Aurora Drawer CSS unused |
| Mobile navigation | `useIsMobile()` → `Sheet` in `ui/sidebar.tsx` |
| Overlay | Aurora Sheet overlay: `var(--aurora-overlay)` |
| Portals | Radix `Portal` → `document.body`, optional `PortalContainerContext` |
| Z-index | Sheet overlay + content both `z-50`; Aurora `--z-*` unused by Sheet |
| Viewport | `h-app-workspace` uses `100dvh` minus `--app-chrome-height` |

---

## Current EvoCRM Usage

### Canonical adapters (re-export or wrap Aurora)

`resources/js/components/ui/{button,badge,input,textarea,card,checkbox,dialog,sheet,select,native-select,dropdown-menu,tooltip,tabs,label,separator,skeleton,spinner}.tsx`

Button and Badge wrap Aurora and map shadcn variants via `lib/aurora/shadcn-bridge.ts`.

### Direct Aurora imports (bypassing adapters)

| File | Import |
|------|--------|
| `pages/crm/contacts/show.tsx` | `@/components/ui/aurora/avatar` |
| `components/crm/evo-kpi-card.tsx` | `@/components/ui/aurora/stat-card` |
| `components/crm/crm-kpi-strip.tsx` | `StatGrid` from stat-card |
| `components/crm/command-palette.tsx` | `@/components/aurora/command-palette` |
| `components/aurora/prompt-input.tsx` | Aurora button + textarea |
| `components/ui/aurora/pagination.tsx` | Aurora button |
| `pages/home.tsx` | Aurora CSS variables + type utilities (inline) |

### Product chrome still on shadcn Sidebar

`app-sidebar.tsx`, `app-shell.tsx`, `app-sidebar-layout.tsx`, `app-sidebar-header.tsx` — EvoDesk rail. Mobile path uses Aurora `Sheet`.

---

## Duplicate Local Components

| Local | Aurora equivalent | Status |
|-------|-------------------|--------|
| `ui/sidebar.tsx` (shadcn) | Aurora Sidebar **block** (different API, no mobile) | Keep product rail; use Aurora Sheet for mobile |
| `ui/alert.tsx` | Aurora `callout` / `banner` | Alert still local shadcn |
| `ui/sonner.tsx` | Aurora `toast.tsx` | Both present |
| `ui/avatar.tsx` | `ui/aurora/avatar.tsx` | Local avatar still exists; contact show imports Aurora |
| `ui/breadcrumb.tsx` | `ui/aurora/breadcrumb.tsx` | Local file still present (not confirmed as re-export) |
| `ui/navigation-menu.tsx` | Upstream Aurora `navigation-menu.tsx` | Local shadcn; Aurora not vendored |
| `ui/input-otp.tsx` | Upstream Aurora `input-otp.tsx` | Local shadcn |
| `ui/toggle.tsx` / `toggle-group.tsx` | Upstream Aurora equivalents | Local shadcn |
| CRM `list-view-table.tsx` | Aurora `data-table.tsx` | Product table still primary |
| `ui/placeholder-pattern.tsx` | None | Local |

**Rule already in adoption doc:** one canonical primitive. Do not add `AuroraButton.tsx`.

---

## Violations

### P0 — broken / unusable — **RESOLVED in PR #101**

1. **Cyclic `--sidebar` ↔ `--aurora-nav-bg` in light mode** — **fixed.**
   Bridge re-asserts both as `#000000` literals. `AuroraTokenBridgeTest` guards the pair.
2. **`SheetHeader` rendered outside `SheetContent`** — **fixed.**
   Title/description live inside the portaled dialog. Mobile nav uses Brand `--sidebar-overlay`.

### P1 — major design-system violation

3. **Aurora navy/cyan contract still applied before the bridge, and shadcn `--sidebar-*` overwritten** to Aurora text/accent. Light-mode `--sidebar-foreground` becomes `var(--aurora-text-primary)` → Brand ink `#111111` on a black rail if the cycle is fixed without restoring rail tokens.
4. **Light `--aurora-shell-bg` uses decorative orange radials** — prior “Aurora aesthetic” wash. Brand Book page wash is `--evosales-canvas-soft` only. Dark already flattened.
5. **Official Aurora Sidebar not used — and must not replace EvoDesk** without an IA rewrite. Mobile nav must stay Sheet + product tree (one tree).
6. **Aurora version not pinned.**

### P2 — major inconsistency

7. Dual type scales (Aurora `--aurora-type-*` vs Brand `--text-*`).
8. Dual toast systems (`sonner` + Aurora toast).
9. `ui/alert.tsx` not on Aurora Callout.
10. `ui/avatar.tsx` and `ui/aurora/avatar.tsx` both exist.
11. `list-view-table` not on Aurora `data-table`.
12. Aurora Drawer CSS present; component not installed; Sheet used instead.
13. Home page uses raw `--aurora-*` inline styles instead of primitives.

### P3 — polish

14. Sheet overlay uses light `--aurora-overlay` `0.18` while Brand Book `--sidebar-overlay` is `0.8`.
15. Aurora `--z-*` unused by Sheet.
16. `rose` button variant still in Aurora Button (not Brand Book).
17. Command palette block still contains demo “Chat with Claude” defaults in the vendored file (product wrapper supplies real items).

---

## EvoCRM surface audit (vs actual Aurora + Brand Book)

| Surface | Finding |
|---------|---------|
| App shell / sidebar | P0 token cycle + Sheet composition. Desktop rail architecture OK. |
| Mobile navigation | P0 transparent sheet; one nav tree in React (good); visually duplicated because page shows through. |
| Top bar | Aurora tokens + adapters. Decorative header gradient uses `--aurora-panel-strong-top`. |
| Workspace switcher | Not a separate Aurora widget. |
| Global search / command | Aurora Command Palette block via CRM wrapper. |
| Notifications | Button only; no Aurora toast feed. |
| User menu | Aurora dropdown. |
| CRM / Outbound / Desk / Ads / Reports | Consume `@/components/ui/*` adapters → Aurora primitives for controls. Layouts are product shells (`CrmListShell`, `RoomShell`, `AdaptiveWorkspaceShell`). |
| Tables | Product `ListViewTable` (data-first). Aurora DataTable installed but not the list primitive. |
| Record pages | Contact show uses Aurora tabs/cards/avatar. Other records follow AdaptiveWorkspaceShell. |
| Forms | Aurora Input/Select/Field via adapters. |

**Not redesigned in this audit.** Tables stay data-first. No card-grid CRM rewrite.

---

## Stop-condition check

| Condition | Result |
|-----------|--------|
| 1. Aurora cannot be found | No — found |
| 2. Documentation / screenshot only | No — vendored source + registry |
| 3. Dependencies missing | Registry items are vendored; Radix/CVA/Tailwind present |
| 4. Multiple conflicting Auroras | One upstream (`dinglebear-ai/aurora`). Local “aesthetic” misuse is the bridge/shell wash, not a second system |
| 5. Brand Book / Aurora ownership unclear | Documented above — Brand Book identity, Aurora components |
| 6. Required Aurora Sidebar for mobile | **Does not exist.** Official block has no mobile drawer. Use Aurora Sheet. |
| 7. Business logic change required | No |
| 8. Major architectural rewrite required | **Yes if** replacing AppSidebar with Aurora Sidebar block. **No** for fixing tokens + Sheet composition |

**Decision:** integrate the Aurora that is already here; fix the P0 token/composition bug; do not invent a second Aurora; do not swap the EvoDesk rail for the official Sidebar block.
