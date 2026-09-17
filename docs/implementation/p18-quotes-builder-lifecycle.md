# P18 — Quotes builder / lifecycle

**PR:** Turn the quote **show** page into a Stripe-like split builder (document vs properties) without replacing send / revoke / preview / public accept.  
**Baseline:** `main` @ `71e3d8b8db85a3e253520b56bfd9603c184d45ac` (P17 #226).  
**Date:** 2026-09-17.

P00–P17 merged and frozen. P18 owns Quotes product chrome and quote lifecycle **presentation** only. It is not a second quote object, a payments/e-sign vendor, a list rewrite, Automation authoring (P19), or Settings IA (P21). Create stays the compact deal drawer.

---

## P18 STATUS

Audit complete on fresh main @ `71e3d8b` **before** product code. CURRENT SHOW recorded below. The active `resources/js/pages/crm/quotes/show.tsx` remains the only quote record. No QuoteBuilderV2 / QuoteWorkspaceNew.

**MERGE READY: NO** — P18.1 gates authoring on QuotePolicy. Research owns Contabo QA. Do not merge. Do not start P20.

## BASE / PR / TIP

- Base: `71e3d8b8db85a3e253520b56bfd9603c184d45ac`
- Branch: `cursor/p18-quotes-builder-lifecycle-ac76`
- PR title: P18 — Quotes builder / lifecycle
- Tip: this branch after the P18 commits

---

## AUDIT

Inspected on fresh main @ `71e3d8b` **before coding**:

| Area | Paths |
|---|---|
| List | `pages/crm/quotes/index.tsx` — DataWorkspace shared-table (P08). Compact `CreateDrawer` → `POST /crm/deals/{deal}/quotes` |
| Show | `pages/crm/quotes/show.tsx` — 3-pane `RecordShell` About / Lines / Related. Lines are **read-only** display |
| Public | `pages/public/quote.tsx` — `/q/{token}` accept |
| Controller | `QuoteController` show / store / update / preview / send / revoke |
| Engine | `QuoteTotals`, `QuoteDocument`, `QuoteMailer`, `QuoteAcceptor` |
| Immutable | `Quote::isImmutable()` = sent_at or accepted_at. Update 422 after send |
| Tests | Wave4 (3-pane lock), P08 (list + `Preview PDF` on show + index must not contain `QuoteBuilder`), QuoteAcceptance, QuoteDelivery, QuoteTotal |

Master-plan note “show already edits lines” was stale. Update route existed; show had no PUT form.

---

## TARGET

Show is a **2-pane split builder**:

- Header: back, title, status, Preview PDF (P08 string stays on `show.tsx`)
- Document: paper quote (lines + notes + total). Drafts can save existing lines via `PUT /crm/quotes/{quote}` (`items[][name|quantity|unit_dzd]`)
- Properties: facts, optional notes/expiry save, send / resend / revoke, public URL, deal / contact / company
- `< lg` (includes 768): `WorkspacePanelSwitcher` Document | Properties
- `lg+`: document | 18–22rem properties rail

Create drawer, list DataWorkspace, public accept, PDF, mailer, totals, and routes are unchanged.

Reference density only: [Stripe invoice editor](https://mobbin.com/screens/a7282f10-2f3d-4de2-8cde-1d5ad2c25dbf). Tokens stay EvoCRM.

---

## BEHAVIOR THAT MUST NOT CHANGE

- `POST /crm/deals/{deal}/quotes` create contract
- `PUT /crm/quotes/{quote}` validation + immutable 422
- `POST .../send`, `POST .../revoke`, `GET .../preview`
- Public `GET /q/{token}` + `POST /q/{token}/accept`
- Totals via `QuoteTotals`
- P08 list chrome / no `QuoteBuilder` on index

---

## FILES

| File | Role |
|---|---|
| `resources/js/pages/crm/quotes/show.tsx` | Page + header + Preview PDF |
| `resources/js/pages/crm/quotes/quote-split-builder.tsx` | Document / properties split |
| `resources/js/pages/crm/quotes/quote-record.ts` | Shared Inertia record types |
| `resources/js/lib/quote-builder.ts` | URLs, date, layout classes |
| `tests/Feature/P18QuotesBuilderTest.php` | Source + live locks |
| `tests/js/p18-quotes-builder.ts` | URL / layout proofs |
| `tests/Feature/EvoCrmWave4QuotesChromeTest.php` | **SHARED TEST** — show chrome lock only |

**Not changed:** QuoteController, Quote model, QuoteTotals / Mailer / Acceptor / Document, quotes index, public quote, routes, schema.

---

## SHARED-SURFACE CHANGE

| FILE | WHY SHARED | CHANGE | COMPATIBILITY | OTHER LANES AT RISK |
|---|---|---|---|---|
| `tests/Feature/EvoCrmWave4QuotesChromeTest.php` | Wave4 locked the pre-P18 3-pane show chrome | Record assertion now locks split builder + still forbids HubSpot paint | List + public accept assertions unchanged | None if P19/P21 do not edit this test |

`WorkspacePanelSwitcher` is composed, not modified. `RecordShell` / app-sidebar / Command OS / settings are untouched.

---

## MIGRATION

None. Existing quote columns already represent document + lifecycle.

---

## TESTS

Commands:

| Command | Result |
|---|---|
| Focused Pest (P18 + Wave4 + Quote* + P08) | **23 passed** |
| `php artisan test` | **957 passed** (11930 assertions) |
| `npx vite-node tests/js/p18-quotes-builder.ts` | **pass** |
| eslint on P18-touched JS | **pass** |
| `npm run types:check` | **pass** |
| `npm run build` | **pass** |

## LIVE VISUAL QA

**NEEDS RESEARCH / Contabo.** This agent did not walk a populated quote show at 1440 / 1280 / 1024 / 768. Do not merge until that pass.

Exercise: draft edit + save lines; sent show (immutable, send/resend/revoke); Preview PDF; public `/q/{token}` accept; list create drawer unchanged.

---

## P18.2 — GLOBAL CREATE QUOTE GATE

P18.1 hid list/builder Save. Contabo still showed Global + → Quote and Command OS `create-quote` for members.

`canCreateQuote(capabilities)` (same `crm.edit` as other Command OS creates / QuotePolicy create) now hides:

- app-sidebar-header `/crm/quotes?create=1`
- Command OS `create-quote`
- deal-quotes Create quote disclose

List `can.create` is unchanged. No Contabo deploy. No P20.

## P18.1 — MEMBER AUTHORING GATE

Contabo: member saw Save/Create/send controls; PUT/POST 403. Root cause: `quoteCanEdit(immutable)` ignored QuotePolicy.

Server now sends `quote.can.update` (`$user->can('update', $quote)`) and list `can.create` (`$user->can('create', Quote::class)`). Builder Save, send/resend/revoke, and Create quote render only when those capabilities are true **and** the quote is not immutable.

No Contabo deploy from this lane. No P20.

## OUT OF SCOPE

P19 Automation. P21 Settings. Payments. E-sign. New tax / discount / currency. New trigger types. P28 cleanup. List rewrite. Public accept redesign. Contabo deploy.

## P19 / P21 HANDOFF

Do not start them from this branch. Quotes list and Settings are untouched.
