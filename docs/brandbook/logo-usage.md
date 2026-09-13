# EvoCrm logo usage

## Files

| File | Path | Use |
|------|------|-----|
| Mark | `public/brand/evocrm/logo.svg` | Sidebar, favicon (`public/favicon.svg`), auth screens |
| Legacy Evotechly mark | `public/brand/evotechly/mark.svg` | Retired from product chrome |

## Mark rules

1. **Fill is `#d9500f` in the SVG artwork** — baked into paths, not `currentColor`
2. **Do not recolor** the mark for light/dark mode — orange stays orange
3. **Do not** add gradients, shadows, or outlines to the mark
4. Minimum clear space: height of mark on all sides
5. Product name in UI wordmarks: `EvoCrm`

## Component reference

[`resources/js/components/app-logo-icon.tsx`](../../resources/js/components/app-logo-icon.tsx) renders the mark. [`tests/Feature/BrandingTest.php`](../../tests/Feature/BrandingTest.php) asserts:

- Mark file exists and contains `#d9500f`
- Mark does **not** use `fill="currentColor"`
- Favicon contains `#d9500f`

## Forbidden

- White or black monochrome variants of the mark (unless a future brandbook explicitly adds approved alternates)
- Stretching or rotating the mark
- Placing mark on busy photography without sufficient contrast
- Using antique `#EC6025` or marketing `#FF6A00` for the mark — artwork is `#d9500f`
