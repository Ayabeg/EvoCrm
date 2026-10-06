# P0.1 VISUAL CERTIFICATION — Gate A

**Agent:** Visual Certification (paired with Agent 04)  
**Head under test:** `02fa629f` (PR #291 workspace frame, on top of PR #290 shell `22b14d1`)  
**Compared to:** Wave 0 `artifacts/product-rebuild/00-baseline` (`89eb457` / main lineage; first-content numbers below also cite W0 `BEFORE-VISUAL-AUDIT.md`) and shell after in `artifacts/product-rebuild/01-frame/shell` / `FRAME-NOTES.md`  
**After set:** `artifacts/product-rebuild/01-frame/after` — 103 shots, commit `fd70e070`, captured 2026-10-06T18:25Z. Viewports 1440 / 1280 / 1024 / 768 / 430 / 390 · FR / EN / AR-RTL · light / dark.  
**Contact sheet:** `artifacts/product-rebuild/01-frame/P01-AFTER-CONTACT-SHEET.png` (1600×2026, current with the after set).  
**Comparison:** `artifacts/product-rebuild/01-frame/BEFORE-AFTER-COMPARISON.png` (1440×15560 — 10 rows, W0 left / P0.1 right, 1440 FR light).  
**Host:** localhost only. DatabaseSeeder + VisualQaSeeder. No extra records. No product-code edits.

Gate A scope: **one shell + one workspace frame**. Page internals may still be old. DataWorkspace views/filters folding and board chrome are **Wave 2**. Those are listed, not scored as NEW P1s.

---

## 1. Chrome vs Blueprint (1440×1000, FR, light, Full Mode)

| Route | W0 top bar | W0 first y | After top bar | After sidebar | After first y | Δ y (W0 → after) |
|---|---:|---:|---|---:|---:|---:|
| Dashboard / Accueil | 52 | 70 (greeting) | **none** | **224** | **29** (H1 Accueil) | −41 (title, not greeting) |
| Contacts | 52 | 259 | none | 224 | 209 | −50 |
| Deals list | 52 | 767 | none | 224 | 368 | −399 |
| Deals board | 52 | 843 | none | 224 | 393 | −450 |
| Contact record | 52 | 111 | none | 224 | 22 | −89 |
| Company record | 52 | (miss) | none | 224 | 14 | — |
| Lead record | 52 | (miss) | none | 224 | 14 | — |
| Inbox | 52 | 94 | none | 224 | 127 | **+33 vs W0 / +48 vs shell 79** |
| Quotes | 40 | 219 | none | 224 | 195 | −24 |
| Settings | 52 | 185 | none | 224 | 169 | −16 (still a modal) |

Shell-only first-content (FRAME-NOTES, after #290 before #291): Accueil 18 · Inbox 79 · Contacts 207 · board 791. Frame then applied WorkspaceHeader 48/40/36.

Other viewports (after):

- **1024** Contacts: sidebar **56** (icon rail). W0 stole ~212px.
- **768** Contacts: sidebar **0** (overlay). Workspace stays full width. W0 kept ~212px expanded.
- **390** Deals board: first card y=**766** (still below the fold). Overlay header, not an expanded rail. PRE-EXISTING page chrome / Wave 2.
- **AR 1440** Contacts: `dir=rtl`, sidebar width 224 (rail on the inline-start / right).
- **Dark 1440** Contacts: rail readable, distinct from canvas (not the W0 merged black slab).

---

## 2. Explicit regression verdicts

### Accueil first content 18 → 29

**Acceptable header cost. Not a P1.**

Shell after (no top bar) latched first-useful on the 27px greeting at y=18. Gate A replaced the greeting with WorkspaceHeader slot C = `t('Home')` / **Accueil** (AMB-01 / HDR-04). y=29 is the 48px title row sitting at the top of the workspace. The greeting was never the product title. Primary « Nouvelle affaire » is now a **neutral** secondary (0 orange primaries on Accueil).

P3 only: date + `Africa/Algiers` share the title row and read tight at 1440.

### Inbox first content 79 → 127 (thread 188 → 236)

**Acceptable Gate A header cost. Not a NEW P1.**

The +48px is one WorkspaceHeader title row stacked above the existing RoomShell tabs (Conversation / Tickets / Canaux). Composer stays anchored (live QA: composer bottom 884 / viewport 900). List and thread remain independent columns; the page does not scroll.

Do **not** promote this to P1 under Gate A. Desk internals + RoomShell tabs are Wave 2 / Inbox wave. Track as **NEW P2** (visual cost to watch), not a ship-blocker.

Capture hygiene: Agent 06 after shots were taken while the seeded workspace still had `inbox_url=https://desk.evotechly.com`, so those PNGs include the CSP / « desk.evotechly.com n’est pas intégré » banner. W0 baseline and this QA server cleared that URL. The banner is **PRE-EXISTING product behavior when a desk URL is configured**, not a #291 layout bug. Live QA on the native desk is the contract source for composer / scroll.

---

## 3. Scorecard (same axes as BEFORE-VISUAL-AUDIT.md)

W0 scores are copied from `docs/product-rebuild/00-baseline/BEFORE-VISUAL-AUDIT.md`. After scores are this certification.

| Axis | W0 | After | Evidence |
|---|---:|---:|---|
| Shell | **3** | **8** | `.app-topbar` gone on every after shot. Rail **224** at ≥1280, **56** at 1024, overlay ≤768. Light cabinet `#F0F2EE` vs canvas. Search + neutral Créer live in the rail. Residual: compact mobile header still has a hamburger; GAP-14 no Tâche in create. |
| Navigation | **5** | **7** | Mode pill gone. Sentence-case groups. Simple Mode membership exact `SIMPLE_NAV` (C-02 OPEN, unchanged). Agents Full-only. Residual: FR chrome still says « Leads » / « Contacts »; Inbox queues still a page column, not rail children (SHELL-11, Wave Inbox). |
| Workspace density | **3** | **5** | Accueil 29; Contacts 209 (was 259); deals list 368 (was 767); board 393 (was 843). Attention / forecast collapsed (C-18 presentation). LAW-06 still missed on lists/board — DataWorkspace + board chrome, Wave 2. |
| Lists | **6** | **7** | Same 37px rows, one orange create, views still work. 768 no longer loses a third of the grid to an expanded rail. First row 209 > 150 because SavedViews + FilterBar + thead are still below the title (not a new P1). |
| Records | **4** | **5** | Identity through WorkspaceHeader; first useful 14–22. RecordWorkspace left/center/right untouched (C-19). Lead record still English + orange « Mark Status as Complete ». Three-column grammar unchanged. |
| Pipeline | **2** | **5** | First card 843 → 393; nested scrollers 6 → 0 at 1440 FR light; cards visible above the fold at 1440. Remaining ~393px is views + filters + stage pills (Wave 2). Mobile 390 still chrome-first (y=766). |
| Inbox | **5** | **5** | Native desk + 8 threads + anchored composer still work. Conversation is still the squeezed middle; empty pane still says « Vous êtes à jour » while 8 threads list. Header +48 is acceptable cost, not an inbox-product win. Score holds. |
| Documents | **4** | **5** | Quotes header through WorkspaceHeader; one orange « Créer un devis ». Quote detail demoted Save lines to outline (FRAME-NOTES). Status « Sent » and 1-row sparse seeder unchanged. |
| Mobile | **3** | **6** | Overlay does not resize the workspace; Escape closes it; 1024 is a 56px rail. 390 Contacts shows rows (not a stolen rail). Board / filter stack at 390 still hides cards — PRE-EXISTING page chrome. |
| RTL | **6** | **7** | AR 1440: `dir=rtl`, rail on the right, tables/checkboxes mirrored. Logical rail properties from #290. Latin stage names and EN leftovers stay LTR-in-RTL. |
| Dark | **6** | **7** | Rail `#111` vs canvas `#0A0A0A` / workspace `#121212` — the frame is visible again. Icons readable. True-black lists still merge into the workspace (page, not shell). |
| Product coherence | **3** | **6** | One shell + one header grammar on the 10 acceptance routes. Accueil is a page name. One orange per list/board. Five header grammars of W0 are gone. Internals (lead English, settings modal, DataWorkspace stack, Inbox queues) still prevent a high-7. |

**Mean: 4.2 → 6.1 / 10.**

The product now has a shared frame. It does not yet have a shared *page*. That is the Gate A stop.

---

## 4. Findings by severity

Each finding is **NEW** (introduced by #290 and/or #291) or **PRE-EXISTING**, and in or out of Gate A ownership.

### NEW P0

None.

### NEW P1

None. Inbox 79→127 and Accueil 18→29 are **not** P1s (see §2).

### NEW P2

1. **Inbox title-row cost (+48px).** First folder rail 79→127; first thread bubble 188→236. WorkspaceHeader + existing RoomShell tabs. Composer still anchored. Wave 2 / Desk should fold or drop the duplicate « Boîte de réception » tab strip. **NEW (frame). Not a Gate A P1.**
2. **After Inbox PNGs show the CSP banner** when `inbox_url` was still the desk host. Capture hygiene on the after set; live native desk is clean. **NEW to the after artifact set, PRE-EXISTING product behavior with a desk URL.** Re-capture Inbox with a cleared URL before any Inbox-wave visual review.

### NEW P3

1. **Accueil title-row crowding.** « Accueil » + « mardi 6 octobre 2026 · Africa/Algiers » on one 48px row. FRAME-NOTES already flagged this. Acceptable; tighten in a later header pass.
2. **Nested rail children use the browser focus ring** (Contacts / Sociétés) while chrome controls use teal `rgb(15, 76, 92)`. Tab order itself is correct. Cosmetic.

### PRE-EXISTING P0 (Wave 2 — do not treat as NEW P1)

1. **Contacts first row y=209** (budget ≤150). SavedViews + FilterBar + thead still below the title.
2. **Deals board first card y=393** (budget ≤200 / goal ≈148). Views + search/filters + stage-count pills + column headers. Attention disclosure already removed ~400px; the rest is board / DataWorkspace internals.

### PRE-EXISTING P1 (listed, not Gate A blockers)

1. DataWorkspace still owns views + filters as separate bands (HDR-01 not fully slotted). **Wave 2.**
2. Board chrome (stage pills, column headers, card internals). **Wave 2 / Deals.**
3. Settings remains a height-capped modal (LAW-09). Nav still clips (SMS / extra WhatsApp).
4. Lead record English island + orange « Mark Status as Complete » (+ orange « New » path).
5. Inbox empty-state lie (« Vous êtes à jour ») and queues-mixed-with-channels.
6. Quote list status « Sent » (EN) in FR chrome.
7. FR/EN nav labels « Leads » / « Contacts ».
8. Quote Resend can still be orange (LAW-10 — Documents wave). Save lines was demoted only.

### PRE-EXISTING P2

1. Companies / Leads lists not on the acceptance scroll-owner list (document scroller).
2. Deal record not an acceptance route (still has a pane scroller).
3. Mobile 390 board is still chrome-first (first card y=766).
4. Money drift on Accueil (`620 k DA` / `2,3 M DA`) vs list `220 000 DA` vs Ask Evo `DZD` leftovers.
5. Two pipeline drawings on Accueil (donut + bar) — page internals.

### PRE-EXISTING P3

1. Sparse Quotes (1 seeded row) — honest seeder state.
2. Companies / Leads document titles stay English.
3. GAP-14: Tâche missing from rail create.
4. C-02 Simple nav membership still OPEN (correctly unchanged).

---

## 5. Per-route visual notes (1440 FR light unless named)

### Dashboard
Accueil title, neutral « Nouvelle affaire », KPI row unchanged. Ready-workspace 4/5 banner still above the tiles. EN stage leftovers (New / Qualified / Demo / Proposal) PRE-EXISTING.

### Contacts / Companies / Leads
Light rail, one orange create, DataWorkspace stack intact. Contacts is the healthiest list. 390 Contacts shows rows under a compact header — overlay, not a 212px rail.

### Deals list / board
The visible win of Gate A. Forecast / attention hidden behind a closed `<details>`. Cards occupy the first screen at 1440. Filters and stage pills still sit above the board (Wave 2). DnD contract unchanged (see P01-QA.md).

### Records
Header slots only. Contact / company identity is immediately under the rail. Lead record is still the noisiest FR/EN page.

### Inbox
Native three-pane desk. Composer pinned. After PNGs may show CSP banner (see §2). RTL mirrors the rail and columns.

### Quotes / Settings
Quotes: WorkspaceHeader + one orange create; one seeded row. Settings: still a dimmed modal over the shell — header adapter only.

---

## 6. Console

`artifacts/product-rebuild/01-frame/after/console-errors.json` — **103/103 empty**.  
Playwright route sweep on head — **12/12 empty** (`console` / `pageerror` / `requestfailed`).  
Same on main `1e146ff`.

This is the local production-build console, PostHog disabled. Not a claim about production or the live desk iframe.

---

## 7. Recommendation

**GO for product-owner visual review.**

Gate A delivered a real frame: no global top bar, 224/56 cabinet, one WorkspaceHeader, one orange on the acceptance lists, Accueil is a page name, Simple Mode and Ask Evo contracts hold, DnD / URL state / QuickRecord hold. Mean 4.2 → 6.1.

Do **not** merge #291 as “done” — it is still a draft stop. Do **not** send Wave 2 a NEW P0/P1 from this certification. Send the PO the comparison PNG and the after contact sheet. Expected PO notes (not blockers): Inbox +48, Accueil date crowding, remaining list/board chrome, Settings modal, lead English.

**NO-GO only if** the PO rejects the +48 Inbox title row as a ship-blocking header. This agent’s verdict: that cost is the designed 48px title, not a defect.
