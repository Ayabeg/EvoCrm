# Command palette (Command OS)

## 1. Screen Identity

Screen ID: `OVR-SHELL-001`
Product area: Shell overlays
Route: Overlay. Remote search `GET /crm/command/search` named `crm.command.search`
Route name: `crm.command.search` (search only)
Frontend file: `resources/js/components/crm/command-palette.tsx`
Primary component: `CommandPalette` wrapping Aurora `CommandPalette` (`resources/js/components/aurora/command-palette.tsx`)
Layout: Portal overlay over AppLayout. Not a page.
Authentication: Authenticated (search aborts 403 without `workspace_id`)
Permissions: Create items require `crm.edit`. Ask item requires `features.ask_evo !== false`. Navigate extras tickets/ads/report_builder respect feature flags. Remote hits are permission-safe on the server (`CommandSearch`).
Parent navigation: Header search, ⌘K, sparkle (`SCR-SHELL-003`)
Entry points: Search click/focus, Ctrl/Cmd+K, Sparkle “Ask Evo”
Exit points: Escape/close; selecting an item visits an href, opens peek, or dispatches Ask Evo
Runtime HTTP (owner, simple_mode=true): Overlay not separately crawled. Host pages 200. `features.ask_evo: false` so Ask section empty. `evoSearchIndex` always `[]`. `[CONFIRMED-BOTH]`
Evidence: `command-palette.tsx`, `resources/js/lib/command-os.ts`, `app/Http/Controllers/Crm/CommandSearchController.php`, `routes/web.php`, `HandleInertiaRequests.php` P16 comment.

## 2. Purpose

Single Command OS (P16): search records, navigate, create, jump to activity queues, and (when enabled) open Ask Evo — without a second palette.

## 3. Current UX Summary

Aurora palette, placeholder “Search, navigate, create, or act”. Empty query shows Recent (localStorage `evo:command-os:recents`, max 5, non-search kinds) then Create, Act, Ask, Navigate. Typed query debounces 180ms, fetches `/crm/command/search?q=`, shows Search hits first then scored local items. Status text: “Searching…” or “Search unavailable — navigate, create, and actions still work”.

## 4. Screen Anatomy

Sections (ids): `recent`, `search`, `create`, `act`, `ask`, `navigate`. Icons from Phosphor via `ICONS` map + kind fallbacks. Wrapper handles select; Aurora item `onSelect` is a no-op.

## 5. Data Displayed

**Navigate (always):** Home, Contacts, Companies, Leads, Deals, Pipeline, Inbox, Activities, Quotes, Automation, Settings.

**Navigate (feature !== false):** Tickets, Captures, Segments, Conversations, Outbound, Ads, Report builder. Captures/Segments/Conversations/Outbound/Reports have **no** feature flag — they appear even in simple mode.

**Create (if `crm.edit`):** Contact, Company, Deal, Quote, Log activity (`?create=1` / activity queue create).

**Act:** Overdue / Today / Upcoming / Completed activities (P15 work queue hrefs).

**Ask:** “Ask Evo” only if `isAskEvoEnabled` — **hidden on this seed**.

**Search hits:** `{ type, id, label, href, recordRef? }` → results with `recordRef` open peek instead of visiting.

## 6. Primary Actions

Select a result. Kinds:

- `ask` → `openAskEvo()` then close
- `recordRef` → `openRecord(ref)` (peek)
- else `href` → `router.visit`

Non-search selections persist to recents.

## 7. Secondary Actions

Type to filter. Close restores focus to the opener unless the opener was the search field (`data-command-trigger="search"`).

## 8. Search

Needle = trim/lowercase. Remote: AbortController + request ids to drop stale responses. `visibleCommandRemoteHits` only shows hits when `hitsForQuery` matches current needle. Local scoring: exact 3, prefix 2, substring 1. Aurora `filter={() => 1}` disables inner filtering so compose order wins.

## 9. Filters

Section grouping only. No type facets in the UI.

## 10. Sorting

Empty query: recents, create, act, ask, navigate catalog order. Query: search hits as returned, then local by score desc.

## 11. Selection

Keyboard/pointer inside Aurora palette (`[UNVERIFIED]` exact a11y behavior of Aurora). `data-command="os"` is the root selector used so peek Escape does not close while command is open.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Search is unbounded by UI paging; server `COMMAND_SEARCH_PER_TYPE = 6`, `COMMAND_SEARCH_MAX_TOTAL = 30`. No infinite scroll.

