# P26 — Accessibility audit

**BASE / starting_ref:** `fa13a64e507b90b25008e0274d42615b84ac9678` (P24 #236 tip).  
**Date:** 2026-09-19.  
**Method:** Inspected before product code. P00–P24 frozen — harden in place, do not redesign.  
**Standard:** Practical WCAG 2.2 AA-compatible behavior. **Not a certification claim.**  
**Tooling:** No axe / jest-axe / Playwright in tree. Did not install a new a11y stack. House style remains Pest source-locks + `tests/js` proofs.

---

## EXISTING (already compatible enough — do not rewrite)

| Surface | Path | Notes |
|---|---|---|
| Overlay primitives | `ds/components/{Drawer,Modal}` → Aurora Sheet/Dialog (Radix) | Dialog semantics, focus trap, Escape, overlay click. Close control named `Close`. |
| QRD | `ds/workspace/QuickRecordDrawer.tsx` | Named Close / Open full record. Focus-visible rings. `onEscapeKeyDown` + restore (P09/P10). `motion-reduce` on slide. |
| Create / Advanced filter | `create-drawer.tsx`, `AdvancedFilterDrawer.tsx` | `DrawerTitle` present. Radix trap/Esc. |
| Command OS | `aurora/command-palette.tsx` | `role="dialog"` + `aria-modal`. Escape. Input `aria-label="Search commands"`. Combobox/listbox/option. Focus moves to input on open. |
| Pipeline keyboard move | `deal-pipeline-board.tsx` | Menu `aria-label="Move to stage"` + stage names. Drag is not the only path. Card `tabIndex={0}` + Enter peek. |
| List peek | `list-view-table.tsx` | Peek rows `tabIndex={0}` + `aria-label="Inspect {identity}"` + Enter. Checkbox hit target separate. |
| Table select | `DataTable.tsx` / `list-view-table.tsx` | Native checkboxes. `Select page` / `Select ${row.id}`. |
| Stage / quote / attention status | `deal-columns.tsx`, `quote-columns.tsx`, `deal-attention.ts` | **Text labels** + tone class. Not color-only. |
| Inbox unread (partial) | `inbox-chrome.tsx` | Unread uses **weight + numeric badge**, not a color dot. Selected uses wash + `aria-current`. |
| Ask Evo (P24) | `ask-evo-panel.tsx`, `ask-evo-drawer.tsx` | Named question field, live status, `role="alert"` errors, collapse `aria-label`, trigger `aria-haspopup`. Focus restore on global drawer close. |
| Activation (P23) | `activation-checklist.tsx` | `h2`, `role="progressbar"` + valuemin/max/now + label. Step **Done / Required / Optional** text. CTA text, not icon-only. |
| Shell icon-only | `app-sidebar-header.tsx`, `ui/sidebar.tsx` | Ask Evo / Create / Tasks / account / search / sidebar trigger named (`aria-label` or `sr-only`). |
| Settings search | `layouts/settings/layout.tsx` | Visible `sr-only` label around search + mobile select. |
| Password toggle | `password-input.tsx` | Hide/Show `aria-label`. |
| Pagination | `WorkspacePaginator.tsx` | `nav` + `Pagination`. |
| Reduced motion (partial) | `aurora-motion.css`, QRD, kanban card, activation bar | Existing `prefers-reduced-motion` / `motion-reduce` on some product motion. Dialog/Sheet Tailwind `animate-in` is **not** covered. |
| Focus ring token | `--color-focus-ring: var(--color-accent)` | Aurora buttons use a 3px mixed ring. P11 cards use outline-2 accent. |

---

## BLOCKER

Must fix in P26. Keyboard users or AT can lose the page or miss required meaning.

| ID | Finding | Why | Owner file |
|---|---|---|---|
| B1 | Pipeline board sets `aria-hidden={busy}` on the whole kanban while `aria-busy` is also set | Hidden subtree can contain focus (cards stay tabbable). AT skips the board. Busy is a state, not removal. | `pipeline-kanban.tsx` |
| B2 | Command OS is a custom `role="dialog"` **without** a Tab trap or focus restore | Tab leaves the overlay into the page behind (focus behind modal). Close does not return to the opener. Radix overlays do this; Command OS does not. | `aurora/command-palette.tsx` |
| B3 | Inbox composer `<Textarea>` is placeholder-only (no `aria-label` / `<label>`) | WCAG 3.3.2 / 4.1.2 — required field has no accessible name. | `inbox-chrome.tsx` |
| B4 | Bulk bar `<select>`s have no accessible name | Native selects expose “Owner / Sequence / Stage” only as the empty `<option>`, not a name. | `BulkActionBar.tsx` |

---

## MAJOR

Core flows. Fix in P26 unless noted as already labeled.

| ID | Finding | Why | Owner file |
|---|---|---|---|
| M1 | Kanban / peek rows activate on **Enter only** | Space is the button activation key. Cards and peek rows are focusable widgets. Keep the existing `event.key !== 'Enter'` string (P10 lock) and add Space beside it. | `pipeline-kanban.tsx`, `list-view-table.tsx` |
| M2 | Peek row focus is `outline-none` + background wash | Focus is easy to miss (near color-only). Cards already use a visible accent outline. | `list-view-table.tsx` |
| M3 | Inbox folder buttons have no `aria-current` | Active folder is wash + weight only. Conversation rows already use `aria-current`. | `inbox-chrome.tsx` |
| M4 | Inbox unread badge is a bare number | Weight + count is not color-only, but the badge name is just `"3"` — announce “N unread”. Selected should stay in the row name. | `inbox-chrome.tsx` |
| M5 | Inbox Reply/Note mode is color/underline only (`aria-pressed` missing) | Mode is a toggle. Visible text exists; pressed state is not programmatic. | `inbox-chrome.tsx` |
| M6 | Ask Evo chips: `<button role="listitem">` | Invalid: `listitem` cannot be a button. Drop the fake list. | `ask-evo-panel.tsx`, `ask-evo-drawer.tsx` |
| M7 | Ask Evo / Create / Advanced drawers often omit `DrawerDescription` | Radix Dialog expects an accessible description. Add `sr-only` where there is no visible description. | `ask-evo-drawer.tsx`, `ask-evo-panel.tsx` |
| M8 | Filter chips: accessible name is the filter value, not “Clear {label}” | `title` exists; `aria-label` does not. × is `aria-hidden`. | `FilterBar.tsx` |
| M9 | Saved view pills: active is wash + weight, no `aria-current` | Same pattern as folders. Links have visible text. | `SavedViews.tsx` |
| M10 | Legacy leads board move control is `opacity-0` until hover | Keyboard users never see the named “Move {title}” control. Page still routed (`LeadBoardController`). | `pages/leads/board.tsx` |
| M11 | Dialog / Sheet / Command OS animations ignore `prefers-reduced-motion` | QRD/kanban honor it. Overlay `animate-in` / inline keyframes do not. **Honor prefers only — do not start a P27 motion system.** | `aurora/dialog.tsx`, `aurora/sheet.tsx`, `aurora-motion.css` |
| M12 | Activation progress text is `aria-hidden` while the bar has a label | Not a failure, but the first incomplete step is not `aria-current="step"`. | `activation-checklist.tsx` |

---

## MINOR

| ID | Finding | Notes |
|---|---|---|
| N1 | Pipeline card is a focusable `<div>` wrapping a `Link` + menu | Extra tab stop; nested interactives. P11 architecture — do not restyle into a button. Space/Enter on the card still peeks. |
| N2 | `DataTable` clickable `<tr>` has no keyboard path | Live lists use `ListViewTable` (peek keyboard). Thin `DataTable` is the older path. Add `aria-selected` only. |
| N3 | Settings filter input `focus-visible:outline-none` (border-brand only) | Weaker than the accent ring. Token-safe; leave unless we touch the file for another reason. **Not touching** — P25 likely owns settings density. |
| N4 | Command OS input `focus-visible:outline-none` | Caret + active option carry focus. Leave chrome. Trap/restore is the fix. |
| N5 | Inbox person mark is `aria-hidden` with `title` | Name is in the row text. OK. |
| N6 | Filter search icon has no `aria-hidden` | Decorative. Add when touching FilterBar. |
| N7 | Unused `app-header.tsx` icon buttons (Menu / Search) lack names | Leftover header (P02/P28). **Do not revive.** |
| N8 | `aria-busy` on Ask Evo input | Unusual on an input; status live region already exists. Leave. |

---

## DEFER-VISUAL

Contrast and paint. Document only unless a **token-safe** one-line fix does not fight Wave0.

| ID | Finding | Decision |
|---|---|---|
| V1 | `--color-text-muted: #929292` on `#ffffff` ≈ **3.0:1** (fails 4.5:1 normal text) | Wave0 **locks** this hex. Micro-UX already says muted is metadata only. **Do not change the token.** Product `text-mute` is `#666666` (≈5.7:1) via `--evosales-mute`. |
| V2 | `#929292` / `text-muted-foreground` used for some body-adjacent copy (auth, settings leftovers) | Leave. Changing those files is visual/P25. |
| V3 | Accent `#E8530E` as **text** on white ≈ 3.6:1 | Brand on white fails AA for small text. Existing `text-brand` links. Do not recolor. Prefer `font-medium` + underline (already on several links). |
| V4 | Accent focus ring on `#F7F7F5` | Orange ring vs canvas is the locked DS. Visible, not 3:1 against every neighbor. Do not invent a second ring. |
| V5 | Dark cabinet contrast | Out of scope (locked). |
| V6 | 44px touch targets / responsive density | **P25.** P26 does not change breakpoints or control height. |
| V7 | Overlay motion timing / easing polish | **P27.** P26 only disables existing motion when `prefers-reduced-motion: reduce`. |
| V8 | Public quote / PDF WCAG | MASTER out of scope. |
| V9 | Full axe CI / screen-reader lab | Not in repo. Do not add Playwright or axe-core in this phase. |

---

## CORE FLOWS (keyboard)

| Flow | Tab | Esc | Focus return | Trap | Keyboard alternative |
|---|---|---|---|---|---|
| List → peek QRD | Peek row + in-row links | Yes (Radix + P09) | Yes | Yes (Radix) | Enter (add Space) |
| Board → peek / move | Card + title link + ⋮ menu | Menu + QRD | QRD yes; menu Radix | Radix menu | Move menu exists |
| Inbox folder → thread → composer | Buttons / rows / fields | n/a (page) | n/a | n/a | Named controls after B3/M3–M5 |
| Command OS | Input + options | Yes | **Missing (B2)** | **Missing (B2)** | Arrows + Enter |
| Ask Evo drawer | Fields / chips / submit | Radix | Yes (P24) | Radix | Submit named |
| Activation | Dismiss + step CTAs | n/a | n/a | n/a | Text status |
| Create / filters | Radix drawer | Yes | Trigger | Yes | — |

No intentional `inert` traps found. The busy-board `aria-hidden` (B1) is the only product trap-class bug.

---

## SHARED FILES TOUCHED (rebase with P25)

P25 owns responsive grammar. Keep P26 diffs surgical on these:

- `resources/js/ds/workspace/FilterBar.tsx`
- `resources/js/ds/workspace/SavedViews.tsx`
- `resources/js/ds/workspace/BulkActionBar.tsx`
- `resources/js/ds/workspace/DataTable.tsx`
- `resources/js/components/crm/list-view-table.tsx`
- `resources/js/components/crm/inbox-chrome.tsx`
- `resources/js/components/crm/pipeline-kanban.tsx`
- `resources/js/components/ui/aurora/dialog.tsx`
- `resources/js/components/ui/aurora/sheet.tsx`
- `resources/css/aurora-motion.css`

Avoid: AdaptiveWorkspaceShell, list page layouts, overflow, control heights, breakpoint class churn.

---

## NOT DOING

- Redesign, new primitives, new toast/dialog library
- Token hex edits (Wave0)
- P25 responsive / 44px mobile pass
- P27 motion system, Lottie, bounce
- axe-core / Playwright / jest-axe install
- PDF / public quote audit
- Claiming WCAG certification
- Contabo deploy / merge
