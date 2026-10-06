# P0.1 VISUAL CERTIFICATION — Gate A (final stack)

**Product head:** `39c7de4e` (PR #291 + shell `1e5eb94` / PR #290)  
**Compared to:** W0 `artifacts/product-rebuild/00-baseline` and shell `artifacts/product-rebuild/01-frame/shell` (`cf2f2ec8`)  
**After set:** recaptured 2026-10-06T19:21Z with workspace `inbox_url=null` (no CSP banner). 103 shots.  
**Sheets:** `P01-AFTER-CONTACT-SHEET.png` (1600×2026, current) · `BEFORE-AFTER-COMPARISON.png` (1440×5400, 10 routes W0 left / final right, 1440 FR light)

---

## 1. First-content y @1440 FR light — before / shell / final

Measured by `capture.mjs` `contentStartY`. Shell column is `01-frame/shell` (Agent 05 after, `cf2f2ec8`). Final is this recapture on `39c7de4`.

| Route | W0 before | Shell | Final | Notes |
|---|---:|---:|---:|---|
| Dashboard / Accueil | 70 | 18 | **29** | Greeting → Accueil title row. Acceptable header cost |
| Contacts | 259 | 207 | **209** | DataWorkspace stack. Budget ≤150 not met |
| Deals list | 767 | 715 | **717** | Attention restored (R06-01) |
| Deals board | 843 | 791 | **793** | Forecast + attention restored. Budget ≤200 not met |
| Contact record | 111 | 59 | **22** | |
| Company record | (miss) | 35 | **14** | |
| Lead record | (miss) | 35 | **14** | |
| Inbox | 94 | 79 | **42** | Quiet header (R06-03) + no CSP banner. Folder rail is first useful. Shell/old-after 79 included desk-URL chrome |
| Quotes | 219 | 179 | **195** | |
| Settings | 185 | 185 | **169** | Still a modal |

Also measured (not acceptance, for completeness): Companies 238 · Leads 194 · Inbox thread 151 · Quote document 21 · Accueil Simple 29.

**Accueil 18→29:** acceptable header cost. Not a P1.  
**Inbox 79→42 (this capture) / 79→127 (invalid first-pass after with a visible title + desk URL):** quiet header is a win. Not a P1. The first-pass +48 is gone.

---

## 2. Scorecard (W0 → final)

| Axis | W0 | Final | Evidence |
|---|---:|---:|---|
| Shell | 3 | **8** | No top bar; 224/56/overlay; first-paint collapse stays 56; light cabinet |
| Navigation | 5 | **7** | Hierarchy + Simple Mode lock. Top-level teal focus. Child Contacts still ink-secondary |
| Workspace density | 3 | **4** | Accueil 29, Contacts 209. Deals back to 717/793 after R06-01 |
| Lists | 6 | **7** | One orange create; 768 no longer steals width |
| Records | 4 | **5** | Header slots; internals old |
| Pipeline | 2 | **3** | −50px vs W0 from losing the top bar. Attention slab is back. Cards at 793/1000 |
| Inbox | 5 | **6** | Quiet header, y=42, no CSP, composer anchored. Empty-state lie remains |
| Documents | 4 | **5** | One orange create; Save lines outline on detail |
| Mobile | 3 | **6** | Overlay + Escape; 1024 rail 56. 390 board still chrome-first |
| RTL | 6 | **7** | AR rail x=1216 |
| Dark | 6 | **7** | Rail ≠ canvas |
| Product coherence | 3 | **6** | One shell + one header. Deals still looks like the old page inside it |

**Mean: 4.2 → 5.9 / 10.** Target coherence 9.0; after **6.0**; gap **3.0**.

---

## 3. Findings

### NEW P0
None.

### NEW P1
None.

### NEW P2
None that Gate A owns.

### NEW P3
1. Accueil date + `Africa/Algiers` share the 48px title row.
2. Nested CRM child (Contacts) Tab outline is `rgb(74, 90, 99)`, not teal. Top-level rail is teal.

### PRE-EXISTING P0 (Wave 2)
1. Contacts first row y=209.
2. Deals board first card y=793 / list y=717.

### PRE-EXISTING P1 (listed, not Gate A blockers)
DataWorkspace views/filters bands; board chrome; Settings modal; lead English + orange New; Inbox « Vous êtes à jour »; FR/EN Leads/Contacts; quote Sent / Resend orange.

---

## 4. Console

103/103 after empty. 12/12 sweep empty on main and head.

---

## 5. Recommendation

**GO for product-owner visual review.**

R06-01 honesty: the board is 793 because forecast/attention are visible again. That is the C-18 question, not a NEW P1. Do not merge to main. Stop for PO approval.
