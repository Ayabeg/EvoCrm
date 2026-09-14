# EvoCRM master implementation plan

**Status:** P00 architecture freeze. **Docs only.**  
**Baseline:** `main` @ `7d05ca7` (research requested against audit SHA `a0b9a85`; neither SHA has `docs/research/`).  
**Method:** CONSOLIDATE → NORMALIZE → MIGRATE → IMPROVE → POLISH. Not a rewrite.  
**Locks:** [`docs/design-system.md`](../design-system.md) tokens/paint; [`docs/evocrm-mobbin-contract.md`](../evocrm-mobbin-contract.md) density only; this tree for sequencing.  
**Companions:** [current-system-map.md](./current-system-map.md) · [canonical-component-map.md](./canonical-component-map.md) · [deprecation-map.md](./deprecation-map.md) · [signature-capability-map.md](./signature-capability-map.md) · [test-strategy.md](./test-strategy.md) · [research/_ABSENT.md](../research/_ABSENT.md)

Historical P01–P16 in [`docs/ui-migration-plan.md`](../ui-migration-plan.md) is **partially shipped** (tokens, `ds/` primitives, 64/240 shell, DataWorkspace adapter). This file supersedes it for all *new* work. Do not delete that file.

---

# FINAL RESPONSE

## 1. CURRENT ARCHITECTURE SUMMARY

EvoCRM is a Laravel 13 + Inertia 3 + React 19 + TypeScript + Tailwind 4 sales OS. Authenticated UI is a single **sidebar shell** (`AppLayout` → `app-sidebar-layout.tsx`): 64/240 grouped rail (Home, CRM, Communication, Sales, Automation, More, Settings) and a command-first topbar (search, Ask Evo, Create, notifications/tasks, profile).

**List chrome already exists as `DataWorkspace`** (`resources/js/ds/workspace/*`) with SavedViews, FilterBar, AdvancedFilterDrawer, DataTable, BulkActionBar. **No page uses it as a real table owner.** `CrmListShell` adapts Inertia list props into DataWorkspace but stubs `rows={[]}` and `selectedIds={[]}`; Contacts, Companies, Deals, Tickets, and Quotes still render `ListViewTable` + page-local selection/bulk. Leads is a raw `<table>` inside `CrmShell`. Deals board is a separate header + `PipelineKanban`, not `mode="board"`.

**Records are full workspaces** (`RecordShell` / `RecordPageFrame` / Ask Evo). There is **no Quick Record Drawer**. Create is `CreateDrawer`. Inbox is native 3-pane + optional EvoDesk iframe. Workflows are a structured table (correct). Quotes create is a compact drawer; show is the line editor. Settings IA is You / Workspace / Integrations / CRM / Admin. Home has KPIs + `GuidedActions` + attention — not a durable activation checklist. Command palette searches `evoSearchIndex` + Navigate (Lucide); Home points at `/home` (no such route; dashboard is `/dashboard`). Icons are split Phosphor/Lucide. `app-header` layout is leftover and unused.

Backend contracts (routes, Inertia props, permissions, bulk, move, quotes, workflows, desk, Ask Evo) stay.

## 2. TOP DIVERGENCE PROBLEMS

1. **DataWorkspace adapter bypass** — domain tables own rows/selection; the suite cannot enforce one list grammar.
2. **No QuickRecordDrawer** — list/board/inbox/command jump only to full pages.
3. **Dual icon family + leftover `app-header`** — `components.json` says Phosphor; ~34 files still import Lucide.
4. **Deal list and board do not share DataWorkspace** — filters/views/drawer/URL diverge; board lacks keyboard/undo.
5. **Leads list is off-contract** — raw table, no saved views; orphan `pages/leads/board.tsx` still in tree.
6. **Companies (and others) still wrap `CrmShell`** — double chrome vs contacts/deals/quotes.
7. **Command ≠ Ask Evo ≠ Create** — AI button opens palette; palette has no Create/Ask sections; `/home` is wrong.
8. **Settings IA ≠ approved scopes** — Communication / Automation / Developer not modeled; Get started sits as a permanent peer.
9. **Activation is wizard-dismiss + empty-guided-actions** — not a durable first CRM outcome.
10. **Quote create is not the Stripe split builder** — acceptable as create; P18 polishes the existing show builder, does not invent a second quote object.

## 3. CANONICAL COMPONENT MAP

See [canonical-component-map.md](./canonical-component-map.md). Headline:

| Layer | Canonical owner | Domain owns |
|---|---|---|
| Shell | AppShell, Sidebar, Topbar, PageHeader | simple-mode leaves |
| Command | CommandPalette | `evoSearchIndex`, capabilities |
| Lists | DataWorkspace suite | columns, cells, filter fields, bulk verbs, create, board slot |
| Peek | QuickRecordDrawer (new) | identity/status/essentials slots |
| Full record | RecordShell / RecordPageFrame | object panes, Ask Evo, convert, quote lines |
| Pipeline | PipelineKanban + DealCard | move POST, forecast, next/stale |
| Inbox | Native workspace + embed fallback | reply/ticket/connectors |
| Queue | ActivityQueue (P15) | complete/attendance |
| Quotes | DataWorkspace list + show builder | lifecycle POSTs |
| Automation | Structured WorkflowBuilder | engine execution |
| Settings | SettingsShell by scope | existing hrefs |
| Activation | OnboardingChecklist | Home facts + wizard |
| Overlays | ds Drawer/Modal/Toast/Empty/Skeleton | copy |

No god components. DataWorkspace does not POST bulk or render wilaya cells.

## 4. SIGNATURE CAPABILITY MAP

See [signature-capability-map.md](./signature-capability-map.md).

| Id | Job |
|---|---|
| `data-workspace` | One list/board orchestrator |
| `record-context` | Peek + full workspace, same facts |
| `action-routing` | Create / log / assign / move / ask / open |
| `attention-engine` | Stale, overdue, unread, Home attention |
| `command` | Navigate · Records · Create · Ask |
| `activation` | Durable first CRM outcome |
| `structured-automation` | Trigger → condition → action (no canvas) |

## 5. FINAL MIGRATION ORDER

Validated against **real code**. Changes from the brief are marked.

