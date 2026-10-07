# W02 VISUAL CERTIFICATION — Deals + Inbox (independent)

**Judge:** independent of the implementation agents. This branch did not design the rooms.  
**Host:** localhost only (`http://127.0.0.1:8000`). No deploy, no merge into `main` or certification product branches, no DNS, no secrets, no real message sends, no invented records.  
**Integration branch:** `rebuild/w02-certification`  
**Parents:** `cursor/w02-deals-impl-5d72` (PR #297) + `cursor/w02-inbox-impl-a162` (PR #298)  
**Base:** `cursor/simple-mode-nav-c02-fa6d`  
**Draft PR:** https://github.com/Evotechly/EvoCrm/pull/299  
**Date measured:** 7 October 2026  
**Login:** `owner@evosales.local` / `password`  
**Workspace:** Evotechly · `inbox_url=null` · `Workspace::inboxUrl()` empty (no Desk fallback) · 15 deals · 8 threads · thread id=1  
**Non-owner:** `sara@evosales.local` (member · `crm.edit=false` · `desk.manage=false`)

**Inputs used:** `W02-DEALS-AUDIT.md`, `W02-INBOX-AUDIT.md`, `W02-TRUST-AUDIT.md` (copied from audit branches), `W02-DEALS-REPORT.md`, `W02-INBOX-REPORT.md`, before shots under `artifacts/product-rebuild/02-wave/before/`.  
**After shots:** recaptured on this integrated branch (`after/deals` 75 PNG, `after/inbox` 166 PNG).  
**Independent capture:** `scripts/product-rebuild/capture.mjs --only deals-list,deals-board,inbox,inbox-thread --skip-sheet` → `artifacts/product-rebuild/02-wave/cert-capture` (28 shots, `inbox_url=null`).  
**Functional:** `scripts/product-rebuild/w02-cert-check.mjs` → `artifacts/product-rebuild/02-wave/cert/functional.json` (37/37).  
**Sheet:** `artifacts/product-rebuild/02-wave/W02-CONTACT-SHEET.png` (18 before/after pairs: FR + AR RTL + mobile + dark).

Font concatenation in PNGs (`AmineBenali`, `Tlemcenschoolinbox`, `Boitede réception`) is the same capture raster as P0.1 / the audits. DOM `innerText` is spaced. Treated as render, not product copy.

---

## Verdict

**Conditional GO for product-owner visual review. Do not merge to main.**

Wave 2 did the job it was asked to do: Deals is a pipeline again; Inbox is a list+thread desk. Both rooms keep Gate A (rail 224/56, frame scroll, one orange primary). No NEW P0. No NEW P1.

Blueprint coherence target is **≥ 9.0**. This cert scores **Deals 8.3** and **Inbox 8.1**. The rooms are clearly better than the audited before. They are not yet one product at 9.

| Room | Before | After | Coherence | Target |
|---|---:|---:|---:|---:|
| Deals | **3.0** | **8.3** | **8.3** | 9.0 |
| Inbox | **5.0** | **8.1** | **8.1** | 9.0 |

---

## 1. Integration (mechanical)

New branch `rebuild/w02-certification` from Deals impl. Inbox impl merged. Conflicts were lang-only.

| Rule | What happened |
|---|---|
| Union keys | `lang/{en,fr,ar}.json` = **2029** keys each, identical set |
| Deals owns shared keys | Shared Wave 2 strings (`Amount (DA)`, attention reasons, nav.crm.leads, …) kept from Deals |
| Inbox owns `inbox.*` | **27** `inbox.*` keys from Inbox, including composer |
| Inbox owns `You're all caught up.` | Unchanged (Home / true-empty still use it) |

No product redesign in the merge. Four last-mile source-locks were retargeted after the merge because each impl’s last commit moved a string the other lane’s lock still quoted (`FilterBar` `!compact`; `inbox.composer.send_resolved` / `type_message` / `private_note`). Those are test locks, not product bugs.

---

## 2. Test results

| Suite | Result |
|---|---|
| Pest (full, after lock retargets) | **1219 passed**, 1 skipped, 1 risky (1220 tests, 34706 assertions) |
| Vitest | **97 passed** (27 files) |
| `tsc --noEmit` | **3 errors**, all pre-existing baseline: `dashboard-recent.tsx` (`dir`), `tablecn.tsx` (`EyeSlash`, `sortableColumnIds`). No Deals/Inbox/chrome errors |
| `vite build` | **OK** (16.4s) |
| Browser console — Deals after | **0 / 75** |
| Browser console — Inbox after | **0 / 126** (empty `console` arrays) |
| Browser console — `capture.mjs` subset | **0 / 28** |
| Functional cert script | **37 / 37** |
| Independent remesure vs impl reports | Matches (Deals card 211 / list 186; Inbox open 482 / closed 842) |

Pre-existing PHP warning: `use InvalidArgumentException` in ticket tests. Not Wave 2.

---

## 3. Functional checks (live, seeded only)

All on `http://127.0.0.1:8000`. Inbox composer was toggled; **no reply/note POST to an external channel**. Member reply probe expected 403 and got 403 (body never left the box).

| Check | Result |
|---|---|
| Deals: no Forecast slab / no Attention slab / no StagePills | Pass |
| Deals: Saved Views inside header; Follow-up / « À relancer » tab | Pass → `attention=needs_attention` |
| Deals: URL round-trip `attention` + `q=clinic` | Pass |
| Deals: List ↔ Board share `attention` | Pass |
| Deals: QuickRecord opens (Escape to close) | Pass |
| Deals: local `POST /crm/deals/{id}/move` 200, then restore | Pass (UI drag did not stick; HTTP move did). Seeded deal 1, stage 1→2→1 |
| Inbox: native desk, no embed banner, pick-conversation (not « caught up ») | Pass · 8 rows |
| Inbox: select row writes `?thread=` | Pass |
| Inbox: Reply ↔ Internal Note `aria-pressed` + placeholder « Note privée » | Pass · not submitted |
| Inbox: Back on 390 clears `thread` | Pass |
| Scroll: `pageScroll=false`; frame `scrollOwner=pipeline` (board) / `conversation` (inbox) | Pass |
| Member Sara: GET Deals 200, GET Inbox 200, move 403, reply 403 | Pass |
| Simple Mode rail | **Accueil, Contacts, Affaires, Boîte de réception, Devis** + **Paramètres**. No Leads / Ads / Outbound / Tickets / Reports |

---

## 4. Measurements

Same selectors as the audits. After numbers remesured on this branch (Deals `metrics.json`, Inbox `column-metrics.json`, plus live cert-check).

### 4.1 Deals — first useful content Y (FR light)

Audit first-useful = first **deal card** (board) or first **table row** (list). Column header / thead are also useful pipeline chrome; both reported.

| Viewport | Board card before → after | Board column header after | List row before → after | List thead after |
|---|---:|---:|---:|---:|
| 1440×1000 | 792.5 → **211** | **156** | 717 → **186** | **150** |
| 1280×900 | 836.5 → **211** | **156** | 761 → **186** | **150** |
| 1024×768 | 831 → **211** | **156** | 761 → **186** | **150** |
| 768×1024 | 956.5 → **259** | **204** | 881 → **234** | **198** |
| 430×932 | 995 → **259** | **204** | 0 → **0** | 0 |
| 390×844 | 907 → **259** | **204** | 0 → **0** | 0 |

Filtered board 1440 (`attention=needs_attention`): first card **239**, column header **184**, chip row present. Forecast one-liner `6 · 940 000 DA`. Six seeded deals. No second filter bag.

`capture.mjs` independent 1440 FR: list **186**, board **211**. Same.

**W02-D-01 (card at 211).** The ≤200 first-card target was an audit goal. The product owner said do not optimize for a pixel number alone. First useful **pipeline** content is the column header at **156** (stage + count + value). The card sits immediately under that 47 px header. Stack: identity+views 96 → toolbar 44 (ends 148) → column chrome 156 → card 211. Closing 11 px would shrink identity or views. **Hierarchy pass. Not a P1.**

### 4.2 Deals — permanent bands (1440 FR light)

| Band | Before list | Before board | After list | After board |
|---|---|---|---|---|
| WorkspaceHeader | yes | yes | yes (96 px, views inside) | yes (96 px, views + forecast one-liner) |
| DealForecastBar slab | — | yes | **gone** | **gone** |
| DealAttentionQueue slab | yes | yes | **gone** (Follow-up tab) | **gone** |
| SavedViews sibling | yes | yes | merged into header | merged into header |
| FilterBar | yes | yes | one compact row (44 px) | one compact row |
| StagePills | yes | yes | **gone** | **gone** |
| Active chips | filtered only | filtered only | same | same |

Permanent default bands **6 → 2** (header + toolbar). Pipeline is the work surface.

### 4.3 Inbox — thread width

| Viewport | State | Thread before | Thread after | List after | Context after |
|---|---|---:|---:|---:|---:|
| 1440×1000 | context open | **341** | **482** | 340 | **360** docked |
| 1440×1000 | context closed | **621** | **842** | 340 | hidden |
| 1280×900 | selected / closed | **181** | **682** | 340 | overlay, not a column |
| 1024×768 | selected / closed | 373 | **594** | 340 | overlay |
| 768×1024 | selected | 414 (list also shown) | **735** (list unmounted) | XOR | hidden |
| 430 / 390 | selected | full width, no Back | full pane + **Back** | XOR | hidden |

**N-I-01 (thread 482 with context open at 1440).** Hero rule this wave committed to: context-closed ≥ 680. Closed is **842**. Open leftover is arithmetic: `1440 − 224 − 340 − 360 = 516` theoretical, **482** measured (gaps/hairline). Gate A rail stays 224. Context at 360 is the dock the wave promised at ≥1440. Thread is still the widest content pane after the list. Composer wraps because 482 is tight. **P2 leftover, not a failed hero. Not a P1.**

### 4.4 Inbox — permanent columns (1440, context open)

| Region | Before | After |
|---|---|---|
| EvoRail | 224 | **224** (Gate A unchanged) |
| RoomShell tab strip | 42 height | `sr-only`; destinations in header Slot J |
| Folder / queue rail | **187** permanent | **not a column** (header flyout) |
| Conversation list | 300 | **340** |
| Thread (hero) | 341 | **482** open / **842** closed |
| Context | 280 docked | **360** docked only at `min-[1440px]` |

Permanent content columns **5 → 3** (rail + list + thread), plus optional context at ≥1440.

### 4.5 Viewport utilization (1440 FR)

| Surface | Before | After |
|---|---|---|
| Deals board | First card at 79% of viewport height. Pipeline almost below the fold | Column chrome at 16%; cards from 21%. ~79% of the canvas is pipeline |
| Deals list | First row at 72% | Row at 19%; thead at 15% |
| Inbox thread (open) | 341 / 1440 = 24% | 482 / 1440 = 33% |
| Inbox thread (closed) | 621 / 1440 = 43% | 842 / 1440 = 58% |

### 4.6 Scroll ownership

Unchanged and correct on every measured viewport.

- Deals board: `data-scroll-owner="pipeline"` · `pageScroll=false`
- Deals list: `data-scroll-owner="surface"` · `pageScroll=false`
- Inbox: `data-archetype="conversation"` · `data-scroll-owner="conversation"` · frame `overflow-y: hidden` · `pageScroll=false`
- List and thread scroll independently. Composer stays anchored. Context scrolls on its own when open. The document is not the primary scroller.

### 4.7 Mobile pane behaviour

| Band | Deals | Inbox |
|---|---|---|
| ≥1440 | list or board in frame | list + thread + optional 360 context |
| 1280 | same chrome | list + thread; context overlay |
| 1024 | rail 56 (global) | list + thread; rail 56 |
| 768 | +48 mobile header; first card 259 | **list XOR thread**; Back visible |
| 430 / 390 | horizontal board; toolbar H-scrolls; views in header | **one pane**; Back clears `thread` |

---

## 5. Scorecard

Scored as a product, not as “did the agent hit a pixel.”

### Deals (0–10)

| Axis | Before | After | Why |
|---|---:|---:|---|
| C-18 composition | 2.5 | **8.5** | Identity → views → one toolbar → pipeline. Slabs gone |
| First useful content | 2.0 | **8.2** | List 186 meets ≤200. Board card 211 / column 156 — hierarchy first |
| Viewport density | 2.5 | **8.0** | Header still 96 px two-row; toolbar still a filter bag |
| Pipeline readability | 4.0 | **8.5** | Cards on first paint; column headers carry stage/count/value |
| List readability | 4.0 | **5.5** | Same C-/A- column truncation as the before audit. Not Wave 2’s, still the list |
| Saved views / filters | 5.0 | **8.0** | Follow-up tab is real; URL + List/Board share state |
| Mobile | 3.0 | **7.0** | Cards above the fold; toolbar H-scrolls on 390 |
| RTL | 6.5 | **7.5** | AR board mirrors; rail on the right |
| Dark | 6.5 | **7.5** | Geometry matches light |
| Trust / copy | 4.0 | **8.5** | Board options, Amount (DA), dates, QuickRecord through `t()` |
| Product coherence | 3.0 | **8.3** | Looks like a pipeline room. Not 9: 96 px header, filter-bag toolbar, inherited list clip |

**Deals mean: 3.0 → 8.3.**

### Inbox (0–10)

| Axis | Before | After | Why |
|---|---:|---:|---|
| Composition | 3.5 | **8.3** | Folders off the grid. List + thread is the desk |
| Thread as hero | 2.5 | **8.0** | Closed 842 ≥ 680. Open 482 is leftover, not a second hero |
| Columns | 3.0 | **8.2** | 5 → 3 + optional context |
| Empty / trust | 3.0 | **8.5** | Pick-conversation while 8 rows exist. No Desk CSP banner on native |
| Mobile panes | 4.0 | **7.8** | XOR + Back. Thread scroller is short (~205) under composer |
| Composer | 6.0 | **8.0** | Reply / Note toggle works; Envoyer stays the one orange. Wraps at 482 |
| Context 360 | 5.0 | **7.5** | Docked only at ≥1440. Duplicate contact+deal blocks are pre-existing |
| RTL | 6.0 | **7.8** | AR selected is a real RTL desk |
| Dark | 6.0 | **7.5** | Same geometry |
| Product coherence | 5.0 | **8.1** | Conversation room. Not 9: tall list header, open-context squeeze, 40 px header vs Deals 96 |

**Inbox mean: 5.0 → 8.1.**

Cross-room: both keep Gate A, teal active, one orange primary, FR/EN/AR together. The visible split is header density (Deals 96 vs Inbox 40). That is the main reason product coherence stays under 9.0.

---

## 6. Issues

### NEW P0

None.

### NEW P1

None.

No presentation-level P0/P1 was fixed by this cert. Nothing to report as a cert-agent patch.

### NEW P2

| ID | What | Repro | Suggested owner |
|---|---|---|---|
| **N-I-01** | 1440 + context open → thread **482** (below the 560 floor). Closed recovers 842 | Owner, FR, 1440, `/inbox?thread=1`. Measure `[data-inbox=thread]`. Then `/inbox?thread=1&context=0` | Inbox. Do not collapse Gate A to 56 on `/inbox` unless SHELL-12 is reopened. Options: narrower list, overlay context at 1440, or accept leftover |
| **N-I-02** | List header is tall (search + assignment segmented + channel chips). Rows start lower than the audit list | `/inbox` 1440 FR. `[data-inbox-pane=list]` chrome above the first row | Inbox. Collapse chips/assignment into one row or a menu |
| **W02-D-03** | Compact toolbar H-scrolls on 390 (List/Board + search + four filters). One row, not a second band | `/crm/deals/board` at 390×844 | Deals. Overflow menu / fewer default filters on mobile |

### NEW P3

| ID | What |
|---|---|
| **N-I-03** | RoomShell nav is `sr-only` and still appears in `innerText` (duplicate Inbox / Conversations / Channels). Invisible |
| **N-I-04** | Latin word concatenation in PNGs — capture artifact, same as P0.1 |
| **N-I-05** | T-I-03 Baileys / Cloud sentence remains on the **zero-thread** empty (Wave3 source-lock). Not hit on this seed |

### Accepted / not a defect

| ID | What | Judgment |
|---|---|---|
| **W02-D-01** | Board first **card** y=211 vs LAW-06 ≤200 | Hierarchy pass. Column header 156. See §4.1 |

### Pre-existing (not NEW, still visible)

| ID | Sev | What |
|---|---|---|
| List C-/A- truncation | P2 | Deals list cells clip to initials / first letter at 1440. **Identical on the before shot.** Not introduced by C-18 |
| **W02-D-02** | P2 | Mobile list first-row measure still y=0 (0×0 row box). Same as the before audit. Rows are visible on the 390 list shot |
| Duplicate CRM context | P3 | Contact block + deal block both painted when both payloads exist. Called out in the Inbox audit |
| T-I-03 / T-I-08 leftovers | P2–P3 | True-empty Baileys sentence; embed-path English kept for the framed host |
| Contacts / Quotes chrome | — | Out of Wave 2. Contacts first-row y was 209 at Gate A |

---

## 7. Trust (spot-check, not a re-audit)

Deals-owned T-D-01 / 09 / 12 / 15 / 16 / 18 / 19 and shared T-S-01 / 02 / 04 look fixed on the seeded FR/AR/EN shots (board options through `t()`, Amount (DA), `formatDate`, QuickRecord labels, Follow-up tab). Inbox T-I-01 / 07 / 09 / 22 look fixed on native panes with `inbox_url=null` (pick-conversation, no Desk hostname banner, context keys in FR/AR). T-I-03 left locked. User-generated titles were not rewritten.

---

## 8. Named shots

Under `artifacts/product-rebuild/02-wave/`:

| Requested | After file |
|---|---|
| Deals board default | `after/deals/deals-board__1440x1000__fr__light.png` |
| Deals board filtered | `after/deals/deals-board-filtered__1440x1000__fr__light.png` |
| Deals list | `after/deals/deals-list__1440x1000__fr__light.png` |
| Deals QuickRecord | `after/deals/deals-quickrecord__1440x1000__fr__light.png` |
| Deals mobile board / list | `after/deals/deals-board__390x844__fr__light.png` · `deals-list__390x844__fr__light.png` |
| Inbox list / selected / thread | `after/inbox/list__*` · `selected__*` · `thread__*` |
| Inbox composer / internal note | `after/inbox/composer__*` · `internal-note__*` |
| Inbox context open / closed | `after/inbox/context-open__*` · `context-closed__*` |
| Inbox mobile list / thread | `after/inbox/mobile-list__*` · `mobile-thread__*` |
| Contact sheet | `W02-CONTACT-SHEET.png` |

Also captured: FR / EN / AR × light / dark × 1440 / 1280 / 1024 / 768 / 430 / 390 for the matrix each impl script already defined. Independent `cert-capture/` covers the four `capture.mjs` routes at six viewports (FR light) plus Inbox EN/AR/dark and Simple Accueil.

---

## 9. Files changed in this integration

Relative to `cursor/w02-deals-impl-5d72` (Inbox merge + audits + this cert). No redesign.

**Inbox product (from PR #298)**  
`resources/js/pages/desk/inbox.tsx`  
`resources/js/components/crm/{adaptive-workspace-shell,desk-shell,inbox-chrome,inbox-crm-context,room-shell}.tsx`  
`resources/js/evo/inbox/{Composer,ConversationList,InboxWorkspace,MessageThread,canned,channel,marks}.*`  
`app/Services/Desk/DeskEmbedProbe.php`  
`scripts/product-rebuild/capture-inbox-after.mjs`  
`tests/Feature/P14InboxCrmContextTest.php` (Inbox retarget, then cert retarget)

**Lang union**  
`lang/{en,fr,ar}.json` — 2029 keys, 27 `inbox.*`

**Audits copied in**  
`docs/product-rebuild/02-wave/W02-{DEALS,INBOX,TRUST}-AUDIT.md` plus before shots

**Cert-only (this agent)**  
`docs/product-rebuild/02-wave/W02-CERTIFICATION.md`  
`scripts/product-rebuild/w02-cert-check.mjs`  
`scripts/product-rebuild/w02-contact-sheet.mjs`  
`artifacts/product-rebuild/02-wave/W02-CONTACT-SHEET.png`  
`artifacts/product-rebuild/02-wave/{cert,cert-capture,after}/`  
Source-lock retargets: `tests/Feature/P05CompaniesWorkspaceTest.php`, `P13InboxWorkspaceTest.php`, `P14InboxCrmContextTest.php`, `P26AccessibilityTest.php`

---

## 10. Recommendation

Show the contact sheet and the 1440 FR board / Inbox open+closed shots to the product owner.

- Deals is a C-18 pipeline. Judge W02-D-01 on hierarchy (pass), not the 11 px.  
- Inbox is a conversation desk. Judge N-I-01 as leftover under a 224 rail (P2), not a missing hero.  
- Do not merge to `main`. Do not deploy. Wave 3 / SHELL-12 / list-column clip are later.

**Stop for PO visual approval.**
