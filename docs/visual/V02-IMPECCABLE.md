# V02 — Impeccable review

**Status:** Clarify → distill → polish completed on PR #250 (`cursor/v02-dashboard-operating-home-fbcb`).  
**Scope:** Home / Dashboard operating home only. V01 shell frozen. P17/P12/P15/P11 truth frozen.  
**Taste:** product-design reasoning only. Dials 4 / 3 / 7.  
**Method:** Populated local Home (`owner@evosales.local`) at 1440, then 1280 / 1024 / 768.

---

## /clarify

Read the populated Home: page context → Attention | Today → KPI snapshot → Pipeline → Recent.

**What is already clear**

- Attention and Today sit above KPIs. Frozen titles `Needs attention` / `Today` remain.
- Page Create is secondary; global Create stays the orange command.
- KPI numbers are truthful P17 values (no invented trends).
- Recent is a secondary feed under Pipeline.

**CLARIFY FINDINGS**

- Attention and Today read as one wide list at 1440 — no column joint.
- Pipeline bars sized by deal *count* made every populated stage a full-width rule (seed: 3 deals each). Commercial difference lives in *amount*.
- Activation “Workspace ready” still painted a full-width orange bar, so the first color after Create was onboarding chrome.

**CLARIFY FIXED**

- Attention | Today: `lg` hairline joint (`lg:border-l lg:border-hairline`) with 32px inner pad.
- Pipeline bar width uses `amount_cents` (existing stage truth), not count.
- Activation progress fill is ink, not brand orange.

**CLARIFY DEFERRED**

- Today with 0 overdue / 0 today / 1 upcoming is truthful P15. Do not invent a fuller queue.
- QRD chrome (hex, tabs) is V08.
- Frozen activation nouns (`Workspace ready`, `Get started`, `Dismiss`).

**CLARIFY REJECTED**

- Helper sentences under Attention / Today (“Deal exceptions”, “Your schedule”) — already removed; do not reintroduce.
- Renaming `Recent records` → “Recent activity” — P17 lock.

---

## /distill

**DISTILL FINDINGS**

- Activation collapsed helper (“Optional steps can wait.”) added a third line under a finished setup band.
- Activation complete ticks and secondary links used brand orange.
- Pipeline `h-1.5` / `bg-ink/55` bars read as heavy rules, not a quiet overview.

**DISTILL REMOVED/REDUCED**

- Collapsed activation helper paragraph (dismiss + progress remain).
- Activation complete ticks: ink, not orange.
- Activation secondary CTA: mute, not brand.
- Pipeline bars: `h-1` / `bg-ink/35`.
- Home widget cards, shadows, 11px captions, orange View all, orange page Create — first implementation.

**DISTILL DEFERRED**

- Activation band presence while visible — P23 functionality. Dismiss stays.
- Unused `activity-feed.tsx` (not mounted on Home).

**DISTILL REJECTED**

- Removing page `New deal` or View all links.
- Removing KPI hints that the payload actually provides (`vs last month` only when previous > 0).

---

## /polish

**POLISH FINDINGS**

- Queue hover was a no-op (`hover:bg-transparent`).
- First/last row padding exceptions fought the hover wash.
- KPI `lg:text-kpi` (28) shouted past Attention.

**POLISH FIXED**

- Queue / stage rows: radius 10, `-mx-2` + `hover:bg-subtle`, P27 120ms.
- KPI values locked at 20/26.
- Type floor 12 on Dashboard copy.
- Page header 28/34/650 + 24 bottom; page pad 32.

**POLISH DEFERRED**

- List/table density on Contacts / Deals (V03 / V06).
- Pipeline Board furniture (V07).

**POLISH REJECTED**

- Decorative sparklines, trend arrows, glass, gradients.
- Giant greeting / hero whitespace.