| Phase | vs brief | Adjustment |
|---|---|---|
| **P00** Architecture freeze | as specified | **This PR.** Research originals absent — reconstructed six files + `_ABSENT.md`. |
| **P01** Primitive convergence | as specified | Still first *implementation* PR. Icons + overlay import path. Shell/tokens already shipped. |
| **P02** Active shell normalization | as specified | **Thin.** 64/240 + grouped rail already live (`P04AppShellTest`). Leftover header, Tasks vs notify, Ask Evo entry. |
| **P03A–D** DataWorkspace contract | split as allowed | **Required.** Suite exists; contract (rows/selection/bulk/board) does not. |
| **P04–P08** Contacts → Companies → Leads → Deals list → Quotes | brief had P04–P08 same objects | **Leads inserted** (off-contract raw table). Tickets **not** in this wave (already on adapter; More item). |
| **P09–P10** Quick Record Drawer | as specified | |
| **P11–P12** PipelineBoard + attention | as specified | Board joins DataWorkspace `mode="board"` here, not in P07. |
| **P13–P14** Inbox + CRM context | as specified | |
| **P15** Activities work queue | as specified | |
| **P16** Command OS | as specified | Includes `/home` → `/dashboard` if not fixed in P01/P02. |
| **P17** Dashboard hierarchy | as specified | |
| **P18** Quotes builder | as specified | Polish show page; keep compact create. |
| **P19–P20** Automation | as specified | Structured only. |
| **P21–P22** Settings + Integrations | as specified | Relabel/reorder existing hrefs. |
| **P23** Activation checklist | as specified | |
| **P24** Contextual Ask Evo | as specified | |
| **P25–P27** Responsive / a11y / motion | as specified | |
| **P28** Legacy removal | as specified | |
| **P29** Visual QA | as specified | |

