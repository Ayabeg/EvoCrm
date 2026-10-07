# W02 INBOX COMPOSITION AUDIT

**Wave:** 2 · **Agent B** · **AUDIT ONLY — no product-code change**  
**Base:** `rebuild/p01-certification` `72877f7c` (approved P0.1 frame: EvoShell/EvoRail 224/56, WorkspaceFrame, quiet conversation `WorkspaceHeader`)  
**Date:** 7 October 2026 · **Host:** localhost `:8000` only  
**Seed:** `DatabaseSeeder` + `VisualQaSeeder` · login `owner@evosales.local` / `password`  
**Workspace:** Evotechly · `simple_mode=false` · `inbox_url=null` (native Desk, no iframe / CSP banner)  
**Seeded threads:** 8 · selected thread `id=1` (Amine Benali, WhatsApp Business)  
**UX authority:** Blueprint V1 §19 / D14 / RESP-01–05  
**Contract authority:** this repository. Conflicts are recorded. Nothing invented.

**Captures:** `artifacts/product-rebuild/02-wave/before/inbox/` (54 PNGs + `column-metrics.json`)  
**Replay:** `node scripts/product-rebuild/capture-inbox-audit.mjs`  
**Measure:** visible-pane remesure in `column-metrics.json` (first-pass `metrics.json` hit hidden AdaptiveWorkspaceShell copies and reported 0×0 list/thread).

Font concatenation in screenshots (`AmineBenali`, `Boitede réception`) is the same capture artifact as Gate A. Treat as render, not product copy.

---

## 0. Verdict

The live Inbox at `/inbox` is still a **five-region desk**, not the Blueprint conversation: **rail 224 + folders 187 + list 300 + thread 341 + context 280** at 1440×1000 with context open. The thread — the hero — is **341 px** (Blueprint ≥ 680, floor 560). Queues are a permanent extra column. Channels are folders, not filters. Context defaults open. At 1280 the thread collapses to **181 px**. At 768 the page shows list **and** thread. At 390 there is no Back — only three pane tabs.

The empty-state lie from Gate A is still live: **« Vous êtes à jour. »** in the unselected thread pane while eight conversations are listed.

P0.1 chrome (224/56 rail, quiet header, frame scroll) is in place and must stay. This wave owns **composition inside** that frame.

---

## 1. Live implementation map

The page that ships is `resources/js/pages/desk/inbox.tsx` (`DeskInbox` → `FrontDesk`). It is **not** `InboxWorkspace.tsx`. That primitive is unused on `/inbox` (callers: `outbound/replies.tsx`, Design Lab `InboxPage.tsx`).

Route: `GET /inbox` → `InboxController::inbox` (`routes/web.php:186`). `/desk` redirects here.

### 1.1 Queues / folders

| Fact | Where |
|---|---|
| Folder keys | `all`, `unassigned`, `mine`, `open`, `closed` + channel keys `whatsapp`, `whatsapp_cloud`, `email`, `telegram`, `sms` — `InboxController::normalizedFolder` `229:236:app/Http/Controllers/Desk/InboxController.php` |
| Counts | `folderCounts()` `200:225` — assignment = `contact.owner_id`; open/closed = thread `status`; channels = `Channel::withCount('threads')` |
| Presentation | `buildInboxFolders` `89:128:resources/js/lib/inbox-workspace.ts` then `InboxFolderRail` → `QueueNavigation` `59:70:resources/js/evo/inbox/QueueNavigation.tsx` |
| Live column | AdaptiveWorkspaceShell **left** pane, `data-inbox-pane="nav"`. Grid track `minmax(11.25rem,13.75rem)` = 180–220 px (`desk/inbox.tsx:663`) |
| Measured @1440 | **187 × 357** at x=240 (16 px pad after the rail) |
| Nav children | **None.** `product-nav.ts:66` Inbox is a leaf (`/inbox`, also `/desk`, `/conversations`) |
| Rail hook | `data-inbox-rail="hook"` only (`evo-shell.tsx:284`). No auto-56, no flyout (SHELL-12 unimplemented) |

