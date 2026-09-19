# V01 — App shell visual implementation

**Status:** First production visual pass of global chrome.  
**Base:** merged V00 `037918794347db944e27d47547ecdaaaed0bf7e8`  
**Taste:** `design-taste-frontend` used as product-design reasoning only. Dials 4 / 3 / 7.  
**Aurora:** preserved. No new component library. Official Aurora Sidebar / DataTable not installed.

P00–P29 behavior is unchanged. Navigation hrefs, Command OS orchestration, Create destinations, and capability gates are unchanged.

---

## Files changed

### Tokens / paint

- `resources/css/app.css` — Visual Law hex, type floor 12, semantic type roles, 48px topbar, solid topbar, rail radius 8, search trigger
- `resources/css/aurora-evotechly-bridge.css` — radii 8 / 10 / 12
- `resources/js/lib/aurora/shadcn-bridge.ts` — Badge default `neutral` / `soft` (was cyan)
- `docs/design-system.md` — live token table aligned to Visual Law

### Shell

- `resources/js/components/app-sidebar.tsx`
- `resources/js/components/app-sidebar-header.tsx`
- `resources/js/components/crm/room-shell.tsx`
- `resources/js/components/aurora/command-palette.tsx` — presentation only
- `resources/js/ds/chrome/PageHeader.tsx` — 32 / 24 geometry, Page 28/34/650
- `resources/js/components/ui/aurora/dropdown-menu.tsx` — 36px rows, radius 8

### Tests / docs

- `tests/Feature/V01AppShellVisualTest.php`
- `tests/Feature/Wave0ShellChromeTest.php`
- `tests/Feature/AuroraTokenBridgeTest.php`
- `tests/Feature/P16CommandOsTest.php` (container width 560)
- `tests/Feature/ProductPolishWorkspaceTest.php`
- `docs/visual/V01-BASELINE.md`
- this file

Not changed: routes, models, APIs, Command OS catalog, page contents (Dashboard through Settings).

---

## Shared primitives

| Primitive | V01 treatment |
|---|---|
| Typography | Page 28/34/650. Roles `--text-page` … `--text-meta`. Floor 12 (`--text-section-label`, `--text-micro`). Nav groups 12/16/500, not 11 uppercase |
| Buttons | Already 36 / 8. Primary hover `#D74908`. Global Create is the orange CTA |
| Inputs / search / select | Default 36 / radius 8. Topbar search no longer `sm` |
| Surfaces | Canvas `#F7F7F5`. Surface `#FFFFFF`. Subtle `#F1F1EF`. Border `#E3E3DF`. Strong `#D6D6D1` |
| Popovers / menus | White surface, hairline, radius 10 (token), 36px items, elevation allowed |
| Badges | Shared default no longer cyan. Orange is not a badge color |
| Dialog | Radius 12 via `--aurora-radius-3` |
| Drawer | Radius 0 unchanged |
| Page header | `px-8` desktop, `pb-6` (24) title-to-content |

---

## Shell geometry

| Measure | Value |
|---|---|
| Collapsed sidebar | 64 |
| Expanded sidebar | 240 |
| Topbar | 48 compact, solid white, hairline, no glass |
| Page pad | 32 (`md:px-8`) on PageHeader and RoomShell |
| Frame | Full viewport. Not a floating card |

---

## Sidebar

Paper rail `#F7F7F5`. Centered 20px Phosphor icons when collapsed, tooltips unchanged. Expanded 36px rows, 13px labels, 12px group labels (CRM, Communication, Sales, More). Active: accent-soft wash + orange icon/text. No solid orange blocks. Settings stays at the bottom. More panel uses surface + hairline + 10 radius instead of evosales literals. Existing hrefs and simple-mode filtering unchanged. Existing compact mark + EvoCRM wordmark. No new logo.

---

## Topbar

Quiet utility bar: sidebar trigger, restrained search (`Search EvoCRM…` + ⌘K, max-width `md`), then Ask Evo / Create / Tasks / profile. Search is no longer a giant centered field. Create is a 36×8 primary with Plus + label from `sm`. Utility actions are ghost 36 icon buttons with tooltips. Profile stays a circular initials control. Sparkle still opens Command OS (P16).

---

## Command palette

Product wrapper (`crm/command-palette.tsx`) untouched in orchestration. Aurora presentation: 560 width, radius 12, 36px rows, 12px section labels (not 10 uppercase), 12px descriptions, selected accent-soft wash without an orange rule, 12px kbd/footer. P16 sections and actions unchanged.

---

## Double-chrome

RoomShell is compatibility architecture and stays mounted. Visual policy: `data-chrome="contextual"`. The Room title is `sr-only`. Tabs remain and keep hrefs. The strip is a line nav, not a second app header. Sticky heavy canvas bar removed. Ads / Reports / Outbound still use RoomShell.

---

## Responsive / a11y / motion

P25 / P26 / P27 preserved. Focus remains orange. Collapse cookie, keyboard rail, Command trap, Create menu, and reduced-motion contracts are not restyled into a new animation system. Topbar height 48 at 768+. Tasks still hide below 390. No new H-overflow utilities.

---

## Visual QA

First paint is source-complete. Populated 1440 critique/revision and 1280/1024/768 overflow must run after CI on a seeded host. See the QA section appended after that pass.

---

## Inherit for V02–V15

Use these tokens and chrome. Do not reimplement Button, Input, Badge, dialog radius, type roles, or the rail. Screen content (Home widgets, lists, board, inbox desk, quotes paper, settings forms) is intentionally still the old grammar inside the new frame.

---

## Intentional deferrals

- Dashboard / CRM list / pipeline / inbox / quotes / automation / settings **content**
- QRD private hex theme (V08)
- Home widget shadow (V02)
- HairlineTable (later)
- Lucide leftovers outside shell
- Combobox primitive
- Dark cabinet
- Official Aurora Sidebar / DataTable
