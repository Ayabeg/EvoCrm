# EvoCRM V00 — Visual Foundation

**Status:** Authoritative for V01–V15.  
**Lane:** Audit + design law only. **No production UI change.**  
**Base:** latest merged `main` at `fc57d94c379968f5a987075aeb426acf0b152180` (P27 Motion, after P28 cleanup).  
**P00–P29:** Frozen. P29 Final Functional Convergence is still a draft PR (`#245`) and is **not** on this base. Rebase V01 if P29 merges.

---

## Design read (Taste §0)

Reading this as: an authenticated B2B CRM product redesign for operators who live in the app all day, with Apple restraint, HubSpot list usability, Salesforce workflow depth, and EvoCRM orange identity, leaning toward restyling the existing Aurora + `ds` primitive stack rather than a landing-page aesthetic or a new component library.

**Redesign mode (Taste §11):** visual overhaul on preserved IA. Routes, permissions, data models, Quote lifecycle, Automation semantics, and the Ask Evo security/context contract do not move.

**Taste scope honesty (Taste §13):** `design-taste-frontend` is written for landing pages and marketing redesigns. V00 uses it as the authoritative Taste skill because the V-series brief says so. Applied: brief inference, dials, product-relevant bias correction, accessibility/performance guardrails, AI-tell bans that apply to product chrome, and the redesign-audit protocol. **Not applied:** hero/bento/marquee/GSAP landing rules.

---

## Taste installed

| Field | Value |
|---|---|
| Skill | `design-taste-frontend` |
| Install command | `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"` |
| Version | **v2 (experimental)** |
| Upstream | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| Repo HEAD at install | `e79ca9ec7e071eb3a3b623c4fb752e853fc3ed58` (2026-09-16) |
| Local path | `.agents/skills/design-taste-frontend/SKILL.md` |
| Other Taste sub-skills | **Not installed** this pass |

---

## Taste dials (validated)

| Dial | Starting brief | Live reading | **Final** | Why |
|---|---|---|---|---|
| `DESIGN_VARIANCE` | 4/10 | ~2–3 accidental (shared list chrome, but Home / Inbox / Automation / Settings already fork) | **4/10** | Structured enterprise CRM. Enough compositional difference between product areas to stop every page looking like title + button + cards + table. Not 3 (too same). Not 5+ (fights CRM muscle memory). |
| `MOTION_INTENSITY` | 3/10 | 3 (P27) | **3/10** | P27 remains the motion contract. Hover / overlay only. No cinematic dashboard. |
| `VISUAL_DENSITY` | 7/10 | ~8–9 (11px labels, stacked chrome) | **7/10** | Serious CRM density: 36px controls, 48px rows, 32px page pad. Type floor 12px. Do not keep microscopic UI to look “enterprise.” |

---

## Document set

| Document | Job |
|---|---|
| [EVOCRM-VISUAL-LAW.md](./EVOCRM-VISUAL-LAW.md) | Master visual law for V01–V15 |
| [V00-AURORA-MAP.md](./V00-AURORA-MAP.md) | Aurora inventory + keep / restyle / extend / defer |
| [V00-CURRENT-UI-AUDIT.md](./V00-CURRENT-UI-AUDIT.md) | Taste audit of current surfaces |
| [V00-COMPONENT-CONTRACT.md](./V00-COMPONENT-CONTRACT.md) | Target appearance per primitive |
| [V00-SCREEN-SIGNATURES.md](./V00-SCREEN-SIGNATURES.md) | Composition identity per product area |
| [V00-REFERENCE-RESEARCH.md](./V00-REFERENCE-RESEARCH.md) | Structural research (not clones) |
| [V00-IMPLEMENTATION-MAP.md](./V00-IMPLEMENTATION-MAP.md) | V01–V15 sequence + leverage ranking |

---

## Authority stack

```text
TASTE                composition quality, anti-slop, redesign audit
AURORA               reusable UI primitives (do not replace)
EVOCRM VISUAL LAW    brand expression + tokens + surface law
P00–P29              behavior, routes, permissions, motion, a11y, responsive
```

When they conflict: **behavior wins, then accessibility, then visual law, then Taste composition, then Aurora default styling.**

---

## Production UI changed

**NO.**

P00–P29 preserved: **YES** (this branch adds documentation only).

Ready for V01: **YES**, with the open items in [V00-IMPLEMENTATION-MAP.md](./V00-IMPLEMENTATION-MAP.md).
