# W02 INBOX IMPLEMENTATION REPORT

**Wave:** 2 · Inbox / Desk presentation (exclusive owner)  
**Branch:** `cursor/w02-inbox-impl-a162`  
**Base:** `cursor/simple-mode-nav-c02-fa6d` (rebuild/p01-certification + C-02 Simple nav)  
**PR:** draft into `cursor/simple-mode-nav-c02-fa6d`  
**Host:** localhost `:8000` only. No deploy, merge, DNS, secrets, or integrations.  
**Seed:** `DatabaseSeeder` + `VisualQaSeeder` · `owner@evosales.local` / `password`  
**Workspace:** Evotechly · `inbox_url=null` · capture sets `simple_mode=false` to match the audit  
**Replay:** `node scripts/product-rebuild/capture-inbox-after.mjs --out artifacts/product-rebuild/02-wave/after/inbox`  
**After-shots:** `artifacts/product-rebuild/02-wave/after/inbox/`

No real messages were sent. Assignment stays `contact.owner_id`. No Équipe / Support queues. No WhatsApp 24h window.

---

## 1. Files changed

Presentation + locks only. No InboxController / DeskComposer / send-path rewrite.

| File | Change |
|---|---|
| `resources/js/pages/desk/inbox.tsx` | Primary. Folder flyout in WorkspaceHeader. Desk tabs as `viewItems`. `hideSectionNav`. 2-col `lg:grid-cols-[21.25rem_minmax(0,1fr)]`. `hideLeftOnDesktop` + `singlePaneBelowLg` + `mountVisibleOnly`. Unselected copy `inbox.empty.pick_conversation`. Back `data-inbox="back"`. Open ticket `outline`. Context dock ≥1440 / overlay on demand below. Channel + assignment wired to `?folder=`. |
| `resources/js/components/crm/adaptive-workspace-shell.tsx` | Additive: `hideLeftOnDesktop`, `singlePaneBelowLg`, `mountVisibleOnly`, controlled `activePanel`, viewport band. Other rooms unchanged when flags are off. |
| `resources/js/components/crm/desk-shell.tsx` | `hideSectionNav` → RoomShell `hideNav`. |
| `resources/js/components/crm/room-shell.tsx` | `hideNav` wraps the 42px strip in `sr-only`. |
| `resources/js/components/crm/inbox-chrome.tsx` | Context host `w-[22.5rem]` (360). |
| `resources/js/components/crm/inbox-crm-context.tsx` | `inbox.context.*` keys; activity type labels; Peek/actions teal. |
| `resources/js/evo/inbox/ConversationList.tsx` | `channels` + `ChannelFilter`; folder empty uses `inbox.empty.folder_description`. |
| `resources/js/evo/inbox/channel.tsx` | Labels through `t()` (`WhatsApp Business`, SMS, `inbox.channel.telegram`). |
| `resources/js/evo/inbox/marks.tsx` | Native banner copy is `inbox.embed.unavailable` (no host / CSP). |
| `resources/js/evo/inbox/Composer.tsx` | `inbox.composer.internal_note`; template titles `t()`. |
| `resources/js/evo/inbox/MessageThread.tsx` | Unknown status + send-failed keys; hide raw `failureReason`. |
| `resources/js/evo/inbox/canned.ts` | `inbox.template.devis_envoye` / `relance_devis`. |
| `resources/js/evo/inbox/InboxWorkspace.tsx` | Same pick-conversation copy on the unused primitive. |
| `app/Services/Desk/DeskEmbedProbe.php` | Cache key `desk_embed_probe_v2_`; reason is the English key (T-I-22). |
| `lang/{fr,en,ar}.json` | **Append-only** `inbox.*` keys (22 + 5 composer keys, identical set in fr/en/ar = 1980). Existing shared keys untouched. Home still uses `You're all caught up.` |
| `tests/Feature/P14InboxCrmContextTest.php` | Source-lock retargeted to `inbox.context.contact_owner` / `deal_owner` / `no_contact`. |
| `scripts/product-rebuild/capture-inbox-after.mjs` | After-shot matrix. Does not POST reply/note. Forces `inbox_url=null`. |

**Not changed:** EvoRail 224/56, `product-nav.ts`, InboxController folder/search/context/embed, DeskComposer send, permissions, Simple Mode membership, Records / Deals / Settings / Dashboard / Quotes.

---

## 2. Thread width before / after

Visible panes only. Before = W02-INBOX-AUDIT `column-metrics.json` (7 Oct 2026). After = live remesure 7 Oct 2026 on this branch (`inbox_url=null`).

