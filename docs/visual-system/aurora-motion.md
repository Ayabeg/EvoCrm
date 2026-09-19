# Aurora motion (MOTION 3) → P27

Calm product motion for EvoCrm. **P27 is authoritative** for product chrome: [`docs/motion/P27-CONTRACT.md`](../motion/P27-CONTRACT.md).

Tokens live in `resources/css/app.css` (P27 roles) and `resources/js/components/aurora.css` (easing). Product overrides live in `resources/css/aurora-motion.css` (imported last from `app.css`).

**Dials:** MOTION 3 · VARIANCE 4 · DENSITY 8  
**Palette:** paper `#eaeaea` · ink `#000000` · accent `#d9500f`

## Contract

| Rule | Value |
|------|--------|
| Properties | `transform` and `opacity` only (color/background may fade with the same timing) |
| Duration | Hover 120ms · dropdown/page 150ms · modal 180ms · drawer 200ms |
| Easing | `--motion-ease-out` `cubic-bezier(0.2, 0.8, 0.2, 1)` — no bounce |
| CTA press | `scale(0.98)` on `.aurora-btn:active` |
| Rail press | `scale(0.97)` on `.app-rail-item:active` |
| Drawer | Sheet open/close 200ms; `[data-aurora=drawer]` |
| Toast | Sonner enter 150ms `translateY(8px) → 0` + opacity (`.aurora-toast-enter`) |
| Reduced motion | `prefers-reduced-motion: reduce` kills decorative transition/animation |

## Out of scope

- Framer page transitions
- Scroll hijacks
- Bounce / overshoot / money-style physics
- Perpetual loops on CRM chrome

## Surfaces

| Surface | How |
|---------|-----|
| Buttons | Unlayered `.aurora-btn` press scale in `aurora-motion.css` |
| Icon rail | `.app-rail-item` + `data-active` on `AppSidebar` |
| Create drawer | Aurora `Sheet` durations + `data-aurora="drawer"` on `CreateDrawer` |
| Toast | Sonner `duration={4000}` + `aurora-toast-enter` |

Aurora’s own `prefers-reduced-motion` guard in `aurora.css` still applies to `.aurora-*` trees.
