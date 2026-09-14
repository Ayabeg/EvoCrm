# P01 — Primitive convergence

**PR:** Phosphor + overlay import path on active EvoCRM chrome.  
**Baseline:** P00 docs @ `7185899` (`cursor/implementation-master-plan-683b`).  
**Date:** 2026-09-14.

Architectural cleanup only. No screen redesign, no route/Inertia/DataWorkspace changes, no Command OS.

---

## Lucide before / after

| Scope | Files with `lucide-react` import | Notes |
|---|---|---|
| **Before (P00 freeze)** | 34 TS/TSX files under `resources/js` | Dual family on live chrome |
| **After P01** | 13 files | Active product chrome is Phosphor |
| **Migrated this PR** | 21 files | Icons and/or overlay path only |

Before count is `rg lucide-react resources/js` on the P00 tree (34 files). After count is the same search on this branch (13 files).

### After — remaining Lucide (exceptions / deferred)

| File | Class | Why left |
|---|---|---|
| `components/app-header.tsx` | C legacy | Unused by `AppLayout`. Delete in P28. Do not touch in P01. |
| `types/navigation.ts` | C / type | `NavItem.icon` is still `LucideIcon` because leftover `app-header` + `nav-footer` consume it. |
| `components/nav-main.tsx` | C unused | Starter-kit leftover. No product import. |
| `components/ui/icon.tsx` | C unused | Lucide wrapper. No product import. |
| `pages/leads/board.tsx` | C orphan | Unrouted. Delete in P28. |
| `components/crm/saved-view-tabs.tsx` | C unused | Only `list-toolbar` imports it. |
| `components/crm/quick-launch-grid.tsx` | C unused | No page import. |
| `components/aurora/prompt-input.tsx` | C unused Aurora | No product import. |
| `components/ui/aurora/{pagination,data-table,toast,combobox,breadcrumb}.tsx` | C dead Aurora skins | Not the public `@/components/ui/*` barrels. P28 if still unreferenced. |

`components/ui/aurora/badge.tsx` mentions lucide in a comment only.

---

## Icon policy

**Phosphor is the EvoCRM application / product icon system.** `components.json` `"iconLibrary": "phosphor"` was already correct.

| Rule | Application |
|---|---|
| Family | `@phosphor-icons/react` on active chrome |
| Weight | `regular` unless the existing control already used another weight (topbar Create stays `bold`) |
| Size | Keep existing `className` / `size-*`. Do not resize layout for SVG geometry |
| Decorative | `aria-hidden` when the icon sits next to visible text or the control already has a name |
| Icon-only | Existing `aria-label` / `sr-only` / `title` kept (sidebar trigger, password toggle, Ask Evo collapse, layout move) |
| Domain objects | Align command-palette object icons with the rail (`AddressBook`, `Buildings`, `Path`, `Handshake`, `SquaresFour`, `Tray`, `CheckSquare`, `FlowArrow`, …) so one object is not two metaphors |
| Do not replace | When meaning would change and there is no Phosphor equivalent that preserves it — none in this PR required a keep-Lucide exception on active chrome |

Lucide `strokeWidth={1.65}` is not a Phosphor API. Replaced with `weight="regular"` and the same CSS size.

---

## Overlay path classification

| Primitive | Canonical product import | Implementation | Verdict |
|---|---|---|---|
| Dialog / Modal | `@/components/ui/dialog` | re-export `@/ds/components/Modal` → Aurora dialog | **CANONICAL** — already used by people, reports, lead dialogs, 2FA, delete-user |
| Drawer | `@/components/ui/drawer` | re-export `@/ds/components/Drawer` → Aurora sheet (aliased) | **CANONICAL** |
| Sheet | `@/components/ui/sheet` | re-export Aurora sheet (same primitive as Drawer) | **ADAPTER** — keep for `ui/sidebar` mobile rail (P04 / AuroraTokenBridge lock `<SheetContent`) |
| Dropdown | `@/components/ui/dropdown-menu` | DS Dropdown → Aurora | **CANONICAL** — already used |
| Tooltip | `@/components/ui/tooltip` | DS Tooltip → Aurora | **CANONICAL** — already used |
| Popover | `@/components/ui/popover` | Aurora popover | **CANONICAL** — already used |
| Select | `@/components/ui/select` | DS Select → Aurora | **CANONICAL** |
| AlertDialog / Command / ContextMenu / HoverCard | — | No local copies | **N/A** — no third path to merge |

