# P15 — Activities & Sales Work Queue

**PR:** Normalize `/crm/activities` into the salesperson’s operational queue: what needs me now, overdue, today, next — complete quickly, open deeper context.  
**Baseline:** `main` @ `07e63670a4d7e10a8d159611ca61e2e091de0776` (P14 #223).  
**Date:** 2026-09-16.

P00–P14 merged and frozen. P15 consumes P12 attention + P14 activity-summary contracts. It is not a calendar, a PM system, a Task rewrite, an AI prioritizer, a new Activity engine, a Deal-attention rewrite, a dashboard, Command OS (P16), or DataWorkspace-for-symmetry.

Live Contabo deploy + populated QA is owned by Research after this PR opens.

---

## P15 STATUS

Audit complete on fresh main @ `07e6367`. SOURCE-OF-TRUTH MATRIX, Task-vs-Activity boundary, and timezone contract recorded **before** product code.

One `Activity` model remains the domain. Helpers only: `ActivityTiming` (P12-identical overdue clock + Today/Upcoming buckets) and `ActivityWorkQueueQuery` (permission-safe grouped query + presenter). No second Activity/Task-merged model.

**MERGE READY: NO** until Research Contabo populated QA is PASS.

## BASE / PR / TIP

- Base: `07e63670a4d7e10a8d159611ca61e2e091de0776`
- Branch: `cursor/p15-activities-work-queue`
- PR title: P15 — Activities & Sales Work Queue
- Tip: this branch after the P15 commits

---

## AUDIT

Inspected on fresh main @ `07e6367`:

| Area | Paths |
|---|---|
| Model | `app/Models/Activity.php` — `due_at`, `completed_at`, `done`, `owner_id` (assignee), `actor_id` (creator), `contact_id`, `deal_id`, `company_id`, `type`, `meta` |
| Recorder | `app/Services/Crm/ActivityRecorder.php` — create + last_activity touch; complete does **not** go through recorder |
| Web controller | `app/Http/Controllers/Crm/ActivityController.php` — index/store/complete/attendance |
| API | `app/Http/Controllers/Api/V1/ActivityController.php` — leftover `date=today/overdue` uses **startOfDay**, not P12. **Not changed** (API frozen; P15 is the web queue) |
| Policy | `ActivityPolicy` — view = workspace; update/delete = `crm.edit` |
| Middleware | `EnforceProductPermissions` — unsafe `crm.*` requires `crm.edit` (complete already gated) |
| Page | `resources/js/pages/crm/activities/index.tsx` — flat table, `limit(200)`, `CrmListHeader`, `window.location ?create=1` (no composer), `date=today` includes overdue |
| Composer | `resources/js/components/crm/activity-composer.tsx` — POST `/crm/activities`; due only on task/meeting |
| Record next | `resources/js/components/crm/record-activity.ts` — **browser `Date.now()`** overdue for record Next. **P09 frozen; not rewritten.** P15 queue must not copy this. |
| P12 | `DealAttentionEvaluator` — overdue = `done=false` + `due_at` + `due_at < now(Africa/Algiers)` (`lt`, not `lte`) |
| P14 | `InboxCrmContextComposer` — next = incomplete `due_at >= now`; last = `created_at`; no body |
| QRD | `RECORD_TYPES` = contact/company/lead/deal/quote. **Activity is not a RecordType.** Peek via `openRecord` |
| Task model | **None.** Grep `class Task` empty. Tasks are `activities.type = task` |
| Lead / conversation | No `lead_id` / `thread_id` / `conversation_id` on activities |
| Extra types | `config/evosales.php`: note, task, call, meeting, email, whatsapp, stage_change, sequence. Queue filter keeps the existing five chips |
| Saved views | Activities do not participate (`views={[]}`). No list-query adapter |
| DataWorkspace | No `activity` ListQueryObject. Forcing it would invent saved views + adapters |
| Reschedule | **No update/reschedule route.** Do not invent |
| Timezone | CRM clock = `Africa/Algiers`. `workspaces.timezone` unused. No user TZ |
| `recordCount` | Page expected it; controller did not pass it |

**Facts:**

| Topic | Finding |
|---|---|
| Assignee | `activities.owner_id`. Recorder defaults owner to actor. Contact owner / Deal owner / `actor_id` are **not** the queue assignee |
| Due | `due_at` datetime only. No `due_date`. Null due is unscheduled, not overdue |
| Complete | `done` + `completed_at` via `markDone()`. Existing POST `/crm/activities/{id}/complete` |
| Create | Existing POST `/crm/activities`. `?create=1` was a dead href |
| Overdue (P12) | `due_at < now(Africa/Algiers)` — includes earlier today |
| Overdue (old page) | `due_at < startOfDay` — **diverges**; P15 must not keep it |
| Today (old page) | `due_at <= endOfDay` — includes yesterday overdue; **wrong** |
| Week chip | UI offered `date=week`; controller `whereDate('due_at', 'week')` matches nothing. Dropped |
| Body | Must not serialize on the queue (P12/P14) |
| Amount | Must not appear or sort |

Search hits for Activity, due_at, completed_at, overdue, today, upcoming, assignee, owner, contact_id, company_id, deal_id, next_activity, task, call, meeting, email, note, markDone, reschedule confirmed the above. No reschedule. No Task model.

---

## SOURCE-OF-TRUTH MATRIX

| ITEM | SOURCE | EXACT SEMANTICS | AUTHORITATIVE? | PERMISSION | LOAD | SHIP / DEFER |
|---|---|---|---|---|---|---|
| Activity identity | `activities` | One row, one type | Yes | `Gate::view(Activity)` = workspace | Queue query | **SHIP** |
| Assignee / My work | `activities.owner_id` | Real assignment. Not `actor_id`, not Contact/Deal owner | Yes | Same | `where owner_id = me` | **SHIP** |
| Creator | `actor_id` | Who logged it | Yes | n/a | Not a queue filter | **DEFER** display |
| Due | `due_at` | Datetime; TZ Africa/Algiers | Yes | Same | Indexed | **SHIP** |
| Complete | `done` + `completed_at` | `markDone()` | Yes | `crm.edit` / `update` | Existing POST | **SHIP** |
| Overdue | P12 predicate | `!done AND due_at IS NOT NULL AND due_at < now(Africa/Algiers)` | Yes — same as List/Board/QRD/Inbox | Visible activities | `ActivityTiming::isOverdue` | **SHIP** |
| Today | remaining today | `!done AND due_at >= now AND due_at <= endOfDay(Africa/Algiers)` | Yes | Same | Timing bucket | **SHIP** |
| Upcoming | after today | `!done AND due_at > endOfDay(Africa/Algiers)` | Yes | Same | Timing bucket | **SHIP** |
| Unscheduled | null due, open | `!done AND due_at IS NULL` | Yes | Same | Quiet group if count > 0 | **SHIP** (meaningful: notes/calls) |
| Completed | `done = true` | Secondary; not overdue | Yes | Same | Separate group | **SHIP** |
| Type | `activities.type` | Filter chips: note/task/call/meeting/email. Other types still list | Yes | Same | `where type` | **SHIP** existing chips |
| Related Deal | `deal_id` | Title only if `Gate::view(Deal)` | Yes | Omit if denied — no title/amount/stage/attention | Eager `deal:id,title` | **SHIP** |
| Related Contact | `contact_id` | Name if viewable | Yes | Omit if denied | Eager name cols | **SHIP** |
| Related Company | `company_id` | Name if viewable | Yes | Omit if denied | Eager `name` | **SHIP** |
| Lead | — | No `lead_id` | No | — | — | **DEFER** |
| Conversation | — | No thread FK | No | — | — | **DEFER** |
| Task entity | — | No `Task` model | — | — | — | **OUT** — do not merge |
| Reschedule | — | No route | — | — | — | **DEFER** — existing flows only |
| Search | — | No real `q` | — | — | — | **DEFER** |
| Saved views | — | Do not participate | — | — | — | **OUT** |
| Deal amount / AI | — | Forbidden ranking | — | — | — | **OUT** |
| Body | `body` | Never on queue | Yes | Leak | Do not select | **SHIP** omit |
| P12 attention | `DealAttentionEvaluator` | Completing overdue clears `overdue_activity` | Yes | Visible deals | Unchanged class | **SHIP** reuse |
| P14 last/next | Composer | Last=`created_at`; next=`due_at >= now` | Yes | Same | Unchanged | **SHIP** agree |
| Peek | `openRecord` | Contact/company/deal only | Yes | Peek gates | Transient | **SHIP** |
| Activity drawer | — | Not a RecordType | — | — | — | **OUT** |

---

## TASK VS ACTIVITY

There is **no** `Task` model, table, policy, or route.

| Concept | Truth |
|---|---|
| Task | `activities.type = 'task'` |
| Note | `activities.type = 'note'` (CRM). Inbox `messages.type = note` is a thread note — not this queue |
| Call / meeting / email | Same `activities` table |
| Completion | One `markDone()` for every type |
| Ownership | One `owner_id` |

P15 does **not** silently merge a second task system. The queue lists Activities. Type=task is a row type, not a domain.

---

## TIMEZONE / OVERDUE / TODAY / UPCOMING

**Clock:** `DealAttentionEvaluator::TIMEZONE` = `Africa/Algiers` = `ActivityTiming::now()`. Not browser-local. `workspaces.timezone` exists and is unused (same as P12).

**Storage:** `due_at` / `completed_at` are datetimes. No date-only column.

**Serialization:** ISO-8601 in Africa/Algiers. Display formats with `timeZone: 'Africa/Algiers'` (same as Inbox).

**Buckets (frozen time 2026-09-16 12:00 Africa/Algiers):**

| Bucket | Rule | Example |
|---|---|---|
| Overdue | `due_at < now` and open | Yesterday; today 09:00 |
| Today | `now <= due_at <= endOfDay` | Exactly 12:00; today 15:00 |
| Upcoming | `due_at > endOfDay` | Tomorrow |
| Unscheduled | open, `due_at` null | Note without due |
| Completed | `done` | Completed yesterday or completed-was-overdue |

Exactly-now is **not** overdue (`lt`, P12). Earlier today **is** overdue (P12), not Today.

React **must not** recompute overdue with `Date.now()`.

---

## ONE ACTIVITY ENGINE

No `WorkQueueActivity` / `SalesTaskActivity` / `AttentionActivity` / `InboxActivity` / `ActivityV2`.

Helpers around the existing model:

- `App\Services\Crm\ActivityTiming` — clock + bucket predicates (P12 overdue reused)
- `App\Services\Crm\ActivityWorkQueueQuery` — query, counts, permission-safe present

`DealAttentionEvaluator` is **not** rewritten. P15 calls the same clock and the same overdue inequality.

---

## WORK QUEUE UI

Specialized continuous queue on the existing Activities route. Groups: **Overdue / Today / Upcoming**; **Unscheduled** only when count > 0; **Completed** secondary.

Default **My work** = `owner_id = auth`. **All** = workspace-visible activities (optional `owner_id` member filter).

Order inside a group: `due_at ASC, id ASC` (completed: `completed_at DESC, id DESC`). **No** amount, **no** AI score.

Row ~52–64px: complete, title, type, due state/time, related CRM (Deal → Contact → Company), assignee. Meetings keep existing attendance POSTs.

Related records: `RecordLink` + `openRecord`. No `ActivityRecordDrawer`.

Complete: existing POST; pending set prevents double-click; error rolls back pending + localized failure; Inertia `back()` is authoritative.

Create: existing composer + POST when `create=1`. No reschedule UI (no backend).

---

## DATAWORKSPACE DECISION

**Do not use DataWorkspace.** Activities have no `listView`, no saved-view participation, no `ListQueryObject`. Forcing P03 would invent ActivityWorkspaceV2 / fake views.

Specialized queue surface. `CrmShell` kept (CRM room tabs; P02 frozen). Not a card stack.

---

## QUERY / URL

Restorable params (existing GET style, not a new P03C object):

| Param | Values | Default |
|---|---|---|
| `scope` | `mine` \| `all` | `mine` |
| `group` | `overdue` \| `today` \| `upcoming` \| `unscheduled` \| `completed` | omitted = all open groups |
| `type` | note/task/call/meeting/email | all |
| `owner_id` | member id | only with `scope=all` |
| `page` | ≥1 | 1 (single-group pagination) |
| `create` | `1` | composer closed |

Legacy `date=overdue|today` maps to `group`. `date=week` dropped.

`router.cancelAll` + visit generation: Overdue → Today → Upcoming rapid → payload `filters.group` must match the requested group or the list is pending. Back/Forward via URL.

---

## P12 AUTHORITATIVE / COMPLETION

List / Board / QRD / Inbox / P15 Overdue use the same predicate.

Complete overdue Activity → leaves P15 Overdue **and** `DealAttentionEvaluator` no longer emits `overdue_activity` for that deal (open deal with no other dated open activity becomes `no_next_action` — same as P12 resolution test).

No React overdue. No dismiss-attention control.

---

## P14 PARITY

P14 next = incomplete `due_at >= now` (overdue is attention, not next). Completing a today/upcoming item removes it from P14 next. Completing overdue removes P12 attention; P14 last remains `created_at` (complete does not rewrite `created_at`). Composer class unchanged.

---

## PERMISSIONS

- Index: workspace `Activity` rows + `Gate::view` each.
- Associations: `Gate::view` Contact/Company/Deal before serialize. Denied Deal → no title/amount/stage/attention.
- Create / complete: `crm.edit` (middleware + `authorize('update')` on complete). View-only member can see My work / All, cannot complete.
- Payload never includes `body`.

---

## PERFORMANCE

- No `all()`. Grouped view: `GROUP_LIMIT` (40) per group. Single group: `PAGE_SIZE` (40) pagination.
- Counts: separate `COUNT(*)` on the filtered base — **authoritative totals**, not page-scoped. UI says “3 overdue” from `counts`, not `items.length`.
- One eager load: owner, contact, deal, company. No per-row Activity/Deal query.
- Selected columns omit `body`.

---

## DESIGN

Locked tokens: `canvas`, `ink`, `mute`, `hairline`, `brand`, `text-destructive`. Overdue = destructive **text plus** the word Overdue (not color-only). One continuous surface. Empty states name the filter (My work vs All vs group). Focus moves to the next complete control after success.

---

## RESPONSIVE / H-OVERFLOW

Page `overflow-x-hidden`. Row fields truncate; no min-width table. 1440 / 1280 keep full row. 1024 stacks due + related. 768: type/assignee can wrap under title; complete stays reachable.

## 1440 QA

Queue + groups; no page H-overflow. **Agent layout contract PASS. Contabo NEEDS RESEARCH.**

## 1280 QA

Same. **Agent layout contract PASS. Contabo NEEDS RESEARCH.**

## 1024 QA

Truncation, no horizontal page scroll. **Agent layout contract PASS. Contabo NEEDS RESEARCH.**

## 768 QA

Complete + title remain; no four-column crush. **Agent layout contract PASS. Contabo NEEDS RESEARCH.**

## PAGE H-OVERFLOW

`overflow-x-hidden` on the workspace column. Group list owns vertical scroll.

---

## TESTS / FIXTURES

Frozen clock: `2026-09-16 12:00 Africa/Algiers` (same as P12/P14).

| Id | Fixture |
|---|---|
| A | Overdue task, mine, Deal — P12 `overdue_activity` |
| B | Today call, mine, Contact |
| C | Upcoming meeting, mine |
| D | Completed yesterday, mine |
| E | Unscheduled note, mine |
| F | Overdue assigned to other member |
| G | Deal + Contact + Company on one row |
| H | `deal_id` points at another workspace’s deal — no title/amount leak |
| I | Long subject (truncate, no overflow) |
| J | Exactly now — Today, not overdue |
| K | Earlier today 09:00 — Overdue |
| L | Later today 15:00 — Today |
| M | Was overdue, then completed — leaves Overdue + clears P12 |

Locks: timing buckets, My work vs All, query composition, complete authorize, N+1, no body, no amount sort, P12 complete parity, P14 next/last agree, visit stale group, no second model, no ActivityRecordDrawer, no DataWorkspace, no `Date.now()` on the queue page.

---

## LIVE CONTABO QA

**NEEDS RESEARCH.** This agent cannot browser Contabo. Research owns deploy + populated walk after the PR opens.

Need populated: overdue / today / upcoming / completed / types / assignees / relations / P12-linked deal / long subject / restricted deal / view-only member.

Checklist:

- My work vs All
- Groups + authoritative counts
- Rapid Overdue → Today → Upcoming
- Complete overdue → P15 + P12 attention gone
- Peek related via QRD; no Activity drawer
- Create via composer
- 1440 / 1280 / 1024 / 768; no H-overflow
- Keyboard complete

---

## P14 / P13 / P12 / P11 / P09 REGRESSION

| Surface | Expectation |
|---|---|
| P14 | Composer + Inbox host unchanged |
| P13 | Four panes / folders / composer unchanged |
| P12 | `DealAttentionEvaluator` class not rewritten |
| P11 | Board / forecast / move frozen |
| P09/P10 | No `QuickRecordDrawer` import on Activities; `openRecord` only |

---

## FILES CHANGED

| File | Change |
|---|---|
| `docs/implementation/p15-activities-work-queue.md` | Audit + matrix + AFTER |
| `app/Services/Crm/ActivityTiming.php` | Shared buckets |
| `app/Services/Crm/ActivityWorkQueueQuery.php` | Query + present |
| `app/Http/Controllers/Crm/ActivityController.php` | Queue index; authorize complete |
| `resources/js/lib/activity-work-queue.ts` | URL + stale visit |
| `resources/js/components/crm/activity-work-queue.tsx` | Queue surface |
| `resources/js/pages/crm/activities/index.tsx` | Host |
| `tests/Feature/P15ActivitiesWorkQueueTest.php` | Fixtures A–M, P12/P14, N+1 |
| `tests/js/p15-activities-work-queue.ts` | URL + stale group |
| `tests/Feature/ActivitiesIndexTest.php` | Scope=all for unassigned note |

**Not changed:** Activity model schema, store/attendance routes, P12 evaluator class, P14 composer, QRD types, API v1 date filters, record-activity.ts, DataWorkspace adapters.

---

## REMAINING DEBT

- Reschedule (no backend)
- Text search
- Saved views
- Lead / conversation associations (no columns)
- API v1 `date=today/overdue` still uses startOfDay
- Record-page `Date.now()` next (P09)
- Contabo populated QA

## P16 HANDOFF

Do not start P16. Command OS is out of scope. Activities stay a queue, not a command destination rewrite.

## P24 HANDOFF

No AI ranking, summaries, or deal scores on the queue.

---

## RISKS

- Default `scope=mine` changes the old dump (unassigned notes hide until All)
- Completing the last dated activity on an open deal surfaces P12 `no_next_action` — correct, not a bug
- Contabo is a merge blocker owned by Research

## MERGE READY

NO — Contabo populated QA pending Research. Do not merge. Do not start P16.