**Not started from old ui-migration P02–P05** — those already merged (#196–#198). Re-doing tokens or a second DataWorkspace folder would be a rewrite.

## 6. PR BREAKDOWN

One phase = one reviewable PR unless split as A–D. See § Phases below for full AC.

```
P00 docs (this)
P01 icons + overlay imports
P02 leftover shell
P03A types/docs lock + tests
P03B hoist selection/rows API (contacts canary, no visual redesign)
P03C DS BulkActionBar swap on contacts
P03D board/paginator/empty ownership helpers
P04 Contacts (remove children bypass)
P05 Companies (drop CrmShell)
P06 Leads (onto DataWorkspace; keep lead object)
P07 Deals list
P08 Quotes list
P09 QuickRecordDrawer shell
P10 Wire drawer to DataWorkspace + command
P11 Board onto mode=board + shared filters
P12 Next-action / stale / keyboard / undo
P13 Inbox workspace normalize
P14 Inbox ↔ record-context
P15 Activities queue
P16 Command OS
P17 Home operating hierarchy
P18 Quote builder/lifecycle chrome
P19 Workflow authoring
P20 Test / history / safety
P21 Settings IA
P22 Integration directory
P23 Activation checklist
P24 Ask Evo contextual
P25 Responsive
P26 A11y
P27 Motion / micro-UX
P28 Delete dead code
P29 Polish QA
```

## 7. DEPENDENCY GRAPH

```
P00
 └─ P01 (icons, overlays)
     └─ P02 (shell leftovers)
         └─ P03A → P03B → P03C → P03D
              ├─ P04 Contacts ──┐
              ├─ P05 Companies ─┼─ P09 Drawer ─ P10 wire
              ├─ P06 Leads     │
              ├─ P07 Deals list┘
              └─ P08 Quotes
                    P07 ─ P11 Board ─ P12 attention
                    P09 ─ P13 Inbox ─ P14 CRM context
                    P10 ─ P16 Command ─ P24 Ask Evo
                    P12 + P15 ─ P17 Home ─ P23 Activation
                    P08 ─ P18 Quotes builder
                    P01 ─ P19 ─ P20 Automation
                    P02 ─ P21 ─ P22 Settings
                    P25 ─ P26 ─ P27 ─ P28 ─ P29
```

Parallel after P03A: P19 (automation) and P21 (settings IA labels) can start if they do not touch DataWorkspace. **Do not** parallel two chrome rewrites of the same page.

## 8. HIGHEST-RISK MIGRATIONS

| Risk | Why | Mitigation |
|---|---|---|
| **P03B/P04 selection hoist** | Contacts today own `useState` selectedIds + domain bulk bar; Wave1 locks `data-crm` | Canary on contacts; keep POST `/crm/contacts/bulk`; feature-flag unnecessary if props stay |
| **P11 board into DataWorkspace** | Board has its own filter strip + options sheet; breaking move/forecast is customer-visible | Slot `board={}` first; do not reimplement kanban; `MoveDealTest` in the same PR |
| **P06 Leads onto workspace** | No `listView` today — may need additive Inertia props | Additive `listView`/`savedFilters` only; do not merge with deal board |
| **P09 drawer hydration** | Full show payload is heavy; no peek endpoint | v1: navigate or reuse create-sized facts; additive `?record=` ; do not new REST resource unless P09 AC says so |
| **P16 command hrefs** | `/home` is wrong; many NAV_ITEMS | Snapshot tests + click Home → `/dashboard` |
| **P23 activation facts** | Temptation to fake completion | Read existing counts from Home builder; additive props only |
| **P28 deletes** | `LeadBoardController` may still be tested | rg + tests before unlink |

## 9. COMPONENTS TO DEPRECATE

Full table: [deprecation-map.md](./deprecation-map.md).

**Delete (P28):** `app-header.tsx`, `app-header-layout.tsx`, `list-toolbar.tsx`, `saved-view-tabs.tsx`, orphan `pages/leads/board.tsx` (controller only if tests allow), leftover Aurora skins, Lucide on product chrome.

**Shrink:** `CrmListShell` bypass, `CrmShell` wrappers, domain `bulk-action-bar.tsx`, `CrmListHeader`, `TasksOverlay` as a second product, `GuidedActions` as the only activation story.

**Do not deprecate:** full records, native+embed inbox, `/crm/leads` object, `/leads` redirect, structured workflows, `CreateDrawer`, `list-query`, Phosphor rail.

## 10. FIRST IMPLEMENTATION PR

This docs PR **is P00**. The first *code* PR:

| Field | Value |
|---|---|
| **PR NAME** | `P01 Primitive convergence (Phosphor + overlay imports)` |
| **GOAL** | One icon family and one overlay import path on product chrome, with zero route/Inertia/behavior changes. |
| **WHY FIRST** | Tokens, 64/240 shell, and DataWorkspace *files* already shipped. Completing DataWorkspace (P03) while Lucide/Sheet forks remain forces every list PR to re-touch chrome. P01 is the safest high-leverage start: reversible, no backend contract, unblocks P02–P29 visual consistency. P03 is higher product leverage but remounts selection on live list pages — it is second, not first. |
| **EXACT SCOPE** | Replace `lucide-react` with Phosphor on CRM chrome listed below; product overlays import `@/components/ui/drawer|dialog` or `@/ds/components/*` (already re-exported), not a third path; do **not** restyle. Optional one-liner: command Home `href` `/dashboard` if it stays a one-line fix with a test. |
| **LIKELY FILES** | `resources/js/components/crm/command-palette.tsx`, `record-chrome.tsx`, `ask-evo-panel.tsx`, `activity-composer.tsx`, `list-chrome.tsx`, `pages/settings/setup/wizard.tsx`, other product Lucide imports from `rg lucide-react resources/js`; do **not** require deleting `app-header.tsx` (that is P02/P28) unless the file is touched. |
| **TESTS** | `php artisan test --filter=P03`; Wave0 if it locks Phosphor on the rail; `npm run types:check`; add/adjust a source lock that listed chrome files do not import `lucide-react`. |
| **VISUAL QA** | Contacts list, one record show, command palette, setup wizard: icons align with rail weight, no Lucide/Phosphor mix on one screen, no layout shift. |
| **ACCEPTANCE** | `components.json` already phosphor; migrated files compile; no Inertia prop change; rail still Phosphor; command still opens; Ask Evo panel still posts. |
| **OUT OF SCOPE** | DataWorkspace row ownership, drawer peek, settings IA, board keyboard, deleting leftovers, restyle to Linear/HubSpot paint. |
| **ROLLBACK** | Revert the PR. No migrations. |

---

# Phases

Each phase is one PR (or A–D). Template fields are complete even when short.

Shared **OUT OF SCOPE** for all phases unless AC says otherwise: Laravel controllers, Inertia contracts, permissions, models, route semantics, HubSpot/Salesforce/Linear paint, n8n canvas, dark cabinet, billing.

Shared **BACKEND CONTRACT THAT MUST NOT CHANGE:** routes in `web.php` / `settings.php` / `api.php`; `listView` / `savedFilters` / `activeFilters`; bulk POSTs; deal move; quote lifecycle; workflow execution; Ask Evo POSTs; desk CSP.

---

## P00 — Architecture freeze / system map

**OBJECTIVE:** Lock the real system map and executable order. No application code.  
**REFERENCE PATTERN:** Internal — this tree + design-system + Mobbin contract (density).  
**CURRENT IMPLEMENTATION:** Historical `ui-audit.md` / `ui-migration-plan.md` (P02–P05 already shipped; audit denies DataWorkspace). `docs/research/` absent on all branches.  
**TARGET ARCHITECTURE:** This file + companions + reconstructed research.  
**FILES LIKELY AFFECTED:** `docs/implementation/*`, `docs/research/*`, additive `docs/ui-migration-plan.md`.  
**NEW / MODIFIED / DEPRECATED COMPONENTS:** None in `resources/js`.  
**BEHAVIOR THAT MUST NOT CHANGE:** All runtime behavior.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** None.  
**TESTS:** Docs-only; no Pest.  
**A11Y / RESPONSIVE QA / VISUAL QA:** n/a.  
**RISKS:** Reconstructing research without inventing scores (mitigated by `_ABSENT.md`).  
**ROLLBACK:** Revert docs PR.  
**ACCEPTANCE CRITERIA:** Required output files exist; absent research listed; phases cite real paths; first code PR is P01.  
**OUT OF SCOPE:** Any TSX/PHP.

---

## P01 — Primitive convergence (icons, overlays)

**OBJECTIVE:** Phosphor-only product chrome; one overlay primitive path.  
**REFERENCE PATTERN:** Linear/Stripe micro-UX (one family, Esc/focus already in DS drawers).  
**CURRENT IMPLEMENTATION:** Dual icons; `CreateDrawer` uses `@/components/ui/sheet`; DS Drawer already wraps Aurora sheet.  
**TARGET ARCHITECTURE:** Product files import Phosphor + `@/components/ui/{drawer,dialog}` or `@/ds/components/*`.  
**FILES LIKELY AFFECTED:** Lucide consumers under `resources/js/components/crm/*`, command palette, setup wizard, selected settings pages.  
**NEW / MODIFIED / DEPRECATED:** Modify icon imports. Deprecate Lucide on those files. No new components.  
**BEHAVIOR THAT MUST NOT CHANGE:** Palette shortcut, Ask Evo POST, wizard steps, record actions.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P00.  
**TESTS:** P03 primitives, Wave0, types, optional lucide rg lock.  
**A11Y:** Icon-only buttons keep `aria-label`.  
**RESPONSIVE QA:** Topbar icons at 375.  
**VISUAL QA:** No mixed families on Contacts + record + palette.  
**RISKS:** Optical size differences (Phosphor `weight="regular"` vs Lucide stroke).  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Listed chrome has no `lucide-react`; rail unchanged; no prop changes.  
**OUT OF SCOPE:** Deleting `app-header`; DataWorkspace rows; restyle.

---

## P02 — Active shell normalization

**OBJECTIVE:** Finish the already-shipped 64/240 shell: remove unused header path from the mental model, clarify AI vs command vs tasks.  
**REFERENCE PATTERN:** Linear shell.  
**CURRENT IMPLEMENTATION:** Rail/topbar live. `app-header-layout` unused. Ask Evo opens palette. Tasks overlay from notify.  
**TARGET ARCHITECTURE:** Documented entries: Search/⌘K → command; Sparkle → command Ask section **or** keep opening palette until P16/P24 (do not invent a second AI panel in the topbar). Tasks remain an overlay **or** link to `/crm/activities` — pick one in this PR, do not ship both bells.  
**FILES LIKELY AFFECTED:** `app-sidebar-header.tsx`, optionally stop exporting header layout from docs only; do not have to delete files yet.  
**NEW / MODIFIED / DEPRECATED:** Modify topbar. Mark header layout deprecated (comment + deprecation map).  
**BEHAVIOR THAT MUST NOT CHANGE:** Simple mode, collapse cookie, Create `?create=1` links, `/inbox` active paths.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P01.  
**TESTS:** P04AppShell, Wave0, SimpleModeNav.  
**A11Y:** Topbar buttons labeled.  
**RESPONSIVE QA:** 375 topbar, mobile Sheet rail.  
**VISUAL QA:** One search, one AI entry, one create, one notify.  
**RISKS:** Operators using Tasks overlay daily — if you retarget, keep a command item.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Still 64/240; unused header not wired; no second AI product.  
**OUT OF SCOPE:** Command section rewrite (P16); deleting header files (P28 OK if unused and tests allow).

---

## P03A — DataWorkspace contract lock

**OBJECTIVE:** Freeze props and ownership in types + P05 tests without moving page tables.  
**REFERENCE PATTERN:** HubSpot list grammar (already in design-system).  
**CURRENT IMPLEMENTATION:** `DataWorkspaceProps` exists; `rowHref` unused (`void _rowHref`); children bypass.  
**TARGET ARCHITECTURE:** Types document `children` as adapter-only; add `onRowPeek?`; comments on domain vs workspace.  
**FILES LIKELY AFFECTED:** `ds/workspace/types.ts`, `DataWorkspace.tsx` comments, `P05DataWorkspaceTest.php`, this plan if needed.  
**NEW / MODIFIED / DEPRECATED:** Types only.  
**BEHAVIOR THAT MUST NOT CHANGE:** All list pages.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P02.  
**TESTS:** P05 still green; update assertions if comments/strings change.  
**A11Y / RESPONSIVE / VISUAL:** n/a if no UI.  
**RISKS:** None.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Contract comments match canonical map; no page visual change.  
**OUT OF SCOPE:** Hoisting state.

---

## P03B — Hoist rows + selection (contacts canary)

**OBJECTIVE:** Contacts pass real `rows` + `selectedIds` into DataWorkspace; table can render via `ListDataTable` **or** children that receive selection from the workspace.  
**REFERENCE PATTERN:** HubSpot bulk bar [fedf5525](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4).  
**CURRENT IMPLEMENTATION:** `contacts/index.tsx` local `selectedIds`; shell stubs selection.  
**TARGET ARCHITECTURE:** Selection state lifts to the page still (or workspace); shell does not pass empty arrays. Row click still `/crm/contacts/{id}`.  
**FILES LIKELY AFFECTED:** `crm-list-shell.tsx`, `contacts/index.tsx`, `ds/workspace/DataWorkspace.tsx`, `list-view-table.tsx` if selection props need threading.  
**NEW / MODIFIED / DEPRECATED:** Modify adapter.  
**BEHAVIOR THAT MUST NOT CHANGE:** Filters, views, import, merge, create, export.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Contact index props.  
**DEPENDENCIES:** P03A.  
**TESTS:** Wave1, P05 (adapter assertions will change — update in-PR).  
**A11Y:** Select-all checkbox labeled.  
**RESPONSIVE QA:** Mobile card rows still select if they do today.  
**VISUAL QA:** Contacts list unchanged except selection owned correctly.  
**RISKS:** Highest in P03 — split from visual polish.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** `CrmListShell` for contacts no longer hardcodes `selectedIds={[]}` with a no-op; bulk still works.  
**OUT OF SCOPE:** Companies/leads/deals/quotes; DS bulk swap (P03C).

---

## P03C — Canonical BulkActionBar on contacts

**OBJECTIVE:** Contacts use `ds/workspace/BulkActionBar` (same POSTs).  
**REFERENCE PATTERN:** Same HubSpot bulk bar.  
**CURRENT IMPLEMENTATION:** `components/crm/bulk-action-bar.tsx` on contacts + deals.  
**TARGET ARCHITECTURE:** DS bar in the `bulk` slot; domain bar remains for deals until P07.  
**FILES LIKELY AFFECTED:** `contacts/index.tsx`, `ds/workspace/BulkActionBar.tsx`.  
**NEW / MODIFIED / DEPRECATED:** Domain bar deprecated for contacts.  
**BEHAVIOR THAT MUST NOT CHANGE:** assign / enroll / delete POST `/crm/contacts/bulk`.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Bulk payload.  
**DEPENDENCIES:** P03B.  
**TESTS:** Wave1 + any bulk feature test.  
**A11Y:** Sticky bar announces count.  
**RESPONSIVE QA:** Bar wraps at 375.  
**VISUAL QA:** 36px controls, not a second orange.  
**RISKS:** Sequence enroll options must still pass.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Contacts do not import domain bulk bar; deals unchanged.  
**OUT OF SCOPE:** Other objects.

---

## P03D — Empty, pagination, board slot helpers

**OBJECTIVE:** DataWorkspace empty/paginator/board paths are usable without children.  
**REFERENCE PATTERN:** design-system DataWorkspace sketch.  
**CURRENT IMPLEMENTATION:** Empty/paginator only when `!hasChildren`. Board slot exists.  
**TARGET ARCHITECTURE:** Adapter may still use children; helpers documented; `rowHref` used by ListDataTable.  
**FILES LIKELY AFFECTED:** `DataWorkspace.tsx`, `DataTable.tsx`, `crm-list-shell.tsx`.  
**NEW / MODIFIED / DEPRECATED:** Modify workspace.  
**BEHAVIOR THAT MUST NOT CHANGE:** Existing children pages.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P03C.  
**TESTS:** P05.  
**A11Y:** Empty state heading.  
**RESPONSIVE / VISUAL:** Pagination pad-x 32.  
**RISKS:** Low.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** `rowHref` no longer voided without replacement; board slot ready for P11.  
**OUT OF SCOPE:** Moving deals board.

---

## P04 — Contacts migration (complete contract)

**OBJECTIVE:** Contacts index is a first-class DataWorkspace consumer (no table bypass if P03B–D succeeded; otherwise finish it here).  
**REFERENCE PATTERN:** HubSpot contacts [2c2951a8](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4).  
**CURRENT IMPLEMENTATION:** Adapter + ListViewTable children.  
**TARGET ARCHITECTURE:** `object="contact"`; domain columns/cells/filters/bulk/create only.  
**FILES LIKELY AFFECTED:** `pages/crm/contacts/index.tsx`, Wave1 test.  
**NEW / MODIFIED / DEPRECATED:** No CrmShell (already none).  
**BEHAVIOR THAT MUST NOT CHANGE:** create, saved view, filter, export, import permission, duplicates, bulk.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** ContactController index/store/bulk/import.  
**DEPENDENCIES:** P03D.  
**TESTS:** `EvoCrmWave1ContactsChromeTest`, P05.  
**A11Y:** Row click vs checkbox.  
**RESPONSIVE QA:** 375 cards / horizontal table.  
**VISUAL QA:** Density lock.  
**RISKS:** `data-crm="contacts-workspace"` must remain.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Workspace `data-ds="data-workspace"`; row → show page (drawer later).  
**OUT OF SCOPE:** Peek drawer.

---

## P05 — Companies migration

**OBJECTIVE:** Same workspace as contacts; **remove `CrmShell`**.  
**REFERENCE PATTERN:** Same list grammar.  
**CURRENT IMPLEMENTATION:** CrmShell + CrmListShell + ListViewTable; no bulk.  
**TARGET ARCHITECTURE:** DataWorkspace `object="company"`; wilaya/city stay domain `filterContext`.  
**FILES LIKELY AFFECTED:** `pages/crm/companies/index.tsx`.  
**NEW / MODIFIED / DEPRECATED:** CrmShell removed from this page.  
**BEHAVIOR THAT MUST NOT CHANGE:** create, filters, show URL.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** CompanyController.  
**DEPENDENCIES:** P04.  
**TESTS:** company feature tests + types.  
**A11Y / RESPONSIVE / VISUAL:** Same as P04.  
**RISKS:** Double-chrome removal changes screenshot tests if any.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** No room tabs on companies list; wilaya filters work.  
**OUT OF SCOPE:** Company bulk API (do not fake).

---

## P06 — Leads list migration

**OBJECTIVE:** `/crm/leads` joins DataWorkspace **as leads**, not as deals.  
**REFERENCE PATTERN:** Salesforce leads list density [f7b32108](https://mobbin.com/screens/f7b32108-1960-4bc8-8509-c53f92e72ebb) — pattern only.  
**CURRENT IMPLEMENTATION:** Raw table, no saved views, CrmShell.  
**TARGET ARCHITECTURE:** Additive `listView` / `savedFilters` if missing (backend **additive**); capture inbox link stays secondary.  
**FILES LIKELY AFFECTED:** `pages/crm/leads/index.tsx`, `LeadController@index`, list-view-config if a lead object type must be added.  
**NEW / MODIFIED / DEPRECATED:** Extend `DataWorkspaceEntity` with `'lead'` if types require; remove CrmShell.  
**BEHAVIOR THAT MUST NOT CHANGE:** create, show, qualify, captures routes.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Existing lead POST/PUT; `/leads` redirect stays.  
**DEPENDENCIES:** P05.  
**TESTS:** LeadPath, LeadConversion, LeadQualify — plus new chrome lock.  
**A11Y / RESPONSIVE / VISUAL:** Score pill remains a cell, not a color-only status.  
**RISKS:** Additive Inertia props — highest backend touch in list wave; keep optional with fallbacks.  
**ROLLBACK:** Revert PHP + TS together.  
**ACCEPTANCE CRITERIA:** Not a kanban; not `/crm/deals/board`; saved views optional but table is workspace.  
**OUT OF SCOPE:** Resurrecting `pages/leads/board.tsx`.

---

## P07 — Deals list migration

**OBJECTIVE:** Deals **list** is DataWorkspace `mode="list"` with domain stage pills, pipeline switcher, bulk.  
**REFERENCE PATTERN:** HubSpot deals list [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d).  
**CURRENT IMPLEMENTATION:** CrmListShell + ListViewTable + domain bulk + layout toggle (links to board).  
**TARGET ARCHITECTURE:** Same; `onModeChange` may navigate to `/crm/deals/board` until P11 shares chrome.  
**FILES LIKELY AFFECTED:** `pages/crm/deals/index.tsx`, Wave2, domain bulk → DS bar.  
**NEW / MODIFIED / DEPRECATED:** Domain bulk deprecated for deals.  
**BEHAVIOR THAT MUST NOT CHANGE:** bulk assign/move/delete; filters; create.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** `/crm/deals/bulk`, index props.  
**DEPENDENCIES:** P03D, preferably P04.  
**TESTS:** Wave2, MoveDeal (untouched).  
**A11Y / RESPONSIVE / VISUAL:** Stage pills not color-only.  
**RISKS:** Layout toggle must not remount a different shell *yet* (board still custom until P11).  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** List on contract; board URL unchanged.  
**OUT OF SCOPE:** Kanban rewrite.

---

## P08 — Quotes list migration

**OBJECTIVE:** Quotes index on DataWorkspace `object="quote"`.  
**REFERENCE PATTERN:** Stripe/HubSpot list density; create stays compact.  
**CURRENT IMPLEMENTATION:** CrmListShell + CreateDrawer posting `/crm/deals/{id}/quotes`.  
**TARGET ARCHITECTURE:** Same create contract; remove leftover mark hex if any.  
**FILES LIKELY AFFECTED:** `pages/crm/quotes/index.tsx`, Wave4.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** create-from-deal, show, send/revoke from show.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** QuoteController.  
**DEPENDENCIES:** P03D.  
**TESTS:** Wave4, QuoteAcceptance (untouched).  
**A11Y / RESPONSIVE / VISUAL:** No hardcoded `#d9500f`.  
**RISKS:** Create requires a deal id — keep that form.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** List on contract; public accept untouched.  
**OUT OF SCOPE:** Split builder (P18).

---

## P09 — Quick Record Drawer foundation

**OBJECTIVE:** Add `QuickRecordDrawer` shell + slots; not wired to every list yet.  
**REFERENCE PATTERN:** Attio/HubSpot inspector — not deep edit. See `docs/research/record-workspace-benchmark.md`.  
**CURRENT IMPLEMENTATION:** None.  
**TARGET ARCHITECTURE:** `ds/workspace/QuickRecordDrawer.tsx`; Esc/focus; “Open full record”; 480–560px.  
**FILES LIKELY AFFECTED:** new DS file, `ds/workspace/index.ts`, maybe a story-less contact canary behind `?record=`.  
**NEW / MODIFIED / DEPRECATED:** **NEW** QuickRecordDrawer. Show pages unchanged.  
**BEHAVIOR THAT MUST NOT CHANGE:** Show routes.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Prefer existing show payload or static slot demo; additive query only.  
**DEPENDENCIES:** P01 overlays, P04 (contacts as host).  
**TESTS:** Show-page tests still pass; optional source lock for `data-ds="quick-record-drawer"`.  
**A11Y:** Focus trap, Esc, return focus to row.  
**RESPONSIVE QA:** Full-width sheet `<768`.  
**VISUAL QA:** Not a second record workspace.  
**RISKS:** Hydration weight.  
**ROLLBACK:** Revert; query param ignored.  
**ACCEPTANCE CRITERIA:** Drawer exists; can open/close on one host; full record link works.  
**OUT OF SCOPE:** Inbox/command/board wiring (P10).

---

## P10 — DataWorkspace + command integration

**OBJECTIVE:** Peek from contacts/companies/deals/quotes rows + command record hits.  
**REFERENCE PATTERN:** Same.  
**CURRENT IMPLEMENTATION:** `router.visit` on row.  
**TARGET ARCHITECTURE:** Row click default stays **full page** OR modifier/peek control — pick one in AC and document. Approved: peek control or `?record=`; do not steal the obvious click if operators expect show. **Recommendation:** keep click → show; add peek icon + command “Peek”.  
**FILES LIKELY AFFECTED:** `list-view-table.tsx` / DataTable, command palette, four index pages.  
**NEW / MODIFIED / DEPRECATED:** Modify table + command.  
**BEHAVIOR THAT MUST NOT CHANGE:** Direct show URLs, create drawer.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Additive `?record=` only.  
**DEPENDENCIES:** P09, P04–P08 as each object is ready (contacts minimum).  
**TESTS:** Wave1/2/4 still visit show on row click if that remains default.  
**A11Y:** Peek button labeled.  
**RESPONSIVE / VISUAL:** Drawer over list.  
**RISKS:** Changing click target — do not.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Peek does not replace show; URL explicit.  
**OUT OF SCOPE:** Deep edit in drawer.

---

## P11 — PipelineBoard onto shared workspace

**OBJECTIVE:** `/crm/deals/board` is DataWorkspace `mode="board"` with shared filters/views/pipeline id.  
**REFERENCE PATTERN:** Pipedrive/HubSpot board; `docs/research/pipeline-benchmark.md`.  
**CURRENT IMPLEMENTATION:** Custom header + kanban + forecast + board options.  
**TARGET ARCHITECTURE:** Workspace chrome + `board={<PipelineKanban…/>}`; layout toggle is mode change (URL may stay `/crm/deals/board`).  
**FILES LIKELY AFFECTED:** `pages/crm/deals/board.tsx`, `deals/index.tsx` toggle, `DataWorkspace.tsx`.  
**NEW / MODIFIED / DEPRECATED:** CrmObjectHeader on board → PageHeader.  
**BEHAVIOR THAT MUST NOT CHANGE:** move POST, forecast math, stages, board options persistence.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Board Inertia props; move route.  
**DEPENDENCIES:** P07, P03D.  
**TESTS:** Wave2, MoveDeal, EvoCrmP8DealWorkspaceColumns.  
**A11Y:** Board still has a non-drag path (menu at least).  
**RESPONSIVE QA:** Horizontal scroll columns `<lg`.  
**VISUAL QA:** Weighted footer stays.  
**RISKS:** Highest pipeline risk — slot first, no kanban rewrite.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Shared views/filters visible; drag still works.  
**OUT OF SCOPE:** Keyboard/undo (P12).

---

## P12 — Pipeline attention UX

**OBJECTIVE:** Card = name, company/contact, amount, owner, **next activity**, stale when meaningful; keyboard + undo + rejection recovery.  
**REFERENCE PATTERN:** HubSpot inactivity + weighted [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1).  
**CURRENT IMPLEMENTATION:** inactive_days / has_next_activity / weighted exist; no keyboard/undo; next line incomplete.  
**TARGET ARCHITECTURE:** DealCard fields complete; `action-routing` for move; toast undo (revert move POST); stage-required modal recovery.  
**FILES LIKELY AFFECTED:** `deals/board.tsx`, `pipeline-kanban.tsx`, maybe move controller only if undo needs a known previous stage (prefer sending from client).  
**NEW / MODIFIED / DEPRECATED:** Modify cards/kanban.  
**BEHAVIOR THAT MUST NOT CHANGE:** Successful move semantics, required properties.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Move endpoint shape unless additive `from_stage`.  
**DEPENDENCIES:** P11.  
**TESTS:** MoveDeal, StageRequiredProperties.  
**A11Y:** Keyboard move; no color-only stale.  
**RESPONSIVE / VISUAL:** Compact vs default cards.  
**RISKS:** Undo vs server validation — show error, do not fake success.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Keyboard + menu + DnD; undo toast; next line visible when data exists.  
**OUT OF SCOPE:** Second deal engine.

---

## P13 — Inbox workspace

**OBJECTIVE:** Native inbox is the IA (folders · threads · conversation · contact); embed stays fallback.  
**REFERENCE PATTERN:** Intercom + Front + HubSpot.  
**CURRENT IMPLEMENTATION:** Dual mode in `pages/desk/inbox.tsx`; `AdaptiveWorkspaceShell` 3 panes.  
**TARGET ARCHITECTURE:** 4-pane desktop when contact sidebar exists; `<lg` switcher unchanged.  
**FILES LIKELY AFFECTED:** `inbox.tsx`, `inbox-chrome.tsx`, `adaptive-workspace-shell.tsx`.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** reply, open ticket, official connect, CSP (`docs/desk-iframe-headers.md`).  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** InboxController, desk connectors.  
**DEPENDENCIES:** P01.  
**TESTS:** Wave3, InboxCspHeaders.  
**A11Y:** Panel switcher tabs.  
**RESPONSIVE QA:** `<lg` one panel.  
**VISUAL QA:** Embed not default IA.  
**RISKS:** Embed customers — keep toggle.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Native 4-pane at 1280; embed path intact.  
**OUT OF SCOPE:** Replacing EvoDesk.

---

## P14 — Inbox CRM context

**OBJECTIVE:** Contact pane uses `record-context` facts + peek / open full.  
**REFERENCE PATTERN:** Same.  
**CURRENT IMPLEMENTATION:** `InboxContactSidebar` facts + Open contact.  
**TARGET ARCHITECTURE:** Shared identity slot; optional QuickRecordDrawer.  
**FILES LIKELY AFFECTED:** `inbox-chrome.tsx`, QuickRecordDrawer.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** Thread reply.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Thread/contact payload.  
**DEPENDENCIES:** P09, P13.  
**TESTS:** Wave3.  
**A11Y / RESPONSIVE / VISUAL:** Open contact still works if drawer fails.  
**RISKS:** Missing contact on thread.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** CRM context not a third card design.  
**OUT OF SCOPE:** Editing the contact in inbox.

---

## P15 — Activities work queue

**OBJECTIVE:** `/crm/activities` is a queue (overdue / today / upcoming), not a dump.  
**REFERENCE PATTERN:** Linear + Asana.  
**CURRENT IMPLEMENTATION:** CrmShell + CrmListHeader + cards; `?create=1` redirect.  
**TARGET ARCHITECTURE:** PageHeader + filters in URL; complete/attendance stay; drop CrmShell.  
**FILES LIKELY AFFECTED:** `pages/crm/activities/index.tsx`, `list-chrome.tsx` usage.  
**NEW / MODIFIED / DEPRECATED:** CrmListHeader deprecated here.  
**BEHAVIOR THAT MUST NOT CHANGE:** store/complete/attendance POSTs.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** ActivityController.  
**DEPENDENCIES:** P01, attention-engine types.  
**TESTS:** EvoCrmP6ActivityComposer, activity feature tests.  
**A11Y:** Complete is a button.  
**RESPONSIVE / VISUAL:** Queue sections.  
**RISKS:** `?create=1` currently sets `window.location` — keep a real create path.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Not DataWorkspace-forced if activities lack listView; do not invent saved views.  
**OUT OF SCOPE:** Replacing record timeline.

---

## P16 — Command OS

**OBJECTIVE:** Sections Navigate · Records · Create · Ask Evo; Phosphor; Home `/dashboard`.  
**REFERENCE PATTERN:** Linear + Slack + Notion.  
**CURRENT IMPLEMENTATION:** Records + Navigate; Lucide; `/home`.  
**TARGET ARCHITECTURE:** `ds/chrome/CommandPalette` or crm wrapper over one primitive.  
**FILES LIKELY AFFECTED:** `components/crm/command-palette.tsx`, `aurora/command-palette.tsx`, topbar.  
**NEW / MODIFIED / DEPRECATED:** Aurora primitive becomes adapter.  
**BEHAVIOR THAT MUST NOT CHANGE:** `evoSearchIndex` hits still visit hrefs.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Shared search index.  
**DEPENDENCIES:** P01, P02, action-routing destinations.  
**TESTS:** Source lock for `/dashboard`; manual Cmd/Ctrl+K.  
**A11Y:** Combobox pattern already in Aurora — keep.  
**RESPONSIVE / VISUAL:** 36px rows.  
**RISKS:** Long NAV_ITEMS list — do not hide routes operators use.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Home works; Create items match topbar; Ask gated.  
**OUT OF SCOPE:** Full Ask conversation inside palette (P24 may embed).

---

## P17 — Dashboard operating hierarchy

**OBJECTIVE:** Attention / activation / pipeline / activity — not vanity-first.  
**REFERENCE PATTERN:** Shopify + Stripe + HubSpot home (not Salesforce widget soup).  
**CURRENT IMPLEMENTATION:** `pages/home.tsx` header, KPIs, pipeline, GuidedActions, AttentionList, feeds, quota.  
**TARGET ARCHITECTURE:** Attention (+ checklist after P23) above charts; one Create path; EvoViz series 1 = accent.  
**FILES LIKELY AFFECTED:** `pages/home.tsx`, `components/dashboard/*`.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** HomeDashboardBuilder numbers; no fake %.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** HomeController props (additive only).  
**DEPENDENCIES:** P12/P15 ideally for attention quality.  
**TESTS:** HomeCommandCenter, HomeQuota, Wave0 home `data-home`.  
**A11Y / RESPONSIVE / VISUAL:** PageHeader 28/34.  
**RISKS:** Widget reorder vs tests locking order.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Needs attention first; KPIs real.  
**OUT OF SCOPE:** New chart library.

---

## P18 — Quotes builder / lifecycle

**OBJECTIVE:** Show page is a clear Stripe-like **split builder** (document vs properties) without replacing lifecycle.  
**REFERENCE PATTERN:** Stripe + HubSpot/PandaDoc.  
**CURRENT IMPLEMENTATION:** Show already edits lines in `RecordShell`; create is compact drawer.  
**TARGET ARCHITECTURE:** Improve chrome/hierarchy; keep send/revoke/preview/PDF; create drawer stays the quick path.  
**FILES LIKELY AFFECTED:** `pages/crm/quotes/show.tsx`.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** send, revoke, public accept, totals.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Quote routes.  
**DEPENDENCIES:** P08, P01.  
**TESTS:** Wave4, QuoteAcceptance, QuoteDelivery, QuoteTotal.  
**A11Y / RESPONSIVE / VISUAL:** Builder usable at 768.  
**RISKS:** Do not rebuild lines from scratch.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Lifecycle identical; chrome clearer.  
**OUT OF SCOPE:** Payments, e-sign vendor.

---

## P19 — Automation authoring

**OBJECTIVE:** Structured builder (trigger / condition / action / else) — **not** n8n canvas.  
**REFERENCE PATTERN:** Shopify Flow + HubSpot + Zapier.  
**CURRENT IMPLEMENTATION:** HairlineTable + create drawer + templates (`workflows/index.tsx`).  
**TARGET ARCHITECTURE:** Same engine; clearer authoring form; drop CrmShell if still present.  
**FILES LIKELY AFFECTED:** `pages/crm/workflows/index.tsx`.  
**NEW / MODIFIED / DEPRECATED:** Optional extract `WorkflowBuilder` domain component.  
**BEHAVIOR THAT MUST NOT CHANGE:** store/update/toggle/delete/templates.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** WorkflowController.  
**DEPENDENCIES:** P01.  
**TESTS:** EvoCell2AutomationSpine + workflow tests.  
**A11Y:** Forms labeled.  
**RESPONSIVE / VISUAL:** Drawer 560.  
**RISKS:** Scope creep into canvas.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** No canvas dependency; templates work.  
**OUT OF SCOPE:** New trigger types.

---

## P20 — Automation test / history / safety

**OBJECTIVE:** Dry-run / last run / confirm destructive toggles if APIs exist or additive.  
**REFERENCE PATTERN:** Zapier history, Flow safety.  
**CURRENT IMPLEMENTATION:** Toggle + delete forms; history UI unknown — **do not invent a log store**. Inspect controller before adding UI.  
**TARGET ARCHITECTURE:** If no run log exists, ship confirm-only safety + document the gap; do not fake history.  
**FILES LIKELY AFFECTED:** workflows page, maybe WorkflowController (additive).  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** Execution semantics.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Unless additive history endpoint is explicitly added and tested.  
**DEPENDENCIES:** P19.  
**TESTS:** Existing workflow tests + new if endpoint added.  
**A11Y:** Confirm dialogs.  
**RESPONSIVE / VISUAL:** —  
**RISKS:** Fake history.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** No silent destructive toggle; no fake rows.  
**OUT OF SCOPE:** Canvas debugger.

---

## P21 — Settings IA

**OBJECTIVE:** Groups Personal / Workspace / CRM / Communication / Automation / Integrations / Developer (max 2 levels).  
**REFERENCE PATTERN:** Stripe + Vercel + Shopify + Linear. See `docs/research/settings-benchmark.md`.  
**CURRENT IMPLEMENTATION:** You / Workspace / Integrations / CRM / Admin.  
**TARGET ARCHITECTURE:** Relabel + reorder **existing hrefs**; permission filters unchanged; Get started not a fake complete.  
**FILES LIKELY AFFECTED:** `layouts/settings/layout.tsx`, Wave5.  
**NEW / MODIFIED / DEPRECATED:** Admin label → Developer (or Workspace) — pick one in PR, not both.  
**BEHAVIOR THAT MUST NOT CHANGE:** 403s, owner-only workspace, capabilities.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All settings routes.  
**DEPENDENCIES:** P02.  
**TESTS:** Wave5, Settings/*, People, Connectors.  
**A11Y:** Nav current page.  
**RESPONSIVE QA:** Settings subnav Sheet if any.  
**VISUAL QA:** Forms max 900px.  
**RISKS:** Operators’ muscle memory.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** No new URLs; danger stays scoped.  
**OUT OF SCOPE:** Billing.

---

## P22 — Integration directory

**OBJECTIVE:** Apps + connectors read as a directory (status, connect, disconnect).  
**REFERENCE PATTERN:** Shopify + Zapier.  
**CURRENT IMPLEMENTATION:** `settings/apps`, `connectors`, Meta, WhatsApp pages.  
**TARGET ARCHITECTURE:** Shared card chrome; No Baileys copy stays.  
**FILES LIKELY AFFECTED:** `pages/settings/apps/index.tsx`, `connectors.tsx`.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** OAuth, Evolution, Meta mappings.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Connector store, official WhatsApp Cloud.  
**DEPENDENCIES:** P21.  
**TESTS:** AppsMarketplace, Connectors, Wave5.  
**A11Y / RESPONSIVE / VISUAL:** Directory, not env dump.  
**RISKS:** Hiding a live connector.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** All current entries still reachable.  
**OUT OF SCOPE:** New vendors.

---

## P23 — Onboarding activation checklist

**OBJECTIVE:** Durable Home checklist to first CRM outcome. Wizard dismiss ≠ done.  
**REFERENCE PATTERN:** Shopify + Linear + Stripe. See `docs/research/onboarding-benchmark.md`.  
**CURRENT IMPLEMENTATION:** GuidedActions + setup wizard.  
**TARGET ARCHITECTURE:** `activation` capability on Home; facts from existing counts; wizard deep-link.  
**FILES LIKELY AFFECTED:** `pages/home.tsx`, `HomeDashboardBuilder` (additive), maybe `guided-actions.tsx`.  
**NEW / MODIFIED / DEPRECATED:** New checklist component; GuidedActions may remain for deal/prospecting.  
**BEHAVIOR THAT MUST NOT CHANGE:** Wizard OAuth; empty KPIs stay empty.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Additive home props only.  
**DEPENDENCIES:** P17 preferred; Create paths exist.  
**TESTS:** FirstRun, OAuthSetup, Home*.  
**A11Y:** Checklist list semantics, not color-only complete.  
**RESPONSIVE / VISUAL:** Above vanity charts.  
**RISKS:** Fake completion.  
**ROLLBACK:** Revert props + UI.  
**ACCEPTANCE CRITERIA:** Completes only when data says so.  
**OUT OF SCOPE:** Marketing site.

---

## P24 — Contextual Ask Evo

**OBJECTIVE:** Ask Evo is contextual on the record (and command section), not a second product.  
**REFERENCE PATTERN:** Intercom/HubSpot AI rail [7783b0d6](https://mobbin.com/screens/7783b0d6-ca17-40ef-89ea-bc8752e3a6fb) (ID as in mobbin contract).  
**CURRENT IMPLEMENTATION:** `AskEvoPanel` on show; topbar opens palette.  
**TARGET ARCHITECTURE:** Command Ask section; panel secondary on record (not the first orange block); capability hide.  
**FILES LIKELY AFFECTED:** `ask-evo-panel.tsx`, command palette, record show pages.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** POST `/crm/{object}/{id}/ask`, draft-email, permissions.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** AskEvoController.  
**DEPENDENCIES:** P16, record-context.  
**TESTS:** EvoCell4, RecordInsight.  
**A11Y:** Dialog/panel labels.  
**RESPONSIVE:** Collapse rail.  
**VISUAL QA:** Not an orange hero.  
**RISKS:** Dual entry confusion — P02/P16 should already define Sparkle.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Same permissions; no Copilot/Breeze copy.  
**OUT OF SCOPE:** New models.

---

## P25 — Responsive convergence

**OBJECTIVE:** One breakpoint grammar: 375 / 768 / 1280 / 1440.  
**REFERENCE PATTERN:** `docs/visual-system/responsive-architecture.md`.  
**CURRENT IMPLEMENTATION:** `h-app-workspace`, AdaptiveWorkspaceShell, list `@[480px]/list`.  
**TARGET ARCHITECTURE:** Apply same to any leftover pages (leads, workflows, settings).  
**FILES LIKELY AFFECTED:** migrated pages that still clip Create or dual-scroll.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** Desktop IA.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P04–P15 roughly done.  
**TESTS:** Existing chrome; manual viewports.  
**A11Y:** 44px targets on mobile where we touch.  
**RESPONSIVE QA:** **This phase’s job.**  
**VISUAL QA:** No horizontal clip on topbar.  
**RISKS:** Rewriting desktop to fit mobile.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Checklist in test-strategy viewports.  
**OUT OF SCOPE:** Native apps.

---

## P26 — A11y pass

**OBJECTIVE:** Focus, contrast, names, keyboard board already shipped in P12 — verify globally.  
**REFERENCE PATTERN:** WAI-ARIA / WCAG; `docs/research/micro-ux-benchmark.md`.  
**CURRENT IMPLEMENTATION:** Mixed.  
**TARGET ARCHITECTURE:** Floor in micro-ux file.  
**FILES LIKELY AFFECTED:** overlays, tables, board, inbox switcher.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** Features.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P25.  
**TESTS:** Manual + any axe later.  
**A11Y:** **This phase’s job.**  
**RESPONSIVE / VISUAL:** Focus ring visible on canvas.  
**RISKS:** Icon-only regressions.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Esc/focus return on all DS overlays; no color-only status on pipeline/lists.  
**OUT OF SCOPE:** PDF/public quote full WCAG audit (separate).

---

## P27 — Motion / micro-UX

**OBJECTIVE:** 150–200ms overlay motion; `prefers-reduced-motion`; one primary per region.  
**REFERENCE PATTERN:** Linear + Stripe.  
**CURRENT IMPLEMENTATION:** `aurora-motion.css`; Wave6 empty/motion tests.  
**TARGET ARCHITECTURE:** DS overlays only; no marketing motion.  
**FILES LIKELY AFFECTED:** `resources/css/aurora-motion.css`, Drawer/Modal.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** Board drag physics already shipped — do not “improve” into bounce.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P26.  
**TESTS:** Wave6, reduced-motion media.  
**A11Y:** Reduced motion.  
**RESPONSIVE / VISUAL:** No layout shift.  
**RISKS:** Over-animating tables.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Overlays honor reduced motion.  
**OUT OF SCOPE:** Lottie, mesh.

---

## P28 — Legacy removal

**OBJECTIVE:** Delete dead adapters listed in [deprecation-map.md](./deprecation-map.md).  
**REFERENCE PATTERN:** Strangler end.  
**CURRENT IMPLEMENTATION:** Dead files still in tree.  
**TARGET ARCHITECTURE:** rg clean.  
**FILES LIKELY AFFECTED:** `app-header*`, `list-toolbar`, `saved-view-tabs`, `pages/leads/board.tsx`, unused Aurora skins, possibly `LeadBoardController`.  
**NEW / MODIFIED / DEPRECATED:** Deletes.  
**BEHAVIOR THAT MUST NOT CHANGE:** All live routes.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** Do not delete routed controllers.  
**DEPENDENCIES:** P04–P16, P02.  
**TESTS:** Full Pest + types + lint; `LeadsBoardTest` / P9 retire tests must be updated *before* controller delete.  
**A11Y / RESPONSIVE / VISUAL:** Smoke Home, Contacts, Board, Inbox, Settings.  
**RISKS:** Test still instantiates orphan controller.  
**ROLLBACK:** Git revert.  
**ACCEPTANCE CRITERIA:** Deprecation checklist green.  
**OUT OF SCOPE:** Renaming PHP namespaces.

---

## P29 — Visual QA / polish

**OBJECTIVE:** Token/hex hygiene; density; accent discipline.  
**REFERENCE PATTERN:** design-system Do/Don't.  
**CURRENT IMPLEMENTATION:** Leftover hex possible in settings/quotes.  
**TARGET ARCHITECTURE:** `rg` empty for `#d9500f|#eaeaea|#EC6025|#0176D3|#00A4BD` in product JS/CSS except history comments and `brand/marks.tsx`.  
**FILES LIKELY AFFECTED:** leftover inline hex.  
**NEW / MODIFIED / DEPRECATED:** —  
**BEHAVIOR THAT MUST NOT CHANGE:** All.  
**BACKEND CONTRACT THAT MUST NOT CHANGE:** All.  
**DEPENDENCIES:** P28.  
**TESTS:** Full suite.  
**A11Y / RESPONSIVE / VISUAL:** **This phase’s job** vs Mobbin *density*, not paint.  
**RISKS:** Chasing pixel parity with HubSpot.  
**ROLLBACK:** Revert.  
**ACCEPTANCE CRITERIA:** Hex rg; Contacts/Companies/Leads/Deals/Quotes share workspace implementation.  
**OUT OF SCOPE:** Marketing landing.

---

# Preserve forever (repeat)

Do not change in any P01–P29 PR unless that PR’s AC explicitly says so:

- Laravel routes, controller signatures, Inertia prop *names*
- Auth, permissions, capabilities, simple mode
- Integrations, webhooks, jobs, observers
- Schema, seeders, default pipeline slugs
- Public quote accept and meeting book
- Inbox/EvoDesk official connector boundary
- Ask Evo permission gating
- Structured workflow execution (no silent canvas)

If a phase needs a UI-only query param (`?record=`), it is additive.

---

# Research honesty

Requested Source-of-Truth files were **not on main or any searched branch**. Six reconstructions + [`docs/research/_ABSENT.md`](../research/_ABSENT.md) record that. Do not treat reconstructions as scored Mobbin audits. Do not implement from missing scorecards.
