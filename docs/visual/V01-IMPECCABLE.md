# V01 — Impeccable review

**Status:** Clarify → distill → polish completed on PR #247 (`cursor/v01-app-shell-chrome-fbcb`).  
**Scope:** V01 global chrome only — rail, topbar, Command OS, RoomShell contextual tabs, shared type / button / input / surface / badge / menu foundations.  
**Taste:** product-design reasoning only. Dials 4 / 3 / 7.  
**Authority:** `EVOCRM-VISUAL-LAW.md`, V00 contracts, Aurora tokens. P25 / P26 / P27 and all P00–P29 behavior stay.

No dashboard / Contacts / list-body redesign. No route, permission, or Command OS orchestration change. No merge.

---

## /clarify — shell copy

Read the authenticated chrome path: rail groups → topbar search / Ask Evo / Create / Tasks / profile → Command OS → RoomShell contextual tabs.

**What is already clear**

- Rail destinations keep the locked nouns (Home, Contacts, Companies, Deals, Pipeline, Inbox, Activities, Quotes, Workflows, Settings, More overflow).
- Search placeholder and accessible name stay `Search EvoCRM…` (P-locked; French `Rechercher EvoCRM…`).
- Create menu uses the same object nouns as the rail (Contact / Company / Deal / Quote) under a labeled Create control.
- Command OS product copy is an operator sentence: `Search, navigate, create, or act`. Sections are Recent / Search / Create / Act / Ask Evo / Navigate. Failure copy names recovery (`Search unavailable — navigate, create, and actions still work`).
- RoomShell titles are `sr-only`; tabs keep their hrefs as quiet section links.

**Shell fixes made**

- Rail wordmark and `aria-label` were `EvoCRM` while the locked lockup (auth, `AppLogo`, BrandingTest) is **EvoCrm**. Aligned the visible / announced rail name to `EvoCrm`. Search string is unchanged.
- Removed the inner More-panel heading that restated `More` after the group label and the More button.

**Deferred (do not change in V01)**

- Sparkle is named Ask Evo and opens Command OS (P16). Do not retarget. Record Ask Evo remains a later V.
- Command dialog `aria-label="Command palette"` and input `aria-label="Search commands"` are P26 locks. Product placeholder is already the clearer sentence.
- `Toggle sidebar` is the sidebar primitive’s accessible name (P-locked). Do not rewrite.
- Create menu stays object nouns, not `Create contact` sentences (those belong on page primaries in V02–V14).
- Command OS section / status strings stay English keys; French day-1 chrome does not include them.
- RoomShell still lists destinations the rail already names (Home / Contacts / Inbox…). Hiding those tabs would be a behavior change. Visual demotion already landed in V01 paint.

---

## /distill — chrome essence

Primary job of V01 chrome: tell the operator **where they are** and give **one command path** plus **one create**.

**Essence kept**

- 64 / 240 paper rail + 48 solid topbar.
- One Command OS (search field, ⌘K, Sparkle).
- One orange Create.
- RoomShell as contextual text, not a second product nav.

**Shell fixes made**

- Active rail no longer paints orange type on top of accent-soft wash while Create is also orange (Visual Law §12 / §13). Active is wash + ink + filled icon.
- More panel no longer carries a second `More` header.
- Off-scale chrome gaps (`gap-1.5`, `gap-2.5`, `py-1.5`, `px-2.5`, Command `10px` / `7px`) moved onto the 4 / 8 / 12 scale.

**Deferred (page content / later V)**

- Page-level orange Creates (`Nouvelle affaire`, `Créer un contact`, list / pipeline primaries) still compete with global Create. V02–V14.
- Home widget cards, KPI tiles, decorative `box-shadow: 0 1px 0` — V02.
- List / table density, filter-band cards, saved-view pills — V03+.
- Inbox desk columns, pipeline board cards, quote paper, automation canvas, settings forms — V07–V13.
- RoomShell tab *presence* on Activities / Automation / Inbox / Tickets / Segments — consume in those V-phases; do not delete in V01.
- Unused `MORE_ITEMS.category` metadata — not painted; grouping would add chrome.
- Ask Evo + Search both opening Command OS — required P16, not noise.

---

## /polish — shipping vs V00 / Taste

Verified against Visual Law, V00 component contract, and the V01 implementation record.

**Shell fixes made**

- Active rail: `bg-sidebar-accent` + `text-sidebar-ink` + filled Phosphor. No orange label, no orange icon, no solid orange block.
- Wordmark: `EvoCrm` on the rail, matching auth lockup.
- Menus: dropdown / sub-menu / select panel use `--aurora-radius-2` (10). Offset 8. Matches popover and the More flyout.
- Command OS: 8px search-row and result gaps; 8px footer padding. Selected row remains accent-soft wash without an orange rule.
- RoomShell / topbar / Create / profile-menu spacing on the core scale.
- Shared Badge default remains neutral/soft (not cyan). Buttons / inputs remain 36 / 8. Dialog remains 12. Focus remains orange.

**Intentionally untouched**

- P26 focus ring (no glow).
- P27 durations / reduced motion.
- P25 no document H-overflow utilities.
- Command catalog, Create `?create=1` destinations, collapse cookie, simple-mode leaf swap.

---

## SHELL FINDINGS FIXED

1. Rail wordmark / nav name `EvoCRM` → `EvoCrm`.
2. Active rail orange text + orange icon → accent-soft wash + ink + filled icon.
3. Redundant More-panel `More` heading removed.
4. Chrome spacing snapped to 4 / 8 / 12 (rail, topbar, Create, RoomShell, Command OS, profile menu).
5. Dropdown / select menus to radius 10 and 8px offset.

## DEFERRED TO V02–V15

| Finding | Phase |
|---|---|
| Page-level orange Creates competing with global `+ Create` | V02–V14 |
| Home widgets as cards; KPI tiles; widget hairline shadow | V02 |
| Contacts / Companies / Leads / Deals / Quotes list body, filter band, table density | V03–V06, V11 |
| Pipeline board / forecast furniture | V07 |
| QRD private hex theme; record property-group cards | V08 |
| Activities queue still mounting CrmShell tabs | V09 |
| Inbox desk columns + DeskShell tab row presence | V10 |
| Quote builder paper / inner cards | V11 |
| Automation RoomShell + canvas chrome | V12 |
| Settings form clusters | V13 |
| Ask Evo drawer / answer column (Sparkle→Command OS stays) | V14 |
| Command `aria-label="Command palette"` / `Search commands` | P26 lock — do not restyle |
| `Toggle sidebar` accessible name | sidebar primitive lock |
| `Search EvoCRM…` vs `EvoCrm` lockup spelling | P-locked search string |
| Lucide leftovers outside shell; combobox; dark cabinet; official Aurora Sidebar / DataTable | later / never |

---

## Contracts preserved

- No H-overflow utilities added or removed.
- Focus remains `--sidebar-ring` / accent orange.
- `prefers-reduced-motion` and P27 timings unchanged.
- No functional, route, or Command OS catalog change.
