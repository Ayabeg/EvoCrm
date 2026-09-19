# P25 → P26 handoff

P26 is **not** started in this PR. Do not treat P25 as a visual rewrite or a Contabo deploy.

## What P26 may consume

- Overflow law + shared classes in `resources/js/lib/responsive.ts` and `.overflow-page` / `.overflow-local-x`.
- DataWorkspace / FilterBar wrap + `min-w-0` column chain (lists no longer grow the page).
- `LOCAL_SCROLL_X_CLASS` on list tables, quote line items, and board inner scroll (`min-w-0` on `PipelineKanban`).
- Overlay viewport caps (Dialog, dropdown, popover). QRD still `min(92vw, 520px)`.
- Quote money wrap (`QUOTE_MONEY_CLASS` / `MONEY_NEVER_CLIP_CLASS`).
- Inbox embed now shares `overflow-x-hidden` with native. Native/embed switch unchanged.
- P17 KPI 2×2 at 768 remains the operating-home contract.
- Settings secrets still reveal-on-demand (`masked_url`). Do not serialize tokens.

## What P26 must not do

- Visual redesign (V00–V15). Do not change type scale, radius, orange discipline, or cabinet.
- Recalculate quote money, send quotes, or mutate P18 lifecycle.
- Change P11 board movement, P12 attention scoring, P15 complete identity.
- Replace inbox embed with a Chatwoot clone or eject operators to another host.
- Put integration secrets in the initial Inertia DOM.
- Global a11y rewrite, motion system, or Command OS replacement (P16 frozen).
- Deploy to Contabo or merge P25.

## Suggested P26 (if product wants it)

P26 is unspecified here. Safe follow-ups if assigned:

- Populated Contabo H-overflow measurement (`document.documentElement.scrollWidth` vs innerWidth) at the four viewports.
- Card/list `@container` density without changing column contracts.
- Settings/ads inline tables still on local scroll (A20) — migrate only if a later ticket owns it.

## Contabo

Research owns deploy. This PR reports `READY_FOR_CONTABO` only after CI is green. Agents do **not** deploy.

## Merge

`MERGE READY: NO` until a human reviews overflow at 1440/1280/1024/768 on populated Contabo and frozen P00–P24 rails.
