# P03C — URL / query state ownership

**PR:** Normalize list URL / query state as one canonical contract. URL + Inertia query is the durable source of truth.  
**Baseline:** `main` @ `3e9e12f` (P03B #208).  
**Date:** 2026-09-14.

Ownership PR. Zero intentional visual change. P03D (empty/pagination/board helpers) is not started.

---

## Before

List chrome wrote GET URLs from a loose `Record<string, unknown>` bag (`filterFields` + `crmListHref`) in several places at once:

| Writer | What it did |
|---|---|
| FilterBar `apply()` | `router.get(crmListHref(...))` from `filterFields` + `extraQuery` |
| FilterBar search / quick filters | Uncontrolled `defaultValue` — stale after back/forward while `preserveState` kept the tree |
| SavedViews `<Link>` + `onClick={onViewChange}` | Link visit **and** shell `router.get(viewHref)` — two navigations |
| CrmListShell chips | Separate `router.get` |
| AdvancedFilterDrawer | GET form (one visit) + local draft groups |
| Pages `listPageHref` | Pagination Links; `page` omitted when `<= 1` |
| PipelineSwitcher | `router.get(base, { pipeline })` — dropped siblings (fixed in hardening) |

`page` was never in `filterFields`, so search / filter / view naturally dropped it.  
`sort` and `columns` were never URL-backed. Sort comes from the saved view or `ListViewConfig::defaultSort`. Columns are session React state in `CrmListShell` synced from `listView.columns`.  
Leads have no list query.

---

## After

One canonical query. One patch helper. Domain adapters serialize to the **existing** backend params. Chrome derives from Inertia `activeFilters` + extras. One user action → one Inertia visit.

```
Inertia activeFilters + extras
        │
        ▼
 fromActiveFilters()  →  CanonicalListQuery
        │
        ▼
 patchListQuery()     →  next CanonicalListQuery
        │
        ▼
 adapter.toDomainParams()  →  q / view / filter_id / page / …
        │
        ▼
 writeListHref() / router.get  OR  <Link href>
```

No URL + independent React list-state + `useEffect` sync. Search uses `key` from the URL value so back/forward remounts the input. Quick filters are `value` from the query.

---

## Canonical query contract

`resources/js/lib/list-query/types.ts`

| Shared concept | Type | Domain serialization |
|---|---|---|
| `search` | `string \| null` | `q` (every live object) |
| `page` | `number \| null` (`<=1` omitted) | `page` |
| `view` | `string \| null` (default `all`) | `view` |
| `savedViewId` | `number \| null` | `filter_id` |
| `filters` | explicit quick-filter keys | same param names |
| `filterGroups` | `ListViewFilters \| null` | `filter_groups` JSON |
| `sort` | `{ field, direction } \| null` | **not URL-serialized** |
| `extras.pipeline` | `number \| null` | `pipeline` (deals only) |

Not `Record<string, any>`. Filter engine is not generalized beyond keys the chrome already writes.

---

## Domain parameter map

| Concept | Contacts | Companies | Leads | Deals | Quotes |
|---|---|---|---|---|---|
| search | `q` | `q` | none | `q` | `q` |
| page | `page` | `page` | none | `page` | `page` |
| view | `view` (`all`/`my`) | `view` | none | `view` | `view` |
| saved view | `filter_id` | `filter_id` | none | `filter_id` | unused (`savedFilters: []`) |
| owner / created / status | yes | yes | none | yes | yes |
| last_activity / city / wilaya / unanswered / unassigned | yes | yes | none | yes | not consumed |
| stage | — | — | none | `stage` | — |
| extras | — | — | — | `pipeline` | — |
| sort | saved view / default | same | none | same | default only (`latest id`) |
| columns | not URL | not URL | hardcoded `<th>` | not URL | not URL |
| board/list | — | — | — | **routes** `/crm/deals` vs `/crm/deals/board` | — |

Backend consumers (unchanged):

- Contacts / Companies / Deals: `CrmFilter::resolve` + `paginate`
- Quotes: `QuoteController::constrain` + `CrmFilter::paginate`
- Leads: `LeadController::index` ignores query

---

## URL source of truth

- UI reads `activeFilters` / extras via `fromActiveFilters`.
- Interaction patches the canonical query, then existing Inertia GET (`navigateListQuery` or `<Link>`).
- History reconstructs from the query. Search `key={`q:${search}`}` remounts the box. Selects are controlled from the query.
- `preserveState: true` is unchanged so P03B selection still survives.

---

## Page reset rules

Verified against pre-P03C `filterFields` (no `page`) and `listPageHref` (`page > 1 ? page : null`):

| Action | Page |
|---|---|
| Search / search clear | reset (omit) |
| Quick filter / chip / clear all | reset |
| Built-in or saved view | reset |
| Stage pill / pipeline switch | reset |
| Sort patch (canonical only) | reset |
| Page prev/next | **keep** search, filters, view, extras, sort |

---

## Saved view behavior

Unchanged semantics:

- Built-in `all` / `my` (tickets also `unassigned` / `closed`): keep chrome filters + search; clear `filter_id`; set owner for `my`; tickets `closed` still clears `status`.
- Saved filter: replace chrome query with extras + `filter_id` only (existing `crmListHref(base, { ...extraQuery, filter_id })`).
- POST `/crm/filters` write path unchanged.

Navigation: `<Link href>` only. Shell `onViewChange` does **not** `router.get`.

---

## Column state

**Exception — not URL-backed.** Intentional.

`CrmFilter::resolve` reads columns from the saved view or `ListViewConfig` defaults, not from the request. Column chooser still updates `CrmListShell` `useState`, synced from `listView.columns` when Inertia replaces the saved view. Session-only until a view is saved.

---

## Board / list state

**Deferred to P11.** `DealLayoutToggle` is two routes (`/crm/deals` vs `/crm/deals/board`), not a query `mode=`. DataWorkspace `onModeChange` is still unwired. Normalizing that here would change routes.

---

## Selection interaction

P03B unchanged. Query updates use `preserveState: true`. Selection is **not** cleared on search / filter / view / page. Cross-page leftover ids remain possible. Documented in `p03b-selection-ownership.md`.

---

## Tests

New lock: `tests/Feature/P03CListQueryOwnershipTest.php`.  
Proofs: `resources/js/lib/list-query/list-query-contract.ts`.

| # | Proof |
|---|---|
| 1 | Search preserves unrelated |
| 2 | Search clear |
| 3 | Filter preserves |
| 4 | Filter clear |
| 5 | Meaningful change resets page |
| 6–9 | Page nav preserves search / filters / sort / view |
| 10 | Sort preserves filters / search |
| 11 | Saved-view change |
| 12 | Permitted extras (`pipeline`) survive |
| 13 | One `router.get` helper; SavedViews Links have no `onClick` navigate; no effect loops |
| H1 | Stage / pipeline preserve q, filters, sort, direction, view, extras |
| H2 | Empty removal deletes only that param |
| H3 | Back/forward reconstruction from hrefs |
| H4 | Board pipeline does not leak list keys |
| 14–18 | Request shapes Contacts / Companies / Leads / Deals / Quotes |
| 19 | P03B selection not cleared |
| 20 | Backend routes unchanged |

---

## Hardening — query preservation

| Bug | Fix |
|---|---|
| PipelineSwitcher `router.get(base, { pipeline })` dropped siblings | `applyPipeline` + `visitListQuery`. Preserves q / filters / sort / direction / view / extras. Drops `stage` (pipeline-scoped). Resets page. Board path emits only `pipeline` (list keys are invalid there). |
| Stage pills `crmListHref(..., filterFields(...), { stage })` dropped `pipeline` / sort | `applyStageFilter` + `listQueryHref` from `fromActiveFilters` + extras. |
| `filterFields` used as the nav bag | Documented as chrome-filter projection only. Navigation uses `hrefFromActiveFilters` / `navigateListQuery`. `listPageHref` goes through the canonical helper. |

Key classes (`lib/list-query/keys.ts`): canonical workspace · chrome filter · unrelated preserved (`sort`, `direction`, `pipeline`) · backend association (still via `filter_groups`) · unsafe (`owner_id`, `columns`, `create`, `contact_id`, `mode`).

URL-owned `sort` + `direction` (`?sort=amount&direction=desc`) reconstruct into `CanonicalListQuery.sort` and are re-emitted. Inertia `activeFilters.sort` objects from saved-view defaults are **not** URL-owned and are not written.

---

## Divergences (kept)

| Divergence | Why kept |
|---|---|
| `filterFields` / chrome omit `deal_stage`, `has_open_deal`, behavior filters | Backend-supported; chrome writes them through `filter_groups`. Not widened onto the FilterBar projection. |
| DealLayoutToggle still sends only `pipeline` | Board/list routes — P11 |
| Quotes skip `CrmFilter::resolve` | Backend contract |
| Tickets share chrome adapters | Out of page scope; params preserved |
| `view=all` still serialized when present on list pages | Pre-existing `crmListHref` / backend `activeFilters.view` |

---

## Tests run

| Command | Result |
|---|---|
| `php artisan test --filter='P03C'` | pass (6 tests, 170 assertions) |
| `php artisan test --filter='P01\|P02\|P03A\|P03B\|P03C\|CrmListWorkspace\|CrmBulkActions\|Contact\|Compan\|Deal\|Quote\|Lead'` | pass (302 tests, 3523 assertions) |
| `npx vite-node resources/js/lib/list-query/list-query-contract.ts` | pass (runtime proofs) |
| `npm run types:check` | pass |
| `npx eslint` on P03C-touched TS files | pass |
| `npm run build` | pass |

New lock: `tests/Feature/P03CListQueryOwnershipTest.php`.

---

## Deferred to P03D

- Empty / pagination / board helpers without a domain surface
- Shared-table `listPageHref` footer as the live paginator (pages still use `CrmListFooter`)
- Putting `sort` or `columns` on the URL (would need a backend read path)
- Contacts→shared-table migration, BulkActionBar redesign, PipelineBoard on `mode="board"`

---

## Architecture maps

Factual updates only: query write path is `lib/list-query` + existing GET params. MASTER P03C title now matches the user phase map (URL/query), not the older BulkActionBar item.
