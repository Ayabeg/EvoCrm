# Conversation history

## 1. Screen Identity

Screen ID: `SCR-INBOX-002`
Product area: Inbox / Desk
Route: `GET /conversations`  — **not** `GET /crm/conversations`
Route name: `crm.conversations` (Laravel name still `crm.*` even though the path is unprefixed)
Frontend file: `resources/js/pages/crm/conversations.tsx`
Primary component: Inertia `crm/conversations` (`ConversationHistory`)
Layout: `AppLayout` + `DeskShell` (same Inbox room chrome as SCR-INBOX-001). Breadcrumbs Conversations → `/conversations`.
Authentication: verified product group.
Permissions: GET is safe (no extra permission). Reply form posts `desk.reply` → `desk.manage` on POST. Owner seed has capabilities including `crm.view`; desk.manage assumed for owner. [UNVERIFIED] view-only member POST.
Parent navigation: DeskShell tab “Conversations”. Sidebar Inbox stays active (`activePaths` includes `/conversations`). Not a SIMPLE_NAV leaf of its own.
Entry points: Desk tab; Inbox embed header “Conversation history”; Inbox empty-state does not link here (it connects WhatsApp). Command OS does not define a separate conversations href in the snippet reviewed (`nav-inbox` → `/inbox` only). [CONFIRMED-CODE] `command-os.ts`.
Exit points: `/inbox`; deal show `/crm/deals/{id}`; stay on `/conversations?thread=`.
Runtime HTTP (owner, simple_mode=true): **`GET /crm/conversations` → 404** in `Screen/_evidence/runtime-index.json`. **`GET /conversations` was not in that crawl list.** Tests prove 200 + component `crm/conversations`: `DeskHandoffTest`, `P13InboxWorkspaceTest`, `EvoCrmWave3InboxChromeTest`. Label: path 404 [CONFIRMED-BOTH]; correct path [CONFIRMED-CODE], [UNVERIFIED] in this crawl dump.
Evidence: `app/Http/Controllers/Crm/ConversationHistoryController.php`; `resources/js/pages/crm/conversations.tsx`; tests above; `DeskEmptyStateTest` empty copy lock.

## 2. Purpose

Read-only-leaning history of CRM `Thread`s (sold Desk traffic) with a split list/detail, contact sidebar, a minimal session reply, and open-deal links. Distinct from live Inbox: no EvoDesk iframe, no folders, no P14 crmContext composer, no note/resolve composer modes.

## 3. Current UX Summary

`data-crm="conversations-workspace"`. If `threads.length === 0`: caught-up mark + EmptyState “No conversation history” + Open inbox. Else: two columns from `lg` — history list (count, Open inbox) and conversation pane (messages + Send + “Open deal” + `InboxContactSidebar`). Selecting a row `router.get('/conversations', { thread })` preserveState.

## 4. Screen Anatomy

- DeskShell tabs: Inbox | Conversations | (Tickets full mode) | Channels.
- Empty: Tray icon, Open inbox button.
- List header: “History”, Open inbox, mono count.
- Rows: `InboxPersonMark`, contact name, unread Badge, company or “No company”, preview (last message body / subject / “No preview”).
- Detail header: name, company · phone · last message when.
- Message stack: direction · status · failure_reason, body.
- Form: body input “Log a session reply” + Send → POST `/desk/threads/{id}/reply`.
- Open deal block under composer.
- Right `InboxContactSidebar` with `contact` only (no `crmContext` prop).

## 5. Data Displayed

`ConversationHistoryController::index`:

- `threads`: workspace threads, limit **80**, `last_message_at` desc, with contact (name, phone, email, company, owner), channel, latest message. No ticket eager load (unlike Inbox).
- `selected`: when `?thread=` integer matches; extra with `contact.deals.stage`, all messages + user, channel. **No `crmContext`.**
- Missing `deskUrl` (handoff test).

Unlike Inbox, there is no folderCounts/embed/channels/officialConnectors.

## 6. Primary Actions

