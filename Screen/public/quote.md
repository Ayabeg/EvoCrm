# Public quote

## 1. Screen Identity

Screen ID: `SCR-PUB-001`
Product area: Public
Route: `GET /q/{token}`, `POST /q/{token}/accept`
Route name: `quotes.public.show`, `quotes.public.accept`
Frontend file: `resources/js/pages/public/quote.tsx`
Primary component: `PublicQuote`
Layout: `PublicLayout` (`resources/js/layouts/public-layout.tsx`) — canvas background, HydrateI18n, PosthogIdentity, **no** product rail
Authentication: Guest. Token in the URL is the secret. Invalid token HEAD **404**. `[CONFIRMED-UI]`
Permissions: `Quote::tokenIsUsable()` or already `accepted_at`; else 404 (`QuoteAcceptanceController::resolve`)
Parent navigation: Shared from CRM quotes (public_token link), not the shell
Entry points: `/q/{token}` from quote emails/messages
Exit points: Accept POST then `back()` (same page, now accepted). No login CTA.
Runtime HTTP (owner, simple_mode=true): Not in runtime-index. Probe `/q/invalid-token` 404.
Evidence: `routes/web.php`, `QuoteAcceptanceController.php`, `public/quote.tsx`, `PublicLayout`.

## 2. Purpose

Let a buyer review a quote (items or HTML snapshot) and accept it without an EvoCrm account.

## 3. Current UX Summary

Header: “EvoCrm” + workspace name. Main max-w-2xl: file icon, quote id, deal title or `Quote #{id}`, greeting using contact first name if present, status or “Accepted”, optional expiry. Table of items (name, qty, amount via `formatDzd`) **or** `dangerouslySetInnerHTML` snapshot HTML **or** empty copy. Notes. Total. Accept button (brand) or accepted check + date.

## 4. Screen Anatomy

`data-crm="public-quote"`. `Head` title = deal title / Quote #id. Accept is Inertia `Form` POST to `quote.accept_url` (`/q/{token}/accept`) or fallback `pathname/accept`.

## 5. Data Displayed

Controller payload: id, status, currency, total_cents, notes, expires_at date, accepted_at ISO, html snapshot, workspace name, accept_url, deal.title, contact.first_name, items[{name,quantity,unit_cents,total_cents}]. Currency field is passed but amounts use `formatDzd` (DZD) regardless `[CONFIRMED-CODE]`.

## 6. Primary Actions

Accept quote (disabled while processing). Idempotent-ish: already accepted shows confirmation instead of the button.

## 7. Secondary Actions

None (no decline, no PDF download, no login).

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Item order from snapshot/items relation.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Single quote. Accept processing disables the button.

## 14. Forms

POST accept, no extra fields (IP captured server-side `QuoteAcceptor::accept($quote, $request->ip())`).

## 15. Overlays

NOT PRESENT.

## 16. States

Valid pending. Accepted. Empty items + html. Empty items no html. 404 invalid/unusable token.

## 17. Empty State

“No line items on this quote.” if no items and no html.

## 18. Error Handling

404 for bad/unusable tokens. Accept errors `[UNVERIFIED]` (expired between render and POST). XSS risk if snapshot_html is attacker-controlled `[LIKELY ISSUE]`.

## 19. Feedback

Accepted state with CheckCircle and localized date (`dateLocale()`). No toast.

## 20. Navigation Behavior

PublicLayout only. Authenticated users can still open the token URL (no redirect to CRM). Accept `back()` refreshes props.

## 21. Entity Relationships

Quote → workspace, deal, deal.contact, items. Accepting is a quote lifecycle event (`QuoteAcceptor`).

## 22. Business Rules

- Token must be usable unless already accepted (accepted quotes remain viewable).
- Amounts displayed as DZD helper even if `currency` differs.
- No auth.

## 23. Backend Dependencies

`QuoteAcceptanceController`, `QuoteAcceptor`, `Quote::tokenIsUsable()`.

## 24. Frontend Dependencies

Inertia Form/Head, Button, Phosphor, `formatDzd`, `t()`, `dateLocale`.

## 25. Responsive Behavior

`px-5 sm:px-8`, table full width. `NOT VERIFIED` on phone.

## 26. Accessibility Observations

**CONFIRMED:** h1, table headers, button disabled while processing, icon aria-hidden.

**LIKELY ISSUE:** HTML snapshot has no sanitizer in the page; status is a raw `quote.status` string; no live region on accept.

**REQUIRES MANUAL TEST:** with a real public_token (none in crawl).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| PUB-Q-001 | HIGH | No real token in the crawl | Page `[UNVERIFIED]` visually | 404 probe |
| PUB-Q-002 | MEDIUM | `dangerouslySetInnerHTML` snapshot | XSS if HTML not trusted | quote.tsx |
| PUB-Q-003 | LOW | `formatDzd` ignores `currency` | Wrong money if non-DZD | formatDzd(total_cents) |
| PUB-Q-004 | LOW | No decline/login | Buyer cannot reject in-app | page source |

## 28. Consistency Comparison

In-app quote detail is a full CRM hub. This is a buyer-facing subset. Book/unsubscribe are other public surfaces; unsubscribe is Blade not Inertia.

## 29. Functional Preservation Contract

- Keep token URLs and accept POST + IP capture.
- Keep items vs html vs empty branches.
- Keep accepted persistence (view after accept).
- Keep 404 for unusable tokens.
- Keep PublicLayout (no shell).

## 30. Design Input Contract

Purpose: review and accept a quote.
Primary goal: accept.
Primary actions: Accept quote.
Required information: party greeting, items, total, expiry, status.
Required components: header identity, line table, total, accept CTA.
Required states: pending, accepted, empty, 404.
Must not remove: token secrecy, accept, DZD display used today.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` a live seed token to screenshot.
- `[UNVERIFIED]` expiry copy format (`expires_at` already a date string).
- Is snapshot HTML sanitized server-side?
