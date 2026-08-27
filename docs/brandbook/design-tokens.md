# Evotechly design tokens

Extracted from [`resources/css/app.css`](../../resources/css/app.css) @ `main` — the live implementation. All hex values below are **actual shipped tokens**, not inferred.

## Core palette (`:root` / Light Cabinet)

| Token | CSS variable | Hex | Tailwind alias | Usage |
|-------|--------------|-----|----------------|-------|
| Canvas | `--evosales-canvas` | `#FFFFFF` | `bg-canvas`, `bg-card` | Cards, main panels, popovers |
| Canvas soft | `--evosales-canvas-soft` | `#F7F7F6` | `bg-background`, `bg-canvas-soft` | Page wash only — not card fill |
| Ink | `--evosales-ink` | `#111111` | `text-ink`, `text-foreground` | Headlines, body |
| Mute | `--evosales-mute` | `#525252` | `text-mute`, `text-muted-foreground` | Labels, hints, secondary |
| Hairline | `--evosales-hairline` | `#E5E5E5` | `border-hairline`, `border-border` | Dividers, inputs |
| Mark / brand orange | `--evosales-mark` | `#EC6025` | `text-brand`, `bg-primary`, `border-brand` | CTAs, links, active tab pip, focus ring |
| Primary on orange | `--primary-foreground` | `#FFFFFF` | `text-primary-foreground` | Filled buttons (light face) |

## Dark Cabinet (`.dark`)

| Token | CSS variable | Hex | Usage |
|-------|--------------|-----|-------|
| Canvas (elevated) | `--evosales-canvas` | `#0A0A0A` | Cards on true-black page |
| Canvas soft (page) | `--evosales-canvas-soft` | `#000000` | App background — true black, never navy |
| Ink | `--evosales-ink` | `#F5F5F5` | Primary text |
| Mute | `--evosales-mute` | `#A3A3A3` | Secondary text |
| Hairline | `--evosales-hairline` | `#1F1F1F` | Borders, dividers |
| Mark | `--evosales-mark` | `#EC6025` | Unchanged — only action color |
| Primary on orange | `--primary-foreground` | `#FFFFFF` | CTA text on orange buttons |
| Secondary / muted fill | `--secondary`, `--muted`, `--accent` | `#171717` | Muted surfaces one step above card |

## Semantic (shadcn mapping)

| Semantic | Light source | Dark override | Notes |
|----------|--------------|---------------|-------|
| `--background` | `--evosales-canvas-soft` | `--evosales-canvas-soft` (#000) | Page background |
| `--foreground` | `--evosales-ink` | `--evosales-ink` | |
| `--card` | `--evosales-canvas` | `--evosales-canvas` (#0A0A0A) | |
| `--primary` | `--evosales-mark` | `--evosales-mark` | |
| `--ring` | `--evosales-mark` | `--evosales-mark` | Focus rings |
| `--destructive` | `oklch(0.577 0.245 27.325)` | same | Delete flows only — **not brand** |
| `--radius` | `0.5rem` | same | Default `rounded-md`; controls `rounded-sm` |

## Sidebar rail (Apple / Aurora Light Cabinet, sidebar-only)

These tokens **never leak into content panels**.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--sidebar` | `#000000` | `#000000` | Rail background — true black |
| `--sidebar-foreground` | `#D4D4D4` | `#A3A3A3` | Nav labels |
| `--sidebar-accent` | `rgba(255, 255, 255, 0.10)` | `rgba(255, 255, 255, 0.10)` | Active row — soft pill, not an orange bar |
| `--sidebar-accent-foreground` | `#F5F5F5` | `#F5F5F5` | Active label |
| `--sidebar-border` | `#1F1F1F` | `#1F1F1F` | Rail divider |
| `--sidebar-ring` | `rgba(255, 255, 255, 0.28)` | `rgba(255, 255, 255, 0.28)` | Rail focus — orange stays on CTAs |
| `--sidebar-well` | `#171717` | `#171717` | Search/compose well |
| `--sidebar-online` | `#22C55E` | `#22C55E` | Presence dot — **status only**, not brand accent |

## Chart series (EvoViz)

From [`resources/js/evoviz/contract.ts`](../../resources/js/evoviz/contract.ts):

| Slot | CSS variable | Allowed tones |
|------|--------------|---------------|
| 1 | `--evosales-mark` | `mark` |
| 2 | `--evosales-ink` | `ink` |
| 3 | `--evosales-mute` | `mute` |
| Hairline / grid | `--evosales-hairline` | — |

No Aurora teal, Kommo blue, or product-specific color ramps. There is **no EvoSales color ramp** beyond mark/ink/mute/hairline.

## Forbidden in product UI

- Navy, indigo, teal in dark tokens (guarded in `app.css` comments)
- Second brand accent (green `#22C55E` is online-status only)
- Purple AI gradients (Ask Evo uses subtle orange radial only)
- Recoloring the Evotechly mark
- Inventing colors beyond white + black + orange (+ destructive red)

## Brand rules (summary)

- **Palette:** white + black + orange only for brand surfaces
- **Orange ratio:** accent for actions, active states, links — not illumination
- **Dark mode:** true black `#000000` canvas, neutral grays only (zero chroma except orange)
- **Money:** `.money` utility — `font-variant-numeric: tabular-nums`
