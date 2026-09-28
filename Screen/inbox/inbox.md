# Desk Inbox

## 1. Screen Identity

Screen ID: `SCR-INBOX-001`
Product area: Inbox / Desk
Route: `GET /inbox`
Route name: `desk.inbox`
Legacy: `GET /desk` named `desk.index` → **redirect** to `desk.inbox` (`InboxController::index`). [CONFIRMED-CODE] `tests/Feature/DeskHandoffTest.php` asserts `GET /desk` → `/inbox`.
Writes on desk host: `POST /desk/threads/{thread}/reply` (`desk.reply`), `POST /desk/threads/{thread}/ticket` (`desk.ticket.open`), `POST /desk/connectors` (`desk.connectors.store`).
Frontend file: `resources/js/pages/desk/inbox.tsx`
Primary component: Inertia `desk/inbox` (`DeskInbox`)
Layout: `AppLayout` + `DeskShell` (`RoomShell` title Inbox). Breadcrumbs Inbox → `/inbox`.
Authentication: verified product middleware group.
Permissions: GET inbox is safe → no extra permission. POST `desk.*` requires `desk.manage`. `desk.ticket.open` is **blocked in simple mode** (`SimpleMode::blocks`). Tickets UI gated by `features.tickets` (false on seed).
Parent navigation: sidebar Inbox `/inbox` (`SIMPLE_NAV` and full nav). `activePaths`: `/desk`, `/conversations` so history highlights Inbox. Desk room tabs: Inbox, Conversations, Tickets (hidden simple mode), Channels.
Entry points: sidebar Inbox; command `nav-inbox`; DeskShell tabs; Conversations “Open inbox”; Home does not deep-link threads.
Exit points: `/conversations`; `/settings/channels` or `/settings/whatsapp*`; ticket show when tickets enabled; contact/deal via CRM context `openRecord`.
Runtime HTTP (owner, simple_mode=true): **200**, component `desk/inbox`, url `/inbox`. Prop keys: `embedUrl`, `embedState`, `embedReason`, `configuredUrl`, `threads`, `selected`, `crmContext`, `crmContextError`, `channels`, `officialConnectors`, `folder`, `q`, `contextOpen`, `folderCounts`. [CONFIRMED-BOTH] `Screen/_evidence/runtime-index.json`. Seed workspace `inbox_url` = `https://desk.evotechly.com` (`dashboard.json`).
Evidence: `InboxController`, `desk/inbox.tsx`, `inbox-chrome.tsx`, `inbox-workspace.ts`, `InboxCrmContextComposer`, `DeskEmbedProbe`, `tests/Feature/P13InboxWorkspaceTest.php`, `P14InboxCrmContextTest.php`, `DeskHandoffTest.php`, `DeskEmptyStateTest.php`.

## 2. Purpose

“My Inbox”: keep operators on the CRM hostname. Prefer framing EvoDesk (Chatwoot Community) at the workspace desk URL + embed path. If no URL or framing is refused (`X-Frame-Options: SAMEORIGIN`, etc.), render the **native** four-pane CRM desk over the same `Thread` records used by `/conversations`, plus CRM context for the selected thread.

## 3. Current UX Summary

Two mutually exclusive workspaces (`data-inbox="embed"` vs `data-inbox="native"`):

1. **Embed** when `embedUrl` is non-null and user has not clicked “Continue in CRM inbox”: header “Inbox / Desk framed on this host · {host}”, link Conversation history → `/conversations`, optional Channels, iframe `title="EvoDesk inbox"` `src={embedUrl}` allow clipboard/mic/camera.
2. **Native** otherwise: optional `InboxStatusBanner` (blocked/unreachable), then either workspace-empty “No conversations” + Connect WhatsApp Cloud, or `FrontDesk` AdaptiveWorkspaceShell: Folders | conversation list | thread + composer, and xl+ `InboxContactSidebar` for CRM context.

Seed crawl recorded prop keys only — **embedState/embedUrl values were not dumped**. Workspace has `inbox_url` https://desk.evotechly.com, so `configuredUrl` is that host + `config('evosales.inbox_embed_path')` (tests expect `https://desk.evotechly.com/` when probe ok). Whether this local crawl framed successfully is [UNVERIFIED].

## 4. Screen Anatomy

**Embed**

- Top bar: title, host subtitle, Conversation history, Channels (if any official connector not connected).
- `InboxEmbedSkeleton` while iframe loading.
- Failed frame overlay: “Desk could not be framed” + Continue in CRM inbox (sets `useNative`).