| Viewport | State | Thread before | Thread after | List after | Context after |
|---|---|---:|---:|---:|---:|
| **1440×1000** | context open | **341** | **482** | 340 | **360** docked |
| **1440×1000** | context closed | **621** | **842** | 340 | hidden |
| **1280×900** | selected / closed | **181** | **682** | 340 | collapsed |
| **1024×768** | selected / closed | **373** | **594** | 340 | collapsed |
| **768×1024** | selected | **414** (list also shown) | **735** (list unmounted) | XOR | hidden |
| **430×932** | selected | 430 (no Back) | full pane + Back | XOR | hidden |
| **390×844** | selected | **390** (no Back) | **390** + Back | XOR | hidden |

**1440 context closed meets the hero rule:** 842 ≥ 680.  
**1440 context open is leftover after rail 224 + list 340 + context 360:** measured 482 (theoretical 516 minus hairline/gap). The brief required ≥680 *with context closed*. Open stays below the 560 floor while the 224 Gate-A rail stays expanded — see §8.

---

## 3. Permanent columns before / after

| Region @1440 context open | Before | After |
|---|---|---|
| EvoRail | **224** | **224** (Gate A unchanged; no inbox-only 56 hack) |
| RoomShell tab strip | **42** height | `sr-only`. Desk destinations live in WorkspaceHeader Slot J (~28px) |
| Folder / queue rail | **187** permanent | **Removed from the grid.** Compact header flyout (`data-inbox="folder-flyout"`) |
| Conversation list | 300 | **340** |
| Thread (hero) | 341 | **482** open / **842** closed |
| Context | 280 docked | **360** docked only at `min-[1440px]` |
| Channel presentation | folder keys in the 187 rail | `ChannelFilter` chips; still `?folder=whatsapp\|…` |

Permanent content columns after: **rail + list + thread**, plus **optional context at ≥1440**.

---

## 4. Scroll ownership

Unchanged and still correct.

- WorkspaceFrame: `data-archetype="conversation"` · `data-scroll-owner="conversation"` · `overflow-y: hidden`
- `pageScroll=false` at every measured viewport
- List (`ConversationList` inner) and thread (`MessageThread`) scroll independently
- Composer stays anchored under the thread
- Context panel (`overflow-y-auto`) scrolls on its own when open
- Document is not the primary scroller

`mountVisibleOnly` unmounts hidden AdaptiveWorkspaceShell breakpoint copies so there is one composer / list / thread in the DOM.

---

## 5. Mobile pane behaviour

| Band | Behaviour |
|---|---|
| **≥1440** | list + thread + optional 360 context |
| **1280** | list + thread. Context is a header-opened overlay, not a docked column |
| **1024** | list + thread. Rail collapses to 56 (global rule). Context overlay only |
| **768** | **list XOR thread.** `/inbox` = list; `?thread=` = thread. `[data-inbox=back]` visible |
| **430 / 390** | **one pane.** Selecting a row shows the thread. **Back** (`lg:hidden`, teal) clears `thread` and returns to the list. Inbox/Conversation tabs remain as a fallback |

---

## 6. Trust items (T-I-*)

| ID | Sev | Status |
|---|---|---|
| **T-I-01** | P0 | **Fixed.** Listed threads + no selection → « Sélectionnez une conversation » / `inbox.empty.pick_conversation` (« Choisissez un fil dans la liste. »). `You're all caught up.` stays on the **true empty workspace** (`InboxEmpty`) and on Home. |
| **T-I-02** | P1 | **Fixed.** Folder/search empty uses `inbox.empty.folder_description`. |
| **T-I-07** | P1 | **Fixed on native panes.** `InboxStatusBanner` is not mounted on FrontDesk. If shown, copy is `inbox.embed.unavailable` (no `desk.evotechly.com` / CSP / frame-ancestors). Embed iframe + probe kept (C-06). Captures ran with `inbox_url=null`. |
| **T-I-22** | P1 | **Fixed.** Probe caches English reason keys (`desk_embed_probe_v2_`). Client `t()`s once. |
| **T-I-09** | P1 | **Fixed.** `inbox.context.contact_owner` / `peek` / loading / failed / no_contact / next_activity / etc. in fr+en+ar. Seen: « Propriétaire du contact », « Aperçu ». |
| **T-I-03** | P1 | **Not changed.** Wave3 + `DeskEmptyStateTest` source-lock « You're all caught up. Connect official WhatsApp Cloud… No Baileys. » on the true-empty path. |
| **T-I-04** | P2 | **Fixed.** Thread header uses `inboxChannelLabel()`. |
| **T-I-11** | P2 | **Fixed.** Activity types map through `t()` / `inbox.activity.scheduled`. |
| **T-I-12 / T-I-13** | P2 / P1 | **Fixed.** Unknown → `inbox.message.unknown_status`. Failed → `inbox.message.send_failed`. Provider codes hidden. |
| **T-I-08** | P2 | **Partial.** Native panes no longer leak Desk/CSP. Embed-path strings (`EvoDesk inbox`, `Continue in CRM inbox`) kept for the framed host (P13). |
| **T-I-19** | P2 | **Left to shared lang.** `:count conversations` not edited. |
| **T-I-14** | P3 | **Fixed.** Template titles `inbox.template.*`. |
| **T-I-20** | P3 | **Fixed.** Context uses `inbox.context.next_activity` instead of `Next`. |

