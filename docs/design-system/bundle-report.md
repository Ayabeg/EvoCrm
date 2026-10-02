# Bundle report — PR12 vs main `56b47f53`

Measured with `npm run build` (Vite 8 production client build). Sizes are minified, then gzip.

## Removed dependencies

| Package | Why |
|---|---|
| `lucide-react` | Phosphor via `@/evo/icons` is the only product icon set. |
| `tw-animate-css` | Replaced by `resources/js/evo/tokens/motion-utilities.css` (`--evo-duration-normal` / `--evo-ease`). |
| `@fontsource/inter` | Already gone before PR12. Geist remains. |

`@/components/ui/*` and `@/ds/components/*` re-export shims are deleted. Production imports `@/evo/ui/*` (empty states: `@/evo/patterns/empty-state`). Leftover `components/ui` files are implementations only: sidebar, sonner, empty-illustration, breadcrumb, input-otp, navigation-menu, morphing-popover.

## Entry / CSS (before → after)

| Asset | Before (main `56b47f53`) | After (this PR) | Δ gzip |
|---|---|---|---|
| `app-*.js` | 497.85 kB / 165.29 kB gzip | 499.16 kB / 165.57 kB gzip | +0.28 kB |
| `main-*.js` | 573.05 kB / 148.64 kB gzip | 573.26 kB / 148.61 kB gzip | −0.03 kB |
| `a11y-*.js` | 672.84 kB / 207.81 kB gzip | 672.84 kB / 207.81 kB gzip | 0 |
| `app-*.css` | 227.27 kB / 36.15 kB gzip | 223.93 kB / 35.41 kB gzip | −0.74 kB |
| `design-lab-*.css` | 152.34 kB / 25.49 kB gzip | 151.66 kB / 25.04 kB gzip | −0.45 kB |

## Top JS chunks before (main `56b47f53`)

| Chunk | Size | gzip |
|---|---|---|
| `a11y-*.js` | 672.84 kB | 207.81 kB |
| `main-*.js` | 573.05 kB | 148.64 kB |
| `app-*.js` | 497.85 kB | 165.29 kB |
| `charts-*.js` | 438.08 kB | 122.67 kB |
| `rich-text-editor-*.js` | 403.67 kB | 128.09 kB |
| `markdown-*.js` | 155.81 kB | 46.71 kB |
| `ai-*.js` | 102.35 kB | 26.86 kB |
| `settings-layout-*.js` | 84.61 kB | 24.29 kB |
| `calendar-*.js` | 74.48 kB | 21.79 kB |
| `data-grid-*.js` | 61.18 kB | 17.02 kB |

## Top JS chunks after (this PR)

| Chunk | Size | gzip |
|---|---|---|
| `a11y-*.js` | 672.84 kB | 207.81 kB |
| `main-*.js` | 573.26 kB | 148.61 kB |
| `app-*.js` | 499.16 kB | 165.57 kB |
| `charts-*.js` | 438.08 kB | 122.67 kB |
| `rich-text-editor-*.js` | 403.67 kB | 128.09 kB |
| `markdown-*.js` | 155.81 kB | 46.71 kB |
| `ai-*.js` | 102.35 kB | 26.86 kB |
| `settings-layout-*.js` | 84.61 kB | 24.29 kB |
| `calendar-*.js` | 74.48 kB | 21.79 kB |
| `data-grid-*.js` | 61.18 kB | 17.02 kB |

Dropping `lucide-react` and `tw-animate-css` did not shrink the largest JS entries (icons were already Phosphor; motion CSS is inlined). App CSS is slightly smaller after token-class replacements.
