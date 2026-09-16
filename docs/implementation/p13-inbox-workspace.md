# P13 — Inbox Workspace Normalization

**PR:** Normalize the existing native FrontDesk + optional EvoDesk embed into a dense four-pane communication workspace.  
**Baseline:** `main` @ `bdda504b52bbff8bddfddb1c212e07a176f84e10` (P12 #221).  
**Date:** 2026-09-16.

P00–P12 merged and frozen. P13 does not replace the messaging engine, create a third Inbox, or start P14 CRM context.

Native FrontDesk is now four logical panes (nav / list / conversation / context host). EvoDesk embed and CSP fallback are unchanged.

Live Contabo deploy + populated QA is owned by Research after this PR opens.

---

## P13 STATUS

Audit complete on fresh main. BEFORE MATRIX recorded before product-code changes. Implementation normalizes workspace chrome only: four logical panes, density, scroll, composer, URL/state, truthful folders/search. Messaging models, send mutations, EvoDesk embed, and CSP fallback stay.

**MERGE READY: NO** until Research Contabo populated QA is PASS.

## AFTER — Contabo live QA fail on `c459e927`

Research Contabo QA failed on tip `c459e927`. Fixes landed on the same PR #222 (no new PR, P14 not started):

1. **Rapid selection (Sev2)** — Thread pane renders header/messages/composer only when `selected.id` matches the requested/URL thread. `router.cancelAll` + visit generation drop stale Inertia `preserveState` payloads. Pending pane (`data-inbox="conversation-pending"`) while they differ. Composer/thread still remount by id.
2. **WhatsApp folder mismatch (Sev2)** — `folder=whatsapp` scopes only `ChannelType::WhatsApp`. `folder=whatsapp_cloud` scopes only `WhatsAppCloud`. Counts and lists use the same predicate.
3. **Email folder missing (Sev3)** — Native rail adds honest `email` / `sms` / `telegram` chips from `folderCounts`. Instagram/Facebook stay on the `channels` payload and never become folders.
4. **1280 crush (optional)** — Context host width `17.5rem` (280px, spec floor) to give the conversation pane more room. No H-overflow change.

Contabo redeploy / re-QA remains Research-owned.

## BASE / PR / TIP

- Base: `bdda504b52bbff8bddfddb1c212e07a176f84e10`
- Branch: `cursor/p13-inbox-workspace`
- PR: https://github.com/Mohamedbeghanem/EvoCrm/pull/222
- Tip: this branch after the Contabo fail fixes

---

## AUDIT

Inspected on fresh main @ `bdda504`:

| Area | Paths |
|---|---|
| Inbox page | `resources/js/pages/desk/inbox.tsx` |
| Native chrome | `resources/js/components/crm/inbox-chrome.tsx` |
| Workspace shell | `resources/js/components/crm/adaptive-workspace-shell.tsx` |
| Desk room | `resources/js/components/crm/desk-shell.tsx`, `desk-glass.tsx`, `desk-thread-card.tsx` |
| Embed / CSP | `app/Services/Desk/DeskEmbedProbe.php`, `app/Http/Middleware/EmbedSecurityHeaders.php`, `docs/desk-iframe-headers.md` |
| Controller | `app/Http/Controllers/Desk/InboxController.php` |
| History | `resources/js/pages/crm/conversations.tsx`, `ConversationHistoryController` |
| Models | `Thread`, `Message`, `Channel`, `ChannelType` |
| Send | `DeskComposer`, `POST /desk/threads/{thread}/reply` |
| Ticket | `POST /desk/threads/{thread}/ticket` |
| Connectors | `OfficialConnectPanel`, `POST /desk/connectors` |
| Tests | Wave3, InboxCspHeaders, DeskHandoff, DeskEmptyState, DeskComposer, DeskSmsSend, EvoTickets P4, ProductPolish, P09/P10/P11 inbox source locks |
| Frozen adjacent | P02 AppShell, P09/P10 QRD, P11 board, P12 attention, DataWorkspace, command palette, Home |

**Facts:**

| Topic | Finding |
|---|---|
| Two modes | EvoDesk iframe when `embedUrl && !useNative`. Else native `FrontDesk`. |
| Embed gate | `workspace.inboxEmbedUrl()` + `DeskEmbedProbe`. Probe `ok` → iframe; `blocked` / `unreachable` / `no-url` → native + compact banner. |
| Native IA | `AdaptiveWorkspaceShell` **3** panes (Folders / Inbox / Conversation). `InboxContactSidebar` (15.5rem) is **nested inside** the conversation column. |
| Folders | Client-only: All, Unassigned, Assigned to me, All open, every `channels[]` chip, All closed. Counts = loaded page (`limit 50`). |
| Fake channel folders | Controller always sends Instagram + Facebook chips. `ChannelType` is only `whatsapp`, `whatsapp_cloud`, `email`, `telegram`, `sms`. Those two folders are always 0. |
| Assignment | No thread assignee. “Mine / Unassigned” use `contact.owner`. |
| Unread | `threads.unread_count` displayed. No mark-as-read on open. |
| Search | None. |
| URL | `?thread=` only. Folder is `useState`. Lost on refresh. |
| Preview | List eager-loads `messages()->latest()->limit(1)`. |
| Thread | Selected loads all `messages.user`, ordered by `created_at` ASC. No timestamps, grouping, separators, or scroll-to-bottom. |
| Channel chrome | Selected header hardcodes `Official WhatsApp`. |
| Composer | Reply mode submit is **Send as resolved** only (`resolve=1`). Note mode: Add note (`as_note`). No Enter-to-send, no attachment field, no inline send error. |
| Attachments | Not in reply validation. Do not invent. |
| HTML | `{message.body}` text node. No `dangerouslySetInnerHTML`. |
| Permissions | `Thread::forWorkspace`. Reply/ticket `abort_unless` workspace match. |
| `/conversations` | Separate history workspace. Same reply route. Do not redesign in P13. |
| P12 / QRD | Inbox must not grow attention badges or `QuickRecordDrawer`. |

Search hits for FrontDesk, EvoDesk, conversation, inbox, thread, message, channel, folder, assignment, unread, composer, WhatsApp, CSP confirmed the above. No third Inbox implementation exists.

---

## BEFORE MATRIX

| SURFACE | CURRENT COMPONENT | DATA SOURCE | ROUTE | CAPABILITIES | PROBLEMS | P13 ACTION | P14 DEFERRED |
|---|---|---|---|---|---|---|---|
| Inbox shell | `DeskInbox` + `DeskShell` + `RoomShell` | Inertia `desk/inbox` | `GET /inbox` | Dual mode; lives inside P02 app shell | Native is 3-pane + nested sidebar, not four logical panes | Keep DeskShell / RoomShell. Four logical panes inside inbox workspace only | Deeper CRM context system |
| Folder / channel nav | `InboxFolderRail` | Client reduce of `threads` + `channels` | none (local state) | All / owner / open / closed / channel chips | Instagram/Facebook folders cannot match `ChannelType`; counts are page-sized; not URL-backed | Real folders only; server counts; `folder` in URL | Custom folders, team inboxes |
| Conversation list | Inline buttons in `FrontDesk` center | `Thread` limit 50, `orderByDesc(last_message_at)` | `GET /inbox?thread=` | Preview, unread badge, select | No search; no density contract; folder lost on refresh; list not independently framed as pane 2 | Header + filter `q`; denser rows; URL state | Infinite scroll / full-text messages |
| Selected conversation | `FrontDesk` right column | `Thread` by id + messages | `GET /inbox?thread=` | Identity, ticket, thread, composer, nested sidebar | Sidebar crushes thread at 1024; header lies about channel | Conversation is dominant pane; truthful channel | Shared identity slot |
| Message thread | Inline map | `selected.messages` | same | Notes vs inbound/outbound bubbles | No timestamps, grouping, day separators, delivery fail, scroll pin | Group + timestamps + scroll contract; show real `status` / `failure_reason` | Read receipts, typing |
| Composer | Inertia `Form` → `desk.reply` | `body`, `as_note`, `resolve` | `POST /desk/threads/{thread}/reply` | Reply, note, resolve | No ordinary Send; no keyboard send; no loading/error chrome | Send + Send as resolved; Enter; processing; remount per thread | Rich composer, templates |
| CRM context pane | `InboxContactSidebar` | `contact` + company + owner | links to contact/company show | Email, phone, owner, company, Open contact | Nested, not a host pane; no collapse | Extract as 4th-pane **host**; collapse; same facts | Deals, activity, peek, edit |
| EvoDesk embed | `DeskEmbedWorkspace` iframe | `embedUrl` when probe `ok` | `GET /inbox` | Framed desk; Continue in CRM inbox on frame error | Client `onError` only; probe already handles CSP | Preserve. Do not make embed the IA | SSO / desk deep-link |
| Native fallback | `FrontDesk` when no usable embed | same threads as history | `GET /inbox` | First-class when URL missing or probe fails | Treated as leftover visually | Keep first-class; compact banner not a wall of warning | — |
| Mobile / tablet | `AdaptiveWorkspaceShell` tabs | same | same | `<md` one pane; `md–lg` list+conversation | Context not reachable as a pane; 4-col would crush 768 | Keep 3-tab switcher. Context via header toggle. No 4th tab | Mobile inbox redesign |

---

## INBOX MODE CONTRACT

```
Inbox  GET /inbox
  │
  ├── embedUrl set (probe state === ok) AND operator has not chosen native
  │      └── existing EvoDesk iframe (`data-inbox="embed"`)
  │
  └── otherwise
         └── native EvoCRM Inbox (`data-inbox="native"`)
```

Decision stays in `DeskInbox`. `useNative` is the existing operator escape. Do not remove either mode. Do not add InboxV2 / NewInbox / InboxBeta / IntercomInbox.

## EVODESK CONTRACT

- Iframe `title="EvoDesk inbox"` when probe is `ok`.
- Header stays on the CRM host. Links: Conversation history, Channels.
- Frame load failure: overlay + **Continue in CRM inbox** (`useNative`).
- CSP: Laravel `frame-ancestors` + `frame-src`. Desk server headers are out of this repo (`docs/desk-iframe-headers.md`).
- Wave3 / InboxCspHeaders / DeskHandoff remain the regression locks.

## NATIVE FALLBACK

Probe `blocked` / `unreachable` / `no-url` sets `embedUrl` null and serves `FrontDesk`. `InboxStatusBanner` is a compact status line, not a developer wall. Empty inbox still uses `EmptyState` + official WhatsApp connect. Native is a sold surface.

## DESKTOP ARCHITECTURE

Four **logical** panes, not four equal columns.

| Pane | Role | Weight | Target width |
|---|---|---|---|
| 1 Inbox nav | folders + truthful counts | lowest | ~180–220px |
| 2 Conversation list | search / rows | second | ~280–340px |
| 3 Active conversation | identity + thread + composer | **primary** | flex |
| 4 CRM context | host for existing facts | third | ~280–340px; collapsed &lt; xl |

`AdaptiveWorkspaceShell` stays the 3-panel switcher (record pages frozen). Pane 4 is a sibling host on `xl+`, not a RecordShell change, not a DataWorkspace clone.

Breakpoints (Tailwind, no JS viewport math):

| Width | Visible |
|---|---|
| 1440 / 1280 (`xl`) | 4 panes when context open |
| 1024 (`lg`) | nav + list + conversation; context collapsed |
| 768 (`md`) | list + conversation; folders via existing switcher |
| &lt;768 | one pane via existing 3 tabs |

Page H-overflow: `overflow-x-hidden` on the inbox workspace.

## INBOX NAV

Real folders only:

- All
- Unassigned (`contact.owner` missing) — honest: this is contact owner, not a thread assignee
- Assigned to me
- All open (`status` not `resolved` / `closed`)
- Channel folders for **actual** `ChannelType` values present or sendable (`whatsapp`, `whatsapp_cloud` from the channels payload; plus `email` / `sms` / `telegram` when `folderCounts` has them)
- All closed

Instagram / Facebook remain on the `channels` Inertia payload (Wave3 `has('channels', 4)`) but are **not** inbox folders (`isInboxChannelFolder` filter stays).

`folder=whatsapp` lists only WhatsApp. `folder=whatsapp_cloud` lists only WhatsApp Business. Counts use the same type predicate as the list.

Counts come from workspace aggregates of the same predicates, not invented SLAs.

## CONVERSATION LIST

Header: title + loaded count + search input.  
`q` is name/subject (and preview body when present) — **not** advertised as global message search.  
Rows stay on the loaded/filtered page (`limit 50`).

## CONVERSATION ROW

Identity mark, name, Algiers timestamp, channel name, preview, unread badge. Selected = `bg-canvas-soft`. Unread name is medium weight. No P12 attention. No fake presence.

## UNREAD SEMANTICS

Display `unread_count` only. No new mark-as-read mutation. Opening a thread does not invent a read receipt.

## SEARCH / FILTERS

| Control | Backing | Honesty |
|---|---|---|
| `q` | Server `InboxController` + client echo | Contact name + subject. Not full-text history |
| `folder` | Server list scope + URL | Same predicates as nav |
| Bulk / snooze / priority | none | Do not add |

## ACTIVE CONVERSATION

Header: contact identity, **real** channel name, owner, ticket link / Open ticket (simple-mode gated, unchanged). Context toggle. No QRD.

## MESSAGE THREAD

Bubbles: inbound left, outbound right, notes labeled private. Width ~78%. Group consecutive same direction + type + Algiers day. Day separators. Timestamps on the last bubble of a group. Failed outbound shows `failure_reason`. Body is text (`whitespace-pre-wrap`), never HTML.

## MESSAGE GROUPING

Same calendar day (`Africa/Algiers`) + same `direction` + same `type` (note vs message). New group otherwise.

## TIMESTAMPS

`formatInboxWhen` / `Africa/Algiers`. Not browser-local. List rows and bubbles share the helper.

## SCROLL CONTRACT

Thread column is the only vertical scroller for messages. Composer and header stay pinned. On `selected.id` change and message-count change, pin to the newest (bottom). Rapid selection must not leave the previous thread’s scroll position on the new thread.

## COMPOSER

Reply / Note tabs kept. Height capped. `key={selected.id}` remounts the form (stale-thread safety).

Reply: **Send** (no resolve) + **Send as resolved** (`resolve=1`).  
Note: **Add note**.  
Enter sends; Shift+Enter newline. Processing disables submit.

## SEND CONTRACT

Unchanged: `POST /desk/threads/{thread}/reply` → `DeskComposer::reply` or note insert. Workspace abort 404. Max 4000. No new providers.

## SEND ERROR

Composer shows Inertia errors. Existing failed messages show `failure_reason` in-thread. Do not fake delivery ticks.

## ATTACHMENTS

Not supported on this route. No paperclip UI.

## EMPTY STATES

Keep Wave3 copy: No conversations / You’re all caught up / No open conversations here / Select a conversation. Folder-empty ≠ product-empty.

## LOADING STATES

Embed: `InboxEmbedSkeleton`. Thread visit: Inertia `preserveState` plus a requested-thread guard. Row highlight follows the requested/URL id immediately. If `selected.id !== requestedThreadId`, the conversation pane shows `conversation-pending` — never the previous thread’s header, messages, or composer. No fake skeleton that looks like another conversation.

## CRM CONTEXT HOST

`InboxContactSidebar` becomes pane 4: same facts (email, phone, owner, company, Open contact). `data-inbox="context-host"`. Collapse control. No deal list, no activity stream, no peek, no edit. **Host only.**

## P14 BOUNDARY

P14 may fill this host with record-context facts + optional Quick Record peek. P13 must not:

- import `QuickRecordDrawer`
- add deal/activity rails
- invent thread assignment
- replace Open contact

## URL / STATE CONTRACT

`GET /inbox?thread=&folder=&q=&context=`

| Param | Meaning |
|---|---|
| `thread` | selected thread id (existing) |
| `folder` | `all` / `unassigned` / `mine` / `open` / `closed` / real channel type |
| `q` | search string |
| `context` | `1` show host at `xl+`; `0` collapsed |

Unknown folder → `all`. Refresh restores URL. Embed mode ignores folder/q (desk owns its IA).

## BACK / FORWARD

Inertia `router.get` with `preserveState` + query params. Back/forward restore thread/folder/q/context.

## STALE REQUEST SAFETY

Each list selection increments a visit generation, sets `pendingThreadId`, and calls `router.cancelAll` before the next `router.get`. `onFinish` is a no-op when `isStaleInboxVisit`. The conversation pane must not render a thread whose id does not match `resolveInboxRequestedThreadId({ pending, url, selected })`. Back/forward clear a pending id that no longer matches the URL. Composer `key={threadId}` remounts only for the matching thread.

## PERMISSIONS

Unchanged workspace scoping. Cross-workspace thread id → not found / null selected. Reply/ticket remain `abort_unless`.

## MESSAGE SAFETY

React text rendering only. No HTML inbox bodies. No XSS via preview.

## PERFORMANCE / N+1

List keeps the existing `with([...])` eager load. Folder counts are set-based aggregates (no per-thread queries). Selected thread remains one find + messages. Do not query activities per row.

## 1440 QA

Four panes; conversation dominant; no page H-overflow. **Agent viewport PASS. Contabo NEEDS RESEARCH.**

## 1280 QA

Four panes if context open; context host `17.5rem` to ease conversation crush. **Agent viewport PASS on prior tip. Contabo FAILED on `c459e927`; re-QA NEEDS RESEARCH.**

## 1024 QA

Three panes; context collapsed; conversation readable. **Agent viewport PASS. Contabo NEEDS RESEARCH.**

## 768 QA

Switcher + list/conversation; no four-column crush; no page H-overflow. **Agent viewport PASS. Contabo NEEDS RESEARCH.**

## PAGE H-OVERFLOW

Workspace `overflow-x-hidden`. Independent pane scroll only.

## LIVE CONVERSATION QA

**NEEDS RESEARCH / Contabo.** Agent cannot deploy `app.evocrmapp.com`.

## LIVE SEND QA

**NEEDS RESEARCH / Contabo.** Pest covers store/fail paths. Populated WhatsApp send is Research.

## LIVE RAPID-SELECTION QA

**NEEDS RESEARCH / Contabo.** Contract tests cover visit generation, `cancelAll`, requested-id guard, and composer remount. Prior tip FAILED rapid-selection stale content.

## EVODESK REGRESSION

Embed path, probe, CSP, Continue in CRM inbox, Wave3 / InboxCspHeaders / DeskHandoff must stay green.

## /CRM/CONVERSATIONS REGRESSION

`/conversations` is history, not Inbox v2. P13 does not restyle it. Wave3 history lock stays.

## P12 REGRESSION

No attention evaluator, no Needs attention, no overdue badges in Inbox.

## P11 REGRESSION

No `DealPipelineBoard` in Inbox. `/leads` → board unchanged.

## P09/P10 REGRESSION

No `QuickRecordDrawer` in Inbox. Peek/`openRecord` stay off this surface. Command palette unchanged.

## FILES CHANGED

| File | Change |
|---|---|
| `docs/implementation/p13-inbox-workspace.md` | Audit + AFTER contract |
| `app/Http/Controllers/Desk/InboxController.php` | URL `folder` / `q` / `context`; set-based folder counts; list scope. Reply/ticket unchanged |
| `resources/js/lib/inbox-workspace.ts` | Folder/search/URL/grouping helpers |
| `resources/js/components/crm/inbox-chrome.tsx` | List header/row, thread grouping + scroll, composer Send, context host |
| `resources/js/pages/desk/inbox.tsx` | Native 4-pane host; URL visits; no Official WhatsApp lie |
| `tests/Feature/P13InboxWorkspaceTest.php` | Source, folder/search, send, N+1 locks |
| `tests/js/p13-inbox-workspace.ts` | Folder/search/stale/grouping proofs |

**Not changed:** Thread/Message/Channel models, `DeskComposer`, embed probe, CSP middleware, `/conversations` page, AdaptiveWorkspaceShell defaults, QRD, P12 attention, DataWorkspace.

## TESTS

- `tests/Feature/P13InboxWorkspaceTest.php`
- `tests/js/p13-inbox-workspace.ts` (tsx proofs)
- Wave3, InboxCspHeaders, DeskHandoff, DeskEmptyState, DeskComposer, ProductPolish, P09–P12 inbox source locks

Required commands: `php artisan test`, `npm run types:check` (after wayfinder), eslint touched files, `npm run build`.

## LIVE VISUAL QA

**NEEDS RESEARCH.** Local/agent layout checks are not Contabo populated walks.

## REMAINING DEBT

- Mark-as-read on open (no current mutation)
- Thread-level assignee (model has none)
- Global message search
- Pagination past 50
- Attachments
- Instagram/Facebook as real channel types (not P13)
- `/conversations` 4-pane (out of scope)
- Contabo populated QA

## P14 HANDOFF

Stable host: `data-inbox="context-host"` + Open contact + current facts. Fill with record-context / peek. Do not replace the host. Do not start P14 in this PR.

## RISKS

- Wave3 source locks require AdaptiveWorkspaceShell + specific copy in `inbox.tsx`
- Record `AdaptiveWorkspaceShell` must stay 3-pane
- Embed customers must keep the iframe path
- Folder counts must not claim more than the query proves
- Contabo is a merge blocker owned by Research

## MERGE READY

NO — Contabo populated QA pending Research.
