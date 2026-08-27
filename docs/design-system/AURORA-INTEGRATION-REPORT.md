# Aurora Integration Report

## 1. Aurora Discovery

Aurora is the real [dinglebear-ai/aurora](https://github.com/dinglebear-ai/aurora) shadcn registry (`https://aurora.tootie.tv/r/{name}.json`), already declared in `components.json` as `@aurora`.

It is **vendored**, not an npm package. The exact upstream revision is pinned in `resources/js/components/ui/aurora/SOURCE.json`:

`fa53183f7e9a790391198424b8b90afb4b5fa50c` (2026-07-13, “align AI automation accent to Axon orange”).

Source lives in:

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

## 13. Remaining Violations (after follow-up)

Intentionally left (stop conditions / no mass rewrite):

- Official Aurora Sidebar block not installed (wrong API; no mobile). **EvoDesk IA unchanged.**
- Aurora Drawer TSX not installed (Sheet covers mobile nav).
- `list-view-table` not migrated to Aurora DataTable. **Intentional.**
- Aurora toast primitive remains unused at the application layer (Sonner is canonical). Documented, not deleted.
- Local `alert.tsx` compound API remains for non-form-error call sites; AlertError now uses Callout.
- Rose family and Aurora status `--aurora-info` cyan remain in the vendored contract (status / secondary, not Brand identity).
- Non-nav dialogs still use 18% `--aurora-overlay`. Only mobile nav uses `--sidebar-overlay`.

## 14. Remaining Risks

- **Wayfinder:** `npm run types:check` needs `php artisan wayfinder:generate --with-form` (generated files are gitignored).
- **ESLint:** `npm run lint:check` still reports 12 pre-existing `import/order` errors in auth/settings files. None are in files from this change. Aurora `ui/aurora/*` and `sidebar.tsx` are ESLint-ignored.
- **Upstream drift:** Registry URLs are mutable. The pin is the git SHA in `SOURCE.json`, not `latest`.
- **Light overlay:** Non-nav dialogs still use 18% `--aurora-overlay` (Aurora light default).

---

## Follow-up — P1–P3 ownership cleanup

PR #101 already established the foundation. This follow-up does **not** redesign EvoCRM, replace EvoDesk, or migrate CRM tables. It fixes remaining token/component ownership.

### 1. Changes made

| Change | What | Why | Authority |
|--------|------|-----|-----------|
| Identity reasserted on `:root, .light` | Same Brand remaps now apply if Aurora's `.light` class is ever set | Aurora navy/cyan still loads first; Brand must win after | Brand Book |
| Accent surface tokens remapped | `--aurora-accent-primary-surface/border/foreground` recomputed from orange | Those names still said “cyan” even after accent remapped | Brand Book |
| Dark accent gradient remapped | `--aurora-accent-gradient` reasserted in `.dark` | Dark inherited Aurora's cyan-stop gradient definition | Brand Book |
| Font cycle broken | `--aurora-font-*` and `--font-sans` are Geist **literals** | `aurora.css` sets `--font-sans: var(--aurora-font-sans)`; pointing back at `--font-sans` is the sidebar cycle class | Brand Book (face) |
| Type scale bridged | Overlapping `--aurora-type-*` map to `--text-*` | Two scales rendered the same sizes independently | Brand Book size + Aurora primitive consumption |
| Toast ownership | Sonner remains the app bus; Aurora toast stays a primitive | Dual systems; flash toasts already use Sonner | EvoSales notifications / Aurora primitive |
| Avatar wrapper | `ui/avatar` consumes Aurora Avatar; muted Brand chrome by default | Local Radix avatar duplicated the primitive | Aurora primitive + EvoSales wrapper |
| Alert / Callout | AlertError uses Callout `error`; local Alert keeps compound API on Aurora error tokens | Callout is the status primitive; do not blindly replace every Alert | Aurora Callout + EvoSales form-error wrapper |
| Home chrome | Product panels/links use `--evosales-*` Tailwind aliases; `.aurora-text-*` classes kept | Home was coupled to Aurora implementation tokens | Brand Book identity; Aurora type utilities |
| SHA pin | `ui/aurora/SOURCE.json` records `fa53183…` + update procedure | Vendored copy had no revision | Reproducibility |

**Not changed:** ListViewTable, AppSidebar / EvoDesk IA, business logic, P0 rail literals (`--sidebar` / `--aurora-nav-bg` `#000000`).

### 2. Files changed (follow-up)

- `resources/css/aurora-evotechly-bridge.css`
- `resources/js/components/ui/avatar.tsx`
- `resources/js/components/ui/alert.tsx`
- `resources/js/components/alert-error.tsx`
- `resources/js/components/ui/sonner.tsx`
- `resources/js/components/ui/aurora/toast.tsx` (ownership comment only)
- `resources/js/components/ui/aurora/SOURCE.json` (new)
- `resources/js/pages/home.tsx`
- `resources/js/components/dashboard/dashboard-header.tsx`
- `resources/js/components/dashboard/attention-list.tsx`
- `resources/js/components/dashboard/activity-feed.tsx`
- `tests/Feature/AuroraTokenBridgeTest.php`
- `docs/design-system/AURORA-INTEGRATION-REPORT.md`

### 3. Token changes

| Token | Before | After | Owner |
|-------|--------|-------|-------|
| `--aurora-font-sans` / `--font-sans` | `var(--font-sans)` ↔ `var(--aurora-font-sans)` (cycle) | Geist literals | Brand Book |
| `--aurora-type-body` | `14px` (Aurora default) | `var(--text-ui-relaxed)` (14px) | Brand Book size |
| `--aurora-type-body-sm` / `--control` / `--table` | `13px` | `var(--text-ui)` (13px) | Brand Book size |
| `--aurora-type-caption` | `11px` | `var(--text-section-label)` (11px) | Brand Book size |
| `--aurora-type-label` / `--micro` | `12px` / `10.5px` | **unchanged** — no Brand equivalent | Aurora |
| `--aurora-accent-primary-surface` etc. | color-mix of whatever accent was in scope | color-mix of remapped orange | Brand Book |
| `--aurora-accent-gradient` (`.dark`) | inherited Aurora cyan stops | remapped orange lift/button | Brand Book |
| `--sidebar` / `--aurora-nav-bg` | `#000000` literals | **unchanged** | Brand Book rail |

`--aurora-info` stays Aurora status cyan. It is not product identity.

### 4. Component changes

| Surface | Decision |
|---------|----------|
| Toast | **Sonner** is the canonical application toaster (`app.tsx` + `useFlashToast`). Aurora `toast.tsx` remains available and unused. Do not mount both. |
| Avatar | **Aurora Avatar** is the primitive. `ui/avatar.tsx` is a compound adapter (ink tone, no accent ring) for user chrome. Contact show already imported Aurora directly. |
| Alert / Callout | **Callout** is the canonical status primitive. `AlertError` now uses it. `ui/alert.tsx` remains the compound form-error adapter, painted with Aurora error tokens. |
| ListViewTable | Untouched. Aurora DataTable stays a primitive. |
| EvoDesk / AppSidebar | Untouched. Official Aurora Sidebar block stays uninstalled. |

### 5. Aurora SHA / revision

| Field | Value |
|-------|-------|
| Source | https://github.com/dinglebear-ai/aurora |
| Registry | https://aurora.tootie.tv/r/{name}.json |
| License | AGPL-3.0-only |
| Revision | `fa53183f7e9a790391198424b8b90afb4b5fa50c` |
| Date | 2026-07-13T23:58:45Z |
| Match | Vendored `aurora.css` equals that commit's `registry/aurora/styles/aurora.css` minus the 4-line file header stripped by the shadcn registry payload |
| Pin file | `resources/js/components/ui/aurora/SOURCE.json` |
| Update | Follow `updateProcedure` in that file. Do not convert to npm. |

### 6. Mobile verification

Re-checked after this follow-up (P0 composition and rail literals were not modified):

- Opaque black drawer; dashboard does not show through
- Width ≈ 240px at 375+; at 320 uses `min(16rem, 86vw)` (~275px)
- Brand overlay (dark ~80%)
- SheetHeader inside SheetContent
- One navigation tree
- Close via backdrop, Close menu, Escape

| Width | Result |
|-------|--------|
| 320 | Pass |
| 375 | Pass |
| 390 | Pass |
| 430 | Pass |

### 7. Desktop verification

EvoDesk rail and ListViewTable were not modified. Home remains a dense command center. Accent links are `#EC6025`, not cyan.

| Width | Result |
|-------|--------|
| 768 | Pass — icon rail (`md`) |
| 1024 | Pass — rail, not mobile Sheet |
| 1280 | Pass — full rail |
| 1440 | Pass |
| 1920 | Pass |

Runtime probe (logged-in Home, computed styles):

```json
{
  "light": {
    "sidebar": "#000",
    "auroraNavBg": "#000",
    "auroraPageBg": "#f7f7f6",
    "auroraAccent": "#ec6025",
    "evosalesMark": "#ec6025",
    "fontSans": "\"Geist Sans\", Geist, ui-sans-serif, system-ui, sans-serif",
    "auroraFontSans": "\"Geist Sans\", Geist, ui-sans-serif, system-ui, sans-serif",
    "auroraTypeBody": ".872rem",
    "textUiRelaxed": ".872rem",
    "auroraShellBg": "#f7f7f6"
  },
  "dark": {
    "sidebar": "#000",
    "auroraNavBg": "#000",
    "auroraPageBg": "#000",
    "auroraAccent": "#ec6025",
    "evosalesMark": "#ec6025",
    "fontSans": "\"Geist Sans\", Geist, ui-sans-serif, system-ui, sans-serif",
    "auroraFontSans": "\"Geist Sans\", Geist, ui-sans-serif, system-ui, sans-serif",
    "auroraTypeBody": ".872rem",
    "textUiRelaxed": ".872rem",
    "auroraShellBg": "#000"
  }
}
```

No token cycle. No navy/cyan identity. Type scale renders as one system.

### 8. Tests

Guards added and passing:

- Font literals / no `--aurora-font-sans: var(--font-sans)`
- Type-scale mapping
- `:root, .light` identity reassert
- `SOURCE.json` 40-char SHA
- Home / dashboard chrome has no raw `--aurora-*`

### 9. Build

`npm run types:check` (after wayfinder `--with-form`) and `npm run build` passed.

### 10. Remaining P2/P3

- Aurora toast primitive unused (by design).
- Non-nav dialog overlay still 18% Aurora light default.
- Official Sidebar / DataTable / Drawer TSX still not product chrome.
- `--aurora-info` cyan remains as status, not brand.

### Verification commands (follow-up)

| Check | Result |
|-------|--------|
| `php artisan test --compact tests/Feature/AuroraTokenBridgeTest.php` | Pass (8) |
| `tests/Feature/BrandingTest.php` + `DashboardTest.php` + `HomeCommandCenterTest.php` + `CrmCreateDrawerTest.php` | Pass (19 total with bridge tests) |
| `npm run types:check` (after wayfinder `--with-form`) | Pass |
| `npm run lint:check` | Pass |
| `npm run build` | Pass |
| Browser (seeded `owner@evosales.local`) | Pass — see §6–7 |