**Native empty**

- Status banner (not for `ok` / `no-url`).
- `InboxCaughtUpMark` + EmptyState “No conversations” / “You're all caught up. Connect official WhatsApp Cloud… No Baileys.”
- Primary CTA `ConnectWhatsAppCta` POST `/desk/connectors` provider `whatsapp_cloud`.
- `OfficialConnectPanel` (hidePrimaryCta).

**Native FrontDesk** (`data-inbox="panes"`)

- Left: `InboxFolderRail` (All, Unassigned, Assigned to me, All open, channel folders with counts, All closed).
- Center: `InboxListHeader` search + count; `InboxConversationRow` list (name, initials, when, preview, channel, unread).
- Right: conversation header (person, owner, channel, Hide context / Context, ticket link + Open ticket if `features.tickets`), `InboxMessageThread`, `InboxComposer` (Reply | Note).
- Context host: xl sidebar; overlay `w-[17.5rem]` below xl when `contextOverlay`.
- Adaptive shell tablet 2-col, desktop 3-col (`lg:grid-cols-[11.25–13.75rem | 17.5–21.25rem | 1fr]`).

## 5. Data Displayed

Controller (`InboxController::inbox`):

- `embedUrl`: only if probe `state === 'ok'`, else null (native).
- `embedState` / `embedReason` / `configuredUrl` (`workspace->inboxEmbedUrl()`).
- `threads`: max **50**, `orderByDesc last_message_at`, folder + `q` applied. Eager contact/company/owner, channel, ticket, latest message. **No deals on list** (`P14` missing `threads.0.deals`; `crmContext` null without `?thread=`).
- `selected` + `crmContext` only when `?thread=` hits a workspace thread. Composer failure → `crmContext` failed payload + `crmContextError: context_failed`.
- `channels`: WhatsApp, WhatsApp Business, Instagram, Facebook chips with settings hrefs + connected flags (Instagram/Facebook are **not** inbox folders — `instagram` query normalizes to `all`).
- `officialConnectors` from `ConnectorRegistrar::deskCatalog`.
- `folder`, `q`, `contextOpen` (`context=0` closes), `folderCounts` (all, unassigned, mine, open, closed, plus per-channel type sums).

CRM context (`InboxCrmContextComposer`, P14): contact, company, deals list, `primary_deal_id` **only** from ticket.deal_id (never latest/amount), attention from P12 on primary, last_activity, tasks, notes **without bodies**. Empty `restricted` when contact not viewable.

## 6. Primary Actions

- Select thread: Inertia GET `/inbox` with `thread`, `folder`, `q`, `context` (`visitInbox`, cancelAll, pending id).
- Reply / private note / send as resolved: POST `/desk/threads/{id}/reply` (`body` required max 4000; `as_note`; `resolve`).
- Connect WhatsApp Cloud (empty).
- Switch to native if iframe fails.

## 7. Secondary Actions

- Folder change; debounced search 250ms.
- Toggle CRM context (`context=0|1`).
- Open ticket POST (full mode only; simple mode blocked).
- Jump to `/conversations`, `/settings/channels`, WhatsApp settings via channel chips / OfficialConnectPanel.
- Retry context load.
- Open related CRM records from sidebar (`openRecord` in `inbox-crm-context.tsx`).

## 8. Search

Query `q`: trimmed, LIKE on thread `subject` OR contact first/last name (escaped `%_\\`). Debounced 250ms in the list header (“Filter by name or subject” in chrome). Does not search message bodies. [CONFIRMED-CODE] `applySearch` + P13 `q=Amel`.

## 9. Filters

`folder` (`normalizedFolder`):

`all` (default), `unassigned` (contact.owner_id null), `mine` (owner = current user), `open` (status not resolved/closed), `closed` (resolved|closed), channel types `whatsapp`, `whatsapp_cloud`, `email`, `telegram`, `sms`.

Unknown folders (e.g. `instagram`) → `all`. [CONFIRMED-CODE] P13.

`context=0` hides context host. `thread` selects.

## 10. Sorting

Threads: `last_message_at` desc. No user sort. Messages: composer/thread grouping via `groupInboxMessages` (Algiers day buckets) in chrome. [CONFIRMED-CODE] lib exists; [UNVERIFIED] visual grouping in crawl.

## 11. Selection

