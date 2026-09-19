# P25 — Responsive contract

**BASE:** `fa13a64e507b90b25008e0274d42615b84ac9678`  
**Lane:** Product hardening only. P00–P24 semantics frozen. No V00–V15 redesign. No Contabo. No merge.

## Overflow law

| Kind | Rule |
|---|---|
| **Page** | `scrollWidth` must not exceed viewport width at 1440 / 1280 / 1024 / 768. Class: `PAGE_OVERFLOW_CLASS` (`min-w-0 overflow-x-hidden`) on workspace columns. |
| **Local scroll** | Tables and pipeline/ticket boards may `overflow-x-auto` inside a `min-w-0` parent. That is not a page defect. |
| **Long text** | `min-w-0` + `truncate` (identity / titles) or `break-words` (copy). **Do not** shrink fonts to fit. |
| **Money** | `MONEY_NEVER_CLIP_CLASS` / `QUOTE_MONEY_CLASS`. May wrap. Never `truncate` or `overflow-hidden`. `formatDzd` / `formatCompactDzd` unchanged. |
| **Overlays** | Dialog / dropdown / popover / command / QRD / Ask Evo capped to `100vw` minus inset. |

## Shared primitives

| Export | File | Use |
|---|---|---|
| `P25_VIEWPORTS` | `resources/js/lib/responsive.ts` | 1440, 1280, 1024, 768 |
| `PAGE_OVERFLOW_CLASS` | same | Page / workspace / QRD / settings / record / room |
| `LOCAL_SCROLL_X_CLASS` | same | Table / board inner scroll |
| `LONG_TEXT_CLASS` / `LONG_TEXT_WRAP_CLASS` | same | Titles vs descriptions |
| `MONEY_NEVER_CLIP_CLASS` | same | Record facts, quote money |
| `FILTER_SEARCH_CLASS` | same | FilterBar search (`min-w-0 flex-1`) |
| `OVERLAY_VIEWPORT_CLASS` / `DROPDOWN_VIEWPORT_CLASS` | same | Overlay caps |
| `.overflow-page` / `.overflow-local-x` | `resources/css/app.css` | CSS twins |

Prefer these over local hacks.

## Surface contract

| Surface | Must | Must not |
|---|---|---|
| **Shell** | 64/240 rail; topbar `min-w-0`; content `overflow-x-clip` | New chrome, header layout |
| **DataWorkspace** | Page overflow + `min-w-0` result column; FilterBar always wraps; table local scroll | New columns, query, selection |
| **QRD** | Viewport-capped drawer; title truncate; page overflow on content | Change peek / hydrate / Escape |
| **Pipeline** | Page overflow; column local H-scroll | Change board movement / attention |
| **Inbox** | Native **and** embed stay; both `overflow-x-hidden` | Restyle iframe, eject Desk |
| **Activities** | Existing page overflow + subject truncate | Change P15 groups / complete |
| **Dashboard** | P17 frozen: Attention → Today → KPI **2×2 at 768** / 4-col `md+`; KPI wrap; page overflow | KPI sources, IA, 5th tile, H-scroller |
| **Quote builder** | Money never clipped; line table local scroll; paper `max-w-[40rem]` | Recalculate cents, send/revoke rules |
| **Automation** | Page overflow on `/crm/workflows` | Authoring / history semantics |
| **Settings + integrations** | Page overflow; nav truncate; secrets **masked** until reveal POST | Put `access_token` / raw callback in initial DOM |
| **Activation** | Wrap / `min-w-0` on step labels | New steps, mark complete |
| **Ask Evo** | Existing overflow; context wraps | Second LLM, write tools, P24 contract |
| **Modals / menus** | Viewport max-width | New overlay system |

## Frozen rails

P09/P10 QRD, P11 board, P12 attention, P13/P14 inbox, P15 queue, P16 Command OS, **P17 KPI 2×2**, P18 quote math, P19/P20 automation, P21 IA, P22 reveal-only secrets, P23 step IDs, P24 `AskEvoContext`.

## Tests

- `tests/js/p25-responsive-hardening.ts`
- `tests/Feature/P25ResponsiveHardeningTest.php`
- P17 KPI proofs must stay green
- P18 quote builder proofs now include `QUOTE_MONEY_CLASS`

## Contabo / merge

`READY_FOR_CONTABO` after CI green. `MERGE READY: NO` until Research populated walk at 1440/1280/1024/768.
