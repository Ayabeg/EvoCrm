# Aurora Design System Adoption

EvoSales adopts [Aurora](https://aurora.tootie.tv) — the operator-grade shadcn registry from [dinglebear-ai/aurora](https://github.com/dinglebear-ai/aurora) — as its component foundation while preserving **EvoTechly brand identity** and **EvoSales product UX**.

## Design hierarchy

1. **Aurora Design System** — component architecture, interaction patterns, accessibility
2. **EvoTechly Brandbook** — orange mark, true-black dark cabinet, Geist typography
3. **EvoSales product requirements** — CRM workflows, record layouts, desk patterns
4. **Existing data/interaction patterns** — Inertia, list views, saved views
5. **PR #80 visual foundation** — where compatible
6. **Responsive Craft** — adaptive workspace shell, viewport matrix
7. **Responsive-design principles** — touch targets, progressive disclosure

When Aurora defaults conflict with EvoTechly (navy page bg, cyan primary, Inter/Manrope stack), the **token bridge wins**.

## Authoritative Aurora source

| Property | Value |
|----------|-------|
| Registry | `https://aurora.tootie.tv/r/{name}.json` |
| Namespace | `@aurora` in `components.json` |
| Install | `npx shadcn@latest add @aurora/<item>` |
| Stack fit | shadcn/ui + Radix + Tailwind v4 + CVA (matches EvoSales) |

**Not used:** `@ticketmaster/aurora` (styled-components), invented local “Aurora” wrappers.

## Architecture

```text
Aurora primitives (--aurora-*)
        ↓  aurora-evotechly-bridge.css
EvoTechly semantic tokens (--evosales-*)
        ↓  app.css @theme
EvoSales product tokens (--text-ui, --sidebar-*, etc.)
        ↓
Application components (ui/*, crm/*)
        ↓
Product modules (contacts, home, desk, …)
```

### File map (Phase 1)

| File | Role |
|------|------|
| `components.json` | `@aurora` registry namespace |
| `resources/js/components/aurora.css` | Aurora token contract (registry vendored) |
| `resources/css/aurora-evotechly-bridge.css` | EvoTechly remaps — **no navy/cyan** |
| `resources/js/components/aurora-components.css` | Aurora `@layer aurora-components` styles |
| `resources/css/app.css` | Import order, EvoSales tokens, Tailwind theme |

### Import order (required)

```css
@layer theme, base, components, aurora-components, utilities;

/* 1. EvoSales --evosales-* + shadcn semantic tokens */
/* 2. @import aurora.css */
/* 3. @import aurora-evotechly-bridge.css */
/* 4. @import aurora-components.css */
/* 5. .dark EvoSales overrides (bridge uses var() — resolves at runtime) */
```

## Token bridge mapping

### Surfaces

| Aurora token | EvoTechly / EvoSales source | Notes |
|--------------|----------------------------|-------|
| `--aurora-page-bg` | `--evosales-canvas-soft` | Page wash, not navy |
| `--aurora-panel-medium` | `--evosales-canvas` | Cards, panels |
| `--aurora-panel-strong` | `--evosales-canvas` | Popovers, inspectors |
| `--aurora-control-surface` | `--evosales-canvas-soft` / `#171717` dark | Inputs |
| `--aurora-nav-bg` | `--sidebar` | EvoDesk rail only |
| `--aurora-hover-bg` | Neutral mix / `#1f1f1f` dark | No blue hover |
| `--aurora-shell-bg` | `--evosales-canvas-soft` | **No cyan radial wash** |

### Brand & accent

| Aurora token | EvoTechly source | Notes |
|--------------|------------------|-------|
| `--aurora-accent-primary` | `--evosales-mark` `#EC6025` | **Not Aurora cyan** |
| `--aurora-accent-button` | `--evosales-mark` | Filled CTAs |
| `--aurora-accent-foreground` | `#ffffff` | On orange buttons |
| `--axon-orange` | `--evosales-mark` | Ask Evo / AI surfaces |
| `--aurora-focus-ring` | orange color-mix | Focus rings |

### Typography

| Aurora token | EvoSales source |
|--------------|-----------------|
| `--aurora-font-sans` | Geist Sans (`--font-sans`) |
| `--aurora-font-display` | Geist Sans |
| Product scale | `--text-page-title`, `--text-ui`, etc. (unchanged) |

### Status (unchanged from Aurora muted palette)

| Aurora token | Usage |
|--------------|-------|
| `--aurora-success` | Healthy / complete |
| `--aurora-warn` | Caution |
| `--aurora-error` | Destructive / failure |
| `--sidebar-online` `#22C55E` | Presence only — **not brand** |

## Component mapping

Phase 1 installs tokens + component CSS only. UI primitives migrate incrementally.

| EvoSales (current) | Aurora equivalent | Migration | EvoTechly customization |
|------------------|-------------------|-----------|---------------------------|
| `@/components/ui/button` | `@aurora/aurora-button` → `@/components/ui/aurora/button` | Phase 2 — replace impl, map variants | `default` → `aurora` + orange bridge |
| `@/components/ui/badge` | `@aurora/aurora-badge` | Phase 2 | Brand = mark, not cyan |
| `@/components/ui/input` | `@aurora/aurora-input` | Phase 2 | Hairline borders |
| `@/components/ui/textarea` | `@aurora/aurora-textarea` | Phase 2 | — |
| `@/components/ui/card` | `@aurora/aurora-card` | Phase 2 | Canvas surfaces |
| `@/components/ui/dialog` | `@aurora/aurora-dialog` | Phase 3 | — |
| `@/components/ui/sheet` | Aurora drawer/sheet patterns | Phase 3 | Mobile nav, Ask Evo |
| `@/components/ui/sidebar` | `@aurora/aurora-sidebar` block | Phase 3 | EvoDesk rail tokens preserved |
| `@/components/ui/select` | `@aurora/aurora-select` | Phase 2 | — |
| `@/components/ui/tooltip` | `@aurora/aurora-tooltip` | Phase 2 | — |
| `@/components/ui/sonner` | `@aurora/aurora-sonner` | Phase 2 | — |
| `command-palette.tsx` | `@aurora/aurora-command-palette` | Phase 3 | ⌘K bar |
| `list-view-table.tsx` | `@aurora/aurora-data-table` | Phase 6 | Responsive row/card |
| `evo-kpi-card.tsx` | `@aurora/aurora-stat-card` | Phase 5 | EvoViz chart colors |
| `ask-evo-panel.tsx` | `@aurora/aurora-prompt-input` block | Phase 4 | `--axon-orange` |
| `adaptive-workspace-shell.tsx` | Aurora PillGroup tabs + sheet | Phase 4 | Responsive Craft matrix |

**Rule:** One canonical component per primitive. No `EvoButton` / `AuroraButton` / `LegacyButton` coexistence after migration.

### shadcn → Aurora variant mapping (Button, Phase 2)

| shadcn `variant` | Aurora `variant` | `filled` |
|------------------|------------------|----------|
| `default` | `aurora` | `true` |
| `outline` | `neutral` | `false` |
| `secondary` | `neutral` | `false` |
| `ghost` | `ghost` | — |
| `destructive` | `destructive` | `true` |
| `link` | `plain` | — |

## Migration phases

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Registry, tokens, bridge, docs | **Done** (PR #86) |
| **2** | Core primitives — canonical `@/components/ui/*` → Aurora adapters | **Done** |
| **3** | Application shell — command bar Aurora Button/CommandPalette | **Done** |
| **4** | Contact Detail — Aurora tabs, cards, avatar, Ask Evo card + mobile Sheet | **Done** |
| **5** | Home dashboard — StatCard KPIs, Aurora dashboard sections | **Done** |
| **6** | Tables/forms/drawers — list card rows @480px, Sheet via Aurora | **Done** |
| **7** | Remaining modules inherit via ui adapters; sidebar keeps EvoDesk rail | **Done** |

Each phase: typecheck, lint, build, viewport spot-check (280 / 375 / 768 / 1024 / 1440).

## Responsive strategy

Structural breakpoints (from `responsive-architecture.md`):

| Viewport | Shell | Contact detail |
|----------|-------|----------------|
| `< 768px` | Sheet nav | Panel switcher: Details · Activity · Related |
| `768–1023px` | Collapsed rail | Center + right; left via tab |
| `≥ 1024px` | Full sidebar | Three-column workspace |

### Design forks (documented decisions)

**Contact contextual rail (mobile)**

- Option A — tabs inside Activity
- Option B — drawer from header “Related”
- Option C — stacked sections below activity
- **Selected: B (existing AdaptiveWorkspaceShell “Related” tab)** — preserves activity focus; related content one tap away without permanent width cost.

**Ask Evo (mobile)**

- **Selected: Sheet / full-height panel** — not hidden; uses Aurora sheet primitive in Phase 4.

**Deal stage rail (mobile)**

- **Selected: Vertical stage stack in right rail** (implemented PR #83) — no page-level horizontal scroll.

## Container queries

Use `@container` on reusable panels when migrating Aurora cards:

- Dashboard KPI tiles
- Activity list items
- Deal cards in contextual rail
- Table cells → card rows on narrow containers

Viewport breakpoints remain for **shell** changes only.

## Accessibility

Aurora components ship focus rings, `aria-busy`, reduced-motion guards. When migrating:

- Preserve keyboard order in command bar and record header
- Focus trap in Sheet/Dialog
- 44px minimum touch targets on mobile actions (PR #84)
- Do not regress screen-reader labels on record chrome

## Install commands (reference)

```bash
# Already in components.json:
# "registries": { "@aurora": "https://aurora.tootie.tv/r/{name}.json" }

# Foundation (Phase 1)
npx shadcn@latest add @aurora/aurora-tokens @aurora/aurora-components

# Next primitives (Phase 2)
npx shadcn@latest add @aurora/aurora-button @aurora/aurora-badge @aurora/aurora-input
```

Production should pin a git commit per [Aurora versioning docs](https://github.com/dinglebear-ai/aurora/blob/main/docs/versioning.md).

## Validation checklist (Phase 1)

- [x] Aurora registry configured
- [x] Tokens + component CSS vendored
- [x] EvoTechly bridge — orange primary, no navy body
- [x] EvoSales desktop tokens unchanged at 1440px
- [x] Aurora Button installed + shadcn adapter
- [x] Contact detail on Aurora primitives (tabs, cards, avatar, Ask Evo)
- [x] Home KPI strip uses Aurora StatCard
- [x] List tables: card rows below 480px container width
- [x] Command palette uses Aurora CommandPalette block

## Related docs

- [`docs/brandbook/design-tokens.md`](../brandbook/design-tokens.md)
- [`docs/visual-system/responsive-architecture.md`](./responsive-architecture.md)
- [`docs/visual-system/home-dashboard-patterns.md`](./home-dashboard-patterns.md)
- [`docs/visual-system/datatable-migration.md`](./datatable-migration.md)
