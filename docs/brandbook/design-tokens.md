# EvoCrm design tokens

Extracted from [`resources/css/app.css`](../../resources/css/app.css) — the live implementation. All hex values below are **actual shipped tokens**, not inferred.

## Core palette (`:root` / Light Cabinet)

| Token | CSS variable | Hex | Tailwind alias | Usage |
|-------|--------------|-----|----------------|-------|
| Canvas / paper | `--evosales-canvas` | `#eaeaea` | `bg-canvas`, `bg-card` | Surfaces, cards, popovers |
| Canvas soft / paper | `--evosales-canvas-soft` | `#eaeaea` | `bg-background`, `bg-canvas-soft` | Page wash |
| Ink | `--evosales-ink` | `#000000` | `text-ink`, `text-foreground` | Headlines, body, filled primary CTAs |
| Mute | `--evosales-mute` | `#525252` | `text-mute`, `text-muted-foreground` | Labels, hints, secondary |
| Hairline | `--evosales-hairline` | `#d4d4d4` | `border-hairline`, `border-border` | Dividers, inputs — subtle on paper |
| Mark / brand accent | `--evosales-mark` | `#d9500f` | `text-brand`, `border-brand` | Mark, active rail, focus, product chrome |
| Mark hover | `--evosales-mark-hover` | `#bf460d` | — | Accent hover |
| Mark pressed | `--evosales-mark-pressed` | `#a93e0c` | — | Accent pressed |
| Ink hover | `--evosales-ink-hover` | `#1a1a1a` | — | Filled CTA hover |
| Primary on ink | `--primary-foreground` | `#FFFFFF` | `text-primary-foreground` | Filled button label |

## Dark Cabinet (`.dark`)

| Token | CSS variable | Hex | Usage |
|-------|--------------|-----|-------|
| Canvas (elevated) | `--evosales-canvas` | `#0A0A0A` | Cards on true-black page |
| Canvas soft (page) | `--evosales-canvas-soft` | `#000000` | App background — true black, never navy |
| Ink | `--evosales-ink` | `#F5F5F5` | Primary text |
| Mute | `--evosales-mute` | `#A3A3A3` | Secondary text |
| Hairline | `--evosales-hairline` | `#1F1F1F` | Borders, dividers |
| Mark | `--evosales-mark` | `#d9500f` | Unchanged — accent only |
| Primary | `--primary` | `#000000` | Filled CTAs stay ink black |
| Primary on ink | `--primary-foreground` | `#FFFFFF` | CTA text on black buttons |
| Secondary / muted fill | `--secondary`, `--muted`, `--accent` | `#171717` | Muted surfaces one step above card |

## Semantic (shadcn mapping)

| Semantic | Light source | Dark override | Notes |
|----------|--------------|---------------|-------|
| `--background` | `--evosales-canvas-soft` | `--evosales-canvas-soft` (#000) | Page background |
| `--foreground` | `--evosales-ink` | `--evosales-ink` | |
| `--card` | `--evosales-canvas` | `--evosales-canvas` (#0A0A0A) | |
| `--primary` | `#000000` | `#000000` | Filled CTAs — ink, not mark |
| `--ring` | `--evosales-mark` | `--evosales-mark` | Focus rings |
| `--destructive` | `oklch(0.577 0.245 27.325)` | same | Delete flows only — **not brand** |
| `--radius` | `0.5rem` | same | Default `rounded-md`; controls `rounded-sm` |

## Sidebar rail (Apple / Aurora Light Cabinet, sidebar-only)

These tokens **never leak into content panels**.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--sidebar` | `#000000` | `#000000` | Rail background — true black |
| `--sidebar-foreground` | `#D4D4D4` | `#A3A3A3` | Nav labels |
| `--sidebar-accent` | `rgba(217, 80, 15, 0.22)` | `rgba(217, 80, 15, 0.22)` | Active row — EvoCrm accent pill |
| `--sidebar-accent-foreground` | `#F5F5F5` | `#F5F5F5` | Active label |
| `--sidebar-border` | `#1F1F1F` | `#1F1F1F` | Rail divider |
| `--sidebar-ring` | `#d9500f` | `#d9500f` | Rail focus — product accent |
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

No Aurora teal, Kommo blue, Slate `#2E3A45`, or antique `#EC6025`. There is **no EvoCrm color ramp** beyond paper/ink/accent/mute/hairline.

## Forbidden in product UI

- Navy, indigo, teal in dark tokens (guarded in `app.css` comments)
- Slate `#2E3A45` or antique orange `#EC6025` as CRM identity
- Second brand accent (green `#22C55E` is online-status only)
- Purple AI gradients (Ask Evo uses subtle orange radial only)
- Recoloring the EvoCrm mark
- Inventing colors beyond paper + black + accent (+ destructive red)

## Brand rules (summary)

- **Palette:** `#eaeaea` paper + `#000000` ink + `#d9500f` accent
- **Accent ratio:** mark, active rail, focus, charts — not filled primary CTAs
- **Filled CTAs:** ink `#000000` with white label
- **Dark mode:** true black `#000000` canvas, neutral grays only (zero chroma except accent)
- **Money:** `.money` utility — `font-variant-numeric: tabular-nums`
