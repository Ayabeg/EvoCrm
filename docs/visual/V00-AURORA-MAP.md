# V00 — Aurora map

**Pin:** `resources/js/components/ui/aurora/SOURCE.json`  
**Upstream:** [dinglebear-ai/aurora](https://github.com/dinglebear-ai/aurora) `fa53183f7e9a790391198424b8b90afb4b5fa50c` (2026-07-13)  
**License:** AGPL-3.0-only (vendored copy)  
**Rule:** Do not replace Aurora. Do not migrate to another component library. Do not clean up this pass.

---

## Ownership

```text
EVOCRM VISUAL LAW     brand hex, type, surface, radius
        ↓
AURORA PRIMITIVES     interaction, a11y, CVA API  (ui/aurora/*)
        ↓
ds/* ADAPTERS         shadcn variant bridge + field chrome
        ↓
ui/* BARRELS          public import path
        ↓
PRODUCT PATTERNS      DataWorkspace, AppSidebar, RecordShell
        ↓
SCREENS               pages/*
```

Aurora is vendored source, not an npm package. Official Aurora Sidebar block is **not** installed and must not replace EvoCRM rail IA.

---

## Token / CSS / bridge

| File | Role | V-series |
|---|---|---|
| `resources/css/app.css` | Live P02 tokens, type scale, chrome height | **RESTYLE** hex to Visual Law |
| `resources/js/components/aurora.css` | Vendored `--aurora-*` contract (navy/cyan defaults) | **KEEP** |
| `resources/css/aurora-evotechly-bridge.css` | Remaps Aurora → product tokens; literals for nav bg | **RESTYLE** |
| `resources/js/components/aurora-components.css` | `.aurora-btn`, cards, inputs | **RESTYLE** (heights, radius) |
| `resources/css/aurora-motion.css` | P27 motion layer | **KEEP** |
| `resources/js/lib/aurora/shadcn-bridge.ts` | Button / Badge variant map | **KEEP** (watch Badge `cyan` default) |

---

## Primitive stack (active)

Three layers, one visual:

1. `ui/aurora/*` implements
2. `ds/components/*` adapts (Button, Badge, Input, Select, field chrome)
3. `ui/*.tsx` re-exports for product imports

Do not add a fourth button.

---

## Component map

| COMPONENT | CURRENT USAGE | VISUAL ROLE | STATE | V-SERIES ROLE | KEEP / RESTYLE / EXTEND / DEFER |
|---|---|---|---|---|---|
| Button (`aurora/button` via `ds/Button`) | Primary/secondary/ghost/danger across product | Action hierarchy | hover, active `scale(0.98)`, focus, disabled, loading | Default 36px, radius 8, filled accent = one hero per surface | **RESTYLE** (live default height 32px / radius 9) |
| Input (`aurora/input` via `ds/Input`) | Filter search, settings, composers | Data entry | sm 28 / default 36 / lg 40; error/warn/success; clearable | Default 36, radius 8, label above | **RESTYLE** |
| Textarea | Notes, Ask Evo, quote body | Multiline entry | same state tokens + count | Same as Input | **KEEP** |
| Select / NativeSelect | Filters, settings, owners | Choice | disabled, placeholder | 36px trigger, radius 8 | **RESTYLE** |
| Combobox | Not a first-class `ds` export; command/search patterns exist | Typeahead choice | — | Add only if a screen needs it; do not invent a second search | **DEFER** |
| Checkbox | List selection, settings | Multi-select | 19px face | Align to 16–18 optical, keep a11y input | **RESTYLE** |
| Switch | Settings toggles | Binary | sm/md/lg tracks | Keep Radix | **KEEP** |
| Tabs / PillGroup | Record mobile switcher, settings, automation | In-page mode | h-9, pill radius 6 | Line tabs for records; pills only for exclusive modes | **RESTYLE** |
| Badge | Status, chips, filters | Status / compact fact | tones + soft/solid/outline; interactive | Pill 999; accent rare; map `cyan` away from brand | **RESTYLE** |
| Label / Field | Settings, create forms | Form grammar | required, invalid, disabled | Label 13/18/500 above control | **KEEP** |
| Card | Home widgets, settings, Ask Evo rail, associations | Semantic group | interactive, elevated tier | Use only when the group is real; radius 10; no nest | **RESTYLE** |
| Separator | Occasional splits | Divider | — | Prefer spacing + one hairline | **KEEP** |
| Dialog / Modal (`ds/Modal`) | Confirms, create, command-adjacent | Blocking task | sizes sm–full; hideClose | Radius 12; elevation allowed | **RESTYLE** |
| Sheet / Drawer (`ds/Drawer` = Sheet) | QRD, filters, Ask Evo, mobile nav | Auxiliary workspace | sides; 200ms P27 | Radius 0; 480 default | **RESTYLE** |
| DropdownMenu | Create, columns, user, saved views | Local menu | destructive item | Elevation allowed; 13px rows | **KEEP** |
| Popover | Column chooser, small editors | Local floating | — | Elevation allowed | **KEEP** |
| Tooltip | Collapsed rail, icon-only | Name | 8px radius | Keep; do not decorate | **KEEP** |
| Skeleton | DataWorkspace loading (`data-p27="loading"`) | Loading shape | text/title/button/avatar | Match final layout; no generic spinner-as-page | **EXTEND** |
| Spinner | Button loading, inline busy | Local wait | sizes + tones | Keep inside buttons | **KEEP** |
| EmptyState + illustrations | WorkspaceEmpty, inbox, boards | Empty | page/panel/banner | Composed, actionable, no cute illustration sprawl | **RESTYLE** |
| Avatar | Records, topbar, activity | Identity | sm/md/lg + status | Keep Phosphor-free photo/initials | **KEEP** |
| Callout | Warnings / alerts | Status message | info/success/warn/error | Prefer over leftover `ui/alert` | **KEEP** |
| Command palette block (`components/aurora/command-palette.tsx`) | Vendored block; product uses `crm/command-palette.tsx` | Command OS presentation leftover | — | Product Command OS stays; Aurora block is unused furniture | **DEFER** |
| Prompt Input block | Ask Evo-adjacent leftover | AI composer | — | Do not adopt as a second composer | **DEFER** |

---

## Product patterns (not Aurora primitives, consume them)

| COMPONENT | CURRENT USAGE | VISUAL ROLE | STATE | V-SERIES ROLE | KEEP / RESTYLE / EXTEND / DEFER |
|---|---|---|---|---|---|
| PageHeader (`ds/chrome`) | DataWorkspace, Settings | Page title 28/34 | primary + secondary | Canonical page title | **KEEP** (spacing to 32/24) |
| CrmObjectHeader | Legacy 15px title | Old object title | — | Retire on touch | **DEFER** (do not redesign in place) |
| DataWorkspace | Contacts, Companies, Leads, Deals, Quotes | List operating system | list/board, selection, query | Shared list grammar | **RESTYLE** chrome density |
| SavedViews | Same lists | View pills | active pill | One accent on active | **RESTYLE** |
| FilterBar | Same lists | Search + chips + advanced | wrap (P25) | Continuous band, not a card | **RESTYLE** |
| ListDataTable / list-view-table | Shared-table objects | 48px rows | hover, selected, peek | Table 13/18/400; header 12–13 | **RESTYLE** |
| HairlineTable | Ads, outbound, attributes | Second table family | — | Converge later; do not fork more | **DEFER** |
| BulkActionBar (ds) | Contacts, Deals | Selection actions | sticky | Keep behavior; restyle band | **RESTYLE** |
| crm/bulk-action-bar | Legacy duplicate | Same | — | Do not extend | **DEFER** |
| WorkspaceEmpty / Paginator | Shared-table | Empty + pager | — | Keep contracts | **RESTYLE** |
| QuickRecordDrawer | Peek from lists/board | 480 inspector | sections, hex-styled | Tokenize; radius 0 | **RESTYLE** |
| RecordShell / AdaptiveWorkspaceShell | Show pages | 3-pane record | 768/1024 collapse | Signature, not a card stack | **RESTYLE** |
| PipelineKanban | Deals board, tickets | Board | drag, peek | Board-first signature | **RESTYLE** |
| AppSidebar + ui/sidebar | Shell | 64/240 rail | collapse cookie | V01 hero primitive | **RESTYLE** |
| AppSidebarHeader | Topbar | Search / Create / Tasks | Command OS | V01 | **RESTYLE** |
| Command OS (`crm/command-palette`) | ⌘K | Navigate / Records / Create / Ask | P16/P26 trap | Floating command surface | **RESTYLE** |
| Ask Evo drawer / panel | Global + record rail | Contextual AI | P24 contract | Presentation only | **RESTYLE** |
| HomeWidget / KPI strip | Dashboard | Operating tiles | empty | Stop boxed dashboard | **RESTYLE** |
| Settings chrome | Settings IA | Admin forms | 900px measure | Keep IA; restyle cards | **RESTYLE** |
| RoomShell | CRM / Desk / Automation tabs | Second nav | — | Hide where rail already names the page | **RESTYLE** |
| Sonner Toast (`ds/Toast`) | Canonical toast | Transient | — | Keep one toaster | **KEEP** |
| ui/alert, navigation-menu, breadcrumb, input-otp, unused page-header | Leftovers | Starter-kit | — | Do not adopt | **DEFER** |
| Official Aurora Sidebar / DataTable / FilterBar / Drawer TSX | Not vendored | Upstream extras | — | Do not install to “complete” Aurora | **DEFER** |

---

## Duplicated primitives (do not clean in V00)

| Concern | Active | Legacy / unused |
|---|---|---|
| Button | Aurora → ds → ui | None visually |
| Toast | Sonner | No Aurora toast file in tree |
| Drawer | Sheet aliased as Drawer | Same primitive, two names. Keep aliases. |
| Empty | Aurora EmptyState + WorkspaceEmpty | CRM empty-room leftovers |
| Table | list-view-table + thin DataTable | HairlineTable (domain) |
| Header | PageHeader 28/34 | CrmObjectHeader 15px, page-header.tsx unused, Aurora display-2 on workflows |
| Bulk | ds BulkActionBar | crm/bulk-action-bar |
| Icons | Phosphor | Lucide in 6 files |

---

## Variants and states to preserve

Aurora already implements the interaction cycle Taste requires: hover, focus, disabled, loading, empty, error (Field / Input state), destructive.

V-series restyles the **paint**, not the state machine.

Missing for V-series quality (extend later, do not invent now):

- Skeleton rows that match column geometry
- Empty states with one real next action (already mostly true)
- Combobox as a documented primitive if filter search needs it

---

## Responsive / a11y behavior

| Concern | Authority | Aurora role |
|---|---|---|
| 1440 / 1280 / 1024 / 768, no page H-overflow | P25 | Sheet/Dialog viewport caps; product uses `PAGE_OVERFLOW_CLASS` |
| Keyboard, focus ring, names, reduced motion | P26 | Radix Dialog/Select/Dropdown/Tabs |
| Overlay timing | P27 | Sheet `MOTION_DRAWER_CLASS` |

Aurora does not define breakpoints. Do not add `--aurora-breakpoint-*`.

---

## shadcn / Aurora relationship

`components.json` still declares shadcn New York + `@aurora` registry.

Public product API is `@/components/ui/*` and `@/ds/*`.

Button `default` → Aurora `aurora` + `filled`.  
Badge `default` → Aurora tone `cyan` (wrong brand signal). V01 maps this to `neutral` / accent-soft.

Do not run `npx shadcn add` for new primitives unless the map says EXTEND and Aurora already has the item.

---

## V-series instruction

Solve shared primitives in V01 (shell, type, buttons, inputs, surfaces, popover/dialog, badges). Later screens inherit. Do not restyle Button fifteen times.
