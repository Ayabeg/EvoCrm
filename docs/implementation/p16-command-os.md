# P16 — Command OS

**PR:** Upgrade the existing Cmd/Ctrl+K surface into the keyboard-first Command OS: SEARCH · NAVIGATE · CREATE · ACT · ASK EVO.  
**Baseline:** `main` @ `b1be269acbf8c231b3640593a64665df6e3962e4` (P15 #224).  
**Date:** 2026-09-16.

P00–P15 merged and frozen. P16 is one orchestration surface over P09–P15 contracts. It is not a new search backend, a second QRD, a second Activity engine, an AI agent, a universal mutation API, a navigation rewrite, a permissions bypass, a second palette, P17 dashboard, or P24 Ask Evo.

Live Contabo deploy + populated QA is owned by Research after this PR opens.

---

## P16 STATUS

Audit complete on fresh main @ `b1be269`. CURRENT COMMAND SYSTEM recorded **before** product code. The active `resources/js/components/crm/command-palette.tsx` wrapper over the Aurora primitive is the only surface. No CommandPaletteV2 / GlobalCommandPalette / UniversalSearch / EvoCommandNew.

**MERGE READY: NO** until Research Contabo populated QA is PASS.

Contabo Research (pre-fix) returned **PARTIAL — MERGE_BLOCKING: yes**. Two Sev2 blockers are fixed in this tip and need a Research recheck. Do not merge. Do not start P17.

## BASE / PR / TIP

- Base: `b1be269acbf8c231b3640593a64665df6e3962e4`
- Branch: `cursor/p16-command-os`
- PR title: P16 — Command OS
- Tip: `cursor/p16-command-os` after the P16 commits

---

## AUDIT

Inspected on fresh main @ `b1be269` **before coding**:

| Area | Paths |
|---|---|
| Active palette | `resources/js/components/crm/command-palette.tsx` — Records + Navigate only |
| Primitive | `resources/js/components/aurora/command-palette.tsx` — custom dialog, combobox, Phosphor, unused `useCommandPalette` hook |
| Trigger | `useCommandPaletteShortcut` in `app-sidebar-header.tsx` — Cmd/Ctrl+K opens (does not toggle); topbar Search + Sparkle also `setPaletteOpen(true)` |
| Search source | Shared Inertia `evoSearchIndex` in `HandleInertiaRequests` — latest 8 contacts/companies/leads/deals, **no query**, email as `hint` |
| Result types | Client `CommandItem` `{ id, label, description, section, onSelect }` — section `'records' \| 'navigate'` |
| Record open | `router.visit(hit.href)` — **not** `openRecord` (P09/P10/P11 source-locked) |
| Create | Topbar dropdown only (`?create=1` for contact/company/deal/quote). Palette had no Create section (P01 locked) |
| Act / P15 | None. Activities nav href `/crm/activities` with no group query |
| Ask Evo | Sparkle opens the same palette. No `kind:"ask"`. `AskEvoPanel` stays on records |
| Permissions | Index is workspace-scoped only; emails shipped to every page; no Gate::view per row at search time |
| Empty | Aurora shows **all** index + NAV_ITEMS when query is empty (not Recents/Create/Act) |
| Limits | 8×4 = 32 records on every Inertia share; client substring filter of that dump |
| Keyboard | Arrows + Enter + Escape. No IME `isComposing` / 229 guard. Focus input on open; no restore on close |
| Overlay | Palette z-index 200/201; QRD/Drawer uses `--z-modal` (50). Cmd+K while QRD open would stack Command above QRD |
| Call sites | Only `app-sidebar-header.tsx`. Aurora `useCommandPalette` unused (dead second listener if imported) |
| Duplicates / dead | Historical `cursor/crm-command-palette-91cb`. Aurora DEFAULT_ITEMS are demo (Chat with Claude) — unused by CRM |
| Lucide | P01 already removed Lucide from both palette files |
| Stale routes | Home already `/dashboard` (P02). Extra operator NAV_ITEMS (Tickets, Ads, Outbound, Reports, …) existed |
| Quotes / Activities | Not in `evoSearchIndex` |
| Leads create URL | Page drawer is local state — `?create=1` is **not** wired (P06 frozen; do not invent) |

**CURRENT COMMAND SYSTEM**

| Topic | Finding |
|---|---|
| TRIGGER | Cmd/Ctrl+K, topbar Search click/focus, Sparkle. One React state `paletteOpen` |
| COMPONENT | CRM wrapper → Aurora `CommandPalette`. **CANONICAL KEEP** |
| SEARCH SOURCE | `evoSearchIndex` latest-8 dump + client `hay.includes(needle)`. Not query-backed. Emails leak |
| RESULT TYPES | Untyped `CommandItem`. Routing by `section` + `onSelect` |
| ROUTE | Record hits `router.visit`; nav `router.visit`. Home `/dashboard` |
| KEYBOARD | Combobox listbox; Enter selects; Escape closes; no IME-safe commit |
| PERMISSIONS | Workspace query only. Frontend hide of nav was absent. Create not in palette |
| EMPTY | Full dump + long NAV_ITEMS. Not Recents + Quick actions |
| LIMITATIONS | No remote debounce, no stale-race, no QRD, no Create/Act/Ask, no Quotes, no P15 seams, load-on-every-page |
| CALL SITES | Header only |
| DUPLICATES | None mounted. Aurora hook unused |

---

## SOURCE-OF-TRUTH MATRIX

| ITEM | SOURCE | EXACT SEMANTICS | AUTHORITATIVE? | PERMISSION | LOAD | SHIP / DEFER |
|---|---|---|---|---|---|---|
| Command surface | `crm/command-palette.tsx` + Aurora primitive | One overlay | Yes | Auth shell | Client | **SHIP** extend |
| Record search | `GET /crm/command/search?q=` | Bounded LIKE + Gate::view | Yes | Workspace + view | On query only | **SHIP** |
| Shared key | `evoSearchIndex` | Empty array; key kept | Contract key only | n/a | None | **SHIP** empty — stop dump/email leak |
| Record open | `useQuickRecord().openRecord` | Enter → QRD; Open full on QRD | P09 | Peek gates | Transient | **SHIP** |
| Navigate | Canonical hrefs | `/dashboard` not `/home` | Yes | Feature flags for tickets/ads/report-builder | Local | **SHIP** |
| Create | Existing `?create=1` / P15 `create=1` | No new forms | Yes | `crm.edit` | Visit | **SHIP** |
| Lead create URL | Leads page local drawer | `?create=1` does not open | Frozen P06 | — | — | **DEFER** |
| Act | `activityQueueHref` | overdue/today/upcoming/completed | P15 | View activities | Visit | **SHIP** — never recalculate |
| Complete activity | `POST /crm/activities/{id}/complete` | Identity + crm.edit | P15 | Explicit only | — | **DEFER** — no fuzzy / no single-Enter mutation |
| Ask Evo | `kind:"ask"` seam | No AI POST, no answers in results | Yes | `features.ask_evo` | Local | **SHIP** seam |
| Recents | `localStorage` identifiers | nav/create/act/ask ids only | Truthful selections | Drop revoked | Bounded 5 | **SHIP** |
| Page-row search | Current table | Fake | No | Leak | — | **OUT** |
| Load-all CRM | Former index | Latest 8×4 every page | No | Email leak | — | **OUT** |
| Deal-value ranking | `amount_cents` | Forbidden | No | — | — | **OUT** |
| AI answers | OpenRouter / Ask POST | P24 | No | — | — | **OUT** |

---

## ONE COMMAND SYSTEM

Extended the **active** CRM wrapper + Aurora primitive.

Not created: `CommandPaletteV2`, `GlobalCommandPalette`, `UniversalSearch`, `EvoCommandNew`, `CommandRecordDrawer`.

Topbar Search, Sparkle, and Cmd/Ctrl+K open the **same** component. One window keydown listener (`useCommandPaletteShortcut`). Aurora `useCommandPalette` stays unused.

---

## MODES

Behavioral sections, not product tabs:

| Mode | Empty query | Typed query |
|---|---|---|
| Recent | Truthful identifier recents | Hidden |
| Search | None (no fake dump) | Remote hits |
| Create | Quick actions if `crm.edit` | Matching create |
| Act | P15 queue jumps | Matching act |
| Ask Evo | Seam if `features.ask_evo` | Matching ask |
| Navigate | Full gated catalog | Matching nav |

Default empty-query is Recents + Create + Act + Ask + Navigate. No empty white box. No fake recents.

---

## SEARCH

- Entities: Contacts, Companies, Leads, Deals, Quotes, Activities (subject only).
- Source: `CommandSearch` — `forWorkspace` + `Gate::view` + limit 6/type, 30 total.
- Compact payload: `{ type, id, label, href, recordRef? }`. No email, phone, amount, body.
- Email may **match** a contact; it is not returned.
- Amount cannot match a deal or quote.
- Empty `q` returns `[]` (does not dump latest records).
- Debounce 180ms. Palette opens instantly with local commands. Progressive remote.
- Stale race: incrementing request id + `AbortController`. Display also gates on `hitsForQuery` via `visibleCommandRemoteHits` so prior needles (`ami`) never render after the input is already `acme`, including empty-query clear. Abort + requestId remain.
- Remote failure: Navigate / Create / Act / Ask still work; footer says search is unavailable.
- Enter on a record hit → `openRecord`. Activity hits peek the first viewable related deal/contact/company, else visit `/crm/activities`.
- Open full stays on QRD. No Command Record Drawer.

`evoSearchIndex` key remains `[]` so every Inertia page stops shipping CRM names/emails.

---

## NAVIGATE

Required: Dashboard `/dashboard`, Contacts, Companies, Leads, Deals, Pipeline `/crm/deals/board`, Inbox `/inbox`, Activities, Quotes, Automation `/crm/workflows`, Settings `/settings`.

Operator extras kept (MASTER: do not hide routes operators use): Tickets, Captures, Segments, Conversations, Outbound, Ads, Reports, Report builder — feature-gated where Simple Mode already blocks them.

No `/home`.

---

## CREATE

Authorized (`crm.edit`) items reuse existing entry points only:

- `/crm/contacts?create=1`
- `/crm/companies?create=1`
- `/crm/deals?create=1`
- `/crm/quotes?create=1`
- `/crm/activities?create=1` (P15 composer)

No duplicate forms. Lead `?create=1` is not wired on the frozen P06 page — not offered.

Routing uses `kind: 'create'` + `action`, never `label.startsWith("Create")`.

---

## ACT

Safe existing actions only: P15 query URLs via `activityQueueHref` / `parseActivityQueueSearch`.

| Command | URL |
|---|---|
| Overdue activities | `/crm/activities?group=overdue` |
| Today's activities | `/crm/activities?group=today` |
| Upcoming activities | `/crm/activities?group=upcoming` |
| Completed activities | `/crm/activities?group=completed` |

Command **never** recalculates overdue/today/upcoming. No `Date.now()`. No Deal-amount ranking. No complete-from-palette mutation (would be fuzzy or a destructive single-Enter). Completing stays on the P15 queue with identity + `crm.edit`.

---

## ASK EVO

Seam only. `kind:"ask"` item when `features.ask_evo`. Selecting it closes the palette. No OpenRouter, no Ask POST, no answers mixed into deterministic results. Contextual Ask remains P24 / record `AskEvoPanel`. Sparkle still opens this same Command OS.

---

## RECENTS

localStorage `evo:command-os:recents`: `{ id, kind }` only. Max 5. Navigate / Create / Act / Ask. No record payloads, emails, phones, amounts. Invalid / revoked ids drop against the live catalog. Fake recents were never shipped.

---

## INTEGRATION

- Topbar “Search EvoCRM… ⌘K” opens the same Command OS.
- Sparkle opens the same Command OS.
- One listener. Cmd/Ctrl+K toggles.
- Focus the input on open; restore the opener on close unless the opener is the topbar Search trigger (`data-command-trigger="search"`).
- Escape closes Command (`preventDefault` + `stopPropagation`, capture). Search `onFocus` is suppressed for `COMMAND_FOCUS_OPEN_SUPPRESS_MS` after programmatic close so focus restore cannot reopen Command.
- Arrows + Enter. IME-safe (`isComposing` / keyCode 229).
- Overlay interop: Command z-index 201 > QRD `--z-modal` 50. Cmd+K while QRD is open stacks Command on top; Escape closes Command first; QRD stays.

---

## DESIGN

Locked EvoCRM / Aurora tokens. Phosphor only. Panel 640px (560–680), `max-width: calc(100vw - 32px)`. Rows `min-height: 44px`. Restrained existing motion. `overflow-x: hidden` on panel, list, and rows. H-overflow none at 1440 / 1280 / 1024 / 768.

---

## AFTER

| Before | After |
|---|---|
| Records + Navigate over latest-8 dump | Search / Navigate / Create / Act / Ask Evo |
| Client filter of shared emails | On-demand permission-safe search |
| `router.visit` records | `openRecord` → QRD |
| No Create / Act | Existing create URLs + P15 group URLs |
| Sparkle opened an empty-ish palette | Same surface; `kind:"ask"` seam |
| `/home` already fixed in P02 | Still `/dashboard` |

---

## P15 / P10 / P09 CONTRACT CONSUMED

Unchanged: QRD types + `openRecord`, P15 `activityQueueHref` / groups, CreateDrawer `?create=1`, AskEvoPanel, DataWorkspace, Inbox, Pipeline board, DealAttentionEvaluator.

P09/P10/P11 source locks that forbade `openRecord` in the palette are updated: Command now **calls** `openRecord` and still must not mount a second drawer.

---

## FILES CHANGED

| File | Change |
|---|---|
| `docs/implementation/p16-command-os.md` | Audit + matrix + AFTER + Contabo PARTIAL |
| `resources/js/lib/command-os.ts` | Typed CommandResult, catalog, race, recents, P15 hrefs, visible hits + Escape helpers |
| `resources/js/components/crm/command-palette.tsx` | Command OS orchestration; drop stale hits on needle change |
| `resources/js/components/aurora/command-palette.tsx` | Controlled query, IME, width, overflow, Escape capture |
| `resources/js/components/app-sidebar-header.tsx` | Same surface; Search focus-open suppress after close |
| `app/Services/Crm/CommandSearch.php` | Permission-safe bounded search |
| `app/Http/Controllers/Crm/CommandSearchController.php` | GET JSON |
| `routes/web.php` | `crm.command.search` |
| `app/Http/Middleware/HandleInertiaRequests.php` | `evoSearchIndex` → `[]` |
| `tests/Feature/P16CommandOsTest.php` | Fixtures + permissions + bounds |
| `tests/js/p16-command-os.ts` | Catalog / race / IME / P15 URLs |
| `tests/Feature/P01PrimitiveConvergenceTest.php` | P16 now owns create/ask sections |
| `tests/Feature/P09QuickRecordDrawerTest.php` | Palette may call `openRecord` |
| `tests/Feature/P10QuickRecordDrawerIntegrationTest.php` | Same |
| `tests/Feature/P11DealsPipelineBoardTest.php` | Same |

**Not changed:** QRD adapters, P15 query/evaluator classes, Inbox, board, AskEvoPanel POSTs, DataWorkspace, create forms.

---

## REMAINING DEBT

- Lead `?create=1` wiring (P06)
- Complete-from-command with explicit identity (not fuzzy)
- Contextual Ask Evo (P24)
- Contabo populated QA

## P17 HANDOFF

Do not start P17. Dashboard operating hierarchy is out of scope. Command OS is not a Home rewrite.

## P24 HANDOFF

`kind:"ask"` is reserved. Do not mix model answers into Command results.

---

## RISKS

- Emptying `evoSearchIndex` changes the shared payload; the key stays. Command no longer reads it.
- Members without `crm.edit` can still **view**-search workspace records (same as list pages) but cannot see Create.
- Contabo is a merge blocker owned by Research.

## TESTS

- `tests/Feature/P16CommandOsTest.php`
- `tests/js/p16-command-os.ts` (`npx vite-node`)
- P01 / P02 / P09 / P10 / P11 / P15 source locks

Commands:

| Command | Result |
|---|---|
| `php artisan test` | 949 passed |
| `npx vite-node tests/js/p16-command-os.ts` | passed |
| `npm run types:check` | passed |
| eslint on P16-touched JS | passed |
| `npm run build` | passed |
| GitHub CI | passed (`tests / ci` on #225) |

## LIVE VISUAL QA

**NEEDS RESEARCH.** Agent did not walk Contabo populated Command OS.

### Contabo Research — PARTIAL (merge-blocking)

Research walked populated Contabo before this fix tip. Result: **PARTIAL — MERGE_BLOCKING: yes**.

| Check | Result | Notes |
|---|---|---|
| Empty-state sections | PASS | Recents / Create / Act / Navigate present |
| Search `a→am→ami→acme` | **FAIL Sev2** | Acme eventually appeared, but Amine hits stayed visible while the input already showed `acme` |
| Search→QRD Enter | PASS | Record Enter opened QRD |
| Create `?create=1` | PASS | Existing drawers |
| P15 Act group URLs | PASS | Unchanged |
| Responsive 768 / 1440 | PASS | No H-overflow reported |
| Inbox / Board / Activities | PASS | Do not regress |
| Escape over QRD | PASS once | Command closed first |
| Standalone Escape | **FAIL Sev2** | Often failed to dismiss; Search focus restore reopened Command |
| Ask Evo | FEATURE_OFF | Out of scope |
| Ctrl+Enter full record | Out of scope | Opened QRD instead |
| Lead create | Out of scope | P06 frozen |

**Fixes in this tip (need Research recheck, not agent-claimed PASS):**

1. **Stale search race** — `visibleCommandRemoteHits` ignores `remoteHits` unless `hitsForQuery` matches the current needle. Query changes (including empty) clear stored hits immediately. AbortController + requestId stay.
2. **Escape** — Aurora Escape `preventDefault` + `stopPropagation` (capture). Header suppresses Search `onFocus` open after programmatic close. Search trigger is not the restored opener.

Contabo checklist (Research-owned recheck):

- Core commands: Navigate Home/Contacts/Pipeline/Inbox/Activities/Settings
- Search race: type `a` → `am` → `ami` → `acme` — **Amine must disappear as soon as the input is `acme`**, not only after the Acme response
- Standalone Escape from Search-opened Command must stay closed
- Create contact/deal/quote via existing drawers
- P15 Overdue / Today / Upcoming / Completed URLs
- Pipeline + Inbox still open from Command
- Permission: view-only member sees search, not Create; other-workspace names/emails absent
- Remote failure: unplug search — Navigate/Create/Act still work
- 1440 / 1280 / 1024 / 768 no H-overflow
- Cmd+K while QRD open; Escape closes Command first

## MERGE READY

NO — Contabo populated QA pending Research. Do not merge. Do not start P17.
