# Aurora Integration Report

## 1. Aurora Discovery

Aurora is the real [dinglebear-ai/aurora](https://github.com/dinglebear-ai/aurora) shadcn registry (`https://aurora.tootie.tv/r/{name}.json`), already declared in `components.json` as `@aurora`.

It is **vendored**, not an npm package. There is no version pin. Source lives in:

- `resources/js/components/aurora.css`
- `resources/js/components/aurora-components.css`
- `resources/js/components/ui/aurora/*` (31 primitives)
- `resources/js/components/aurora/command-palette.tsx`
- `resources/js/components/aurora/prompt-input.tsx`

EvoTechly identity is applied by `resources/css/aurora-evotechly-bridge.css`. Brand Book remains the identity authority (orange mark, true-black cabinets, Geist). Aurora remains the component/implementation authority.

The official Aurora **Sidebar block** is a desktop `<nav>` with `items[]` + `onSelect`. It has **no mobile drawer**. Replacing `AppSidebar` with that block would be a product-IA rewrite and is out of scope. Mobile navigation correctly uses the vendored Aurora **Sheet**.

Full inventory: [`AURORA-AUDIT.md`](./AURORA-AUDIT.md).

## 2. Aurora Components

Installed and used via `@/components/ui/*` adapters (or direct import where noted):

Button, Badge, Input, Textarea, Select, NativeSelect, Checkbox, Switch, Tabs/PillGroup, Card, Dialog, Sheet, DropdownMenu, Popover, Tooltip, Label, Separator, Skeleton, Spinner, Avatar, Breadcrumb, Pagination, Toast, EmptyState, Field, Combobox, Listbox, Progress, Callout, StatCard, DataTable.

Blocks: Command Palette, Prompt Input.

**Not installed / not used this pass:** official Sidebar block, Drawer TSX (CSS only), Radio, FilterBar, Command primitive, Table primitive, Banner, ContextMenu, and the rest of the upstream 79-primitive catalog.

## 3. Aurora Tokens

| Source | Role |
|--------|------|
| `resources/js/components/aurora.css` | Upstream `--aurora-*` contract (navy/cyan defaults) |
| `resources/css/aurora-evotechly-bridge.css` | Remap to `--evosales-*` + EvoDesk rail literals |
| `resources/css/app.css` | Brand Book `--evosales-*`, `--sidebar-*`, `--text-*` |
| `resources/js/components/aurora-components.css` | Component styles reading `--aurora-*` only |

Runtime probe after the fix (light `:root`, built CSS):

```json
{
  "sidebar": "#000",
  "auroraNavBg": "#000",
  "swatchBg": "rgb(0, 0, 0)",
  "swatchColor": "rgb(212, 212, 212)"
}
```

`--sidebar` computes to opaque black. It is no longer cyclic.

## 4. EvoCRM Problems Found

| ID | Sev | Problem |
|----|-----|---------|
| P0-1 | P0 | Light-mode `--sidebar` ↔ `--aurora-nav-bg` cycle → invalid/transparent rail and mobile Sheet |
| P0-2 | P0 | Mobile `SheetHeader` rendered outside `SheetContent`; leftover div props spread onto `Sheet` |
| P1-1 | P1 | Aurora overwrite of `--sidebar-foreground` etc. on light `:root` (ink on black if cycle fixed without restoring rail tokens) |
| P1-2 | P1 | Decorative orange `--aurora-shell-bg` radials (Aurora-as-aesthetic) |
| P1-3 | P1 | Official Aurora Sidebar not a mobile primitive — must not replace EvoDesk |
| P1-4 | P1 | Aurora registry not SHA-pinned |
| P2-1 | P2 | Dual type scales; dual toast (Sonner + Aurora toast); local Alert/Avatar still coexist |
| P2-2 | P2 | `list-view-table` not on Aurora DataTable |
| P3-1 | P3 | Light dialog overlay `0.18` vs Brand `--sidebar-overlay` `0.8` (mobile nav now uses the Brand overlay) |

## 5. Changes Made

| File | Change | Reason |
|------|--------|--------|
| `docs/design-system/AURORA-AUDIT.md` | Authority map of the real Aurora | Phase 2 — do not invent |
| `docs/design-system/AURORA-INTEGRATION-REPORT.md` | This report | Phase 14 |
| `resources/css/aurora-evotechly-bridge.css` | Literal `--sidebar` / `--aurora-nav-bg` `#000000`; restore EvoDesk `--sidebar-*`; flatten `--aurora-shell-bg` | Break P0 cycle; Brand Book identity |
| `resources/js/components/ui/aurora/sheet.tsx` | Optional `overlayStyle` / `overlayClassName` | Let product nav set Brand overlay without forking Sheet |
| `resources/js/components/ui/sidebar.tsx` | Header inside `SheetContent`; `hideClose`; Brand overlay; opaque inner `bg-sidebar`; no props-on-Sheet | Root-cause mobile composition |
| `tests/Feature/AuroraTokenBridgeTest.php` | Guards literals + SheetHeader order | Regression guard |

No database, API, auth, or CRM calculation changes.

## 6. Mobile Bug Root Cause

Not a z-index bug. Not a missing opacity hack.

1. `aurora.css` sets `--sidebar: var(--aurora-nav-bg)`.
2. The bridge set `--aurora-nav-bg: var(--sidebar)`.
3. Light `:root` never re-asserted `--sidebar` as a hex after those imports. (`.dark` in `app.css` already did, so dark mode mostly escaped.)
4. Cyclic custom properties are invalid at computed-value time. `background: var(--sidebar)` on the mobile Sheet became **transparent**.
5. The Sheet also **overrode** Aurora’s opaque `--aurora-panel-strong` with that broken `--sidebar`.
6. Underlying dashboard painted through the drawer → “duplicated” nav/content, unreadable layering.
7. `SheetHeader` sat outside the portaled `SheetContent`, so dialog title/description were not in the overlay layer.

## 7. Mobile Bug Fix

- Bridge now sets **literals**: `--aurora-nav-bg: #000000` and `--sidebar: #000000`, plus the Brand Book rail foreground/accent/border tokens.
- Mobile Sheet uses that opaque `--sidebar`, an inner `bg-sidebar` fill, and `isolation: isolate` so the panel is its own stacking context.
- Overlay uses `--sidebar-overlay` (`rgba(0,0,0,0.8)`), not the light-mode 18% Aurora dialog wash.
- Title/description live **inside** `SheetContent`. Close is the existing “Close menu” control (`hideClose`); Escape and backdrop remain Radix Dialog behavior.
- One nav tree: desktop rail is `hidden md:block`; mobile is Sheet-only via `useIsMobile()` (767px).

Verified in a real browser (logged in as the seeded owner):

- Menu open: opaque black drawer, dimmed backdrop, page not printed through the nav.
- Close: backdrop, “Close menu”, Escape.
- No click-through. No horizontal overflow. Body scroll locked while open.

## 8. Components Migrated

| Before | After | Reason |
|--------|-------|--------|
| shadcn Sidebar mobile Sheet, header outside content, `background: var(--sidebar)` (cyclic) | Same product rail + Aurora Sheet composed correctly | Official Aurora Sidebar has no mobile drawer; do not rewrite IA |
| Sheet overlay always `--aurora-overlay` | Optional `overlayStyle`; mobile nav uses `--sidebar-overlay` | Brand Book rail overlay |
| Light `--aurora-shell-bg` orange radials | `var(--evosales-canvas-soft)` | Stop treating Aurora as a decorative wash |

No `AuroraButton.tsx` (or similar) was created. Canonical `@/components/ui/button` already wraps the real Aurora Button.

## 9. Tokens Migrated

| Category | Before | After | Source |
|----------|--------|-------|--------|
| Rail fill | `--sidebar: var(--aurora-nav-bg)` + `--aurora-nav-bg: var(--sidebar)` (invalid in light) | `#000000` both | Brand Book EvoDesk rail |
| Rail text | Aurora `--aurora-text-primary` after remap (`#111111` light) | `#d4d4d4` / `#a3a3a3` dark | Brand Book `--sidebar-foreground` |
| Rail accent | Aurora hover/cyan remap | `rgba(236, 96, 37, 0.22)` light / `#171717` dark | Brand Book |
| Page shell | Orange radial wash | `--evosales-canvas-soft` | Brand Book canvas |
| Mobile overlay | `--aurora-overlay` 18% light | `--sidebar-overlay` 80% | Brand Book |
| Mobile shadow | Hardcoded `0 24px 48px rgba(0,0,0,0.32)` | `var(--aurora-shadow-strong)` | Aurora token (bridged) |

## 10. Responsive Verification

| Width | Result |
|-------|--------|
| 320 | Pass — trigger + opaque Sheet |
| 375 | Pass — opaque Sheet, Escape/backdrop/close, no leak, one tree |
| 390 | Pass — same; contacts remain a data table |
| 430 | Pass |
| 768 | Pass — icon rail (`md`), not a broken overlay |
| 1024 | Pass — rail, not mobile Sheet |
| 1280 | Pass — full rail, collapse works |
| 1440 | Pass |
| 1920 | Pass |

## 11. Accessibility Verification

- Radix Dialog: focus trap, `aria-modal`, Escape, backdrop click.
- `SheetTitle` / `SheetDescription` now inside the dialog (sr-only).
- “Close menu” remains a visible control; default Sheet X is hidden via `hideClose` (product already had a close row).
- `prefers-reduced-motion` still in `aurora.css` for `.aurora-*`.
- Keyboard `⌘/Ctrl+B` still toggles the sidebar.
- Touch targets on rail rows remain `min-h-11`.

## 12. Files Changed

- `docs/design-system/AURORA-AUDIT.md`
- `docs/design-system/AURORA-INTEGRATION-REPORT.md`
- `resources/css/aurora-evotechly-bridge.css`
- `resources/js/components/ui/aurora/sheet.tsx`
- `resources/js/components/ui/sidebar.tsx`
- `tests/Feature/AuroraTokenBridgeTest.php`

## 13. Remaining Violations

Intentionally left (stop conditions / no mass rewrite):

- Official Aurora Sidebar block not installed (wrong API; no mobile).
- Aurora Drawer TSX not installed (Sheet covers mobile nav).
- `list-view-table` not migrated to Aurora DataTable.
- Local `alert.tsx`, `avatar.tsx`, `sonner.tsx` still coexist with Aurora equivalents.
- Aurora registry not SHA-pinned.
- Dual type scales (Brand `--text-*` vs Aurora `--aurora-type-*`).
- Rose / cyan families remain in the vendored Aurora contract (unused as brand).

## 14. Remaining Risks

- **Wayfinder:** `npm run types:check` needs `php artisan wayfinder:generate --with-form` (generated files are gitignored).
- **ESLint:** `npm run lint:check` still reports 12 pre-existing `import/order` errors in auth/settings files. None are in files from this change. Aurora `ui/aurora/*` and `sidebar.tsx` are ESLint-ignored.
- **Pinning:** Upstream registry URLs are mutable; vendored files can drift.
- **Light overlay:** Non-nav dialogs still use 18% `--aurora-overlay` (Aurora light default). Only mobile nav uses `--sidebar-overlay`.

### Verification commands

| Check | Result |
|-------|--------|
| `php artisan test --compact tests/Feature/AuroraTokenBridgeTest.php` | Pass (2) |
| `tests/Feature/BrandingTest.php` + `DashboardTest.php` + `HomeCommandCenterTest.php` + `CrmCreateDrawerTest.php` | Pass |
| `npm run types:check` (after wayfinder `--with-form`) | Pass |
| `npm run lint:check` | Fail — 12 pre-existing `import/order` errors, documented |
| `npm run build` | Pass |
| Browser (seeded `owner@evosales.local`) | Pass — see §10 |
