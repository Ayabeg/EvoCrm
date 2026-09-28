# Quotes list

## 1. Screen Identity

Screen ID: SCR-QUOTE-001
Product area: CRM / Quotes
Route: `/crm/quotes`
Route name: `crm.quotes.index` [CONFIRMED-CODE]
Frontend file: `resources/js/pages/crm/quotes/index.tsx`
Primary component: `QuotesIndex`
Layout: App shell + `CrmListShell` shared-table. Breadcrumb: Quotes.
Authentication: CRM auth group.
Permissions: view any workspace quote. `can.create` = `QuotePolicy::create` = `crm.edit`. [CONFIRMED-BOTH] seed `can.create: true`
Parent navigation: Sidebar Sales group **Quotes** `/crm/quotes`. [CONFIRMED-CODE]
Entry points: sidebar; command palette; deal related “View”; `/crm/quotes?create=1`.
Exit points: row `/crm/quotes/{id}` (SCR-QUOTE-002); create overlay OVR-QUOTE-001; empty-state link to `/crm/deals?create=1`.
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/quotes/index`. [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `%TEMP%/evocrm-inertia/crm_quotes.json`.

## 2. Purpose

Index of commercial quotes (always attached to a deal). Scan amount, status, owner, dates; open builder; create a one-line draft quote.

## 3. Current UX Summary

Same shared-table chrome as other objects but thinner: **no bulk**, **savedFilters always []**, listView sort meta `created_at desc` while controller actually `latest('id')`. Seed: 1 quote, title “Clinic website intake”, status Sent, 220_000 DZD, owner null. [CONFIRMED-BOTH]

## 4. Screen Anatomy

`data-crm="quotes-workspace"`. Title Quotes, record count, **Create quote** if `can.create`, search/filters/columns, table, pagination, create drawer.

No pipeline switcher, stage pills, import, export, attention, layout toggle. [CONFIRMED-CODE]

## 5. Data Displayed

Props: `quotes`, `deals` (id, title for create), `members`, `savedFilters` [], `activeFilters` {view, status, owner, created, q}, `listView`, `recordCount`, `paginator`, `createOpen`, `can`. [CONFIRMED-BOTH]

Columns (`ListViewConfig` quote): Quote (title + Quote #{id} secondary), Amount, Status, Owner, Create date, Expiration; Sent hidden by default. [CONFIRMED-CODE]

Statuses: draft, sent, accepted (labels Draft/Sent/Accepted). Tone: accepted ink medium, sent ink, draft mute. Do not infer expired from expires_at. [CONFIRMED-CODE] `quote-columns.tsx`

Seed row id 1, total_cents 22000000, status sent, sent_at null, expires_at null, deal id 1. `recordCount` 1, paginator 25. `deals` list length 15. [CONFIRMED-BOTH]

## 6. Primary Actions

Create quote (if can). Open quote show.

## 7. Secondary Actions

Filters, column chooser, saved views UI (no server-saved quote views). Command create-quote if `canCreateQuote`. Delivery (send/preview/revoke) is **not** on the list (P08 comment). [CONFIRMED-CODE]

## 8. Search

**Search quotes…** `q`. Backend: quote `id` exact or deal title LIKE. [CONFIRMED-CODE] `QuoteController::constrain`

## 9. Filters

`view` all | my (my = deal.owner_id current user). `status` draft|sent|accepted. `owner` id or unassigned (via deal). `created` today|7d|30d|90d. `q`. Not `CrmFilter::apply` — custom `constrain()`. `savedFilters` empty so saved-view persistence is cosmetic/broken for quotes. [CONFIRMED-CODE]

## 10. Sorting

UI listView default created_at desc. Query always `latest('id')`; `CrmFilter::applySort` has no quote branch. Column sort clicks [UNVERIFIED] likely no-ops. [CONFIRMED-CODE]

## 11. Selection

`selectable: false` with comment “Page does not participate now. Not a permanent bulk ban.” [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

25 per page via `CrmFilter::paginate`. Inertia loading flag. [CONFIRMED-CODE]

## 14. Forms

Only the create drawer (OVR-QUOTE-001).

## 15. Overlays

OVR-QUOTE-001. Row peek OVR-SHELL-006 (`entity="quote"`). Shell overlays.

## 16. States

Populated; empty; filtered empty; `can.create` false hides primary; `createOpen && can.create`; no deals in drawer (see overlay).

## 17. Empty State

Unfiltered: **No quotes yet**, body about creating on a deal, CTA **Create quote**. Filtered: **No quotes match these filters**, no CTA. [CONFIRMED-CODE]

## 18. Error Handling

Create validation on overlay. Index itself has no error UI beyond Inertia `errors`. [CONFIRMED-CODE]

## 19. Feedback

Drawer closes on success (`resetOnSuccess`). Stays on list (store returns `back()`). [CONFIRMED-CODE]

## 20. Navigation Behavior

Row href `/crm/quotes/:id`. Create stays on index. Empty drawer can leave to deals create.

## 21. Entity Relationships

Quote → Deal → owner/contact/company. Customer is on the deal, not a quote column. Related SCR-QUOTE-002, OVR-QUOTE-001, SCR-DEAL-003.

## 22. Business Rules

- Currency DZD; totals from `QuoteTotals` on create.
- Create requires ≥1 line item.
- `can.create` from policy.
- Simple mode allowed.
- Status filter exact enum; unknown ignored.

## 23. Backend Dependencies

`QuoteController::index`, `presentList`, `constrain`, `CrmFilter::paginate`, `CrmHub::listViewMeta('quote')`, `QuotePolicy`.

## 24. Frontend Dependencies

`index.tsx`, `quote-columns.tsx` / contract, `CrmListShell`, `CreateDrawer`, `quote-split-builder` not used here.

## 25. Responsive Behavior

Same workspace table as deals. [CONFIRMED-CODE] Viewport [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: search aria-label Search quotes; identity initials decorative.
LIKELY ISSUE: no bulk yet but selection types exist; status is text not a badge with role.
REQUIRES MANUAL TEST: peek on quote rows.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-QUOTE-001 | MEDIUM | savedFilters hard-coded `[]` | Cannot persist quote views | QuoteController |
| UX-QUOTE-002 | MEDIUM | Sort meta ignored; always latest id | Column sort lies | `latest('id')` vs listView |
| UX-QUOTE-003 | LOW | Create is one ad-hoc line only | Must open builder to add catalog lines | overlay form |
| UX-QUOTE-004 | OBSERVATION | status sent vs sent_at null | List shows Sent inaccurately | dump |

## 28. Consistency Comparison

Shared-table like deals/contacts but no bulk/import/export/pipeline. Create must pick a deal first (unlike deals which can spawn a contact).

## 29. Functional Preservation Contract

Must keep: list of quotes with deal title identity; DZD amount; status draft/sent/accepted; owner from deal; dates; search id/title; filters view/status/owner/created; `can.create`; create overlay POST to deal; row href show; empty states; 25/page; peek.

## 30. Design Input Contract

Purpose: find and open quotes.
Primary goal: open the right quote or start one on a deal.
Primary actions: Create quote, open quote.
Required information: quote/deal title, number, amount DZD, status, owner, created, expires.
Required components: shared table, create drawer.
Required states: empty, filtered empty, cannot create, no deals.
Must not remove: deal association, DZD, statuses, can.create gate.

## 31. Open Questions / Unknowns

- Whether FilterBar quote adapter emits all constrain keys. [UNVERIFIED] contract includes q, status, owner, created, not stage/pipeline.
- Peek payload for quotes. [UNKNOWN]
