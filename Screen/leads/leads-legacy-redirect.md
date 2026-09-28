# Legacy `/leads` redirect (retired Kommo board)

## 1. Screen Identity

Screen ID: SCR-LEAD-004
Product area: CRM / Deals (legacy Leads URL)
Route: `GET /leads`
Route name: `leads.index` — **redirect**, not an Inertia page
Frontend file intended historically: `resources/js/pages/leads/board.tsx` (`LeadsBoard`)
Primary component: **none at runtime**. Laravel `Route::redirect('/leads', '/crm/deals/board')`. `[CONFIRMED-CODE]`
Layout: NOT APPLICABLE (302, no Inertia layout). `[CONFIRMED-UI]`
Authentication: Inside the authenticated middleware group; unauthenticated users hit `auth` then login. Crawl of `/leads` recorded **302 Location `/crm/deals/board`**. `[CONFIRMED-BOTH]`
Permissions: Redirect itself is a GET with no extra permission. Destination is deals board (`crm.deals.board`). `[CONFIRMED-CODE]`
Parent navigation: **None.** Sidebar must not advertise `/leads` (`EvoCrmP9RetireLeadsBoardTest`). Leads nav goes to `/crm/leads`. `[CONFIRMED-CODE]`
Entry points: Bookmarks, README, stale links, `pages/leads/board.tsx` internal `router.get('/leads', …)` if that page were ever mounted. `[CONFIRMED-CODE]`
Exit points: Always `/crm/deals/board` (SCR-DEAL-002). `[CONFIRMED-BOTH]`
Runtime HTTP (owner, simple_mode=true): **302** → `/crm/deals/board`. Component null, no props. `[CONFIRMED-UI]`
Evidence: `Screen/_evidence/runtime-index.json` path `/leads`; `routes/web.php` line `Route::redirect('/leads', '/crm/deals/board')->name('leads.index')`; `SimpleModeGuardTest` “keeps the retired /leads redirect while simple mode is on”. `[CONFIRMED-BOTH]`

## 2. Purpose

Retire the second pipeline product. One deal engine: list `/crm/deals` + board `/crm/deals/board`. Inbound Lead object lives at `/crm/leads`. `[CONFIRMED-CODE]` (`docs/evocrm-qa-checklist.md`, P9 tests)

## 3. Current UX Summary

Operators who open `/leads` land on the **deals** kanban, not a lead list and not `pages/leads/board.tsx`. `[CONFIRMED-BOTH]`

README still claims: “`/leads` is the Kommo-style pipeline board: horizontal stages … Dragging a card between stages updates the deal (`POST /crm/deals/{deal}/move`). It is the same deal engine as `/crm/deals`.” `[CONFIRMED-CODE]` That description matches the **orphan** React page and the **deals** board, not the live `/leads` route.

## 4. Screen Anatomy

Runtime: NOT PRESENT (redirect). `[CONFIRMED-UI]`

Orphan UI in `resources/js/pages/leads/board.tsx` `[CONFIRMED-CODE]` `[UNREACHABLE]`:
- Header “Lead board” + pipeline name + “New lead”
- Search “Search leads…”
- Strip chips Active / Tasks today / No tasks / Overdue / New today (counts)
- `PipelineKanban` of **deals** (amount DZD, contact/company, next task, lead_score pill)
- Drag or menu “Move to {stage}” → POST `/crm/deals/{id}/move`
- First-column quick add POST `/crm/deals` with `stage_id`, title, `contact_name`
- Breadcrumbs `{ title: 'Leads', href: '/leads' }`

No web Inertia render of this file. Vite/graphify still indexes it; `AuroraTokenBridgeTest` and `P26AccessibilityTest` still read the file. `[CONFIRMED-CODE]`

## 5. Data Displayed

Redirect: none. `[CONFIRMED-UI]`

Orphan page expected props: `pipeline`, `stages`, `deals` (BoardDeal), `counts`, `filter`, `q`. `[CONFIRMED-CODE]` `[UNREACHABLE]`

API `GET /api/v1/leads/board` (`LeadController::board` in Api V1) returns **deal board JSON** (pipeline, stages, deals, forecast) — mobile catalog `leadsBoard`. Not this React page. `[CONFIRMED-CODE]`

## 6. Primary Actions

Runtime: follow redirect to deals board (create deal, drag stage — see SCR-DEAL-002). `[CONFIRMED-CODE]`

Orphan: “New lead” / Quick add actually creates a **deal**. `[CONFIRMED-CODE]` `[UNREACHABLE]`

## 7. Secondary Actions

NOT APPLICABLE at `/leads`. Orphan: search debounce `router.get('/leads', { filter, q })` — would 302 if ever executed, dropping query unless deals board reads those params. `[CONFIRMED-CODE]` `[UNREACHABLE]`