Drawer and Sheet are **behaviorally identical** (alias of the same Aurora sheet). Product files that imported Sheet were switched to Drawer names. Internals, focus, portal, z-index, animation, Escape, and controlled `open` were not rewritten.

### Overlay imports migrated (Sheet → Drawer)

| File | From | To |
|---|---|---|
| `create-drawer.tsx` | `@/components/ui/sheet` | `@/components/ui/drawer` |
| `ask-evo-panel.tsx` | `@/components/ui/sheet` | `@/components/ui/drawer` |
| `record-layout-editor.tsx` | `@/components/ui/sheet` | `@/components/ui/drawer` |
| `column-chooser.tsx` | `@/components/ui/sheet` | `@/components/ui/drawer` |
| `board-options-sheet.tsx` | `@/components/ui/sheet` | `@/components/ui/drawer` |

### Overlay imports left (incompatible / locked / unused)

| File | Why |
|---|---|
| `components/ui/sidebar.tsx` | Tests lock `<SheetContent`. Primitive internals. Same Aurora sheet. |
| `components/app-header.tsx` | Legacy unused header. P28. |
| `components/crm/list-toolbar.tsx` | Unused. P28. |
| `ds/components/*` → `@/components/ui/aurora/*` | Correct adapter layer. Not a third product path. |
| Aurora `command-palette.tsx` custom dialog | Custom overlay, not Radix Dialog. Presentation adapter until P16. Icon-only change. |

No Dialog / Popover / Dropdown / Tooltip forks were force-merged. Product already used the public barrels.

---

## Lucide → Phosphor (active files)

| File | Lucide | Phosphor |
|---|---|---|
| `command-palette.tsx` | Home, Users, Building2, SquareKanban, Ticket, Inbox, Handshake, MessageCircle, Workflow, Send, SendHorizonal, Bolt, Megaphone, ChartSpline, PenLine, LibraryBig | House, AddressBook, Buildings, Path, Ticket, Tray, Handshake, CheckSquare, ChatCircle, FlowArrow, PaperPlaneTilt, PaperPlaneRight, Lightning, Megaphone, ChartLine, PencilSimple, Books, SquaresFour, UsersThree |
| `aurora/command-palette.tsx` | Clock3, Navigation, Search, Sparkles, Star, Zap | Clock, Compass, MagnifyingGlass, Sparkle, Star, Lightning |
| `record-chrome.tsx` | MessageCircle, MoreHorizontal, Handshake, UserPlus, Bolt, SendHorizonal, Users, Mail, Inbox, Send | ChatCircle, DotsThree, Handshake, UserPlus, Lightning, PaperPlaneRight, UsersThree, Envelope, Tray, PaperPlaneTilt |
| `ask-evo-panel.tsx` | Sparkles, ChevronUp/Down | Sparkle, CaretUp/Down |
| `activity-composer.tsx` / `record-action-row.tsx` | Mail, Phone, CheckSquare, Calendar, StickyNote | Envelope, Phone, CheckSquare, Calendar, Note |
| `list-chrome.tsx` | ChevronDown, Plus, Search, SlidersHorizontal | CaretDown, Plus, MagnifyingGlass, SlidersHorizontal |
| `wizard.tsx` | ArrowLeft, Check, Minus, ExternalLink | ArrowLeft, Check, Minus, ArrowSquareOut |
| `inline-record-field.tsx` | SquarePen | PencilSimple |
| `enrichment-panel.tsx` | Search | MagnifyingGlass |
| `record-layout-editor.tsx` | Columns3, ChevronUp/Down, RotateCcw | Columns, CaretUp/Down, ArrowCounterClockwise |
| `ui/sidebar.tsx` | PanelLeftOpen/Close | Sidebar (regular). Open vs close glyphs were Lucide-specific; control still has `sr-only` “Toggle sidebar”. |
| `user-menu-content.tsx` | Settings, LogOut | GearSix, SignOut |
| `appearance-tabs.tsx` | Sun, Moon, Monitor | Sun, Moon, Desktop |
| `password-input.tsx` | Eye, EyeOff | Eye, EyeSlash |
| `alert-error.tsx` | AlertCircleIcon | WarningCircle |
| `manage-two-factor.tsx` | ShieldCheck | ShieldCheck |
| `two-factor-recovery-codes.tsx` | Eye, EyeOff, LockKeyhole, RefreshCw | Eye, EyeSlash, Lock, ArrowClockwise |
| `two-factor-setup-modal.tsx` | ScanLine, Check, Copy | Scan, Check, Copy |
| `leads/captures.tsx` | Plus, Trash2 | Plus, Trash |
| `outbound/domains/index.tsx` | Check, Copy | Check, Copy |

