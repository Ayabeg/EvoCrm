# Evotechly Brandbook (vendored)

**Historical Wave 0 brand notes.** Authenticated product UI for P02+ is locked in [`docs/design-system.md`](../design-system.md) (accent `#E8530E`, canvas `#F7F7F5`). Do not copy the Wave triad below into new work.

The external GitHub repo `Mohamedbeghanem/Brandbook` **does not exist** (404 — never created; confirmed 2026-08-24 via `gh repo view` and repository search). Brand tokens and usage rules are consolidated here from in-repo implementation sources so redesign work is unblocked.

## Source of truth hierarchy

| Priority | Path | Role |
|----------|------|------|
| 1 | [`resources/css/app.css`](../../resources/css/app.css) | Live CSS tokens (`--evosales-*`, Tailwind `@theme`, Light/Dark Cabinet) |
| 2 | [`public/brand/evocrm/logo.svg`](../../public/brand/evocrm/logo.svg) | Product mark artwork — fill `#E8530E`, **do not recolor** |
| 3 | [`README.md`](../../README.md) § Brand | Product brand rules |
| 4 | [`tests/Feature/BrandingTest.php`](../../tests/Feature/BrandingTest.php) | Automated brand assertions |
| 5 | [`resources/js/evoviz/contract.ts`](../../resources/js/evoviz/contract.ts) | Chart palette (mark / ink / mute only) |

## Marketing vs product orange

| Context | Hex | Notes |
|---------|-----|-------|
| **Product UI (EvoCrm, rail, favicon, logo.svg)** | `#E8530E` | **Canonical after P02.** See [`design-system.md`](../design-system.md). Enforced by `BrandingTest.php`. |
| Marketing design system (Google Drive *Design system v3.0*, *Web Design System v1.0*) | `#FF6A00` | Landing pages and campaign assets only — **not** for CRM/product CSS. |

When in doubt, use `--color-accent` / `#E8530E` from `app.css`.

## Contents

| Doc | Description |
|-----|-------------|
| [design-tokens.md](./design-tokens.md) | Complete color, spacing, radius, sidebar, and semantic token table |
| [typography.md](./typography.md) | Geist stack, UI sizes, `.money` utility |
| [logo-usage.md](./logo-usage.md) | Mark lockup, sizes, forbidden treatments |

## Logos (shipped)

```
public/brand/evocrm/
├── logo.svg       # Sidebar, favicon, auth — fill #E8530E
└── SOURCE.txt     # Provenance note
```

Original artwork lineage: evotechly.com / QuiverAI Arrow export. Previously referenced as `Brandbook assets/logos/evotechly/mark.svg` before that repo was planned.

## External references (not vendored)

These live in Google Drive (*Evotechly → Design-system*) and cover **marketing** tone, not product CSS:

- *Evotechly Web Design System v1.0* — landing pages, SaaS marketing
- *Design system v3.0* — campaign/asset generation rules
- *EVOLAUNCH SALES ASSET SYSTEM v1.0* — sales copy, not UI tokens

## Future: standalone Brandbook repo

If `Mohamedbeghanem/Brandbook` is created later, it should mirror this vendored content plus any extended brand-board HTML. Reconcile product tokens against `app.css` first — product wins over marketing PDFs.
