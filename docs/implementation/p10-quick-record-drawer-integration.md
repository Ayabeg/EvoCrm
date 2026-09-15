# P10 — Quick Record Drawer integration

**PR:** Wire the frozen P09 drawer into the five DataWorkspace object lists.  
**Baseline:** `main` @ `0694f07` (P09 #218).  
**Date:** 2026-09-15.

P10 is integration only. P09 is not redesigned. P11 is not started.

---

## P10 STATUS

Integrated. One reserved `onRowPeek` seam on DataWorkspace / ListDataTable / ListViewTable. `CrmListShell` opens `openRecord({ type: entity, id })` for contact / company / lead / deal / quote. Production list pages stay unaware of peek URLs, adapters, and fetch. URL peek is deferred (decision B).

## BASE / PR / TIP

- Base: `0694f0777fbb3ed0ce377c31ef0ed7d6d4e247d8`
- Branch: `cursor/p10-quick-record-drawer-integration-f7f4`
- Tip: this branch after the P10 commits

## BEFORE

List row click called `router.visit(rowHref)` and left the workspace. Back reconstructed query/page/selection from a new Inertia show visit. P09 reserved `onRowPeek` and voided it. Provider + drawer already lived in `app-layout`.

## P09 CONTRACT CONSUMED

Unchanged: one `QuickRecordDrawer`, `RecordRef`, five adapters, peek endpoint, open / replace / back / close / retry / openFull, association replace, stale protection, a11y, Escape, focus restore, responsive widths, `fullRecordHref`, `openRecord({type,id})`, `RecordLink`.

P10 only calls `openRecord` and passes the row element as `opener`. No adapter, hydration, or shell edits.

## PROVIDER PLACEMENT

Still `app-layout.tsx` (`QuickRecordProvider` + one `QuickRecordDrawer`). Smallest shared host for all five lists. No per-row provider. No per-domain remount.

## DATAWORKSPACE PEEK SEAM

Activated the reserved prop:

```ts
onRowPeek?: (row: Row, context?: { opener?: HTMLElement | null }) => void
```

`DataWorkspace` passes it to `ListDataTable` → `ListViewTable`. Domain mode still forbids `onRowPeek`. There is no `onContactPeek` × 5.

`CrmListShell` is the only production host:

```ts
openRecord({ type: entity, id: row.id }, { opener })
```

`isRecordType` excludes tickets.

## ROW INTERACTION CONTRACT

One behavior on all five lists:

| Target | Action |
|---|---|
| Row / card background | Peek (`openRecord`) |
| Identity name `Link` (`rowHref`) | Full record show |
| Checkbox / button / menu / label | Nested control only |
| Contact email / phone | `mailto:` / `tel:` — nested only |
| Cmd/Ctrl or middle click on row | `window.open(rowHref)` |
| Shift/Alt click on row | `router.visit(rowHref)` |
| Enter on focused row | Peek |
| Enter on identity link | Full record |

Owner / city / stage / amount text is not an interactive control — those cells peek, same as empty row chrome. Interactive-target guard stays `a, input, button, label`.

Bulk mode: checkbox selects; preferred row click still peeks and does not call selection APIs.

## rowHref CONTINUITY

`rowHref` remains the full show path (`/crm/{contacts|companies|leads|deals|quotes}/:id`). Peek never overwrites it. `resolveRowHref` is unchanged. Modifier clicks and Open full consume that href.

## FULL RECORD ESCAPE HATCH

Identity `Link` on every row. Drawer **Open full ↗** visits the current descriptor `fullRecordHref` (P09). No new show pages.

## MODIFIER / NEW-TAB BEHAVIOR

Real hrefs stay on identity links (browser + Inertia defaults). Row-background Cmd/Ctrl/middle opens the same `rowHref` in a new tab. Nested links keep native modifier behavior because the guard returns before peek.

## KEYBOARD BEHAVIOR

Peekable rows are `tabIndex={0}` with `aria-label="Inspect {identity}"`. Enter on the row peeks. Enter on the identity link follows the link. Valid table markup; the row is not a nested button wrapping the link.

## CONTACTS INTEGRATION

`CrmListShell` + `openRecord({ type: 'contact', id })`. Search, views, filters, columns, selection, bulk, pagination, show, nested email/phone preserved. No field / bulk / view changes.

## COMPANIES INTEGRATION

Drawer via the same seam. Search, Wilaya, city, columns, pagination, create, show preserved. `selectable: false`. No fake bulk.

## LEADS INTEGRATION

Drawer via the same seam. `supportsQuery: false`, 100-cap, stub paginator, `selectable: false` preserved. Qualification / conversion stay on show. No invented list search / views / qualify. `/leads` redirect untouched.

## DEALS LIST INTEGRATION

List only. Query, search, views, filters, stage, pipeline, selection, bulk, columns, pagination, List–Board toggle, DZD, show preserved. Board page not wired. `/leads` redirect untouched.

## QUOTES INTEGRATION

Drawer via the same seam. Deal-title identity, Quote #id, `total_cents`, DA display, draft/sent/accepted only, `expires_at` / No expiration, owner, created, All/My, `selectable: false`, no Add view, deal-first create, show/PDF/send/accept/revoke on full record. No Customer / Expired invent, no bulk, no row mutation menu.

## SELECTION PRESERVATION

`activateListRow` does not call `toggleOne` / `clearSelection`. Checkbox still owns selection. Select A+B → peek C → close → A+B remain. Drawer state is the P09 controller, not workspace selection.

## QUERY PRESERVATION

Open / close / association replace do not `router.get` the list. Filter, search, view, pipeline extras stay on the Inertia page.

## PAGINATION PRESERVATION

Paginator hrefs unchanged. Peek does not write `page`. Close does not reset page.

## SCROLL PRESERVATION

No DataWorkspace remount key. Table overflow containers stay mounted. Vertical and horizontal scroll positions survive open / close.

## COLUMN PRESERVATION

Columns remain `ListViewConfig` / session / `CrmListShell` `useState`. Peek does not call `onColumnsChange`.

## SAVED VIEW PRESERVATION

`SavedViews` and `filter_id` / `view` are untouched. Peek is not a view.

## URL DECISION

**B — defer URL-addressable peek.**

P03C owns list query. Writing `peek` via Inertia would refetch the list (breaks context preservation). `history.pushState` would desync Inertia's page URL and make Back/Forward collide with filter navigation. Refresh reconstruction is not the mission.

`peek` stays in `UNSAFE_QUERY_KEYS`. Helpers (`writePeekSearch`, `peekTokenFromSearch`) remain unused on production lists. Browser Back = page history. Drawer Back = P09 in-memory stack. Do not claim otherwise.

## DRAWER HISTORY

P09 in-memory stack only. `openRecord` resets. Association `replace` pushes. Drawer Back pops. Empty stack closes.

## ASSOCIATION TRAVERSAL

From a production list opener: Contact → Company → Deal (etc.) replaces inside the same drawer. The underlying list object does not switch. Close returns to the same Contacts / Companies / Leads / Deals / Quotes workspace.

## OPEN FULL

P09 `openFull()` visits the **current** drawer `RecordRef` `fullRecordHref`. Not the original list row if the user traversed.

## LOADING / ERROR

Immediate P09 shell + skeleton. No list spinner. Peek 404/403/network stay in the drawer. Close returns to the list. No hard-nav error page.

## STALE REQUEST PROTECTION

Unchanged P09 `requestId` + abort. Rapid list clicks open A → B → C; A cannot render over C.

## ACCESSIBILITY / FOCUS

P09 dialog, focus trap, Escape, labelled Close / Open full. `opener` is the production row (`<tr>` / mobile `<li>`). `onCloseAutoFocus` focuses it; `?.` is the safe fallback if the row is gone.

## PERFORMANCE

No Inertia list visit on peek. No table remount. Provider already above the workspace. Hydration is one peek GET. Not thousands of row rerenders — `onRowPeek` is a `useCallback` on the shell.

## 1440 QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** Expected: 480px right drawer, workspace visible, no orange drawer, no giant row hover. Existing `hover:bg-canvas-soft` + `cursor-pointer` only.

## 1280 QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** Same 480px drawer.

## 1024 QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** 480px drawer. Deals/Quotes `table-fixed` min-widths must not snap H-scroll on open/close.

## 768 QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** Wider sheet `min(92vw, 520px)`. Touch: card tap peeks; identity / checkbox / mailto / tel stay nested.

## CONTACTS LIVE QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** Populated list: search + view + filter + columns + page + selection → peek → traverse → close. Context intact. Identity link still show. Email/phone do not peek.

## COMPANIES LIVE QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** Wilaya/city + columns + pagination + create overlay coexistence.

## LEADS LIVE QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** Cap/stub paginator unchanged. No list qualify. Show still qualifies/converts.

## DEALS LIVE QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** List only. Pipeline + stage + search + bulk + List/Board toggle. Board cards still visit show.

## QUOTES LIVE QA

**LIVE VISUAL QA NEEDS HUMAN / RESEARCH BOX.** Deal title identity, DA total, draft/sent/accepted, No expiration. H-scroll at 1024/768.

## CONTEXT-PRESERVATION WALK

Mandatory on Contabo (research box):

1. Contacts: apply search + saved view + owner + columns + page 2 + select two rows. Scroll. Peek a third row. Traverse association. Close. Same query, page, selection, columns, scroll.
2. Repeat on Companies (no selection), Leads (no query/search), Deals list (pipeline/stage/bulk), Quotes (All/My).
3. Open create drawer, dismiss, peek — list state intact.
4. Bulk honesty: selected rows stay selected while peeking another row.

This agent cannot browser Contabo. Do not treat harness-only as this walk.

## BACK/FORWARD QA

In-memory peek: browser Back leaves the list (previous Inertia page), it does **not** close the drawer. Drawer Back is the in-drawer control. No URL peek Back/Forward contract in P10.

## P04–P09 REGRESSION

List pages still omit `QuickRecordDrawer` / `onRowPeek` / `openRecord`. `rowHref` still full show. Interactive guard string unchanged. P09 reservation comment kept; the seam is now passed through instead of voided. P01–P09 Pest locks remain.

## DEALS BOARD REGRESSION

`deals/board.tsx` still `PipelineKanban`. No drawer / `onRowPeek` / `openRecord`.

## INBOX REGRESSION

Inbox has no drawer wiring.

## COMMAND REGRESSION

Command palette still `router.visit(href)`. No `openRecord`.

## CREATE FLOW REGRESSION

Create drawers stay page-local. Peek uses the P09 overlay. Neither writes the other's state.

## BULK REGRESSION

Contacts/Deals bulk bars unchanged. Peek does not clear or add ids. Companies/Leads/Quotes stay `selectable: false`.

## FILES CHANGED

- `resources/js/ds/workspace/types.ts` — peek context on the reserved seam
- `resources/js/ds/workspace/DataWorkspace.tsx` — pass `onRowPeek` through
- `resources/js/ds/workspace/DataTable.tsx` — ListDataTable forwards peek
- `resources/js/ds/workspace/data-workspace-contract.ts` — shared-table accepts `onRowPeek`
- `resources/js/ds/workspace/index.ts` — export row-peek helpers
- `resources/js/ds/workspace/quick-record/row-peek.ts` — `recordRefFromRow` + activation
- `resources/js/ds/workspace/quick-record/index.ts` — re-exports
- `resources/js/ds/workspace/quick-record/url.ts` — document decision B
- `resources/js/ds/workspace/quick-record-list-contract.ts` — export-only proofs
- `resources/js/components/crm/crm-list-shell.tsx` — one `openRecord` host
- `resources/js/components/crm/list-view-table.tsx` — peek vs visit vs new-tab
- `tests/js/p10-quick-record-drawer-integration.ts`
- `tests/Feature/P10QuickRecordDrawerIntegrationTest.php`
- `docs/implementation/p10-quick-record-drawer-integration.md`

P09 drawer / adapters / peek endpoint / harness were not rewritten.

## TESTS

`P10QuickRecordDrawerIntegrationTest` plus P01–P09 / `CrmListWorkspace` / `CrmBulkActions` / Contact / Company / Lead / Deal / Quote. Contract proofs in `quick-record-list-contract.ts` (export-only; runner is test-only). Commands: `php artisan test`, `npm run types:check`, eslint on touched files, `npm run build`.

## LIVE VISUAL QA

**NEEDS HUMAN / RESEARCH BOX.** This agent cannot browser Contabo. Research should walk the checklist below after deploy.

## REMAINING DEBT

- URL-addressable peek (decision B)
- No peek analytics (no established list-peek convention)
- Contabo viewport / focus / H-scroll walks
- Owner text cells peek (owner is not a nested control in P04–P08)

## DEFERRED TO P11+

P11/P12 Deals board peek. P13/P14 Inbox. P15 Activities. P16 Command. Optional URL peek if it can be additive without P03C collision. Note/task mutations. Session cache.

## RISKS

Focus restore fails if a later table virtualizes rows away before close (P09 `?.` fallback). Future URL peek done wrongly could drop P03C keys — keep `peek` unsafe and host-level only.

## MERGE READY

YES — integration only; P11 not started.

---

## Contabo / research checklist

- [ ] Deploy this branch
- [ ] Contacts / Companies / Leads / Deals **list** / Quotes: populated lists, not harness
- [ ] Row background peeks; identity link opens show; Cmd/Ctrl+click opens new tab
- [ ] Checkbox / email / phone do not peek
- [ ] Select A+B, peek C, close → A+B still selected
- [ ] Filter + page + columns + scroll survive open / close / association traverse
- [ ] Deals/Quotes H-scroll at 1024 and 768 does not snap
- [ ] 1440 / 1280 / 1024 / 768: P09 widths, no page H-overflow, no orange drawer
- [ ] Create drawer still works; board / inbox / Cmd+K unchanged
- [ ] Browser Back is page history; drawer Back is in-drawer only
- [ ] `/crm/quick-record-drawer/harness` still absent in production
