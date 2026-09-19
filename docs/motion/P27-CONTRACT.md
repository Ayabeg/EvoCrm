# P27 — Motion & micro-UX contract

**BASE:** `9093aae6ff4c5ebb0499dd5597b2a89222d34ccd`  
**Lane:** One restrained interaction language. Fast / stable / premium — not playful, bouncy, or cinematic. **Not a visual redesign.**

P25 responsive + P26 a11y stay in force. P26 reduced-motion overrides decorative motion. Focus rings and names stay P26.

---

## Timing

| Role | Duration | Use |
|---|---|---|
| **Hover / pressed color** | ~120ms | Wash, border, text color |
| **Dropdown / popover** | ~150ms | Menu / popover open-close (opacity + small translate) |
| **Page / toast / backdrop** | ~150ms | Toast enter, command backdrop, non-route chrome |
| **Modal / Command OS panel** | ~180ms | Dialog, palette panel |
| **Drawer / sheet / QRD** | 180–220ms (**200ms**) | Sheet, Create, filters, Ask Evo, QRD |

**Easing:** `cubic-bezier(.2,.8,.2,1)` (`--motion-ease-out`). **No bounce. No overshoot. No spring.**

**Properties:** `opacity`, `transform`, and matching `color` / `background-color` / `border-color`. No layout animation on tables. No page-level fades. No scroll hijacks.

---

## Shared tokens

| Export | File | Value |
|---|---|---|
| `--motion-duration-hover` | `resources/css/app.css` | `120ms` |
| `--motion-duration-dropdown` | same | `150ms` |
| `--motion-duration-page` | same | `150ms` |
| `--motion-duration-modal` | same | `180ms` |
| `--motion-duration-drawer` | same | `200ms` |
| `--motion-ease-out` | `aurora.css` (existing) | `cubic-bezier(.2,.8,.2,1)` |
| `P27_*` / `MOTION_*_CLASS` | `resources/js/lib/motion.ts` | Class twins |

Prefer these over local `duration-150` / `duration-300`. Do not add Framer, Lottie, or a second motion library. Aurora `--motion-duration-fast/medium/slow` remain vendor aliases; product chrome uses the P27 names.

Product CSS: `resources/css/aurora-motion.css` (imported last from `app.css`).

---

## States (only these)

| State | Rule |
|---|---|
| **Hover** | Color/border 120ms. No lift, glow, or bounce. |
| **Pressed** | Existing `scale(0.98)` button / `0.97` rail. Color 120ms. |
| **Focus** | **P26 owns the ring.** Timing may match hover; do not restyle outline. |
| **Selected** | Instant wash + existing `aria-current` / `aria-selected` (P26). No selection choreography. |
| **Loading** | Immediate skeleton / `aria-busy`. **No artificial delay.** Pulse/shimmer die under reduced-motion. |
| **Open / close** | Overlay tokens above. One primary motion per region. |

---

## Surface contract

| Surface | Must | Must not |
|---|---|---|
| **Shell** | Rail/button press via `aurora-motion.css`; hover 120ms | New chrome, header layout |
| **DataWorkspace** | Row hover 120ms; skeleton immediate | Row slide, query/selection change |
| **QRD** | 200ms drawer; `motion-reduce` | Change peek / hydrate / Escape |
| **Pipeline** | Card hover 120ms; `motion-reduce` | Change drag physics / attention |
| **Inbox** | Folder/row hover 120ms | Restyle iframe, drop P26 names |
| **Dashboard** | KPI link hover 120ms | KPI counting, tile stagger, 5th tile |
| **Quotes** | Static `formatDzd` | Money tween, clip, recalc |
| **Automation** | No new motion | Authoring / history semantics |
| **Settings + integrations** | Nav hover 120ms; secrets **masked until POST** | Animate raw `access_token` into DOM |
| **Activation** | Width 120–150ms + `motion-reduce` | Confetti, new steps |
| **Ask Evo** | Drawer 200ms; real `processing` | Fake typing / fake latency |
| **Modals / menus** | Modal 180 / dropdown 150 + `motion-reduce` | New overlay system |

---

## Reduced motion (hard)

`prefers-reduced-motion: reduce` **disables decorative** transition/animation (press scale, overlay `animate-in`, toast, pulse, shimmer, command enter).

- P26 `motion-reduce:*` on Dialog / Sheet / QRD / kanban / activation **stays**.
- Command OS **keeps** its centering `transform: translate(-50%, -50%)`. Reduced-motion must not zero layout transforms.
- Focus visibility is not decorative.

---

## Frozen rails

P00–P26 product behavior, routes, Inertia names, POST/PATCH. P09/P10 QRD, P11 board physics, P12 attention, P13/P14 inbox, P17 KPI 2×2, P18 quote math, P19/P20 automation, P21 IA, P22 reveal-only secrets, P23 step IDs, P24 `AskEvoContext`, P25 overflow, P26 names/focus.

---

## Tests

```bash
php artisan test --filter=P27
php artisan test --filter=P25
php artisan test --filter=P26
npm run types:check
npm run lint:check
npm run build
composer ci:check
```

- `tests/js/p27-motion.ts` — token meaning
- `tests/Feature/P27MotionTest.php` — source-locks
- Wave6 motion assertions updated to P27 drawer **200ms**
- P25/P26 Pest stay green without editing those contracts

---

## Contabo / merge

Agents do **not** deploy. Humans do not merge this PR as a visual redesign.

- `READY_FOR_CONTABO`: set in the implementation report after CI-equivalent commands are green.
- `MERGE READY: NO` — Contabo populated QA + human review still required.

---

## Out of scope

Lottie, mesh, bounce, Framer, page fades, P28 deletes, P29/V00, KPI choreography, money animation, fake AI latency.