- Select a thread (`?thread=`).
- Open inbox.
- Send reply (same desk reply contract, no `as_note` / `resolve` fields in this form).

## 7. Secondary Actions

- Open deal links for `selected.contact.deals`.
- Contact sidebar actions inherited from `InboxContactSidebar` without context payload (identity/owner/company as the chrome supports). [UNVERIFIED] exact sidebar fields when `context` is undefined — component still rendered.

## 8. Search

NOT PRESENT. No `q`. List is the latest 80 threads only.

## 9. Filters

NOT PRESENT. No folder query. Thread query is selection, not a filter.

## 10. Sorting

`last_message_at` desc only.

## 11. Selection

Single thread via `thread` query. Highlight `selected?.id === thread.id`. No pending-id state machine (unlike Inbox `pendingThreadId`).

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Limit 80, no pager, no “has more”. Full Inertia GET on select. Messages: all loaded for selected (controller `messages.user`), not latest-1. [CONFIRMED-CODE]

## 14. Forms

One `Form` POST `/desk/threads/{id}/reply`, `name=body` required, `resetOnSuccess=['body']`. Placeholder “Log a session reply”. No note toggle, no Send as resolved. Unsafe method → `desk.manage`.

## 15. Overlays

NOT PRESENT as page-owned modals. `InboxContactSidebar` is a column, not a drawer overlay (no xl overlay pattern from Inbox). Shell command/tasks still available.

## 16. States

- Empty history (no threads).
- List without selection: EmptyState “Select a conversation” / “See contact and deal context from the sold Desk.”
- List + selected.
- Unread badge when `unread_count > 0`.
- No open deal copy.
- [UNVERIFIED] loading skeleton — none in code.

## 17. Empty State

Two empties: workspace-level (no threads) and pane-level (no selection). Copy locked in `DeskEmptyStateTest`.

## 18. Error Handling

No page-level embed banner (no desk frame). Reply errors via Inertia/form ([UNVERIFIED] displayed). Wrong-workspace thread id: `find` returns null → UI stays unselected. Message `failure_reason` shown in caps meta line.

## 19. Feedback

Send button `disabled={processing}`. No toast in this file. Unread badge.

## 20. Navigation Behavior

- Must use `/conversations`. `/crm/conversations` 404 (runtime). Route name `crm.conversations` is easy to mis-link. [CONFIRMED-BOTH]
- Inbox embed header correctly links `/conversations`.
- `router.get` preserveState on row click (not `<Link>`).
- Deal links are Inertia `<Link>` to deal show.

## 21. Entity Relationships

- Same `Thread`/`Message`/`Contact`/`Channel` as Inbox native list.
- `contact.deals.stage` for the selected thread only — **not** ticket-authoritative primary (P14 is Inbox-only).
- Reply mutates the same Message table as Inbox composer.
- Does not compose `InboxCrmContextComposer`.

## 22. Business Rules

- History stays in CRM; no desk URL prop.
- Workspace scoped queries.
- Limit 80 vs Inbox 50.
- Open deal section title says “Open deal” but maps **all** `contact.deals` returned by Eloquent (no `is_open` filter in controller). Closed/won deals can appear. [CONFIRMED-CODE]
- Simple mode: page allowed (not in SimpleMode::blocks). Tickets tab hidden in DeskShell; this page does not offer Open ticket.

## 23. Backend Dependencies

- `App\Http\Controllers\Crm\ConversationHistoryController`
- `App\Http\Controllers\Desk\InboxController::reply` (shared)
- `App\Models\Thread`
- Tests: `DeskHandoffTest`, `P13InboxWorkspaceTest` (GET `/conversations?thread=`), `EvoCrmWave3InboxChromeTest`, `DeskEmptyStateTest`

## 24. Frontend Dependencies

- `pages/crm/conversations.tsx`
- `components/crm/desk-shell.tsx`
- `inbox-chrome.tsx` (CaughtUpMark, ContactSidebar, PersonMark, formatInboxWhen, inboxContactName/initials)
- `ui/badge`, `ui/button`, `ui/empty-state`, `ui/input`

