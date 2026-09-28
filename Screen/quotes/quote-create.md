# Quote create overlay

## 1. Screen Identity

Screen ID: OVR-QUOTE-001
Product area: CRM / Quotes
Route: Overlay on `/crm/quotes` (`?create=1`). Submit `POST /crm/deals/{deal}/quotes` (`crm.quotes.store`). Alternate create UI on deal show (`DealQuotes` disclose) — same endpoint, not this overlay.
Route name: `crm.quotes.store` [CONFIRMED-CODE]
Frontend file: `resources/js/pages/crm/quotes/index.tsx` (drawer). Shared `CreateDrawer`. Deal-page sibling: `resources/js/components/crm/deal-quotes.tsx`.
Primary component: QuotesIndex create `CreateDrawer`
Layout: Right drawer over quotes list (`sm:max-w-md`, `data-aurora="drawer"`).
Authentication: parent quotes list.
Permissions: drawer opens only if `can.create` (`crm.edit` + `authorize('create', Quote::class)` and `authorize('update', $deal)` on store). [CONFIRMED-CODE]
Parent navigation: N/A.
Entry points: Quotes **Create quote**; `?create=1`; command palette create-quote → `/crm/quotes?create=1` if `canCreateQuote`. Empty list CTA.
Exit points: Cancel; success `back()` on list; empty-deals link `/crm/deals?create=1`.
Runtime HTTP: parent **200** with `createOpen` + `can.create`. [CONFIRMED-BOTH] Drawer interaction [UNVERIFIED].
Evidence: `Screen/_evidence/runtime-index.json`; `%TEMP%/evocrm-inertia/crm_quotes.json` (`createOpen: false`, `can.create: true`, 15 deals).

## 2. Purpose

Create a draft quote with a single named line in DZD, attached to an existing deal.

## 3. Current UX Summary

If the workspace has no deals, the drawer is instructional (not a form). Otherwise: deal select (defaults first deal in title order), line name *, quantity default 1, amount DZD *, notes, Create quote.

## 4. Screen Anatomy

Title **Create quote**.
No-deals branch: “A quote needs a deal first.” + “Open Deals…” + link **Create a deal**.
Form branch: Deal *, Line name *, Quantity, Amount (DZD), Notes, Cancel, Create quote (brand).

Deal show alternate: disclose **Create quote** with product select (ad hoc or catalog), line name, qty, DZD, notes — still one `items[0]`.

## 5. Data Displayed

Parent `deals: {id, title}[]` ordered by title. Seed 15 options. Local React state `dealId` string. [CONFIRMED-BOTH]

## 6. Primary Actions

Create quote POST. Empty-state Create a deal.

## 7. Secondary Actions

Cancel. Command palette. Deal-page create.

## 8. Search

NOT PRESENT (deal is a `<select>`). [CONFIRMED-CODE]

## 9. Filters

NOT APPLICABLE.

## 10. Sorting

Deal options `orderBy('title')`. [CONFIRMED-CODE]

## 11. Selection

Deal dropdown required.

## 12. Bulk Actions

NOT APPLICABLE.

## 13. Pagination / Loading Strategy

`processing` disables submit. `resetOnSuccess` + close drawer. Store returns `back()` so user remains on quotes index (new row should appear). [CONFIRMED-CODE]

## 14. Forms

POST `/crm/deals/{dealId}/quotes`:
- status optional in: draft, sent, accepted (UI omits; default draft)
- notes optional
- expires_at optional (UI omits)
- items required min 1: name required_without product_id, quantity min 1, unit_dzd or unit_cents

`QuoteTotals::sync` writes items and `total_cents`. Currency DZD. [CONFIRMED-CODE]

Deal show form may send `items[0][product_id]`.

## 15. Overlays

This overlay. Nested none.

## 16. States

Closed; open; processing; no deals; can.create false (button hidden; query `create=1` ignored if `!can.create`). [CONFIRMED-CODE] `useState(Boolean(createOpen) && can.create)`

## 17. Empty State

No deals: copy + link to deal create (not a disabled submit). [CONFIRMED-CODE]

## 18. Error Handling

403/404 on deal. Validation on items. Inertia errors on fields [UNVERIFIED] display.

## 19. Feedback

Drawer close on success; no toast. User must notice the new table row.

## 20. Navigation Behavior

Stays on `/crm/quotes`. Does not visit quote show. Empty path may leave to deals create (list, not board).

## 21. Entity Relationships

Quote belongs to Deal (workspace copied). Totals from line. Contact/company inherited from deal for later send.

## 22. Business Rules

- Cannot create a quote without a deal.
- `crm.edit` on both quote create and deal update.
- One line from this overlay; more lines only if later edited on show (and show currently cannot add rows — UX-QUOTE-010).
- Default status draft.

## 23. Backend Dependencies

`QuoteController::store`, `QuoteTotals`, `QuotePolicy`, `DealPolicy::update`.

## 24. Frontend Dependencies

`quotes/index.tsx`, `CreateDrawer`, `command-os.ts` `canCreateQuote`, `deal-quotes.tsx` (sibling entry).

## 25. Responsive Behavior

Same drawer as deal create. [CONFIRMED-CODE] Viewport [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: labels with required asterisks; native required on deal/line/amount.
LIKELY ISSUE: deal select not searchable; two create surfaces (list vs deal) with different fields (product picker only on deal).
REQUIRES MANUAL TEST: focus trap; create=1 with can.create false.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-QUOTE-020 | MEDIUM | Single line, no catalog on list overlay | Incomplete quotes | index.tsx vs deal-quotes.tsx |
| UX-QUOTE-021 | MEDIUM | Success does not open the new quote | Extra click | store `back()` |
| UX-QUOTE-022 | LOW | Deal select is first title, not “most relevant” | Easy to attach wrong deal | `deals[0]` default |
| UX-QUOTE-023 | LOW | No expires_at on create | Must edit show | store vs form |

## 28. Consistency Comparison

Same CreateDrawer pattern as OVR-DEAL-001. Quotes uniquely require a parent deal. Deal overlay can create a contact; quote overlay cannot create a deal except via a text link.

## 29. Functional Preservation Contract

Must keep: `can.create` gate; `?create=1`; POST to `/crm/deals/{deal}/quotes`; required deal + line name + DZD; qty default 1; no-deals empty branch linking to deal create; command-palette href; DZD→cents via QuoteTotals.

## 30. Design Input Contract

Purpose: start a priced document on an opportunity.
Primary goal: pick deal, enter one DZD line, save draft.
Primary action: Create quote.
Secondary: go create a deal if none exist.
Required information: deal title, line name, quantity, amount DZD.
Required states: no deals, processing, forbidden create.
Must not remove: deal requirement, DZD, policy gate.

## 31. Open Questions / Unknowns

- Whether product catalog should appear on the list overlay (exists on deal show). Product intent [UNKNOWN].
- Create from command palette with zero deals: drawer empty branch. [UNVERIFIED] in UI crawl.
