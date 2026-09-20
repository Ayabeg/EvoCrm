# V02 — Impeccable review (Shopify × HubSpot revision)

**Status:** Clarify → distill → polish on the populated 1440 Home.  
**Scope:** Home / Dashboard only. V01 shell frozen. P17/P12/P15/P11 truth frozen.  
**Taste:** product-design only, after Mobbin research. Dials 4 / 3 / 7.  
**Method:** Local populated Home (`owner@evosales.local`) at 1440. Fingerprint `home-CPAfz4EZ.js`.

`/distill` did **not** remove containment. Each remaining surface groups a real information job.

---

## /clarify

Read the populated 1440: Accueil → Activation → Attention|Today module → Snapshot → Pipeline → Recent.

**What is already clear**

- Five white modules on paper. Radius 10. Border `#E3E3DF`. Width ~1088.
- Attention | Today share one operating surface. Today is no longer floating.
- Snapshot is typographic columns (620K / 2.285M / 67% / 12) at 20px. Not spreadsheet cells.
- Attention overdue is red + reason; “No next action” is mute.
- Today is time-first (`18:33` / Démo Constantine / meeting · Karim Ziani).
- Pipeline is a stacked share + labeled rows, not per-stage loading bars.

**CLARIFY FINDINGS**

- Activated setup painted a full progress rule above Attention, competing with the pipeline viz.
- Snapshot repeated `September 2026` as a module caption and as the first KPI hint.

**CLARIFY FIXED**

- Hide the activation progress bar when the workspace is already ready. Keep title, count, Dismiss.
- Remove the snapshot window caption. Period stays on KPI hints that the payload actually provides.

**CLARIFY DEFERRED**

- Today with 0 overdue / 0 today / 1 upcoming is truthful P15. Do not invent a fuller queue. The shared module height is driven by Attention.
- 1280 / 1024 / 768 finalization — human review gate.
- QRD chrome is V08.

**CLARIFY REJECTED**

- Helper sentences under Attention / Today.
- Renaming `Recent records` → “Recent activity”.
- Removing the operating-module containment because Today is sparse.

---

## /distill

**DISTILL FINDINGS**

- `windowLabel` on `HomeKpiStrip` was a second caption for data the tiles already carry.
- Activated activation bar was leftover chrome, not a setup action.

**DISTILL REMOVED/REDUCED**

- Snapshot window caption / unused `windowLabel` prop.
- Activated progress bar.

**DISTILL KEPT (meaningful groups)**

1. Activation module (P23 visible)
2. Attention + Today operating module
3. Business snapshot module
4. Pipeline module
5. Recent records module

**DISTILL DEFERRED**

- Activation presence while `visible` — P23 functionality. Dismiss stays.
- Unused `activity-feed.tsx`.

**DISTILL REJECTED**

- Removing any of the five modules because they are cards.
- Removing page `New deal` or View all.
- Removing truthful KPI hints (`vs last month` only when previous > 0).

---

## /polish

**POLISH FINDINGS**

- A gapless stacked bar still read a little like a single fill.
- Snapshot hover wash on metric columns is enough; no extra caption.

**POLISH FIXED**

- Pipeline distribution: `h-3`, 1px gaps between segments, ink/35 · ink/18 · one brand lead.
- Type floor 12 held. KPI values 20/26 held.

**POLISH DEFERRED**

- Responsive finalization.
- List/table density (V03 / V06).
- Pipeline Board furniture (V07).

**POLISH REJECTED**

- Decorative sparklines, trend arrows, glass, gradients, greeting, mascots.
- A second orange besides Create-in-chrome and the one pipeline lead segment.
