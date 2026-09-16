# P14 — Inbox CRM Context

**PR:** Fill the P13 Inbox fourth-pane host with one permission-safe `InboxCrmContext`.  
**Baseline:** `main` @ `339831cfcc01afe753e78cc1256714830c8fff64` (P13 #222).  
**Date:** 2026-09-16.

P00–P13 merged and frozen. P14 is a contextual CRM **bridge**. It is not a Contact/Deal record page, a second QuickRecordDrawer, a CRM dashboard, an Activities redesign (P15), or Ask Evo (P24).

Live Contabo deploy + populated QA is owned by Research after this PR opens.

---

## P14 STATUS

Audit complete on fresh main @ `339831c`. One `InboxCrmContextComposer` hydrates the selected conversation on the same Inertia visit. P13 host (`data-inbox="context-host"`) stays. P12 `DealAttentionEvaluator::evaluate` is reused in memory. No fake primary Deal. No QRD fork. No peek waterfall.

**MERGE READY: NO** until Research Contabo populated QA is PASS.

## BASE / PR / TIP

- Base: `339831cfcc01afe753e78cc1256714830c8fff64`
- Branch: `cursor/p14-inbox-crm-context`
- PR title: P14 — Inbox CRM Context
- Tip: this branch after the P14 commits

---

## AUDIT

Inspected on fresh main @ `339831c`:

| Area | Paths |
|---|---|
| Inbox workspace | `resources/js/pages/desk/inbox.tsx`, `inbox-chrome.tsx`, `inbox-workspace.ts` |
| Context host | `InboxContactSidebar` (`data-inbox="context-host"`) — email/phone/owner/company + Open contact |
| Controller | `app/Http/Controllers/Desk/InboxController.php` |
| Models | `Thread` (`contact_id` only), `Contact`, `Company`, `Deal`, `Activity`, `Ticket` (`thread_id`, `deal_id`), `Message` |
| P12 | `DealAttentionEvaluator` — overdue + no_next_action; `presentMany` / `evaluate` |
| P09/P10 | `QuickRecordPeek`, `useQuickRecord().openRecord`, `RecordLink`, `formatMoneyCents` → `formatDzd` (DA) |
| Policies | workspace `view` / `crm.edit` update; `AuthorizesWorkspaceCrmRecord` |
| Tasks | No `Task` model. Tasks are `Activity` `type=task` |
| Notes | No `Note` model. CRM notes are `Activity` `type=note`. Inbox `Message` `type=note` is a thread note, not a CRM note |
| History | `/conversations` still uses `InboxContactSidebar` fallback facts — not redesigned |
| Frozen | P13 panes/list/thread/composer/EvoDesk; QRD shell; P11 board; P12 evaluator |

**Facts:**

| Topic | Finding |
|---|---|
| Conversation→Contact | `threads.contact_id` only. Nullable. No email/phone/name inference. |
| Contact→Company | `contacts.company_id` only. Quiet absence if null. |
| Contact→Deals | `deals.contact_id` hasMany. No thread.deal_id. |
| Conversation→Deal | Only `tickets.deal_id` when `tickets.thread_id` is this thread. `Ticket::openFromThread` does **not** set deal_id. |
| Primary Deal | No CRM primary_deal column. First/latest/highest is forbidden. |
| Last activity | Real `activities.created_at`. `deals.last_activity_at` / `contacts.last_activity_at` / `updated_at` are **not** last activity (P12 already documented last_activity_at is dirty). |
| Next activity | Incomplete `activities.due_at` or truthful `deals.next_activity_at`. Free-text `next_step` is not a next action. |
| Overdue | P12 evaluator only. |
| Messages vs notes | `InboxController::reply` `as_note` inserts `messages.type=note`. It does **not** write `activities`. Do not double-log. |
| Create/Link contact | No thread↔contact link/create endpoint. Ticket requires a contact. **Defer** create/link. |
| Peek | `GET /crm/records/{type}/{id}/peek` + `openRecord`. Inbox must not embed `QuickRecordDrawer` (P13 source lock). |
| Owners | Contact owner ≠ conversation assignee (Inbox has no thread assignee; “Assigned to me” is contact owner). Deal owner ≠ Inbox assignee. |
| Permissions | `view` = same workspace. Conversation `Thread::forWorkspace` does not bypass CRM `Gate::view`. |
| Load | P13 selected visit already loads contact/company/owner/ticket/messages. List must stay free of per-row CRM composition. |
| Rapid selection | P13 visit generation + `selectedMatchesRequest` + `conversation-pending`. Context must use the same visit — no second async tree. |

Search hits for contact_id, company_id, deal_id, conversation_id, activity, task, note, association, peek, openRecord, attention, next_activity, last_activity, owner, context, sidebar confirmed the above.

---

## SOURCE-OF-TRUTH MATRIX

| CONTEXT ITEM | SOURCE | RELATION | AUTHORITATIVE? | PERMISSION BOUNDARY | LOAD STRATEGY | P14 SHIP/DEFER |
|---|---|---|---|---|---|---|
| Contact identity | `contacts` via `threads.contact_id` | Conversation→Contact | Yes | `Gate::view(Contact)` | Already on selected thread; re-check gate | **SHIP** |
| Email / phone | `contacts.email`, `phone_e164` | Contact fields | Yes | Same; omit if restricted | Same row | **SHIP** copy via existing `useClipboard` |
| Contact owner | `contacts.owner_id` → users | Contact owner | Yes | Same | Eager `owner:id,name` | **SHIP** labeled **Contact owner** |
| Company | `contacts.company_id` | Contact→Company | Yes | `Gate::view(Company)` | Eager `company`; omit if none/denied | **SHIP** quiet absence; no auto-create |
| Conversation↔Deal | `tickets.deal_id` where `thread_id` | Ticket | Yes, only when set | `Gate::view(Deal)` | Selected ticket already loaded; find in visible deals | **SHIP** as `primary_deal_id` only if visible |
| Contact deals | `deals.contact_id` | Contact→Deal | Yes | `Gate::view` each deal; `forWorkspace` | One `where contact_id` + eager stage/owner/company; cap 12 | **SHIP** compact list; no fake primary |
| Company deals not on contact | `deals.company_id` | Company→Deal | Not for this conversation | n/a | Do not load | **DEFER** — not conversation-authoritative |
| Deal stage / amount / owner | `stages`, `amount_cents`/`currency`, `owner_id` | Deal | Yes | Deal view | Eager on the deals query | **SHIP** P11 money/stage truth |
| P12 attention | `DealAttentionEvaluator::evaluate` | Deal + scheduled activities | Yes | Visible deals + visible scheduled activities only | One scheduled Activity query; evaluate in memory | **SHIP** reuse; no React recompute |
| Last activity | `activities.created_at` | Contact or visible deal ids | Yes | `Gate::view(Activity)`; no `body` | One recent Activity query, limit 40 | **SHIP** subject/type/at only |
| Next activity | Incomplete `due_at >= now` or deal `next_activity_at` | Same | Yes | Same | Same scheduled query | **SHIP** overdue is attention, not next |
| Tasks | `activities.type=task` | contact_id or visible deal_id | Yes | Same | Slice of scheduled + recent, max 4 | **SHIP** compact |
| Notes | `activities.type=note` | Same | Yes | Same; no body | Slice of recent, max 4 | **SHIP** compact |
| Thread notes | `messages.type=note` | Conversation | Not a CRM note | n/a | Already in thread pane | **DEFER** — do not show as Notes |
| Create/Link contact | none | — | No API | — | — | **DEFER** truthful empty only |
| Local deal inspect | React state | UI only | Not a domain relation | n/a | Client; reset on thread change | **SHIP** not in URL |
| Peek | existing `openRecord` | RecordRef | Yes | Peek endpoint gates | Transient; no waterfall | **SHIP** Open + Peek |
| Stale / stage aging | none truthful | — | No | — | — | **DEFER** (P12) |
| AI / summaries | — | — | — | — | — | **OUT** P24 |

---

## RELATIONSHIP CONTRACT

```
Thread.contact_id ──► Contact          (only conversation→CRM identity)
Contact.company_id ──► Company         (optional)
Contact.deals()   ──► Deal[]           (relevant deals)
Ticket.thread_id
  + Ticket.deal_id ──► primary Deal    (only when both set and Deal is visible)

FORBIDDEN: match on name / email / phone / message body / first() / latest() / highest amount.
```

Context selection (local inspect) ≠ domain relationship.

## CONTEXT CONTRACT

One payload `crmContext` on the Inbox Inertia visit (sibling of `selected`, not a thread-list field):

```
thread_id
empty: null | no_contact | restricted | error
contact?  company?  primary_deal_id?  deals[]
last_activity?  next_activity?
tasks[]  notes[]
attention?          // primary deal only; null if no authoritative primary
capabilities
```

Deal row: id, title, stage, amount_cents, currency, owner, associations, is_open/is_won/is_lost, next_activity, attention, href.

No `InboxContactContext` / `InboxCompanyContext` / `InboxDealContext` / `ConversationDealSidebar` / `Customer360V2`.

## CONTEXT LOADING

Same P13 `router.get('/inbox', { thread })` visit. Composer runs only for the selected thread. List visits send `crmContext: null`.

No `conversation → contact peek → company peek → deal peek → activity` waterfall.

## CONTACT / COMPANY / DEALS

See matrix. Copy email/phone uses `useClipboard`. Peek uses `openRecord`. Full record uses real hrefs from `fullRecordHref`.

## MULTIPLE-DEAL SEMANTICS

`primary_deal_id` is set **only** from visible `ticket.deal_id`. Otherwise `null` and the pane lists relevant deals (open first, closed after). Inspecting a deal is local React state keyed by `thread_id` and is discarded on A→B→C.

## CLOSED-DEAL SEMANTICS

Won/Lost stay in the list, quieter, labeled historically (Won/Lost), never “active”. Open deals sort first.

## MONEY / STAGE TRUTH

Stages remain New / Qualified / Demo / Proposal / Won / Lost. Amounts are `amount_cents` + `currency` (DZD) rendered with `formatMoneyCents` → `formatDzd` (**DA** display). P11 frozen.

## P12 ATTENTION REUSE

Composer calls `DealAttentionEvaluator::evaluate($deal, $scheduledForThatDeal)` in memory after one scheduled query. React renders `attention.primary` / `attention.signals` only. No overdue/no_next_action math in the client. No health score, no Resolve/Dismiss/Mark healthy. Actions: View Activity (`/crm/activities`), Open Deal, Create Activity (`/crm/activities?create=1`).

## LAST / NEXT ACTIVITY

Last = newest visible Activity by `created_at`. Next = earliest incomplete `due_at >= now` (deal-scoped when a focused deal exists), else truthful `next_activity_at`. Never `updated_at`.

## TASKS / NOTES

Tasks and notes ship as compact summaries when associations are real. Note **body** is never serialized. Inbox messages are not notes.

## NO-CRM-CONTACT / CREATE-LINK

`empty: no_contact` → “No CRM contact linked.” Create/Link deferred — no backend support, no email-match linking.

## QUICK RECORD / FULL RECORD / URL

`openRecord` for Peek only. QRD stays the P09/P10 drawer. Full pages remain authoritative. Local inspect is **not** a URL param (not a durable association). Existing `thread` / `folder` / `q` / `context` unchanged.

## RAPID-SELECTION / LOADING / ERROR

Render context only when `context.thread_id === requestedThreadId === selected.id`. Pending keeps fourth-pane geometry + localized skeleton (never previous person). Composer exceptions leave `selected` intact and show Retry (`crmContextError`).

## PERMISSIONS / SERIALIZATION

Filter with `forWorkspace` + `Gate::view` before serialize. Attention scheduled set is viewable activities only — no restricted subject/reason leak. No activity `body`. Conversation access ≠ CRM access.

## PERFORMANCE / PAYLOAD

Selected thread only. Queries: 1 deals (`contact_id` + optional ticket deal), 1 recent activities (`whereIn` deal ids), 1 scheduled activities (`whereIn`). No per-deal Activity query. Caps: 12 deals, 40 recent, 4 tasks, 4 notes, 8-ish activity fields, no bodies.

## RESPONSIVE / H-OVERFLOW

P13 adaptive remains authoritative. Host width `17.5rem`. Page `overflow-x-hidden`. 1024/768: collapse/overlay. No four-column squeeze.

## 1440 QA

Four panes; conversation dominant; context host `17.5rem`; no page H-overflow. **Agent layout contract PASS (P13 + host fill). Contabo NEEDS RESEARCH.**

## 1280 QA

Four panes if context open; host stays `17.5rem`. **Agent layout contract PASS. Contabo NEEDS RESEARCH.**

## 1024 QA

Three panes; context collapsed / overlay; conversation readable. **Agent layout contract PASS. Contabo NEEDS RESEARCH.**

## 768 QA

Switcher + list/conversation; context overlay/sheet; no four-column crush. **Agent layout contract PASS. Contabo NEEDS RESEARCH.**

## PAGE H-OVERFLOW

Workspace `overflow-x-hidden` unchanged. Independent pane scroll only. Fourth pane owns vertical context scroll.

## LIVE CONTEXT QA

**NEEDS RESEARCH / Contabo.** Populated Contact+Company+Deal+Activity walk after Research deploy.

## LIVE MULTI-DEAL QA

**NEEDS RESEARCH / Contabo.** Need a contact with several open deals and one ticket-linked deal.

## LIVE ATTENTION PARITY QA

**NEEDS RESEARCH / Contabo.** Same deal must show the same P12 primary on List / Board / Inbox context.

## LIVE RESOLUTION QA

**NEEDS RESEARCH / Contabo.** Complete overdue activity / schedule next action → Inbox attention disappears after refresh. No dismiss control.

## LIVE RAPID-SELECTION QA

**NEEDS RESEARCH / Contabo.** Contract tests cover delayed A under C. Prior P13 Contabo fail on stale thread must not regress.

## LIVE PARTIAL-DATA QA

**NEEDS RESEARCH / Contabo.** Contact-only, no-viewable-contact, Won/Lost-only, restricted deal.

## P13 REGRESSION

Native four-pane host, folders, composer, visit generation, embed path unchanged. `InboxContactSidebar` remains the host. `/conversations` keeps the P13 fallback facts. Wave3 + P13 tests green (939/939).

## P12 REGRESSION

`DealAttentionEvaluator` unchanged. Inbox does not recompute overdue / no_next_action. P12 tests green.

## P11 REGRESSION

No board in Inbox. Stages and DZD/DA money path unchanged. P11 tests green.

## P09/P10 REGRESSION

No `QuickRecordDrawer` import in Inbox. Peek via `openRecord` only. Peek URL decision B frozen. P09/P10 tests green.

## EVODESK REGRESSION

Embed iframe, probe, CSP, Continue in CRM inbox unchanged.

## FILES CHANGED

| File | Change |
|---|---|
| `docs/implementation/p14-inbox-crm-context.md` | Audit + SOURCE-OF-TRUTH MATRIX + AFTER contract |
| `app/Services/Desk/InboxCrmContextComposer.php` | One permission-safe composition |
| `app/Http/Controllers/Desk/InboxController.php` | `crmContext` / `crmContextError` on selected visit |
| `resources/js/lib/inbox-crm-context.ts` | Payload types + stale / primary / inspect helpers |
| `resources/js/components/crm/inbox-crm-context.tsx` | Context surface |
| `resources/js/components/crm/inbox-chrome.tsx` | Host fills with context; fallback for `/conversations` |
| `resources/js/pages/desk/inbox.tsx` | Same-visit context + pending geometry |
| `tests/Feature/P14InboxCrmContextTest.php` | Fixtures, permissions, N+1, source locks |
| `tests/js/p14-inbox-crm-context.ts` | Rapid A→B→C + no fake primary |

**Not changed:** Thread/Message/Channel models, `DeskComposer`, QRD shell, P12 evaluator class, AdaptiveWorkspaceShell defaults, `/conversations` layout.

## TESTS

- `tests/Feature/P14InboxCrmContextTest.php` (10)
- `tests/js/p14-inbox-crm-context.ts`
- P13 / P12 / P11 / P09 / P10 / Wave3 inbox locks

Commands:

| Command | Result |
|---|---|
| `php artisan test` | **939 passed** (11393 assertions) |
| `php artisan wayfinder:generate --with-form && npm run types:check` | **pass** |
| eslint on P14-touched JS | **pass** |
| `npm run build` | **pass** |
| GitHub CI | pending on PR |

## LIVE VISUAL QA

**NEEDS RESEARCH.** Agent did not walk Contabo populated inbox.

## REMAINING DEBT

- Create/Link contact for threads with no viewable contact (no API today)
- Thread.contact_id is NOT NULL in schema — null-contact is defensive; restricted contact is the live empty
- Company deals that are not on this contact
- Activities queue redesign (P15)
- Contabo populated QA

## P15 HANDOFF

Do not start P15 here. Activities remain compact last/next + `/crm/activities` links. P15 owns the work queue.

## P24 HANDOFF

No Ask Evo, summaries, or deal scores in Inbox.

## RISKS

- Wave3 still requires `InboxContactSidebar` + `No owner` in chrome (fallback kept)
- Inbox.tsx must not contain `QuickRecordDrawer` / `DealAttentionEvaluator`
- Ticket.deal_id is uncommon (`openFromThread` does not set it) — most conversations will show a deal list, not a primary
- Contabo is a merge blocker owned by Research

## MERGE READY

NO — Contabo populated QA pending Research. Do not merge. Do not start P15.
