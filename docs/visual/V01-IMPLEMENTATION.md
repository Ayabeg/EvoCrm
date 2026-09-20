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
- `resources/js/components/ui/aurora/dropdown-menu.tsx` — 36px rows, radius 10
- `resources/js/components/ui/aurora/select.tsx` — menu panel radius 10
- `resources/js/components/user-menu-content.tsx` — profile menu spacing
- `docs/visual/V01-IMPECCABLE.md` — clarify / distill / polish record

### Tests / docs

- `tests/Feature/V01AppShellVisualTest.php`
- `tests/Feature/Wave0ShellChromeTest.php`
- `tests/Feature/AuroraTokenBridgeTest.php`
- `tests/Feature/P16CommandOsTest.php` (container width 560)
- `tests/Feature/ProductPolishWorkspaceTest.php`
- `docs/visual/V01-BASELINE.md`
- `docs/visual/V01-IMPECCABLE.md`
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
| Popovers / menus | White surface, hairline, radius 10 (`--aurora-radius-2`), 36px items, elevation allowed |
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

Paper rail `#F7F7F5`. Centered 20px Phosphor icons when collapsed, tooltips unchanged. Expanded 36px rows, 13px labels, 12px group labels (CRM, Communication, Sales, More). Active: accent-soft wash + ink text + filled icon (Visual Law §12 / §13 — Create keeps the orange). No solid orange blocks. Settings stays at the bottom. More panel uses surface + hairline + 10 radius, no restated More heading. Existing hrefs and simple-mode filtering unchanged. Existing compact mark + EvoCrm wordmark. No new logo.

---

## Topbar

Quiet utility bar: sidebar trigger, restrained search (`Search EvoCRM…` + ⌘K, 200 / 240 / 280px — not `flex-1`), then Ask Evo / Create / Tasks / profile. Search uses radius 8 and a surface fill, not a landing-page pill. Create is a 36×8 primary with Plus + label from `sm`. Utility actions are ghost 36 icon buttons with tooltips. Profile stays a circular initials control. Sparkle still opens Command OS (P16).

---

## Command palette

Product wrapper (`crm/command-palette.tsx`) untouched in orchestration. Aurora presentation: 560 width, radius 12, 36px rows, unstyled search input (no nested field chrome), 12px section labels (not 10 uppercase), 12px descriptions, selected accent-soft wash without an orange rule, 12px kbd/footer. P16 sections and actions unchanged.

---

## Double-chrome

RoomShell is compatibility architecture and stays mounted. Visual policy: `data-chrome="contextual"`. The Room title is `sr-only`. Tabs remain and keep hrefs as quiet 13px text links (no orange underline bar, no second header surface). Sticky heavy canvas bar removed. Ads / Reports / Outbound still use RoomShell.

---

## Responsive / a11y / motion

P25 / P26 / P27 preserved. Focus remains orange. Collapse cookie, keyboard rail, Command trap, Create menu, and reduced-motion contracts are not restyled into a new animation system. Topbar height 48 at 768+. Tasks still hide below 390. No new H-overflow utilities.

---

## Visual QA

Populated local seed (`owner@evosales.local`) against the production Vite build. Two passes: first paint, then one critique/revision.

### First paint (1440)

- Rail 239 / paper `#F7F7F5`, topbar 48 / solid white, titles 28/34/650, canvas `#F7F7F5`, accent `#E8530E`.
- Search measured 448px (`flex-1 sm:max-w-md`) and read as a landing-page field.
- Command OS 560 / radius 12 / selected `#FFF1EA`, but the query row used a nested Input pill.
- Inbox RoomShell tabs still looked like a second chrome row (orange underline).
- Page-level orange Creates (`Nouvelle affaire`, `Créer un contact`) still compete with global `+ Créer`. Left for V02–V14 — changing them would restyle screen content.
- H-overflow none at 1440 / 1280 / 1024 / 768.

### Revision

- Search: 200 / 240 / 280, radius 8, surface (not subtle pill), no `flex-1`.
- Command query: `unstyled` Input.
- RoomShell tabs: contextual text links, no `border-b-2` mark.

### Second paint

| Viewport | Search | Sidebar (default expanded) | H-overflow |
|---|---|---|---|
| 1440 | 280 × 36 | 239 paper | none |
| 1280 | 280 × 36 | 239 paper | none |
| 1024 | 280 × 36 | 239 paper | none |
| 768 | 240 × 36 | 239 labeled rail (existing P25 `md` desktop rail) | none |

Collapsed rail measured 63. Command OS 560 × 12, transparent query field, selected `#FFF1EA`. Create menu: white surface, Contact / Company / Deal / Quote. Screenshots: `/opt/cursor/artifacts/screenshots/v01-*-{1440,1280,1024,768}.png` plus `v01-command-1440.png` and `v01-create-menu-1440.png`.

Expected leftover: new shell + old page widgets/tables (Home cards, list pills, pipeline board, inbox desk, settings form). That is V02–V15 work.

### Impeccable (PR #247, same branch)

Clarify / distill / polish on chrome only. See `V01-IMPECCABLE.md`. Shell fixes: EvoCrm wordmark, active rail recedes to wash + ink, More panel heading removed, chrome spacing on 4 / 8 / 12, menus at radius 10. Page-content findings documented, not painted.

---

## Inherit for V02–V15

Use these tokens and chrome. Do not reimplement Button, Input, Badge, dialog radius, type roles, or the rail. Screen content (Home widgets, lists, board, inbox desk, quotes paper, settings forms) is intentionally still the old grammar inside the new frame.

---

## Intentional deferrals

- Page-level primary Creates remaining orange (Home / list / pipeline). Global `+ Créer` is the chrome primary.
- Dashboard / CRM list / pipeline / inbox / quotes / automation / settings **content**
- QRD private hex theme (V08)
- Home widget shadow (V02)
- HairlineTable (later)
- Lucide leftovers outside shell
- Combobox primitive
- Dark cabinet
- Official Aurora Sidebar / DataTable