T-S-* shared-lang items (Leads, Amount (DZD), AR mash of old embed strings) are **not** owned here except the new `inbox.*` keys.

---

## 7. Tests + verify

| Check | Result |
|---|---|
| Pest Inbox locks (P13, P14, Wave3, DeskEmptyState, I18nFoundation, ProductPolish, P25, P29) | **54 passed** |
| Full Pest | **1217 passed**, 1 skipped, 1 risky. Pre-existing warning: `use InvalidArgumentException` in ticket tests (not Inbox). |
| Vitest `inbox.test.ts` + `workspace.test.ts` | **10 passed** |
| `tsc --noEmit` | **3 errors**, all pre-existing (`dashboard-recent.tsx` `dir`, `EyeSlash`, `sortableColumnIds`). No new Inbox errors. |
| `npm run build` | **pass** |
| Console on smoke `/inbox` 1440 FR | **[]** |
| Capture console | **126/126 captures empty.** `console-errors.json` has no error/warning/pageerror. |

P13 / Wave3 / DeskEmptyState strings remain in `desk/inbox.tsx` (`AdaptiveWorkspaceShell`, `InboxFolderRail`, `"You're all caught up"`, `desktopGridClassName`, native/embed markers). Folder rail is still *in source* (flyout + hidden left), not deleted.

---

## 8. NEW P0 / P1 (honest)

**No new P0.**

| ID | Sev | What |
|---|---|---|
| **N-I-01** | P2 | **1440 + context open → thread 482px** (below the 560 floor). Budget with the approved 224 rail: `1440 − 224 − 340 − 360 = 516`. Closing context recovers **842**. SHELL-12 (Inbox rail 56) would make open-context leftover ~684; this wave **does not** change Gate-A 224/56. |
| **N-I-02** | P2 | List header is tall (search + assignment segmented + channel chips). Rows start lower than the audit list. Functionally correct; not a width thief. |
| **N-I-03** | P3 | RoomShell nav is `sr-only` and still appears in `innerText` (duplicate Inbox / Conversations / Channels). Invisible. |
| **N-I-04** | P3 | Latin word concatenation in PNGs (`AmineBenali`, `Boitede réception`) — same capture artifact as P0.1 / the audit. Not product copy. |
| **N-I-05** | P3 | T-I-03 Baileys / Cloud sentence remains on the zero-thread empty (test-locked). |
| **N-I-06** | P1 → **fixed in this PR** | AR composer was using mashed shared keys. Appended `inbox.composer.enter_hint` / `send_resolved` / `insert_template` / `private_note` / `type_message` (no shared-key edits). |

---

## 9. Preserved contracts

- Real seeded conversations (8). Selection + URL `thread`, `folder`, `q`, `context=0`
- Assignment = `contact.owner_id` (`mine` / `unassigned`)
- Reply / Internal note still POST `/desk/threads/{id}/reply` — **not submitted** in QA
- Composer anchored; Open ticket outline; Envoyer is the one orange `#EC6025`
- Active/filter teal `#0F4C5C`
- Embed probe + iframe path kept; native captures keep `inbox_url` null
- Gate A rail 224 expanded / 56 collapsed — no `/inbox`-only shell collapse

---

## 10. Capture index

**126 shots + 40 aliases = 166 PNGs** in `artifacts/product-rebuild/02-wave/after/inbox/`.

| Variant | Viewports | States |
|---|---|---|
| FR light | 1440, 1280, 1024, 768, 430, 390 | list, selected, composer, internal-note, context-open, context-closed |
| EN light / AR RTL / FR dark | 1440, 1280, 768, 390 (all states); 1024 + 430 (list, selected, context-closed) | same names |

Aliases: `thread__*` (= selected), `mobile-list__*` / `mobile-thread__*` at 390 and 430.

Metrics: `metrics.json`, `column-metrics.json`. Manifest: `manifest.json`.

1440 FR light (capture script):

- list: rail 224 · folders null · list 340 · `caughtUpVisible=false` · `pickConversationVisible=true` · 8 rows · no banner
- context closed: thread **842**
- context open: thread **482** · context **360**
