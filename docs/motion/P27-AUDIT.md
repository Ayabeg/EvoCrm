# P27 — Motion & micro-UX audit

**BASE / starting_ref:** `9093aae6ff4c5ebb0499dd5597b2a89222d34ccd` (P26 #238 tip).  
**Date:** 2026-09-19.  
**Lane:** Product hardening only. P00–P26 frozen. No V00–V15 redesign. No Contabo. No merge. No P29.  
**Authority:** Linear + Stripe behavior; EvoCRM tokens / type / density stay paint authority.  
**Method:** Source audit of product overlays and listed surfaces before code. Live Contabo walk is Research-owned.

---

## Existing language (split)

| Owner | Timing / easing | Surfaces |
|---|---|---|
| `aurora.css` tokens | `--motion-duration-fast` 160ms / `medium` 240ms / `slow` 360ms · `--motion-ease-out` `cubic-bezier(.2,.8,.2,1)` | Aurora trees |
| `aurora-motion.css` | Button/rail color 160–240ms; press `scale(0.98/0.97)`; toast 240ms; reduced-motion kill on rail / drawer / toast / Command OS | Shell press, create drawer, Sonner |
| Aurora Sheet | Open **300ms** / close **200ms** · `ease-in-out` · `motion-reduce` (P26) | Drawer, Ask Evo, Advanced filters, Create |
| Aurora Dialog | **200ms** fade+zoom · `motion-reduce` (P26) | Modal / confirm |
| Aurora Dropdown | Content **150ms**; items **100ms**; **no** `motion-reduce` | Menus |
| Aurora Popover | `animate-in` / zoom; **no duration token**; **no** `motion-reduce` | Popovers |
| QRD | **200ms** · `cubic-bezier(.2,.8,.2,1)` · `motion-reduce` | Peek drawer |
| Command OS | Backdrop 120ms `ease-out`; panel 150ms **`cubic-bezier(0.16, 1, 0.3, 1)`** (overshoot); rows 80ms | Palette |
| Product hovers | Mixed `duration-150` / bare `transition-colors` / `--motion-duration-fast` | Inbox, KPI, activity, lists, pipeline cards |
| Loading | Immediate `Skeleton` / `animate-pulse` / `aurora-shimmer`; Inertia `processing` for Ask Evo | Workspace, inbox, boards |
| P26 reduced-motion | Overlay `motion-reduce:*` + CSS kill on `[data-command=os]` / `backdrop` | Must stay; decorative only |

No Framer, Lottie, confetti, KPI count-up, money tween, fake Ask Evo typing, or artificial loading delay in product files.

---

## Classification

### KEEP

Already in the P27 language, or frozen by P25/P26. Do not restyle.

| ID | Surface | Why |
|---|---|---|
| K1 | P25 overflow / money / overlay viewport classes | Responsive contract. H-overflow remains a defect. |
| K2 | P26 focus rings, names, keyboard, Command OS trap | Focus stays P26. Motion must not become the only cue. |
| K3 | QRD 200ms + contract easing + `motion-reduce` | Already inside drawer 180–220ms. Peek / hydrate / Escape frozen. |
| K4 | Dropdown content `duration-150` | Matches dropdown ~150ms. Add reduced-motion only. |
| K5 | Press scale `0.98` / `0.97` | Restrained, not bounce. Wave6 locks the values. |
| K6 | Pipeline drag physics + stage menu | MASTER: do not “improve” into bounce. Keyboard path stays. |
| K7 | Dashboard KPI `formatCompactDzd` / static `%` | No counting or tile choreography. P17 2×2 frozen. |
| K8 | Quote `formatDzd` / `QUOTE_MONEY_CLASS` | Money never animated or clipped. |
| K9 | Settings `masked_url` + reveal POST | Secrets stay immediate-masked. No fade-in of raw tokens. |
| K10 | Ask Evo `processing` / “Asking…” | Real request state. No typewriter. |
| K11 | Activation progress width + `motion-reduce` | No confetti. Step IDs frozen. |
| K12 | DataWorkspace skeleton on `loading` | Immediate. No `setTimeout` delay. |
| K13 | `--motion-ease-out` `cubic-bezier(.2,.8,.2,1)` | Already the contract ease. |
| K14 | Inertia progress color (not a page fade) | Keep. Do not add route fades. |

### NORMALIZE

Product interaction states only: hover / pressed / focus (timing only) / selected / loading / open / close.

| ID | Finding | Target | Owner |
|---|---|---|---|
| N1 | Sheet open **300ms** is outside drawer 180–220 | **200ms** both ways, contract ease | `aurora/sheet.tsx` |
| N2 | Dialog **200ms** vs modal ~180 | **180ms** + contract ease | `aurora/dialog.tsx` |
| N3 | `aurora-motion.css` still uses 160/240 | Hover **120** / page **150** / drawer **200** | `aurora-motion.css` |
| N4 | Toast enter 240ms | Page **150ms** | `aurora-motion.css` |
| N5 | Command OS panel easing overshoots | Contract ease; modal **180** / page **150** backdrop | `aurora/command-palette.tsx` |
| N6 | Command / dropdown item hover 80–100ms | Hover **120ms** | palette + dropdown |
| N7 | Inbox / KPI / activity / conversations `duration-150` hover | Hover **120ms** + `motion-reduce` | listed surfaces |
| N8 | Pipeline card `--motion-duration-fast` (160ms) | Hover **120ms**; keep `motion-reduce:transition-none` | `pipeline-kanban.tsx` |
| N9 | List / settings nav hover has no duration token | Shared hover class | list + settings |
| N10 | Popover / dropdown lack reduced-motion | `motion-reduce` + dropdown **150ms** | popover + dropdown |
| N11 | Reduced-motion `transform: none` on `[data-command=os]` fights centering `translate(-50%,-50%)` | Kill animation/transition only on the palette; keep layout transform | `aurora-motion.css` |
| N12 | Decorative `animate-pulse` / `aurora-shimmer` ignore reduced-motion | Hard-kill decorative loops | `aurora-motion.css` |
| N13 | Split token names (`fast`/`medium` vs product roles) | Add `--motion-duration-{hover,dropdown,drawer,modal,page}` via existing CSS | `app.css` + `lib/motion.ts` |

### REMOVE

Banned motion that must stay absent (lock in tests). Nothing product-facing to delete.

| ID | Anti-pattern | Status |
|---|---|---|
| R1 | Framer / Lottie / mesh / bounce / spring | Absent. Keep absent. |
| R2 | Page-level fades / scroll hijacks | Absent on Inertia app. Keep absent. |
| R3 | KPI count-up / tile choreography | Absent. Keep absent. |
| R4 | Money tween / misleading DZD | Absent. Keep absent. |
| R5 | Ask Evo fake typing / fake latency | Absent. Keep absent. |
| R6 | Activation confetti | Absent. Keep absent. |
| R7 | Artificial loading delay | Absent. Keep absent. |
| R8 | Accidental secret reveal animation | Absent. Keep absent. |

### DEFER_TO_VISUAL

Not P27. Do not restyle, recolor, or rebuild.

| ID | Item | Why |
|---|---|---|
| V1 | `aurora-components.css` vendor 360ms drawers / infinite pulses | Unused marketing/catalog widgets. Touching them is a visual pass. |
| V2 | `zoom-in-95` overlay scale | Restrained; changing scale is paint. Timing only here. |
| V3 | shadcn `sidebar.tsx` `duration-200 ease-linear` | Chrome width, not product overlay language. |
| V4 | Auth underline / OTP caret blink | Outside listed product surfaces. |
| V5 | Press-scale numeric tweak beyond Wave6 locks | Visual feel. |
| V6 | Phosphor / Lucide mix | Research consistency, not motion. |
| V7 | `#929292` / accent / canvas tokens | Wave0 / P26 DEFER-VISUAL. |
| V8 | Phone widths &lt;768 | P25 DEFER-VISUAL. |
| V9 | P28 legacy deletion | Next phase. |

---

## Surface notes (items 5–15)

| Surface | Verdict | Must not |
|---|---|---|
| Shell | NORMALIZE press/hover tokens; KEEP 64/240 rail | New chrome |
| DataWorkspace | KEEP skeleton; NORMALIZE row hover | Query / selection |
| QRD | KEEP 200ms; token-bind | Peek / hydrate / Escape |
| Pipeline | NORMALIZE card hover only | Drag physics / attention |
| Inbox | NORMALIZE folder/row hover | Native/embed, P26 names |
| Dashboard | NORMALIZE KPI link hover | KPI sources, counting, 2×2 |
| Quotes | KEEP static money | Recalc / clip / tween |
| Automation | KEEP (no overlay motion) | Authoring / history |
| Settings / integrations | NORMALIZE nav hover; KEEP reveal-only | Secrets in initial DOM |
| Activation | KEEP progress `motion-reduce` | Confetti / new steps |
| Ask Evo | KEEP real busy; inherit drawer 200ms | Fake typing / second LLM |

---

## Risks

- Over-animating tables (MASTER). Hover color only; no row slide.
- Wave6 locked Sheet `duration-300` — P27 owns that lock and updates it.
- P26 Pest locks handoff text “P27 is **not started**” — leave `docs/accessibility/P26-P27-HANDOFF.md` historical.
- Command OS centering uses `transform`; reduced-motion must not zero it.

---

## Out of scope

Lottie, mesh, bounce, Framer (not in tree), page fades, P28 deletes, P29/V00, Contabo deploy, merge.
