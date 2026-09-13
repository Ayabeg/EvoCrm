# Aurora motion (MOTION 3)

Calm product motion for EvoCrm. Tokens live in `resources/js/components/aurora.css`. Product overrides live in `resources/css/aurora-motion.css` (imported last from `app.css`).

**Dials:** MOTION 3 · VARIANCE 4 · DENSITY 8  
**Palette:** paper `#eaeaea` · ink `#000000` · accent `#d9500f`

## Contract

| Rule | Value |
|------|--------|
| Properties | `transform` and `opacity` only (color/background may fade with the same timing) |
| Duration | 200–300ms (`--motion-duration-fast` 160ms / `--motion-duration-medium` 240ms) |
| Easing | `--motion-ease-out` `cubic-bezier(0.2, 0.8, 0.2, 1)` — no bounce |
| CTA press | `scale(0.98)` on `.aurora-btn:active` |
| Rail press | `scale(0.97)` on `.app-rail-item:active` |
| Drawer | Sheet open 300ms / close 200ms; `[data-aurora=drawer]` |
| Toast | Sonner enter 240ms `translateY(8px) → 0` + opacity (`.aurora-toast-enter`) |
| Reduced motion | `prefers-reduced-motion: reduce` kills transition/animation/transform |

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
