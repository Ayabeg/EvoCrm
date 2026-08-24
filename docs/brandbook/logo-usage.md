# Evotechly logo usage

## Files

| File | Path | Use |
|------|------|-----|
| Mark | `public/brand/evotechly/mark.svg` | Sidebar 24px, favicon (`public/favicon.svg`), auth screens |
| Lockup | `public/brand/evotechly/evotechly.svg` | Full wordmark where space allows |

## Mark rules

1. **Fill is `#EC6025` in the SVG artwork** — baked into paths, not `currentColor`
2. **Do not recolor** the mark for light/dark mode — orange stays orange
3. **Do not** add gradients, shadows, or outlines to the mark
4. Minimum clear space: height of mark on all sides
5. Product name in UI: `EvoSales · Evotechly` (`config('app.name')`)

## Component reference

[`resources/js/components/app-logo-icon.tsx`](../../resources/js/components/app-logo-icon.tsx) renders the mark inline. [`tests/Feature/BrandingTest.php`](../../tests/Feature/BrandingTest.php) asserts:

- Mark file exists and contains `#EC6025`
- Mark does **not** use `fill="currentColor"`
- Favicon contains `#EC6025`

## Forbidden

- White or black monochrome variants of the mark (unless a future brandbook explicitly adds approved alternates)
- Stretching or rotating the mark
- Placing mark on busy photography without sufficient contrast
- Using marketing `#FF6A00` for the mark — artwork is `#EC6025`
