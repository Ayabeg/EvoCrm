# P26 → P27 handoff

P27 is **not started** in this PR. Do not merge P26 as a motion redesign.

## What P27 may consume

- Existing overlay owners: Aurora Dialog / Sheet, QRD, Create drawer, Advanced filters, Ask Evo drawers, Command OS.
- Reduced-motion **kill switch already on** those surfaces (`motion-reduce:*` + `aurora-motion.css` `@media (prefers-reduced-motion: reduce)` including `[data-command=os]` / `backdrop`).
- Focus trap + restore on Command OS (`trapTabKey` / `restoreFocus` in `resources/js/lib/a11y.ts`). Do not replace with a second palette.
- Visible focus outline pattern: `focus-visible:outline-2` + `--color-accent` / `--color-focus-ring`.
- Inbox / list / board keyboard names from P26 — do not restyle them into motion-only cues.

## What P27 must not do

- Invent a second motion library, Lottie, mesh, bounce, or page-level fades.
- Change board drag physics (already shipped; MASTER: do not “improve” into bounce).
- Recolor tokens (`#929292`, accent, canvas) under an “a11y contrast” pretext — that is DEFER-VISUAL / Wave0-locked.
- Start P28 legacy deletion or a global responsive rewrite (P25).
- Claim WCAG certification or add axe-core as a merge gate unless a later phase owns tooling.
- Redo Ask Evo / Activation copy or completion rules.

## P27 target (from MASTER)

150–200ms overlay opacity/transform; honor `prefers-reduced-motion` (already floored here); one primary per region. Files: `resources/css/aurora-motion.css`, Drawer/Modal only as needed.

## Contabo

Research owns deploy. This PR reports `READY_FOR_CONTABO` only after types/lint/build/Pest are green. Agents do **not** deploy.

## Merge

`MERGE READY: NO` until a human reviews P26 audit leftovers (DEFER-VISUAL) and Contabo QA is done.