## 14. Forms

Single query string. Not an Inertia form.

## 15. Overlays

This is the overlay. Can open peek or Ask Evo on top of the page after it closes.

## 16. States

Closed / open empty / searching / results / search failed / no local match. Recents invalid vs current catalog filtered out (`filterValidRecents`).

## 17. Empty State

Aurora decides empty query presentation; local catalog is never empty (navigate always has items). Failed search still shows local matches.

## 18. Error Handling

Non-OK or network → `searchFailed`, hits cleared, status string. AbortError ignored. Stale responses ignored. 403 on search if no workspace.

## 19. Feedback

`statusText`; recents persistence (private mode catch). No toast.

## 20. Navigation Behavior

Closing clears query/hits. Shortcut toggles. Simple mode still offers Companies/Leads/Pipeline/Tickets-hidden-by-feature etc. Tickets/Ads/Report builder omitted because features false.

## 21. Entity Relationships

Search hits attach to contact/company/lead/deal/quote refs for peek. Activity search description uses type string; no peek for activities (`recordRef` optional).

## 22. Business Rules

- Do not load CRM rows onto every page (`evoSearchIndex = []`).
- Create gated on `crm.edit`; header Create is looser.
- Ask Evo catalog respects simple-mode feature flag.
- Recents never store search hits.

## 23. Backend Dependencies

`CommandSearchController` + `App\Services\Crm\CommandSearch`. Auth + verified + permissions + simple mode middleware group (search itself is not in `SimpleMode::blocks`).

## 24. Frontend Dependencies

Aurora palette, `useQuickRecord`, `useSimpleMode`, `command-os`, `openAskEvo`.

## 25. Responsive Behavior

`[UNVERIFIED]` Aurora layout on mobile. `NOT VERIFIED` viewport.

## 26. Accessibility Observations

**CONFIRMED:** shortcut ignores IME (`isComposing`, keyCode 229); focus restore except search trigger.

**LIKELY ISSUE:** two ⌘K handlers exist (wrapper `useCommandPaletteShortcut` and Aurora `useCommandPalette` demo hook — the demo hook is not used by this wrapper). Sparkle name vs action (header).

**REQUIRES MANUAL TEST:** arrow keys, screen reader announcements of sections, trapTabKey in Aurora.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| CMD-001 | HIGH | Sparkle labeled Ask Evo; Ask catalog empty in simple mode | Dead-end expectation | `features.ask_evo` false + sparkle opens palette |
| CMD-002 | MEDIUM | Navigate ignores SIMPLE_NAV | Hidden rooms still listed | `REQUIRED_NAVIGATE` |
| CMD-003 | LOW | Copy is English while chrome locale is `fr` | Mixed language | hard-coded labels in `command-os.ts` |
| CMD-004 | OBSERVATION | Header Create vs Command Create permission mismatch | See HDR-002 | `canCreateCrm` |

## 28. Consistency Comparison

Create destinations overlap the header dropdown plus Log activity. Act items overlap the Tasks overlay tabs but Tasks overlay cannot jump to completed/queue filters the same way. Peek is unique to search hits with `recordRef`.

## 29. Functional Preservation Contract

- Keep one OS for search/navigate/create/act/ask.
- Keep GET `/crm/command/search` as the only record search.
- Keep debounce, stale-request, and fail-open local catalog.
- Keep peek on record refs and Ask Evo seam when enabled.
- Keep recents key/limit.
- Keep ⌘K toggle and search-focus suppress.

## 30. Design Input Contract

Purpose: command launch pad.
Primary goal: find a record or jump to a job in <3 keystrokes.
Primary actions: search select, navigate, create, act, ask.
Required information: query, sections, status, recents.
Required components: palette dialog, query field, grouped results.
Required states: empty, searching, failed search, recents.
Must not remove: permission-safe search, create `?create=1` URLs, activity queue hrefs.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` actual hit types returned by `CommandSearch` for this seed.
- `[UNKNOWN]` whether tickets are searchable when simple mode 403s ticket pages.
- Aurora default items (“Chat with Claude”) are demo-only — confirm they never render when `items` is passed `[CONFIRMED-CODE]` they should not.
