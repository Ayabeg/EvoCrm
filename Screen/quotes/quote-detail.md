# Quote detail (split builder)

## 1. Screen Identity

Screen ID: SCR-QUOTE-002
Product area: CRM / Quotes
Route: `/crm/quotes/{quote}`
Route name: `crm.quotes.show` [CONFIRMED-CODE]
Related routes: `crm.quotes.update` PUT, `crm.quotes.preview` GET PDF, `crm.quotes.send` POST, `crm.quotes.revoke` POST. Public accept is SCR-PUB-001 `/q/{token}` — not this screen.
Frontend file: `resources/js/pages/crm/quotes/show.tsx` + `quote-split-builder.tsx`
Primary component: `QuoteShow` → `QuoteSplitBuilder`
Layout: `RecordPageFrame` (not the three-pane deal RecordShell). Breadcrumbs: Quotes → Quote (second crumb href `/crm/quotes`). [CONFIRMED-CODE]
Authentication: CRM auth group. `authorize('view')` + workspace 404.
Permissions: `quote.can.update` from `QuotePolicy::update` (`crm.edit`). Send/revoke controller methods do **not** call `authorize('update')` — workspace check only. [CONFIRMED-CODE]
Parent navigation: Quotes list.
Entry points: list row; deal quotes (preview more common from deal related — show is list href).
Exit points: Back to Quotes; deal/contact/company links; Preview PDF new tab; public_url.
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/quotes/show` for `/crm/quotes/1`. [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `%TEMP%/evocrm-inertia/crm_quotes_1.json`.

## 2. Purpose

Edit (if mutable), preview, send, and revoke a DZD quote document bound to a deal. Line totals owned by `QuoteTotals` on the server.

## 3. Current UX Summary

Split builder: document paper (center) + properties/delivery (right on `lg`). Mobile panel switcher Document | Properties. Seed quote id 1 title Clinic website intake, status_label Sent, currency DZD, total 22_000_000 cents, 2 lines, contact Amine Benali, company Clinique El Djazair, `immutable: false`, `can.update: true`, `sent_at`/`public_url` null despite status sent. [CONFIRMED-BOTH]

## 4. Screen Anatomy

Header `data-crm="quotes-record"`: Back, h1 title, status badge, Quote #{id}, contact · owner, **Preview PDF**.

`data-quote="split-builder"`:
- **Document** `data-quote="document"`: paper (`QUOTE_DOCUMENT_PAPER_CLASS`), Quote kicker, number, title, contact · company · expires, immutable notice, line table (Item, Qty, Unit, Total), notes, grand total DZD. Editable → Form PUT Save lines.
- **Properties** `data-quote="properties"`: facts Amount, Status, Owner, Created, Expires (“No expiration”), Sent, Accepted; editable expires_at + notes Save properties; **Delivery** `data-quote="delivery"` email + Email quote / Resend / Revoke link / public_url; associations Deal, Contact, Company.

`WorkspacePanelSwitcher` keys center/left (Document/Properties). Desktop `lg:grid-cols-[1fr_18–22rem]`.

## 5. Data Displayed

Single prop `quote` (`presentRecord`): id, title, status, status_label, currency, total_cents, notes, timestamps, public_url, immutable, can.update, owner, deal, contact, company, items[{id,name,quantity,unit_cents,total_cents}]. [CONFIRMED-BOTH]

Seed items: at least “EvoSales workspace” qty 1 unit 18_000_000. Notes “Clinic workspace + desk handoff”.

## 6. Primary Actions

- Save lines / Save properties (if `quoteCanEdit`).
- Email quote / Resend (`POST /crm/quotes/{id}/send` `to`).
- Preview PDF (`GET /crm/quotes/{id}/preview` inline PDF).

## 7. Secondary Actions

Revoke public link (`POST .../revoke`) when sent && !accepted && !revoked && can.update. Open deal/contact/company. Copy-visible public_url.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT APPLICABLE.

## 10. Sorting

NOT APPLICABLE. Line order = item id as stored.

## 11. Selection

NOT PRESENT. No add-line-row control beyond using existing items or a blank row when editable && items.length===0. **Cannot add extra lines in UI** besides editing current rows. [CONFIRMED-CODE] `LineTable` maps items only.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

`SkeletonRecord` while Inertia loading. PDF is a separate full document response.

## 14. Forms

| Form | Method | Action | Notes |
| --- | --- | --- | --- |
| Lines | PUT | `/crm/quotes/{id}` | items[i][name,quantity,unit_dzd]; `QuoteTotals::sync` replaces all items |
| Properties | PUT | same | expires_at, notes (no items) |
| Send | POST | `/crm/quotes/{id}/send` | to email; default contact.email; 422 if empty |
| Revoke | POST | `/crm/quotes/{id}/revoke` | sets revoked_at |

Update aborted 422 **Sent quotes cannot be edited.** when `isImmutable()` (`sent_at` or `accepted_at` filled). Seed status sent but sent_at null ⇒ still editable. [CONFIRMED-BOTH]

Status on update validated `draft,sent,accepted` but UI does not post status. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT on show (no create drawer). PDF is a new tab. Public page is separate.

## 16. States

Loading; editable vs immutable; accepted copy; revoked copy; no contact; empty lines; send vs resend; public_url present/absent; can.update false hides delivery forms; mobile panel.

## 17. Empty State

No line items (read-only): **No line items**. Notes empty: **No notes.** Associations empty strings. Quote 404 if missing.

## 18. Error Handling

422 immutable; 422 send without to; 404 workspace. Inertia Form errors [UNVERIFIED] display in builder (no explicit error paragraph in LineTable).

## 19. Feedback

Buttons disable while processing. Mail send uses mailbox from workspace; subject `Quote #{id} from EvoSales`; attaches PDF; sets status sent, sent_at, public_token 14 days. [CONFIRMED-CODE] `QuoteMailer` UI success is `back()` only.