---

## Exceptions left (justified)

1. **Lucide on leftover `app-header` / `NavItem` type** — P02/P28. Changing the type would force a header rewrite this PR forbids.
2. **Sidebar mobile `Sheet*`** — same primitive as Drawer; source locks require the Sheet names.
3. **Dead Aurora skins still on Lucide** — unused by public barrels; P28 delete, do not restyle here.
4. **Command Home `href: '/home'`** — left for P02/P16. P01 must not change routes.
5. **Aurora command-palette custom overlay** — not Radix Dialog. Icon-only. Sections/search model unchanged.

---

## Deferred

| Item | Phase |
|---|---|
| `/home` → `/dashboard` in command palette | P02 / P16 |
| Command OS (recent, create, Ask Evo sections) | P16 |
| Delete `app-header*`, unused list-toolbar, orphan leads board, unused Aurora skins | P28 |
| DataWorkspace row ownership | P03 |
| Settings IA | P21 |

---

## Tests run

| Command | Result |
|---|---|
| `php artisan test --filter=P01` | pass (3 tests, 81 assertions) |
| `php artisan test --filter=P03` | pass (7 / 331) |
| `php artisan test --filter=P04` | pass (4 / 57) |
| `php artisan test --filter=Wave0` | pass (5 / 94) |
| `php artisan test --filter=Wave1` | pass (3 / 75) |
| `php artisan test --filter=Wave2` | pass (4 / 117) |
| `php artisan test --filter=Wave3` | pass (5 / 106) |
| `php artisan test --filter=Wave4` | pass (6 / 131) |
| `php artisan test --filter=Wave5` | pass (5 / 98) |
| `php artisan test --filter=P05` | pass (4 / 99) |
| `php artisan test --filter=SimpleMode` | pass (10 / 103) |
| `php artisan test --filter=AuroraToken` | pass (20 / 167) |
| `php artisan test --filter=MoveDeal` | pass |
| `php artisan test --filter=Quote` | pass (23 / 250) |
| `php artisan test --filter=LeadPath` | pass |
| `php artisan test --filter=LeadConversion` | pass |
| `php artisan test --filter=Inbox` | pass (16 / 266) |
| `php artisan test --filter=OAuthSetup` | pass |
| `php artisan test --filter=FirstRun` | pass |
| `php artisan test --filter=CrmRecord` | pass |
| `npm run types:check` | pass (after `php artisan wayfinder:generate --with-form`) |
| `npx eslint` on P01-touched files | pass (1 pre-existing `command-palette` hook warning) |
| `npm run lint:check` (repo-wide) | pre-existing errors outside P01 files; not weakened |
| `npm run build` | pass |

New lock: `tests/Feature/P01PrimitiveConvergenceTest.php`.

---

## Visual QA / a11y

**Source + compile (done):** sizes/`aria-*` preserved; Drawer is an alias of the same Aurora sheet; vite production build succeeded; command palette still only `records` + `navigate` and `/home`.

**Live authenticated browser pass (not run here):** no seeded operator session in this environment. Reviewer should still click through Home / Contacts / Companies / Leads / Deals / Pipeline / Quotes / Inbox / Settings / ⌘K at 1440, 1280, 1024, 768, and 375.

Mental model (from source, unchanged contracts):

- Command palette: ⌘K / Escape / backdrop click still close; focus still moves to the search input
- Sidebar trigger: still `sr-only` “Toggle sidebar”; mobile still `<SheetContent>`
- Create / Ask Evo / layout / columns / board options: same `open` / `onOpenChange` / `side` props on the same primitive
- Icon-only: password toggle labels, Ask Evo collapse labels, layout move labels kept

A11y: decorative icons `aria-hidden` on touched chrome; icon-only controls keep names; tooltips not made the sole label; overlay labels unchanged.