Single selected thread via URL `thread`. Pending selection shows “Opening conversation”. List highlight uses `requestedThreadId`. No multi-select.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Hard cap 50 threads — no pager. Context loaded only for selected id (not N+1 on list — P13/P14). Embed: iframe load/error client states. Native: conversation-pending pane until selected matches request. `isStaleInboxVisit` drops out-of-order GETs.

## 14. Forms

- `InboxComposer`: Reply (optional resolve) vs Note (`as_note=1`). Enter (no shift) submits. Validation error `errors.body`.
- Connect WhatsApp: POST `/desk/connectors`.
- Open ticket: POST `/desk/threads/{id}/ticket` — requires `contact_id` else 422; redirects `crm.tickets.show`. Hidden in simple mode.

Conversations history reuses the reply route with a simpler input (see SCR-INBOX-002).

## 15. Overlays

- CRM context overlay on < xl.
- Official connect panel on empty.
- Quick Record is **forbidden** on this page (P13/P14 must not import `QuickRecordDrawer`); context uses `openRecord` from the shared provider in AppLayout. [CONFIRMED-CODE]
- No command-palette-specific inbox overlay.

## 16. States

- Embed ok / loading / client failed / user-forced native.
- Probe `blocked` / unreachable / `no-url` → native + banner (banner skipped for no-url and ok).
- Workspace empty (folder all, no q, count 0).
- Folder/search empty list: “No open conversations here”.
- No selection: “Select a conversation”.
- Opening conversation (pending).
- Context pending / error / restricted empty / contact-only (no company/deal).
- Tickets feature off (seed): no Open ticket, no ticket number link.

## 17. Empty State

Illustrated EmptyState + Tray icon; copy forbids Baileys/QR. Tests lock “Connect WhatsApp Cloud”, “No Baileys”. Folder empty is a smaller text block, not the full empty.

## 18. Error Handling

- Embed probe prevents a dead iframe when desk sends SAMEORIGIN (`DeskHandoffTest`).
- iframe `onError` → failed overlay (may not fire for XFO — probe is the real guard).
- Context composer catch → failed present + `crmContextError`.
- Reply/ticket 404 wrong workspace; ticket 422 no contact.
- Message `failure_reason` shown in thread chrome. [CONFIRMED-CODE] types include failure_reason.

## 19. Feedback

Composer processing disables Send. No dedicated success toast ([UNVERIFIED]). Banner is status, not alert (blocked uses `role="status"`; iframe fail uses `role="alert"`). Unread badge on rows.

## 20. Navigation Behavior

- Always CRM host; never `Location` away to desk (`DeskHandoffTest`).
- `/desk` 302 `/inbox`.
- Inertia preserveState/Scroll on inbox visits.
- Conversation history is a sibling route, not `/crm/conversations` (that 404s — see SCR-INBOX-002).
- Simple-mode nav still includes Inbox.

## 21. Entity Relationships

- `Thread` + `Message` + `Channel` + `Contact` (+ company, owner) + optional `Ticket`.
- CRM context: deals, activities (tasks/notes), P12 attention on ticket-linked deal only.
- Official connectors / WhatsApp Cloud vs Evolution — empty state forbids Baileys.
- Same thread set as `/conversations`.

## 22. Business Rules

- Stay on CRM hostname.
- Embed only if desk allows this origin; else native.
- List payload must not include crmContext or deal hydration.
- Primary deal never invented from amount/recency.
- Activity bodies must not leak (P14).
- Folder instagram is not real.
- Simple mode: no ticket create; tickets feature false.
- Search is name/subject only.
- No `dangerouslySetInnerHTML` (P13).

## 23. Backend Dependencies

- `App\Http\Controllers\Desk\InboxController`
- `App\Services\Desk\DeskEmbedProbe`
- `App\Services\Desk\DeskComposer` (reply)
- `App\Services\Desk\InboxCrmContextComposer`
- `App\Services\Connectors\ConnectorRegistrar`
- `App\Models\Workspace::inboxEmbedUrl()` / `inboxUrl()`
- `App\Support\Integrations`
- `Ticket::openFromThread`
- Tests: P13, P14, DeskHandoff, DeskEmptyState, `EvoCrmWave3InboxChromeTest.php`

## 24. Frontend Dependencies

- `pages/desk/inbox.tsx`
- `components/crm/desk-shell.tsx`, `adaptive-workspace-shell.tsx`, `inbox-chrome.tsx`, `inbox-crm-context.tsx`
- `components/desk/desk-glass.tsx`, `official-connect-panel.tsx`
- `lib/inbox-workspace.ts`, `lib/inbox-crm-context.ts`
- `hooks/use-simple-mode.ts`