## 20. Navigation Behavior

Back to `/crm/quotes`. Preview target=_blank. Public URL `/q/{token}` when token usable.

## 21. Entity Relationships

Deal, contact, company, quote items, optional product_id on items (create path; show table does not expose product_id). Public token. Mailbox for send.

## 22. Business Rules

- Totals: quantity ≥ 1; unit from unit_cents or unit_dzd×100 or product; line = qty×unit; quote.total_cents = sum. Currency DZD.
- Immutable after sent_at or accepted_at.
- Revoke does not change status enum; sets revoked_at; `tokenIsUsable` false.
- Accept is public flow (SCR-PUB-001), not this page.
- Send freezes snapshot HTML/PDF.

## 23. Backend Dependencies

`QuoteController` show/update/preview/send/revoke; `QuoteTotals`; `QuoteDocument`; `QuoteMailer`; `QuotePolicy`; `Quote::isImmutable|tokenIsUsable`.

## 24. Frontend Dependencies

`show.tsx`, `quote-split-builder.tsx`, `quote-record.ts`, `lib/quote-builder.ts`, `record-hub` facts, `WorkspacePanelSwitcher`.

## 25. Responsive Behavior

`lg` two-column; below lg one panel via switcher. Line table `min-w-[28rem]` + local overflow-x. Money classes never truncate. [CONFIRMED-CODE] Viewport [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: Document/Properties aria-labels; line inputs aria-label Line name/Quantity/Amount (DZD); Preview PDF button.
LIKELY ISSUE: two PUT forms can confuse; no add-row button; panel switcher a11y not inspected.
REQUIRES MANUAL TEST: keyboard between document and properties, PDF tab.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-QUOTE-010 | HIGH | No UI to add/remove extra line rows | Multi-line quotes only via pre-seeded items or deal create | LineTable map |
| UX-QUOTE-011 | MEDIUM | Status Sent with null sent_at still editable | Contradicts “Sent quotes cannot be edited” copy | dump vs isImmutable |
| UX-QUOTE-012 | LOW | Breadcrumb Quote points at list | No self link | show.tsx layout |
| UX-QUOTE-013 | LOW | Send/revoke skip policy authorize | View-only user might send if they can hit URL | QuoteController send |
| UX-QUOTE-014 | OBSERVATION | Deal related links preview not this page | Inconsistent entry | deal-detail |

## 28. Consistency Comparison

Not the deal three-column hub. Closer to a document editor. Delivery is unique vs other CRM objects.

## 29. Functional Preservation Contract

Must keep: split document/properties; DZD totals from server; line edit when mutable; save properties; PDF preview; email send with to; resend; revoke; public_url; immutable lock; associations; Africa/Algiers date formatting; status labels.

## 30. Design Input Contract

Purpose: produce and deliver a quote PDF/email.
Primary goal: confirm lines and send.
Primary actions: save lines, email quote, preview PDF.
Secondary: properties, revoke, open deal.
Required information: title, status, lines, total DZD, contact email, dates.
Required components: paper document, properties, delivery.
Required states: draft editable, sent immutable, accepted, revoked, no email.
Must not remove: DZD, send, preview, revoke, immutability, deal link.

## 31. Open Questions / Unknowns

- How seed quote got status=sent without sent_at. [UNKNOWN]
- Product picker on show (deal create has catalog; builder does not). [CONFIRMED-CODE] absent
- Whether update with empty items array is blocked (`min:1` nullable). [CONFIRMED-CODE] items optional on update
