# P08 — Quotes list workspace migration

**PR:** Move the production Quotes **list** (`/crm/quotes`) onto DataWorkspace `resultMode="shared-table"`. Fifth live object on the canonical shared-table path. Completes the first object-list migration wave (Contacts / Companies / Leads / Deals / Quotes).  
**Baseline:** `main` @ `1762e38` (P07 #216).  
**Date:** 2026-09-15.

Structural list-surface migration only. Zero quote-engine / builder / send / accept / PDF / tax / discount / currency / bulk-API / saved-view persistence / filter-contract changes. P03C query adapter is mapped, not replaced. P09 QuickRecordDrawer and P18 builder redesign are not started.

---

## BEFORE

Quotes list was a domain-result consumer of `CrmListShell`. Chrome (header, SavedViews, FilterBar) already came from DataWorkspace; the table, empty, pagination, and loading lived in page children.

| Concern | Owner |
|---|---|
| Route | `GET /crm/quotes` → `QuoteController@index` |
| Page | `pages/crm/quotes/index.tsx` |
| resultMode | Implicit `domain` (page omitted `resultMode=`) |
| Table renderer | Domain `ListViewTable` in children |
| Identity cell | Generic primary-column `Link` (`title` or `Quote #{id}`) |
| Query | P03C `QUOTE_ADAPTER` (`q`, `view`, `status`, `owner`, `created`) |
| Saved views | Built-in All / My only. Controller `'savedFilters' => []`. UI hides “Add view” |
| Selection | P03B uncontrolled. `selectable: false` |
| Bulk | None — no route, no UI |
| Empty | Domain `CrmEmptyState` (true empty vs filtered) |
| Pagination | Domain `CrmListFooter` + page-local `listPageHref` |
| Loading | Page `useInertiaLoading` + `SkeletonList` |
| Create | `CreateDrawer` → `POST /crm/deals/{deal}/quotes` |
| Row href | Domain fallback `${basePath}/${id}` |
| Statuses | `draft` / `sent` / `accepted` |
| Money | `total_cents` via `formatDzd` |
| Customer | Not a Quote field — via required `deal_id` |
| Validity | Stored `expires_at` (optional). No `expired` status |
| Search placeholder | Generic “Search” |

No `QuoteWorkspaceTable` / `QuotePaginator` / `QuoteSavedViews` files existed. The fork was the generic domain trio (`ListViewTable` + `CrmEmptyState` + `CrmListFooter`).

---

## AFTER

Quotes **list** is a real shared-table consumer. The page no longer renders a raw table, `CrmEmptyState`, `CrmListFooter`, or `SkeletonList`. Create-from-deal, show, send, revoke, PDF, and public accept are untouched.

| Concern | Owner |
|---|---|
| Workspace composition | DataWorkspace |
| Query chrome | DataWorkspace SavedViews + FilterBar + AdvancedFilterDrawer |
| Table shell | `ListDataTable` → `ListViewTable` |
| Selection | P03B `WorkspaceSelection` (uncontrolled). **`selectable: false`** |
| Row href | P03D `quoteRowHref` → `/crm/quotes/:id` |
| Empty | P03D `WorkspaceEmpty` via `empty={quoteEmptyState(...)}` |
| Pagination | P03D `WorkspacePaginator` via `listPageHref` |
| Loading | Canonical DataWorkspace skeletons (`loading={loading}`) |
| Domain columns / cells | `quote-columns.tsx` + `ListViewConfig::columns('quote')` |
| Create | Unchanged `CreateDrawer` + POST `/crm/deals/{deal}/quotes` |
| Saved views | Unchanged consume-only (All / My). No “Add view” |
| Bulk | Still none |

`CrmListShell` now branches:

- Contacts + Companies + Leads + Deals + **Quotes**: `resultMode="shared-table"` (requires `rows`, `rowHref`, `empty`)
- Tickets: `resultMode="domain"` + `renderResults` (unchanged)

---

## DATAWORKSPACE MIGRATION

```
QuotesIndex
  CrmListShell resultMode="shared-table"
    DataWorkspace object="quote"
      PageHeader (Create quote)
      SavedViews (All / My only — no Add view)
      FilterBar (search “Search quotes…” + status/owner/created + Advanced + columns)
      ListDataTable(rowHref) | WorkspaceEmpty | loading skeletons
      WorkspacePaginator
```

Quotes owns: columns, cells, row ids, `rowHref`, status, customer/deal semantics, money formatting, filters, actions, permissions, query adapter values, lifecycle values.

DataWorkspace owns: composition, views chrome, query chrome, table shell, selection, empty, pagination.

Forbidden on the Quotes **list** page:

- `CrmShell` / `chrome="workspace"` / `RoomShell`
- `children` / `renderResults`
- Raw `<table>` / `CrmEmptyState` / `CrmListFooter` / page `listPageHref` / `SkeletonList`
- `QuickRecordDrawer` / `onRowPeek`
- `QuoteWorkspaceTable` / `QuoteWorkspacePaginator` / `QuoteSavedViews` / `QuoteFilterBar` forks

---

## QUOTE QUERY CONTRACT

P03C already normalized Quotes. **Do not replace the adapter.**

`QUOTE_ADAPTER` remains:

| Field | Value |
|---|---|
| `object` | `quote` |
| `supportsQuery` | `true` |
| `searchParam` | `q` |
| `filterKeys` | `owner`, `created`, `status` |
| `extras` | `[]` |

Serialized production params stay `q` / `view` / `status` / `owner` / `created` / `page` only as they already exist. No aesthetic renames.

Backend `QuoteController::constrain` is unchanged:

| Param | Behavior |
|---|---|
| `q` | Exact quote `id` OR `deal.title LIKE %q%` |
| `view` | `all` / `my` (deal owner = current user) |
| `status` | `draft` / `sent` / `accepted` (invalid ignored) |
| `owner` | `unassigned` or numeric deal `owner_id` |
| `created` | `today` / `7d` / `30d` / `90d` |
| `page` | `CrmFilter::paginate`, 25/page |

Adapter may emit `sort` / `direction` / `filter_id` / `filter_groups`. Backend still ignores sort (`latest('id')`) and always returns `savedFilters: []`. That is existing honesty, not a P08 invention.

URL / Inertia `activeFilters` remain the source of truth. No page-local search input. No `searchParams.set` / `history.replaceState` mirror.

Search: supported. Placeholder **Search quotes…**. Backend param stays `q`. No client fuzzy. Page reset follows the P03C contract.

---

## QUOTE IDENTITY

Canonical identity is the stored list `title` (deal title from `presentList`, fallback `Quote #{id}`). There is no separate quote number field.

- Primary: `title` or `Quote #{id}`
- Secondary: `Quote #{id}` only when it is not already the primary (so two quotes on the same deal stay distinguishable)
- Truncate + `title` tooltip
- Subtle 24px initials from the first two title tokens
- Same grammar as Contacts / Companies / Leads / Deals

Do not invent a quote code, SKU, or invoice number.

---

## CUSTOMER SEMANTICS

Quote has **no customer FK**. Customer context is the required Deal:

- List `title` = `deal.title`
- List `owner` = `deal.owner`
- Record show already hydrates `deal.contact` / `deal.company`

P08 does **not** invent a universal Customer column. Contact is eager-loaded in `index` but was never part of `presentList`; hydrating it onto the list would be a new payload, so it stays off the list. Quiet em dash remains the empty-cell convention for owner / dates when missing.

---

## QUOTE COLUMN CONTRACT

File: `resources/js/pages/crm/quotes/quote-columns.tsx`

Real `ListViewConfig::columns('quote')` fields only:

| id | Default visible | Role |
|---|---|---|
| `title` | yes | Identity. Frontend label **Quote** |
| `amount` | yes | `total_cents` via existing `formatDzd` |
| `status` | yes | Exact `draft` / `sent` / `accepted` |
| `owner` | yes | Deal owner (same owner cell convention) |
| `created_at` | yes | Existing date format |
| `expires_at` | yes | Stored validity. “No expiration” if null |
| `sent_at` | no | Send timestamp. Em dash if null |

No invented columns (customer, company, contact, tax, discount, PDF, public URL, probability).

Recommended scan hierarchy (documented, not forced): identity → status → amount → owner → dates.

---

## STATUS / LIFECYCLE

Verified production statuses: **draft / sent / accepted**. Labels stay Draft / Sent / Accepted. P08 does not rename them and does not add `expired` / `rejected` / `revoked` as list states.

List cell tone (restrained, not all orange, no filled badges):

| Tone | When | Presentation |
|---|---|---|
| `draft` | `status === 'draft'` | `text-mute` |
| `sent` | `status === 'sent'` | `text-ink` |
| `accepted` | `status === 'accepted'` | Quiet success — `font-medium text-ink` |
| `unknown` | anything else | `text-mute` (do not infer from dates) |

Backend owns state. A past `expires_at` does **not** become Expired on the list.

Lifecycle (create, line items, send, accept, revoke, PDF) stays on existing controller / services / show / public routes.

---

## MONEY / CURRENCY

`QuoteAmountCell` calls existing `formatDzd(total_cents ?? 0)`.

- Currency remains stored `DZD` (create always writes `DZD`)
- Authoritative amount is stored `total_cents` from `QuoteTotals`
- No conversion, no extra rounding, no compact format, no list-side recompute of tax/discount/line items
- `tabular-nums` + truncate + tooltip

---

## VALIDITY / EXPIRY

Real field only: `expires_at` (optional on create/update).

- Present when set, formatted with the existing Algiers date helper
- Missing → existing copy **No expiration**
- Public `token_expires_at` (+14d on send) is a **link** expiry, not a list column
- `revoked_at` / `accepted_at` stay on show
- Do not invent validity from `created_at + N`

---

## DEAL ASSOCIATION

Required `deal_id` FK. Create is still `POST /crm/deals/{deal}/quotes`. List row already includes `{ deal: { id, title } }`. Title **is** the deal title. Navigation to the quote show is unchanged; deal navigation from the list is not invented (no new deal column). Deal show embed (`DealQuotes`) is untouched.

---

## ROW NAVIGATION

`quoteRowHref(row) → /crm/quotes/${row.id}`  
P03D `resolveRowHref` / `ListDataTable.rowHref`.  
`onRowPeek` is still unused (P09).  
Row click ignores `a, input, button, label` so the name link does not double-navigate.

---

## QUOTE ACTIONS

List surface actions that already existed:

| Action | Where | Unchanged? |
|---|---|---|
| Create quote | Header CTA + empty CTA → `CreateDrawer` | Yes |
| View | Row click / identity link → show | Yes |

Show-only (not added to the list menu): Preview PDF, send/resend, revoke. There was no list row action menu; P08 does not invent View/Edit/Send/Download/Duplicate/Delete on the row. Permissions stay `crm.edit` for create/update; list remains auth + workspace scoped.

One primary CTA: **Create quote**.

---

## SELECTION / BULK DECISION

Re-audit: still **no** quote bulk route, no quote bulk API, no `crm.quotes.bulk`.

**Decision: `selectable: false`.** No checkboxes. No fake bulk bar. Comment retained: “Not a permanent bulk ban.”

Uncontrolled P03B `WorkspaceSelection` is still wired (`pageIds`) so a future real bulk API can opt in without a second selection system.

---

## SAVED VIEWS

**Consume-only.** Honesty over symmetry.

- Built-in All quotes / My quotes remain
- Controller still `'savedFilters' => []`
- `SavedFilter` entity still `in:contact,deal,company` — quote is not persistable
- SavedViews still hides “Add view” for `object === 'quote'`
- P08 does **not** enable “+ Add view” for visual symmetry
- No new persistence

---

## FILTERS

Real quote `filterFields` only: status (`draft` / `sent` / `accepted`), owner, created (`today` / `7d` / `30d` / `90d`).

Quick bar uses the shared owner / created / status set. Search placeholder is **Search quotes…**. Sibling query preservation stays on P03C (`q` / view / sort keys are not erased when a filter changes). Advanced drawer may write `filter_groups`; backend still does not apply them (pre-existing).

---

## COLUMNS

Visibility + order stay on ListViewConfig / session. Not URL. `applyQuoteColumnContract` only relabels `title` → **Quote**. Lean default: six visible columns; `sent_at` stays default-hidden.

Widths (P05 / P07 lesson):

- `table-fixed min-w-[60rem]` (six default columns)
- title 28% / amount 14% / status 10% / owner 16% / created 16% / expires 16%
- Flexible identity; compact status; predictable money/dates
- Identity `flex w-full min-w-0` + ellipsis
- Intentional table H-scroll; vertical scroll on the table body (`scrollbar-gutter: stable`)
- Last column padding so it is not clipped
- Cards below `@[480px]/list`

---

## EMPTY STATES

`WorkspaceEmpty` (`h2` + `role="status"`).

| State | Title | CTA |
|---|---|---|
| No records | No quotes yet | Create quote |
| Filtered / search miss | No quotes match these filters | none |

Copy matches the previous domain empty. Filtered empty uses `hasActiveListFilters(activeFilters)`.

---

## PAGINATION

`WorkspacePaginator` → `workspacePageHref` → `listPageHref`.  
Noun is now `quotes` (was a generic `records` stub because Quotes had not migrated).  
Special contract (backend ignores URL sort) is adapted, not faked — Prev/Next still send `page` with the current filters.

---

## VISUAL BASELINE INHERITANCE

Inherited from P04/P05/P06/P07. No independent Quotes visual system.

- Identity cell: two-line title + quote number; table headers 13/18
- Quote rows `min-h-12` so two-line identity can grow
- Header hierarchy unchanged (PageHeader title, one primary Create quote)
- Filter chrome is existing DataWorkspace spacing (pad-x 32)
- Workspace surface `bg-white` (same as Contacts / Companies / Leads / Deals)
- Restrained orange: brand only on the existing create-drawer submit, not on status
- No new cards, gradients, orange surfaces, or app-shell redesign
- Canonical loading skeletons — no Quotes-specific spinner

---

## FIRST-WAVE CONSISTENCY AUDIT

Shared chrome only (Contacts / Companies / Leads / Deals / Quotes). Other four objects were **not** redesigned.

| Finding | Object | Action |
|---|---|---|
| Shared-table + CrmListShell mapper | All five | Consistent after P08 |
| Search placeholder object-specific | Companies / Deals / **Quotes** | Quotes now “Search quotes…” |
| Search placeholder still generic “Search” | Contacts | Documented; do not reopen P04 |
| Search hidden (`supportsQuery: false`) | Leads | Documented; do not reopen P06 |
| Saved-view create | Contacts / Companies / Deals | Existing persistence |
| Saved-view consume-only / blocked | Quotes / Leads | Honesty; do not enable Add view |
| Bulk real | Contacts / Deals | Existing APIs |
| Bulk absent | Companies / Leads / Quotes | `selectable: false` |
| Identity two-line + initials | All five | Quotes now matches |
| `WorkspacePaginator` noun | Quotes was `records` | Fixed shared primitive (`quote: 'quotes'`) |
| Tickets still domain | Tickets | Out of wave 1 |

Shared primitive fixes in P08 (quote-keyed only, safe):

- `WorkspacePaginator` noun `quote: 'quotes'`
- `FilterBar` “Search quotes…”
- `ListDataTable` scrollbar-gutter includes `quote`
- `wrapQuickFilters` includes `quote`

No Contacts / Companies / Leads / Deals page files were redesigned.

---

## 1440 QA

Intended (not executed here — see LIVE VISUAL QA):

Default six columns visible when the workspace is wide. Toolbar: search + status/owner/created + Advanced + columns. Identity truncates; full title in `title`. Status compact. Amount tabular.

---

## 1280 QA

Same columns. May start the intentional table H-scroll if the pane is narrower than `60rem`. No page-level overflow. Last column not clipped.

---

## 1024 QA

Table `min-w-[60rem]` + one intentional horizontal scroller. Vertical scroll on the table body. Header / filters wrap. Primary CTA visible.

---

## 768 QA

Same H-scroll contract above 480px container. Below `@[480px]/list` card rows (title + three secondary fields). Primary Create quote visible. Create drawer still requires a deal.

---

## BACK / FORWARD QA

Explicit checklist (P07 gap — document, do not fake results):

1. Search `q` survives Back/Forward
2. Status chip survives
3. Owner chip survives
4. Created chip survives
5. Built-in view `all` / `my` survives
6. Page 2 survives
7. Combined `q` + `status` + `page` survives
8. Selection is not written to the URL (and there are no checkboxes)
9. Opening Create quote (`?create=1` if used) then Back returns to the list query
10. Row → show → Back returns to the same list URL

---

## INTERACTION QA

1. `/crm/quotes` uses DataWorkspace shared-table, not domain children
2. Identity truncates long deal titles; tooltip shows the full title
3. Secondary is `Quote #{id}` when title is the deal name — never duplicated
4. Amount is existing DZD formatting, tabular
5. Draft mute / Sent ink / Accepted quiet success — not all orange
6. Status names stay Draft / Sent / Accepted
7. Expired-looking dates do not relabel status
8. Row click → `/crm/quotes/:id`; name link does not double-navigate
9. Create quote drawer still POSTs `/crm/deals/{id}/quotes`
10. Empty deals list in the drawer still points to `/crm/deals?create=1`
11. Search placeholder reads “Search quotes…”
12. No “Add view”
13. No checkboxes / bulk bar
14. True empty vs filtered empty copy
15. Paginator shows “Showing N of M quotes”
16. Contacts / Companies / Leads / Deals / Tickets / quote show unchanged

---

## QUOTE LIFECYCLE REGRESSION

P08 must not change:

- Create from deal (line name, quantity, `unit_dzd`, notes)
- Line-item sync via `QuoteTotals` (`unit_cents` / `total_cents`)
- Subtotal / tax / discount / total / currency (none of these are list-owned; totals stay stored `total_cents`)
- Status transitions `draft` → `sent` (mailer) → `accepted` (public accept)
- Send / resend / revoke on show
- PDF preview
- Permissions (`crm.edit` create/update; workspace abort on send/revoke)
- Deal association FK and cascade
- Public `/q/{token}` accept
- Immutable after send/accept

Covered by existing `QuoteTotalTest`, `QuoteDeliveryTest`, `QuoteAcceptanceTest`, `EvoCrmWave4QuotesChromeTest` (record + public + live filters), `CrmPolicyTest`.

---

## OWNERSHIP MAP

| Area | Owner after P08 |
|---|---|
| List composition / chrome | DataWorkspace |
| Quote columns, cells, identity, amount, status tone | Quotes (`quote-columns.tsx`) |
| Query keys | P03C `QUOTE_ADAPTER` |
| Selection | P03B WorkspaceSelection (`selectable: false`) |
| Bulk | **Does not exist** |
| Saved-view create | **Does not exist** for quote |
| Show / PDF / send / revoke | Unchanged. P18 polish only |
| Public accept | Unchanged |
| QuickRecordDrawer | **Unchanged. P09** |
| Tickets list | Unchanged domain |

---

## TESTS

New lock: `tests/Feature/P08QuotesWorkspaceTest.php`  
Proofs: `resources/js/pages/crm/quotes/quote-columns-contract.ts`

Updated source locks that previously froze Quotes on domain children: P03A, P03B (selection honesty kept), P03D, P04, P05, P06, P07, `CrmListWorkspaceTest`, `EvoCrmWave4QuotesChromeTest` (list chrome only).

P03C query lock is unchanged (QUOTE_ADAPTER shape). Quote engine tests are not rewritten.

---

## LIVE VISUAL QA

**Status: NEEDS HUMAN / RESEARCH BOX**

This agent did not run a real browser against a deployed Contabo / preview host. Do not treat the checklists above as executed.

Exercise at **1440 / 1280 / 1024 / 768** plus the Back/Forward and Interaction lists.

Realistic Contabo QA data:

- ≥1 long deal title (80+ chars) used as quote title
- Two quotes on the same deal (prove Quote #{id} secondary)
- Quote with no deal title fallback (orphan is rare; title fallback is `Quote #{id}`)
- Mix of draft / sent / accepted
- Amounts 0 and large (e.g. 5,000 DZD)
- `expires_at` set, past, and null
- `sent_at` present and null
- Unassigned deal owner
- Enough rows for page 2
- Empty filtered search (`q=zzz-no-match`)
- Workspace with zero deals (create drawer empty state)
- User with and without `crm.edit`

---

## REMAINING QUOTE LIST DEBT

- `sort` / `direction` are emitted by the adapter but the backend still uses `latest('id')`
- `filter_groups` / `filter_id` are not applied (`savedFilters` is always `[]`)
- No quote bulk API
- No persisted saved views for quote
- Contact / company stay on the record, not the list
- Column chooser is session-only (same as the other four objects)
- `CrmListShell` still maps Inertia; page does not import DataWorkspace directly
- No QuickRecordDrawer, no list row action menu
- Six default columns need H-scroll under ~1280 content width (intentional)

---

## DEFERRED TO P09+

| Item | Phase |
|---|---|
| QuickRecordDrawer / `onRowPeek` | **P09** |
| Tickets shared-table | later (not P09) |
| Quote builder / lifecycle UX | **P18** |
| New quote backend / statuses / tax / discount / currency / PDF / send / acceptance | out of scope |
| Quote bulk API | out of scope until a real endpoint exists |
| Persisted quote saved views | out of scope until `SavedFilter` allows `quote` |
| Apply `filter_groups` / URL sort on quotes | later (unless main already did; it did not) |
| App-wide a11y | **P26** |
| Legacy helper deletion | **P28** |

---

## P18 DEFERRALS

P18 owns builder/lifecycle UX redesign. P08 explicitly does **not**:

- Redesign `quotes/show.tsx`
- Add a split builder
- Change line-item editing UX
- Change send / accept / revoke / PDF chrome
- Invent list-row Send / Download / Duplicate
- Recalculate totals or change currency display rules

Create-from-deal stays the compact drawer that already existed.