## 25. Responsive Behavior

[CONFIRMED-CODE] `overflow-x-hidden`; AdaptiveWorkspaceShell defaultPanel center; tablet 2-col (folders+list vs conversation); desktop 3-col; context `hidden xl:flex` with mobile overlay. [NOT VERIFIED] devices.

## 26. Accessibility Observations

CONFIRMED: iframe title; compose group aria-label; Reply/Note aria-pressed; textarea aria-label; banner role status; failed embed role alert; folder/list/conversation labels on adaptive shell.

LIKELY ISSUE: conversation rows are buttons (good) but embed iframe is a black box to AT; native list has no aria-activedescendant.

REQUIRES MANUAL TEST: keyboard through three panes; iframe focus trap; context overlay dismiss.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-INBOX-001 | HIGH | Two inboxes (EvoDesk iframe vs native) with different capabilities | Reply/context/folders vanish when embed “works”; operators may never see CRM context | `embedUrl && !useNative` early return |
| UX-INBOX-002 | MEDIUM | iframe `onError` does not catch X-Frame-Options; recovery depends on server probe | If probe false-oks, user sees a blank frame until they notice Continue | `DeskEmbedProbe` vs iframe onError |
| UX-INBOX-003 | MEDIUM | Thread list capped at 50, no pagination | Older conversations disappear from Inbox (history route still 80) | `InboxController` `limit(50)` |
| UX-INBOX-004 | LOW | Search ignores message body and phone/email | Hard to find a thread by snippet | `applySearch` |
| UX-INBOX-005 | MEDIUM | Open ticket hidden/403 in simple_mode | DeskShell still has Channels; tickets tab stripped — support loop blocked by design | `SimpleMode::blocks` `desk.ticket.open`; `features.tickets false` |
| UX-INBOX-006 | OBSERVATION | Channel chips include Instagram/Facebook but those are not folders | Settings detours, not inbox filters | P13 instagram → folder all |
| UX-INBOX-007 | LOW | Empty-state CTA English “Connect WhatsApp Cloud” while locale fr | Mixed language | `desk/inbox.tsx` |
| UX-INBOX-008 | OBSERVATION | Runtime dump did not capture embedUrl value | Audit cannot confirm whether seed owner saw iframe or native | `runtime-index.json` keys only |

## 28. Consistency Comparison

- Native chrome matches conversations (person mark, caught-up empty) but conversations lacks folders/search/context composer richness.
- CRM context attention uses the same P12 types as Home, presented in a sidebar not a Home list.
- Room tabs vs sidebar: both expose Inbox; Conversations is tab-only (sidebar treats it as Inbox active).

## 29. Functional Preservation Contract

- [ ] GET `/inbox` Inertia `desk/inbox` on CRM host (no eject).
- [ ] GET `/desk` redirect to `/inbox`.
- [ ] Embed when probe ok; native fallback when no-url/blocked; Continue in CRM inbox.
- [ ] Native folders, counts, name/subject search, 50-thread list, selected thread + composer reply/note/resolve.
- [ ] crmContext only for selected thread; no list hydration; no body leak; primary deal only from ticket.
- [ ] Official WhatsApp Cloud empty (no Baileys).
- [ ] Simple mode: no ticket open.
- [ ] Link to `/conversations` (not `/crm/conversations`).

## 30. Design Input Contract

Purpose: work conversations without leaving CRM.
Primary goal: pick a thread and reply (or frame Desk if allowed).
Primary actions: select thread, send reply/note, filter folder, search.
Secondary: context panel, connect channel, conversation history, tickets when enabled.
Required information: folder counts, contact identity, last message preview, unread, channel, messages, CRM contact/company/deals/attention when selected.
Required components: embed OR native panes, composer, empty connect, status banner, context sidebar.
Required states: embed, native empty, native list, pending select, context error/restricted, blocked desk.
Information priority: unread/open mine > thread > CRM context.
Business-critical: hostname stay, probe fallback, workspace scoping, no invented primary deal.
Must not remove: `/desk` redirect, history link, resolve send, note vs reply.

## 31. Open Questions / Unknowns

- [UNVERIFIED] Seed owner embedState (`ok` vs `blocked`) on localhost.
- [UNKNOWN] Default `evosales.inbox_embed_path` in this env (tests assume trailing slash URL).
- [UNVERIFIED] Whether framed EvoDesk SSO/session works for `owner@evosales.local`.
- [UNKNOWN] Product preference: always native + CRM context vs iframe-first.