## 25. Responsive Behavior

[CONFIRMED-CODE] `lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]`. Below lg, grid is single column (list stacked above detail) via `grid` + `gap-px`. [NOT VERIFIED] whether both panes remain usable on a phone (detail may sit below a long list).

## 26. Accessibility Observations

CONFIRMED: `aria-label="Conversations"` / `Conversation` on sections; row buttons; empty as h2.

LIKELY ISSUE: no aria-current on selected row (bg only); composer input lacks an explicit `aria-label` (placeholder only); unread badge not announced as unread.

REQUIRES MANUAL TEST: keyboard list → detail; sidebar focus.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-CONV-001 | HIGH | Real route is `/conversations`; `/crm/conversations` 404 | Deep links and mental model of `/crm/*` fail | `runtime-index.json` 404; `routes/web.php` |
| UX-CONV-002 | MEDIUM | No search/folders vs Inbox native | History is a dump of 80 threads | controller vs InboxController |
| UX-CONV-003 | MEDIUM | Reply form is a weaker Inbox composer (no note, no resolve, no Enter-to-send) | Operators bounce to Inbox to work a thread | `conversations.tsx` vs `InboxComposer` |
| UX-CONV-004 | LOW | “Open deal” lists every deal on the contact, not open-only | Won/lost clutter; contradicts heading | `contact.deals` with stage, no is_open filter |
| UX-CONV-005 | MEDIUM | No P14 crmContext (attention, tasks, primary ticket deal) | History cannot operate the exception the Inbox sidebar shows | controller props vs P14 |
| UX-CONV-006 | LOW | Command palette has Inbox but not Conversations | Discoverability depends on Desk tabs | `command-os.ts` |
| UX-CONV-007 | OBSERVATION | This crawl did not GET `/conversations` | Runtime 200 inferred from tests | `runtime-index.json` |

## 28. Consistency Comparison

- Shares DeskShell, person marks, empty illustration with Inbox.
- Diverges: no embed, no folders, no crmContext, different limit, different composer, deals footer unique to this page.
- Home/Activities are CRM room; this is Desk room — correct for communication, but `/crm/conversations` 404 fights the Inertia page path `pages/crm/conversations.tsx`.

## 29. Functional Preservation Contract

- [ ] `GET /conversations` Inertia `crm/conversations` with `threads` + `selected`.
- [ ] `/crm/conversations` is not this screen (currently 404 — do not “fix” by silently duplicating without product decision, but do not link it).
- [ ] `/desk` still redirects to Inbox, not here.
- [ ] Empty + select-empty copy; Open inbox CTA.
- [ ] Thread select via `?thread=`; reply via existing `desk.reply`.
- [ ] No `deskUrl` eject.
- [ ] Workspace isolation; 80-cap.

## 30. Design Input Contract

Purpose: review past desk threads with light CRM deal/contact context.
Primary goal: find a thread and read the transcript.
Primary actions: select thread, open inbox, send a logged reply.
Secondary: open deals, view contact sidebar.
Required information: contact identity, company, preview, messages with direction/status, phone, deals.
Required components: list, transcript, reply field, empty states, desk tabs.
Required states: empty workspace, unselected, selected, unread.
Information priority: recency > transcript > deals.
Business-critical: CRM-host history, shared Thread model with Inbox.
Must not remove: Open inbox, thread query param, workspace scoping.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- [UNVERIFIED] Owner 200 payload for `/conversations` on this seed (thread count, selected null).
- [UNKNOWN] Should route name `crm.conversations` be renamed to match the public path?
- [UNKNOWN] Should history reuse Inbox native `FrontDesk` instead of a second pane implementation (P13 “without a third implementation” locks Inbox, not this page)?
- [UNVERIFIED] Sidebar behavior without crmContext.
- [UNKNOWN] Whether `contact.deals` should filter open — heading says open.