## 8. Search

NOT APPLICABLE on the redirect. Orphan search is labeled “leads” but queries `/leads`. `[CONFIRMED-CODE]`

## 9. Filters

Orphan strip `filter=` chips. Deals board has its own options — do not assume they match. `[CONFIRMED-CODE]` `[UNKNOWN]` deals board query compatibility.

## 10. Sorting

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 11. Selection

NOT PRESENT. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 14. Forms

Orphan quick-add POST `/crm/deals` (`title`, `contact_name`, `stage_id`). `[CONFIRMED-CODE]` `[UNREACHABLE]`

## 15. Overlays

Orphan: card ellipsis dropdown to move stage. `[CONFIRMED-CODE]` `[UNREACHABLE]`

## 16. States

Runtime: HTTP 302 only. `[CONFIRMED-UI]`
Simple mode: redirect still allowed (not in `SimpleMode::blocks`). `[CONFIRMED-CODE]`

## 17. Empty State

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 18. Error Handling

NOT APPLICABLE on redirect. `[CONFIRMED-CODE]`

## 19. Feedback

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

`GET /leads` → `/crm/deals/board`. Named route `leads.index` is this redirect (tests assert the string in `web.php`). `[CONFIRMED-BOTH]`

`GET /crm/leads` remains the Lead **list** (SCR-LEAD-001) — different product object. `[CONFIRMED-BOTH]`

## 21. Entity Relationships

Redirect target is Deal/pipeline. Lead records are not listed here. `[CONFIRMED-CODE]`

## 22. Business Rules

- Dual IA is retired: no second kanban product at `/leads`. `[CONFIRMED-CODE]`
- Simple mode keeps the redirect. `[CONFIRMED-CODE]`
- File `pages/leads/board.tsx` is dead web UI; deleting it is out of scope for this audit. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`routes/web.php` redirect. Destination `DealController::board`. API `App\Http\Controllers\Api\V1\LeadController::board` uses `PipelineManager::boardData` (deals). `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

Live: none. Dead: `pages/leads/board.tsx`, `PipelineKanban*`, `LeadScorePill`, `formatDzd`, `stageUnderlineColor`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

NOT APPLICABLE. Orphan kanban is horizontal overflow. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: orphan search has `aria-label="Search leads"`; move button `aria-label={`Move ${deal.title}`}`. `[CONFIRMED-CODE]` `[UNREACHABLE]`
REQUIRES MANUAL TEST: redirect announcement for screen readers (browser default).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-LEAD-301 | HIGH | README documents `/leads` as the live Kommo board | Docs send people to deals board or a dead page | README vs runtime 302 `[CONFIRMED-BOTH]` |
| UX-LEAD-302 | HIGH | `pages/leads/board.tsx` still present and wired to `/leads` | Future route revival would restore dual IA | file + redirect `[CONFIRMED-CODE]` |
| UX-LEAD-303 | MEDIUM | Bookmark `/leads` ≠ Lead object `/crm/leads` | Operators looking for inbound leads land on deals | runtime `[CONFIRMED-UI]` |
| UX-LEAD-304 | LOW | Command palette keyword for Leads is “pipeline prospects” | Confuses lead list vs pipeline board | `command-os.ts` `[CONFIRMED-CODE]` |
| UX-LEAD-305 | OBSERVATION | API path `/leads/board` is deal board JSON | Mobile “leads board” is deals | `api.php` `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

QA checklist and P9 tests match runtime (redirect). README and orphan page match each other, not runtime. Deals board (`/crm/deals/board`) is the live Kommo-like UI. `[CONFIRMED-BOTH]`

## 29. Functional Preservation Contract

- Keep `GET /leads` → `/crm/deals/board` until product explicitly reintroduces a URL.
- Keep `/crm/leads` as the Lead list, not a kanban.
- Do not put `/leads` in the rail.
- If the orphan board is resurrected, it must not fork a second pipeline (same `POST /crm/deals/{deal}/move`).

## 30. Design Input Contract

Purpose of the **live** URL: compatibility alias to the deals pipeline board.
Primary goal: one pipeline surface.
Primary actions: none on `/leads`; inherit deals board.
Required information: none on this hop.
Required components: HTTP redirect only.
Required states: 302 authenticated; login if guest.
Business-critical: do not render a second board.
Must not remove: redirect until README/bookmarks are migrated.

## 31. Open Questions / Unknowns

- Whether any production bookmark volume still hits `/leads`. `[UNKNOWN]`
- Whether mobile clients depend on `GET /api/v1/leads/board` naming. `[UNVERIFIED]`
- Plan to delete `pages/leads/board.tsx`. `[UNKNOWN]`