Blueprint queues (À moi / Non assignés / Équipe commerciale / Support / Tous): only `mine` / `unassigned` / `all` exist. **Do not ship Équipe / Support** ([GAP-02](../00-baseline/BLUEPRINT-IMPLEMENTATION-MATRIX.md#gap-02)).

### 1.2 Conversation list

`ConversationList` `16:137:resources/js/evo/inbox/ConversationList.tsx` in the **center** pane. Adapter: `deskThreadToConversation`. Virtualized (`@tanstack/react-virtual`, row 72). Search via `InboxListHeader` → `q` debounce 250 ms (`desk/inbox.tsx:454:459`). `showFilters={false}` (`499`) so `ChannelFilter` and the assignment segmented control are **not mounted** on `/inbox`.

Measured @1440: **300 × 926** (track `minmax(17.5rem,21.25rem)` = 280–340).

### 1.3 Channel filtering

Channels are **folders**, not chips. `applyFolder` `264:266:InboxController.php` filters `channel.type`. `ChannelFilter.tsx` exists (`data-inbox="channel-filter"`) but is dead on this page.

Controller `channels` prop (`111:138`) is a **connector chip list** (WhatsApp / WhatsApp Business / Instagram / Facebook) used for empty-state / settings hrefs — not the folder rail. Instagram / Facebook are **not** accepted `folder` values (P13: `?folder=instagram` normalizes to `all`).

**C-05:** stop presenting channel keys as queues; keep `?folder=whatsapp|…` as a ChannelFilter. Do not delete accepted keys.

### 1.4 Assignment

**C-04:** `Thread` has no assignee. `mine` / `unassigned` filter `contact.owner_id`. Thread header shows `selected.contact?.owner?.name ?? Unassigned` (`desk/inbox.tsx:533:536`). No assign control on the conversation. Do not add `threads.assignee_id`.

### 1.5 Selected conversation / thread / composer

| Piece | File | Notes |
|---|---|---|
| Select | `selectThread` `444:449:desk/inbox.tsx` | `pendingThreadId` + Inertia `GET /inbox?thread=` |
| Pending | `data-inbox="conversation-pending"` `633:644` | « Opening conversation » |
| Unselected | `646:655` | « Select a conversation » + **« You're all caught up. »** — **the lie** |
| Header | `DeskGlass` `512:597` | Avatar, name, owner · channel, Hide context / Context, Open ticket (orange) |
| Thread | `InboxMessageThread` → `MessageThread.tsx:129:135` | `data-inbox="thread"`, own `overflow-y-auto`, virtualized, scroll-to-end |
| Composer | `InboxComposer` `328:345:Composer.tsx` | POST `/desk/threads/{id}/reply`. Tabs **Reply / Note**. Hidden `as_note=1` in note mode. Buttons Send / Send as resolved / Add note |
| Note UI | Recaptured `internal-note__1440x1000__fr__light.png` | Pressed **Note**, placeholder « Note privée », CTA « Ajouter une note ». No outbound send |

Composer is **anchored** under the thread (not inside the thread scroller). At 1440 open: composer 341 × 248 at y=736.

**Do not POST a reply or resolve during QA.** `DeskComposer::reply` (`app/Services/Desk/DeskComposer.php:20`) queues Evolution / SMS to the live channel.

### 1.6 Context panel

`InboxContactSidebar` `57:185:resources/js/components/crm/inbox-chrome.tsx` — `data-inbox-pane="context"`, `lg:w-[17.5rem]` = **280 px** (not Blueprint 360). Default **open** (`context` query omitted ⇒ `'1'`, `InboxController.php:49`). `context=0` hides it. Docked `hidden xl:flex` (`desk/inbox.tsx:678`) so it appears at **≥1280**. Below `xl`, `contextOverlay` is a 17.5 rem sheet over the thread (`608:630`).

Content: `CRMContext` + `InboxCrmContext` from `InboxCrmContextComposer` (P14). Fallback facts: email / phone / owner / company. Duplicate CRM blocks (composer + facts) when both payloads exist.

### 1.7 Desk / RoomShell tabs

`DeskShell` wraps every `/inbox` render (`desk-shell.tsx:46:64`). `RoomShell` (`room-shell.tsx:44:102`) draws a **42 px** section nav: Inbox · Conversations · Tickets · Channels (`DESK_TABS` `8:32`). Simple Mode drops Tickets. `WorkspaceHeader` is conversation-quiet: `h1` is `sr-only` (`WorkspaceHeader.tsx:57,110`). Measured header rect is null / height 0. Visible title chrome is the RoomShell strip, not Slot C.

### 1.8 WhatsApp

Official Cloud / Evolution only. Empty workspace CTA « Connect WhatsApp Cloud » + « No Baileys. » (`desk/inbox.tsx:143`, locked by `DeskEmptyStateTest`). Composer template picker has a WhatsApp-templates section (`Composer.tsx:207:229`). **No 24-hour window, no `last_inbound_at`, no template-lock** ([GAP-12](../00-baseline/BLUEPRINT-IMPLEMENTATION-MATRIX.md#gap-12)). Do not invent « Fenêtre fermée » or disable send.

### 1.9 Permissions

Route name `desk.inbox` / `desk.reply` / `desk.ticket.open` → `desk.manage` (`EnforceProductPermissions.php:78:80`) on **all** methods, including GET. API v1 thread writes also require `desk.manage` (`123:124`). Owner seed has it. Do not change the permission map.

### 1.10 Realtime

**None.** No Echo, Reverb, Pusher, or polling in inbox/desk/composer/thread JS. Refresh is Inertia `router.get` / `Form` POST + `back()`. C-06 live-dot replacement is visual only — do not invent a websocket.

### 1.11 URL state

`inboxSearchParams` `131:154:resources/js/lib/inbox-workspace.ts`:

| Param | Default omitted | Meaning |
|---|---|---|
| `thread` | none | selected id |
| `folder` | `all` | queue / channel key |
| `q` | empty | name / subject search |
| `context` | open | `'0'` closes the panel |

Keep this contract. Relabel UI; do not rename params.

### 1.12 Scroll ownership

WorkspaceFrame: `data-archetype="conversation"` · `data-scroll-owner="conversation"` · `overflow-y: hidden`. Measured `pageScroll=false` at every viewport in this audit.

Independent scrollers: folder rail (`scrollPanels.left=true`), list (`ConversationList` inner `overflow-y-auto`), thread (`MessageThread`), context (`overflow-y-auto`). Composer and conversation header stay. **Do not make the document the primary scroller.**

### 1.13 AdaptiveWorkspaceShell trap

`adaptive-workspace-shell.tsx:151:226` mounts **three** complete pane trees (mobile `<md`, tablet `md–lg`, desktop `lg+`). Hidden copies stay in the DOM. First-match `querySelector` hits 0×0 nodes. Three composers exist at once (`notePressed` listed « Note » twice). Any implementer measuring or binding to `[data-inbox="composer"]` must filter **visible** nodes.

### 1.14 Embed path (keep, do not exercise)

If `inbox_url` is set and the probe is `ok`, `DeskInbox` renders the iframe (`data-inbox="embed"`, `desk/inbox.tsx:269:279`). This audit cleared `inbox_url`. Keep the embed + `InboxStatusBanner` probe (C-06: replace copy with a live dot; do not delete the probe or iframe).

---

## 2. Column table @ 1440×1000 FR light — context open (`/inbox?thread=1`)

Measured 7 Oct 2026, visible panes only. Viewport 1440. Blueprint target from §19 / ARCH-06 / RESP-01: **56 · 340 · ≥680 · 360**.

| Region | Selector | x | Width px | Height px | Blueprint | Consumes space unnecessarily? | Class |
|---|---|---:|---:|---:|---|---|---|
| EvoRail | `.evo-rail-slot` | 0 | **224** | 1000 | 56 on Inbox `<1600` (SHELL-12); 224 is the approved **global** expanded rail | Yes on this route — 168 px that Blueprint gives the thread | **KEEP** global 224/56 primitive. On `/inbox` only: **COLLAPSE** to 56 unless pinned (SHELL-12). Do not change the 224/56 tokens. |
| RoomShell tabs | `[data-chrome=contextual] nav` | 256 | 1152 | **42** | Slot J view tabs / no second title bar (HDR-10) | Height, not a column. Duplicates « Inbox » next to the quiet header | **MERGE** into WorkspaceHeader Slot J (live hrefs). Not a fifth column. |
| WorkspaceHeader | `[data-workspace=header]` | 224 | 1216 | **0** | Quiet conversation header (P0.1) | No | **KEEP** (sr-only h1). Do not un-quiet. |
| Folder / queue rail | `[data-inbox-pane=nav]` | 240 | **187** | 357 | Not a column. Queues = Inbox nav children (SHELL-11, REM-03) | **Yes — the extra column.** ~220 px with padding/gap | **MOVE** real folders (`all` `unassigned` `mine` `open` `closed`) into Inbox rail children / flyout. **REMOVE FROM DEFAULT** as a pane. Channel keys **MOVE** to `ChannelFilter` (C-05). |
| Conversation list | `[data-inbox-pane=list]` | 465 | **300** | 926 | 340 | Slightly narrow; not the thief | **KEEP.** Target **340** (320 at 1280). |
| Conversation column | `[data-inbox-pane=conversation]` | 803 | **341** | 926 | `minmax(560,1fr)` target ~684 | Starved leftover after folders + context | **KEEP as hero.** Must receive leftover width. Floor **560**. |
| Thread scroller | `[data-inbox=thread]` | 803 | **341** | 585 | same | Same | **KEEP.** Independent scroll. |
| Composer | `[data-inbox=composer]` | 803 | **341** | 248 | Anchored under thread | Tall because the column is narrow (buttons wrap) | **KEEP** anchored. Do not send. |
| Context | `[data-inbox-pane=context]` | 1160 | **280** | 958 | 360 optional; default closed in some §15 record rules; Inbox docks at 1440 | Default-open at 1440 is allowed by ARCH-06; **280 ≠ 360**. At 1280 it must not stay docked | **KEEP** as optional dock @1440 (widen to **360**). **COLLAPSE** / overlay below 1440. Default-open @1440 is OK; default-open @1280 is not. |
| Workspace remainder | `.evo-workspace` | 224 | 1216 | 1000 | 1216 if rail 224; **1384** if rail 56 | — | — |

**Thread usable width @1440 context open: 341 px** (conversation column).  
**Context closed (`?context=0`): thread 621 px** — still under 680 because the folder column remains.  
**Budget if folders MOVE and Inbox rail COLLAPSE to 56 and context 360 / list 340:** `1440 − 56 − 340 − 360 = 684` — matches RESP-01.

### 2.1 Other viewports (selected, context default)

| Viewport | Rail | Folders | List | Thread | Context | vs Blueprint |
|---|---:|---:|---:|---:|---:|---|
| 1280×900 | **224** | 187 | 300 | **181** | **280 docked** | Context should overlay/collapse. Thread is unusable. Composer clips. |
| 1024×768 | **56** | 187 | 300 | **373** | hidden (`xl`) | Rail correct. Still **three** content columns. Target: list + thread only. |
| 768×1024 | 0 (overlay) | tab | **280** | **414** | hidden | Blueprint: list **OR** thread. Live: both + Dossiers/Inbox/Conversation tabs. |
| 430×932 | 0 | tab | hidden* | **430** | hidden | One pane after switching to Conversation. No Back. |
| 390×844 | 0 | tab | hidden* | **390** | hidden | Same. Tabs, not Back. Thread height only 205 px above composer. |

\*Remesure opened the Conversation tab so the list is unmounted in the mobile tree. List-state shots still show the center pane alone.

`pageScroll` was **false** at every size. Scroll ownership is already correct; composition is not.

---

## 3. Findings (severity for the implementer)

### P0 — composition

1. **Thread is not the hero.** 341 px @1440 open / 181 px @1280. Floor 560, target ≥680.
2. **Queues are a permanent extra column** (~187–220 px) of folder + channel names. Blueprint forbids this unless it requires it — it requires the opposite (SHELL-11, REM-03, PAGE-INB-01).
3. **Channels act as queues** (WhatsApp, WhatsApp Business, Email, Telegram, SMS in the folder rail). C-05: present as `ChannelFilter`. Keep `?folder=` keys.

### P1 — states and bands

4. **Empty-state lie (pre-existing, Gate A P1).** `/inbox` with 8 rows: right pane « Sélectionnez une conversation » / « Vous êtes à jour. » (`desk/inbox.tsx:648:652`, FR `messages.ts:37`). PAGE-INB-03: if the list has threads, that copy is forbidden. Wave3 **source-locks the English string** in this file (`EvoCrmWave3InboxChromeTest.php:25`) — see §6.
5. **1280 docks 280 px context** and leaves 181 px for the thread. Blueprint: context **may collapse** at 1280; it must not win over the thread.
6. **768 shows list + thread.** `AdaptiveWorkspaceShell` tablet branch (`176:207`) is center+right. Blueprint RESP-04: one pane, list **OR** thread.
7. **390/430: no Back.** Three tabs (Dossiers / Boîte de réception / Conversation). Blueprint: one pane + obvious Back to the list.

### P2

8. **Inbox rail stays 224 at 1440/1280.** SHELL-12: force 56 below 1600 with a 240 px queue flyout. `data-inbox-rail="hook"` is a no-op. Do not change the global 224/56 rule for other routes.
9. **Context 280 vs 360.** `lg:w-[17.5rem]` in `inbox-chrome.tsx:126`.
10. **RoomShell 42 px tab strip** + quiet header. HDR-10: title in C (quiet is fine), Desk destinations as Slot J, not a second grammar.
11. **Open ticket is orange** in the conversation header while **Envoyer** is also orange. L4: one orange. Envoyer is the conversation primary (PAGE-INB-01). Ticket → ghost / teal.
12. **No realtime.** Inertia only. C-06 live dot is a banner replacement, not Echo.

### P3 / capture

13. Concatenated Latin words in PNGs — capture artifact, same as P01.
14. Triple pane DOM (mobile+tablet+desktop) — measurement / focus trap, not a user-visible extra column.

---

## 4. Blueprint vs contract (do not invent)

| ID | Blueprint | Contract (wins) | This audit |
|---|---|---|---|
| C-04 | Thread assignee | `contact.owner_id` only | Relabel / show owner. No `assignee_id`. |
| C-05 | Channels are filters | `folder` accepts channel keys + counts | Stop *presenting* them as the queue column. Keep the query keys. |
| C-06 | Hide CSP/dev banner | `InboxStatusBanner` is a real embed probe | Banner is already hidden when `inbox_url` is null (`marks.tsx:50`). Do not delete probe / iframe. |
| C-01 | `/crm/inbox` | `/inbox` | Stay on `/inbox`. |
| GAP-02 | Équipe commerciale, Support | No folder, no query | Do not ship. |
| GAP-12 | WhatsApp 24h window | No timestamp on the thread payload | Do not fake. Do not disable send. |
| SHELL-11 | Queues as Inbox nav children | `product-nav.ts` Inbox is a leaf | Additive children from **existing** folder keys only. |
| ARCH-06 | Drop queue column | P13/Wave3 lock `AdaptiveWorkspaceShell` + `InboxFolderRail` | May stop passing folders as a **visible desktop column**. Keep the components and `data-inbox-pane="nav"` if tests require the marker — but not a 187 px track. |
| P0.1 frame | — | Rail 224/56, WorkspaceFrame, quiet header | **Do not restyle the shell.** Inbox-route rail collapse is SHELL-12, scoped to `/inbox`. |

---

## 5. Implementation brief (one exclusive agent)

### 5.1 Own these

| File | Why |
|---|---|
| `resources/js/pages/desk/inbox.tsx` | **Primary.** FrontDesk grid, empty-selected copy, context default/overlay, `showFilters`, `desktopGridClassName`, tab/Back behaviour. |
| `resources/js/components/crm/inbox-chrome.tsx` | Context host width 280 → 360; collapse control. Keep `data-inbox="context-host"`. |
| `resources/js/evo/inbox/ConversationList.tsx` | Wire `ChannelFilter` / assignment **or** keep `showFilters` and pass handlers from FrontDesk. Empty list copy only when `conversations.length === 0`. |
| `resources/js/evo/inbox/ChannelFilter.tsx` | Use as-is; do not rewrite chips. |
| `resources/js/evo/inbox/QueueNavigation.tsx` | Reuse for flyout / rail children. Do not invent a second folder component. |
| `resources/js/lib/inbox-workspace.ts` | Folder helpers / URL params. Keep function names P13 locks (`normalizeInboxFolder`, `isStaleInboxVisit`, `inboxThreadMatchesRequest`, `resolveInboxRequestedThreadId`, `groupInboxMessages`). |
| `resources/js/components/shell/product-nav.ts` | **Additive** Inbox children for real folders only. Do not change other nav sections. |
| `resources/js/components/shell/evo-shell.tsx` | Activate `data-inbox-rail` (56 + flyout) **on `/inbox` only**. Do not change `RAIL_EXPAND_MIN` for the rest of the product. |

Optional restyle-only: `Composer.tsx` (one orange = Envoyer; Note label « Note interne » if translators already have it). No new submit contract.

### 5.2 Do not touch

- EvoRail / EvoShell **global** 224/56, cabinet tokens, WorkspaceFrame, quiet `WorkspaceHeader` contract (`workspace.test.ts`).
- `InboxController` folder / search / `context` / embed / `reply` / `openTicket` behaviour. No new folder keys. No assignee column.
- `DeskComposer` / Evolution / SMS send path. **Never submit the composer against a seeded WhatsApp thread.**
- `AdaptiveWorkspaceShell` public API shape (`left`/`center`/`right`, `desktopGridClassName`) — other rooms use it (`ProductPolishWorkspaceTest`). You may pass new classNames from Inbox.
- `InboxWorkspace.tsx` unless you **migrate `/inbox` onto it** in this wave (not required; live page is `desk/inbox.tsx`). Do not create InboxV2 / NewInbox / IntercomInbox (P13 forbids those strings).
- Permissions, Simple Mode, `InboxCrmContextComposer` payload, P14 context matching.
- Embed iframe path, CSP probe, `officialConnectors`.
- Capture / seed scripts beyond this audit folder.

### 5.3 Target widths

| Viewport | Rail | List | Thread (hero) | Context | Panes |
|---|---|---|---|---|---|
| **1440** | 56 unless user pinned expand | 340 | leftover, **≥560**, target **684** | 360 docked, toggle `context=0` | list + thread + optional context. **No folder column.** |
| **1280** | 56 (or 224 if you keep global expand — then context **must** overlay) | 320 | leftover, **≥560** | **COLLAPSE / overlay** (296 if it can dock without breaking the floor) | list + thread |
| **1024** | 56 | ~300–340 | leftover | overlay only | **list + thread** |
| **768** | overlay / 56 if the shell still shows a rail | full **or** hidden | full **or** hidden | overlay / hidden | **list XOR thread** |
| **430 / 390** | none | full **or** hidden | full **or** hidden | hidden / sheet | **one pane + Back** |

Queues: rail children or Inbox hover flyout (240), not a grid track. Channels: `ChannelFilter` in the list header.

### 5.4 Empty-state copy

| Situation | Copy |
|---|---|
| Workspace has **zero** threads (`folder=all`, no `q`) | Existing `InboxEmpty` — « No conversations » + WhatsApp Cloud CTA. Keep « You're all caught up. Connect official… » / No Baileys (DeskEmptyState + Wave3). |
| Folder/search empty, other threads exist | « No open conversations here » (already the list `emptyTitle`). |
| Threads in the list, **none selected** | « Select a conversation » + shortcuts. **Not** « You're all caught up. » |
| Thread selected, no messages | Quiet thread empty — not caught-up. |

Wave3 locks the substring `"You're all caught up"` **somewhere** in `desk/inbox.tsx`. Keep it on the **true empty workspace** path (`InboxEmpty`) and remove it from the unselected-thread pane.

### 5.5 Responsive behaviour to implement

- `[` / `]` may collapse list / context if cheap; URL `context=0` already exists.
- 768+: do not use the tablet « always show center+right » branch for Inbox. Either a new `tabletGridClassName` that is single-pane, or Inbox-local switcher that treats tablet like mobile when a thread is selected.
- 390: selecting a row shows the thread; **Back** returns to the list (`thread` cleared). Tabs may remain as a fallback but Back must be obvious.

---

## 6. Test locks (must stay green)

Update tests in the **same** PR if a locked string moves. Do not delete locks.

| Suite | What it freezes |
|---|---|
| `tests/Feature/P13InboxWorkspaceTest.php` | Native + embed markers, `AdaptiveWorkspaceShell`, `InboxComposer` / `InboxMessageThread` / `InboxContactSidebar`, « Assigned to me », « All open », « Select a conversation », « Open ticket », `overflow-x-hidden`, no InboxV2/NewInbox, folder + search + channel-folder Inertia, `context=0`, reply + ticket routes, `inbox-workspace.ts` helpers, no `instagram` folder key |
| `tests/Feature/P14InboxCrmContextTest.php` | `data-inbox="context-host"`, native/embed markers, composer context payload |
| `tests/Feature/EvoCrmWave3InboxChromeTest.php` | `DeskShell`, `InboxFolderRail`, `"You're all caught up"`, `desktopGridClassName`, embed CSP when `inbox_url` set, native fallback |
| `tests/Feature/DeskEmptyStateTest.php` | `EmptyState`, Connect WhatsApp Cloud, No conversations, No Baileys, channels[4] keys |
| `tests/Feature/DeskComposerTest.php` | Reply / note POST contract — **do not change** |
| `tests/Feature/P25ResponsiveHardeningTest.php` / `P29FinalConvergenceTest.php` | `data-inbox="native"` / `embed` |
| `tests/Feature/ProductPolishWorkspaceTest.php` | `AdaptiveWorkspaceShell` import |
| `resources/js/evo/workspace/workspace.test.ts` | Quiet conversation header |

Channel-folder **counts** (`folder=whatsapp` ⇒ 3, etc.) stay. Presentation may move to chips that still set `?folder=`.

---

## 7. Risks

1. **P13 + Wave3 source-locks** will fail if `AdaptiveWorkspaceShell`, `InboxFolderRail`, or the caught-up string disappear from `desk/inbox.tsx`. Relocate, don’t delete.
2. **Triple DOM** in AdaptiveWorkspaceShell: click / measure / Playwright must target visible panes. Inbox-local CSS that assumes one composer will fight the hidden copies.
3. **SHELL-12 vs P0.1 224 rail.** Inbox-only collapse. A global change reopens Gate A.
4. **Sending.** `DeskComposer` talks to Evolution. Visual QA must never submit Reply on seeded WhatsApp threads. Notes POST as `as_note` (DB only) — still avoid in capture scripts.
5. **Assignment / WhatsApp window / Équipe queues.** Inventing any of these is a contract break (C-04, GAP-12, GAP-02).
6. **`conversations.tsx`** shares DeskShell + caught-up copy. Out of this brief unless a shared string move forces a one-line follow.
7. **Orange ticket + orange Envoyer** — changing ticket to non-primary may need a class tweak only; P13 locks the words « Open ticket », not the Button variant.

---

## 8. Capture index

54 shots in `artifacts/product-rebuild/02-wave/before/inbox/`.

States × viewports FR light: `list`, `selected`, `composer`, `internal-note`, `context-open`, `context-closed` at 1440 / 1280 / 1024 / 768 / 430 / 390.  
1440 extras: `en` light, `ar` RTL, `fr` dark (same six states).

Evidence called in this doc:

- Empty-state lie: `list__1440x1000__fr__light.png`, `list__1440x1000__fr__dark.png`
- Five-region squeeze: `selected__1440x1000__fr__light.png`
- Note mode: `internal-note__1440x1000__fr__light.png` (recaptured; Note pressed)
- Thread recovery without context: `context-closed__1440x1000__fr__light.png` (621 px, folders remain)
- 1280 crush: `selected__1280x900__fr__light.png`
- 768 XOR fail: `selected__768x1024__fr__light.png`
- 390 no Back: `selected__390x844__fr__light.png`
- RTL: `selected__1440x1000__ar__light.png` (rail on the right; same five regions)
- Metrics: `column-metrics.json`

No real messages were sent. `inbox_url` stayed null.
