# P26 — Accessibility contract

Practical WCAG 2.2 AA-compatible behavior inside the existing architecture. **Not a certification.** Prefer native HTML over decorative ARIA.

---

## What P26 guarantees

| Area | Contract |
|---|---|
| Keyboard | Core list peek, pipeline card peek, inbox rows/folders/composer, Command OS, Ask Evo, overlays: no product focus trap. Enter **and** Space activate peek/card widgets. Pipeline **move** stays the existing named menu (not drag-only). |
| Focus | Visible accent outline on peek rows, inbox rows/folders, kanban cards. Radix drawers/dialogs keep trap + Esc. Command OS now traps Tab and restores the opener. QRD restore unchanged (P09). |
| Semantics | Native `<table>` / `<button>` / `<label>` / `<select>` first. Invalid `role="listitem"` on buttons removed. Drawers that lacked a description get `sr-only` `DrawerDescription`. |
| Icon-only names | Existing shell names kept. Filter chips expose `aria-label="Clear {label}"`. Legacy leads-board Move control remains named and is visible on `focus-within`. |
| Forms | Inbox composer has `aria-label` matching the visible placeholder. Bulk selects named. Ask Evo question field already named (P24). Settings search already labeled (untouched). |
| Tables | Page/row checkboxes keep P03/P04 names. Selected rows expose `aria-selected` on the thin `DataTable`. Peek rows keep `Inspect {identity}`. |
| Pipeline DnD | Drag remains; keyboard alternative is the existing stage menu. Busy state is `aria-busy` only — **never** `aria-hidden` on the board. |
| Dialogs / drawers | Radix Sheet/Dialog: Esc, trap, named Close. `motion-reduce` on overlay animation. Ask Evo + Advanced filters described. |
| Inbox selection | Selected = wash **and** `aria-current` **and** “selected” in the row name. Not color-only. |
| Inbox unread | Weight + count **and** “N unread” in the row name + `sr-only` “unread” on the badge. |
| Status | Deal stage / quote status / attention already text+tone (P07/P08/P12). Unchanged. |
| Contrast | **No token hex edits.** Wave0 keeps `#929292`. Product `text-mute` stays `#666666`. See audit V1–V5. |
| Reduced motion | Honor `prefers-reduced-motion` on existing overlay / command / drawer / toast / button motion. **No P27 motion system.** |
| Ask Evo | Chips are a named `group` of buttons. Drawers have titles + descriptions. Question labeled. Errors `role="alert"`. Focus restore on close kept. |
| Activation | Progressbar named. First incomplete step `aria-current="step"`. Done / Required / Optional text stays. |

---

## What must not change

- P00–P24 product behavior, routes, Inertia names, POST/PATCH contracts
- Drag physics, board column widths, list density, breakpoints (P25)
- Motion timing / easing as a design system (P27)
- `--color-text-muted: #929292` and `--color-focus-ring` tokens
- New a11y runtime (axe-core, Playwright, jest-axe)

---

## Tests

```bash
php artisan test --filter=P26
npm run types:check
npm run lint:check
npm run build
```

`tests/js/p26-accessibility.ts` locks helper meaning (unread / selected / activation keys). Pest source-locks the files above.

---

## Contabo / merge

Agents do **not** deploy. Humans do not merge this PR as “certified AA.”

- `READY_FOR_CONTABO`: set in the implementation report after CI-equivalent commands are green.
- `MERGE READY: NO` — Contabo populated QA + human review still required.

---

## Certification

This PR does **not** claim WCAG 2.2 AA conformance. It removes the listed blockers/majors inside the current shell.
