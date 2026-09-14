# Micro-UX benchmark (reconstructed)

**Status:** Reconstructed 2026-09-14. Original file never existed on `main` or any searched branch.  
**Provenance:** Approved research summary + `docs/design-system.md` Do/Don't + `docs/visual-system/responsive-architecture.md` + live overlay/list code.  
**Honesty:** Rules only. No invented heuristic scores.

---

## Locked rules (every later PR)

| Rule | Meaning in EvoCRM |
|---|---|
| **One primary CTA per region** | `PageHeader` has one `primaryAction`. Topbar Create is global; page Create must not compete as a second filled orange. |
| **Escape + focus return** | Drawer / modal / palette / overlay close on Esc. Focus returns to the control that opened them. |
| **No color-only status** | Stage, stale, won/lost, ticket SLA, inbox unread need a label or icon plus color. Accent wash is selection, not meaning. |
| **Keyboard alternative for DnD** | Pipeline (and any future board) must move a card via menu + keyboard, not drag alone. |
| **URL query state** | Saved views, filters, `?create=1`, future `?record=` / `?drawer=` are shareable. Do not invent a second client-only filter store. |
| **Reduced motion** | Honor `prefers-reduced-motion`. Motion is 150–200ms opacity/transform only (`docs/ui-migration-plan.md` P15). |

---

## Overlay contract (already partly shipped)

Canonical primitives live in `resources/js/ds/components/`:

| Primitive | File | Use |
|---|---|---|
| Drawer | `ds/components/Drawer.tsx` | Create, advanced filters, future Quick Record |
| Modal | `ds/components/Modal.tsx` | Confirmations, convert, destructive |
| Toast | `ds/components/Toast.tsx` (Sonner) | Success / undo / error |
| EmptyState | `ds/components/EmptyState.tsx` | Page and filtered-empty |

Product pages still import `@/components/ui/sheet` / `dialog` in places (`create-drawer.tsx`). Those are strangler re-exports — new work imports `@/ds/components/*` or the ui re-export, never a third overlay.

**Behavior that must not regress**

- `?create=1` still opens `CreateDrawer` on contacts, companies, deals, quotes, tickets.
- Advanced filters stay a **right drawer**, not an inline second filter band (`AdvancedFilterDrawer` + `P05DataWorkspaceTest`).
- Command palette: `Cmd/Ctrl+K`, click/focus on the read-only search field.

---

## Focus, hit targets, density

From `docs/design-system.md` (do not reopen):

- Control height **36px**, table row **48px**, page pad-x **32px** desktop / **16px** `<768`
- Sidebar 64 collapsed / 240 expanded
- Focus ring = accent `#E8530E`, 3:1 against canvas
- Buttons are `<button>` or Inertia `Link`, not clickable divs
- Table is the surface — no extra card chrome around lists

---

## Status and attention

Approved pipeline/record micro-copy (behavioral):

- Stale is shown **when meaningful** (inactivity threshold), not as a permanent red card.
- Next action is a line of text (due activity / “No activity scheduled”), not a colored pip alone.
- Selection wash is accent 10% (`--color-accent-wash`), not orange text on orange.

Live board already has `is_inactive`, `inactive_days`, `has_next_activity` on `pages/crm/deals/board.tsx`. Keyboard + undo are **missing** — that is a P11/P27 gap, not a token gap.

---

## Responsive micro-UX

From `docs/visual-system/responsive-architecture.md` (keep):

- Independent scroll regions; `h-app-workspace` uses `100dvh`
- `<lg` inbox / record: `AdaptiveWorkspaceShell` panel switcher, not a squeezed 4-pane
- 375: Sheet nav, do not clip Create
- Do not add a second mobile IA

---

## A11y floor (P26, but apply from P01)

- Visible focus
- Drawer focus trap
- `aria-label` on icon-only topbar buttons (already on Ask Evo / Create)
- Contrast: body `#161616` on `#F7F7F5` / white; muted `#929292` for metadata only
- Announce bulk selection count
- Do not ship drag-only stage changes

---

## Out of scope for micro-UX PRs

- Marketing motion, marquees, mesh, glass on scrolling content
- Cloning Linear/Stripe visual identity
- Dark cabinet (explicitly out of `design-system.md` P02–P15)
