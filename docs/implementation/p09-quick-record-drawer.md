# P09 — Quick Record Drawer foundation

**PR:** Add the universal Quick Record Drawer. Contextual inspection layer, not a replacement for full record workspaces. Production list `rowHref` is unchanged.  
**Baseline:** `main` @ `83834a7` (P08 #217).  
**Date:** 2026-09-15.

P09 is foundation only. P10 wires production surfaces. P11 is not started.

---

## P09 STATUS

Foundation implemented: one shell, five typed adapters, one permission-aware peek endpoint, in-memory open/replace/back/close controller, local/testing harness. Production lists, board, inbox, and command are untouched.

## BEFORE

There was no peek layer. List/board/command jumped to full Inertia show pages (`RecordShell` / `RecordPageFrame`). Create used `CreateDrawer`. `DataWorkspace` reserved `onRowPeek` with an explicit void and a P04–P08 lock: `onRowPeek is reserved for P09`.

| Object | Show route | Show page | List rowHref |
|---|---|---|---|
| Contact | `GET /crm/contacts/{id}` | `pages/crm/contacts/show.tsx` | `/crm/contacts/:id` |
| Company | `GET /crm/companies/{id}` | `pages/crm/companies/show.tsx` | `/crm/companies/:id` |
| Lead | `GET /crm/leads/{id}` | `pages/crm/leads/show.tsx` | `/crm/leads/:id` |
| Deal | `GET /crm/deals/{id}` | `pages/crm/deals/show.tsx` | `/crm/deals/:id` |
| Quote | `GET /crm/quotes/{id}` | `pages/crm/quotes/show.tsx` | `/crm/quotes/:id` |

Existing JSON: Sanctum `GET /api/v1/{contacts,leads,deals,quotes}/{id}`. **No company show.** API payloads omit associations and quote deal-title presentation. Inertia show is a full workspace — too heavy to hydrate a drawer.

## ARCHITECTURE

```
openRecord({ type, id })
  → QuickRecordProvider / controller
  → GET /crm/records/{type}/{id}/peek
  → record-adapters/{type}.ts
  → RecordDescriptor
  → QuickRecordDrawer shell
```

- **Shell owns behavior:** open, replace, back, close, focus, width, motion, loading, errors, stale requests.
- **Adapters own domain semantics:** identity, status vs qualification, money, associations, capabilities.
- **Not built:** ContactDrawer / CompanyDrawer / LeadDrawer / DealDrawer / QuoteDrawer.

## RECORD REF CONTRACT

```ts
type RecordType = 'contact' | 'company' | 'lead' | 'deal' | 'quote'
type RecordRef = { type: RecordType; id: number }
```

Lists and callers pass a `RecordRef`, not a giant record. `parseRecordRef` rejects unknown types and non-integer / `< 1` ids.

## RECORD DESCRIPTOR

Presentation-only normalize:

`ref`, `title`, `subtitle?`, `avatar?`, `status?`, `owner?`, `fullRecordHref`, `keyProperties[]`, `associations[]`, `activity[]`, `notes[]`, `tasks[]`, `actions[]`, `capabilities`, `permissions`.

Empty values render as an em dash (`—`). Quote has no customer FK. Lead qualification is not a deal stage.

## ADAPTER CONTRACT

`adaptRecord(payload)` dispatches to `resources/js/ds/workspace/record-adapters/{contact,company,lead,deal,quote}.ts`. Each adapter maps peek facts → `RecordDescriptor`. Adapters do not fetch and do not duplicate show pages.

## CONTACT ADAPTER

Identity: `display_name` / first+last. Status: `lead_status` (not a pipeline stage). Owner: `owner_name`. Key properties: email, phone, company, owner, lead status, city, wilaya, created. Associations: company + deals (real FKs). Activity/notes/tasks: supported. Actions: mailto / tel when present + Open full → `/crm/contacts/:id`.

## COMPANY ADAPTER

Identity: `name`. No pipeline status. Owner: `owner_name`. Key properties: domain, industry, phone, city, wilaya, country, owner, contact/deal counts. Associations: contacts + deals. Activity supported. Open full → `/crm/companies/:id`.

## LEAD ADAPTER

Identity: `title`. **Qualification** from `status` (`new` / `working` / `qualified` / `disqualified`). Not a deal stage. Key properties: qualification, source, score, contact, company, deal, qualified_at, created. Associations: contact, company, deal (`hasOne`) only — no inferred contact.deals. Activity/notes/tasks **omitted** (lead show has no timeline engine). Open full → `/crm/leads/:id`.

## DEAL ADAPTER

Identity: `title`. **Stage** from `stage.name` — not qualification. Amount: `amount_cents` via `formatDzd`. Associations: company, contact, lead (if `lead_id`), quotes. Activity supported. Open full → `/crm/deals/:id`.

## QUOTE ADAPTER

Identity: deal title (`deal.title` / `deal_title`), subtitle `Quote #{id}`. Status: `draft` / `sent` / `accepted` only. **Do not infer `expired` from `expires_at`.** Total: `total_cents` + DZD. Expires: `expires_at`. Owner from `deal.owner`. Association: **Deal only** (Quote has no customer FK). Activity/notes/tasks omitted. Open full → `/crm/quotes/:id`.

## HYDRATION CONTRACT

`openRecord({type,id})` → shell opens immediately → one `GET /crm/records/{type}/{id}/peek` (`Accept: application/json`, `credentials: same-origin`) → adapter → render.

One fetch style. Not five. Not Inertia `show()`. Not Sanctum `/api/v1` (missing company + associations).

## BACKEND ADDITIONS

**Why a small endpoint:** existing contracts cannot safely hydrate a peek.

| Existing | Gap |
|---|---|
| Inertia show | Full workspace; navigates away; too heavy |
| `GET /api/v1/contacts\|leads\|deals\|quotes/{id}` | No company; no associations; quote missing deal title |
| Record layout JSON | Layout cards only |

`QuickRecordPeek` is **read-only**. Reuses `forWorkspace`, policies (`view` / `update`), `CrmHub::timeline`, and existing models. No new CRM models. No writes. No parallel public API.

Route: `GET /crm/records/{type}/{id}/peek` (`crm.records.peek`). `type` allowlisted. Missing / other-workspace → **404** (no existence leak). Policy `view` fail → **403**.

## PERMISSION MODEL

| Gate | Rule |
|---|---|
| Find | `forWorkspace($user->workspace)` |
| View | Policy `view` = same workspace |
| `permissions.can_update` | Policy `update` = workspace + `crm.edit` |
| Actions | mailto/tel are links; mutating note/task **not** offered |
| Other workspace | 404 |

GET web CRM still does not require `crm.view` beyond workspace membership — same as show pages.

## DRAWER CONTROLLER

One controller (`quick-record/controller.ts` + `QuickRecordProvider`):

| Method | Behavior |
|---|---|
| `openRecord(ref)` | Open, reset history, hydrate |
| `replace(ref)` | Push current onto stack, same drawer, hydrate |
| `back()` | Pop stack, hydrate; empty stack closes |
| `close()` | Reset, increment request id (in-flight ignored) |
| `retry()` | Re-hydrate current ref |
| `openFull()` | Visit `fullRecordHref` (existing show) |
| `pin()` | Reserved no-op |

No `contactDrawerOpen` × 5. Association clicks `replace` — no nested overlay stack.

## URL / HISTORY STRATEGY

**P09:** in-memory history only. Production lists do **not** read or write a query param. Filter/page/view keys are untouched. Opening/closing the drawer does not `router.get` and does not refetch the list.

Reserved query (classified **unsafe** in P03C, not a filter):

```
peek={type}:{id}    e.g. peek=contact:11
```

`peek` is in `UNSAFE_QUERY_KEYS` so chrome will not treat it as a filter. P09 does not preserve it in `listQueryHref` yet — that is P10.

**P10 must:**

1. Keep `peek` in `UNSAFE_QUERY_KEYS`.
2. When a list host opts into URL sync, merge `peek` into href builders the same way `create` is a sibling (do not fold it into canonical filters).
3. `openRecord` on a list page: `history.pushState` / Inertia-safe query write that **only** adds/replaces `peek` and leaves `q`, `page`, `view`, `filter_id`, chrome filters intact.
4. Close: delete `peek`, restore the base list URL.
5. Refresh with `peek` present: host calls `openRecord(parsePeekToken)`.
6. Invalid peek: open error state (malformed / 404), do not drop list query.
7. Back/Forward: popstate reads `peek` and `replace`/`close` without a second history entry.
8. Do not call `searchParams.set` inside FilterBar / DataWorkspace (P03C lock). Host-level peek sync lives beside list-query, not inside it.

If this P10 path is skipped, URL integration is a blocker — do not invent a second key.

## OPEN / REPLACE / CLOSE

- Open from closed: fresh stack.
- Replace (association): same drawer instance, previous ref pushed.
- Close: stack cleared; focus returns to opener.
- Same ref while open: no duplicate history entry.

## FULL RECORD CONTINUITY

Every adapter sets `fullRecordHref` to the **existing** show route above. Header **Open full ↗** visits that href. No new full-record pages.

## CAPABILITIES

| Section | Contact | Company | Lead | Deal | Quote |
|---|---|---|---|---|---|
| Overview | yes | yes | yes | yes | yes |
| Activity | yes | yes | no | yes | no |
| Notes | yes (read-only) | yes (read-only) | no | yes (read-only) | no |
| Tasks | yes (read-only) | yes (read-only) | no | yes (read-only) | no |
| Associations | if any | if any | if any | if any | deal only |

Unsupported sections are omitted. Honesty over symmetry.

## OVERVIEW

5–8 high-value properties. Not a full attribute dump. Quiet em dash. Truncate with `title`.

## ACTIVITY

Reuses `CrmHub::timeline` facts (latest 8). Read-only compact list. Not a second engine. Not `RecordActivityPanel`.

## NOTES

Filtered `type=note` from the same timeline. **Read-only.** Mutations stay on the full record (`POST /crm/activities`). Documented in the drawer copy.

## TASKS

Filtered `type=task`. **Read-only.** Complete / create stay on the full record.

## ASSOCIATIONS

Real `RecordRef`s only. Click → `replace(ref)` in the same drawer.

- Contact ↔ company, deals
- Company ↔ contacts, deals
- Deal ↔ company, contact, lead (if FK), quotes
- Quote → deal
- Lead → contact, company, deal (`hasOne`) — not inferred contact deals

## ACTIONS

Conservative: Email (`mailto:`), Call (`tel:`), Open full. No Delete. No create-task / add-note (unsafe in peek). Complex / destructive stay on the full record.

## LOADING STATE

Drawer opens immediately. Compact skeleton approximates header + tabs + properties. No full-page spinner.

## ERROR STATES

| Case | UI |
|---|---|
| 404 | Close / Retry / Open full (if href known) |
| 403 | Close only (no Open full leak) |
| Network | Close / Retry / Open full |
| Malformed ref | Close |

No blank drawer.

## STALE REQUEST PROTECTION

Each open/replace/back/retry increments `requestId`. `isStaleHydration(active, incoming)` drops older responses. In-flight fetch is aborted. **A → B → C cannot render A over C.** Locked in `quick-record-drawer-contract.ts` + Pest source lock.

## CACHE STRATEGY

**No cache.** Correctness first. Session cache deferred; if added later it must key by `RecordRef` + workspace and die on 403/404.

## ACCESSIBILITY

Radix Dialog (Drawer/Sheet): dialog semantics, focus trap, Escape closes, Tab contained. Accessible name from record title. Icon buttons labelled (`Close`, `Open full record`). Overlay blocks the underlying page. `prefers-reduced-motion` disables the 200ms slide.

## FOCUS RESTORATION

`onCloseAutoFocus` focuses the stored opener (`options.opener` from the click that called `openRecord`). Initial focus is the Close button.

## RESPONSIVE CONTRACT

| Viewport | Width |
|---|---|
| < 640 | near-full `w-full` |
| 640–1023 | wider sheet `min(92vw, 520px)` |
| ≥ 1024 | 480px right drawer (inside 440–520) |

Same semantic shell. P25 owns final mobile. No page horizontal overflow — drawer is `fixed`.

## 1440 QA

Desktop right drawer 480px. Workspace remains visible. **NEEDS HUMAN / RESEARCH BOX** on Contabo.

## 1280 QA

Same 480px drawer. **NEEDS HUMAN / RESEARCH BOX.**

## 1024 QA

480px (`lg`). **NEEDS HUMAN / RESEARCH BOX.**

## 768 QA

Wider sheet `min(92vw, 520px)`. **NEEDS HUMAN / RESEARCH BOX.**

## MOTION

200ms, `cubic-bezier(.2,.8,.2,1)`, no bounce. `motion-reduce:transition-none`. P27 owns final polish.

## TEST HARNESS

`GET /crm/quick-record-drawer/harness` registered **only** when `app()->environment(['local', 'testing'])`. Not a production debug route. Does not change `rowHref`. Opens all five types via `openRecord({type,id})` using latest workspace ids.

## FIVE-RECORD QA

Pest hydrates one real Contact / Company / Lead / Deal / Quote and asserts identity, associations, capabilities, and existing show routes. Live visual pass on Contabo is **NEEDS HUMAN / RESEARCH BOX**.

## ASSOCIATION NAVIGATION QA

Controller proof: Contact → Company → Deal → Back (company) → Close. Drawer does not nest. Live walk **NEEDS HUMAN / RESEARCH BOX**.

## URL / HISTORY QA

P09 in-memory only. Reserved `peek` documented. P10 path specified above. Live URL walk **deferred to P10**.

## P04–P08 REGRESSION

List pages still must not contain `QuickRecordDrawer` or `onRowPeek`. `rowHref` still full show. `list-view-table` still `router.visit(href)`. `DataWorkspace` still voids `onRowPeek` with the P09 reservation comment (P10 will consume it). Deals board, Inbox, Cmd+K untouched.

## FILES CHANGED

- `app/Support/QuickRecordPeek.php` — read-only presenter
- `app/Http/Controllers/Crm/QuickRecordController.php`
- `app/Http/Controllers/Crm/QuickRecordHarnessController.php`
- `routes/web.php` — peek + env-gated harness
- `resources/js/ds/workspace/QuickRecordDrawer.tsx`
- `resources/js/ds/workspace/quick-record/*`
- `resources/js/ds/workspace/record-adapters/*`
- `resources/js/ds/workspace/quick-record-drawer-contract.ts`
- `resources/js/ds/workspace/index.ts`
- `resources/js/layouts/app-layout.tsx` — provider + host
- `resources/js/lib/list-query/keys.ts` — reserve `peek`
- `resources/js/lib/list-query/list-query-contract.ts`
- `resources/js/pages/crm/quick-record-drawer/harness.tsx`
- `tests/Feature/P09QuickRecordDrawerTest.php`
- `docs/implementation/p09-quick-record-drawer.md`

## TESTS

`P09QuickRecordDrawerTest` plus P01–P08 / `CrmListWorkspace` / `CrmBulkActions` / object show tests remain green. Contract file locks stale A→B→C and adapter semantics.

## LIVE VISUAL QA

**NEEDS HUMAN / RESEARCH BOX.** This agent cannot browser Contabo. Research should walk:

1. Local/testing harness: open each of the five types.
2. Contact → Company → Deal → Back → Close → focus restore.
3. Deal → Quote → Open full (quote show).
4. Rapid A→B→C (no stale flash).
5. 1440 / 1280 / 1024 / 768 — no page H-overflow.
6. Escape, Tab trap, labelled Close / Open full.

## P10 INTEGRATION CONTRACT

Callers must not know hydration, width, adapters, tabs, permissions, or loading.

```ts
import { useQuickRecord, RecordLink } from '@/ds/workspace'

const { openRecord } = useQuickRecord()
openRecord({ type: 'contact', id })

<RecordLink record={{ type: 'deal', id }} mode="drawer">Peek</RecordLink>
```

P10 may pass `onRowPeek={(row) => openRecord({ type: object, id: row.id })}` from a host. Do **not** teach list pages about peek URLs, adapters, or fetch. Enable URL sync per the URL section (`peek` only). Keep default row click as full record until product asks otherwise.

## REMAINING DEBT

- Notes/Tasks read-only
- No session cache
- `pin()` is a no-op
- Lead/Quote have no activity section (honest)
- Viewport / focus walks need a human on Contabo
- `onRowPeek` still reserved in DataWorkspace (intentional)

## DEFERRED TO P10+

Production list/board/inbox/command wiring. URL `peek` sync + listQueryHref preserve. Optional peek affordance vs row click. P11 board, P16 shortcuts, P25 mobile, P27 motion polish. Note/task mutations. Cache.

## RISKS

Hydration weight if peek later grows to full show. URL sync done wrongly could drop P03C keys — follow the reserved-key path. Focus restore fails if callers omit `opener`.

## MERGE READY

YES — foundation only; P10 not started.

---

## Contabo / research checklist

- [ ] Deploy this branch
- [ ] Confirm `/crm/quick-record-drawer/harness` is **absent** in production (`APP_ENV=production`)
- [ ] On a local/staging box, open harness and complete FIVE-RECORD + association + rapid A→B→C + Escape/focus
- [ ] Confirm `/crm/contacts` row click still opens show, not the drawer
- [ ] Confirm Pipeline, Inbox, Cmd+K unchanged
