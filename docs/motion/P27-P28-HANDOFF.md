# P27 → P28 handoff

P28 is **not started** in this PR. Do not merge P27 as legacy deletion.

## What P28 may consume

- P27 tokens in `resources/js/lib/motion.ts` and `app.css` (`--motion-duration-hover|dropdown|page|modal|drawer`).
- Overlay owners still: Aurora Dialog / Sheet, QRD, Create, Advanced filters, Ask Evo, Command OS.
- Reduced-motion kill in `aurora-motion.css` (decorative only; Command OS keeps centering transform).
- Wave6 + P27 Pest locks for 200ms drawers and no-bounce CSS.

## What P28 must not do

- Invent a second motion library or reopen overlay timing.
- Delete live routes while “cleaning” adapters (`deprecation-map.md` only).
- Recolor tokens or start V00.
- Deploy to Contabo or mark merge ready.

## Contabo

Research owns deploy. Agents do **not** deploy.

## Merge

`MERGE READY: NO` until a human reviews P27 leftovers (DEFER_TO_VISUAL) and Contabo QA is done.
