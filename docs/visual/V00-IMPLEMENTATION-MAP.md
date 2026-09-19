# V00 — Implementation map

V00 does not implement V01.

This file is the sequence, the shared primitives that must be solved early, and the resource ranking.

---

## High-leverage primitives (solve once)

Ranked by how many V01–V15 screens inherit the change.

### HIGH LEVERAGE

Do these in V01 (and the token pass that V01 owns). Later screens must not reimplement them.

| Primitive | Why it inherits | First consumer |
|---|---|---|
| Typography tokens + type floor | Every surface | V01 shell, then all |
| Color deltas (hover, soft, success/warn/danger, border strong) | Every control and status | V01 |
| Page geometry (32 / 24 / section 32) | Every authenticated page | V01 |
| Surface law (canvas / surface / subtle, no card stacks) | Home, lists, records, settings | V01–V02 |
| Buttons 36 / radius 8 / one accent CTA | Every page | V01 |
| Inputs / search / select 36 / radius 8 | Filters, settings, composers | V01 |
| Popover / dropdown / dialog / drawer paint | Command, QRD, filters, Ask Evo | V01 |
| Badges (kill cyan default) | Lists, pipeline, quotes, inbox | V01 |
| Navigation + topbar | Whole product | V01 |
| Table row + header type | V03–V06, V11 | V01 tokens, V03 first list |
| Filter band + saved views | V03–V07, V11 | V03 |
| Focus / motion consumption | Already P26/P27; do not restyle rings | V01 verify only |

### MEDIUM

Shared, but can wait until the first screen that needs the restyle.

| Primitive | First screen |
|---|---|
| KPI strip (not cards) | V02 Dashboard |
| Home / widget surfaces | V02 |
| Kanban column + card | V07 (tickets inherit) |
| Record header + property groups | V08 |
| Timeline / activity item | V08 / V09 |
| Inbox row + thread header | V10 |
| Quote paper canvas | V11 |
| Settings form card (saveable group only) | V13 |
| Empty / skeleton shapes per signature | each V, using shared EmptyState |
| RoomShell retirement | V01 decision, consume in V03+ |

### SCREEN-SPECIFIC

Do not generalize these into a new primitive until a second screen needs the same composition.

| Item | Screen |
|---|---|
| Activation band | V02 / V14 |
| Deal attention line | V06 / V07 |
| Pipeline forecast rail | V07 |
| Quote delivery / send / revoke cluster | V11 |
| Automation canvas chrome | V12 |
| Integrations app row | V14 |
| Ask Evo answer column | V14 |
| Board won/lost dock | V07 only if needed |

**Law:** Do not create 15 independent implementations of Button, Input, table row, or filter bar.

---

## V01–V15 sequence

| Phase | Surface | Inherits | Unique work | Stop condition |
|---|---|---|---|---|
| **V01 Shell** | Rail, topbar, Command OS, token/bridge restyle, button/input/dialog/drawer/badge | — | Brand in chrome. RoomShell policy. Type + color law in CSS. | 1440/1280/1024/768 no page H-overflow. P26 focus still orange. No route changes. |
| **V02 Dashboard** | Home | V01 tokens, buttons, type, surface | Attention-first signature. KPI strip. Kill widget shadows. | Activation and P17 hooks unchanged. |
| **V03 Contacts** | First list | V01 + DataWorkspace restyle | Filter band + table rhythm as the template | list-query, peek, columns frozen |
| **V04 Companies** | List | V03 | Almost inherit-only. Domain columns stay. | No new table primitive |
| **V05 Leads** | List | V03 | Path filters only if already present | Lead OS semantics frozen |
| **V06 Deals** | List | V03 | Slim attention line | Bulk + query frozen |
| **V07 Pipeline** | Board | V01, V06 chrome | Board-first signature, kanban restyle | Move POST + stages frozen |
| **V08 QRD + Record** | Inspector + 3-pane | V01 drawers, type | Tokenize QRD. Flatten property groups. | Peek/show contracts frozen |
| **V09 Activities** | Queue | V01, V08 timeline | Drop redundant RoomShell. Queue band. | P15 groups/complete frozen |
| **V10 Inbox** | Desk | V01, adaptive shell | Desk signature. Slim context. | Native + embed stay |
| **V11 Quotes** | List + builder | V03 list, V08 rail | Paper canvas signature | Lifecycle frozen |
| **V12 Automation** | Authoring | V01 headers | Canvas + history. No display-2 fork. | Workflow payloads frozen |
| **V13 Settings** | Admin IA | V01 type/forms | Form-column signature. Radius 8/10. | P21 IA frozen |
| **V14 Integrations + Activation + Ask Evo** | Apps, Home band, AI | V02, V13, V08 | Connect rows. Activation band. 13px AI. | P22/P23/P24 frozen |
| **V15 Convergence** | Whole product | All | Kill leftover 11px, hex QRD, RoomShell, HairlineTable drift, Lucide-on-touch | Visual QA vs this law. No new signatures. |

---

## V01 must ship (so later phases inherit)

1. Visual Law hex + type tokens in `app.css` / bridge (no component rewrite beyond what those tokens paint).
2. Button default height 36, radius 8, filled accent.
3. Input / select / tabs 36, radius 8.
4. Dialog 12, drawer 0.
5. Badge default not cyan.
6. Rail + topbar restyle (active wash, group type 12–13, search field).
7. PageHeader spacing aligned to 32 / 24.
8. Document RoomShell: hide on destinations the rail already names.
9. 1440 screenshot pass that V00 could not run, plus 1280 / 1024 / 768 overflow.

V01 may touch CSS and shell presentation. It may not change navigation hrefs or Command OS sections.

---

## Audit method limits

| Need | Status |
|---|---|
| Source + token audit | Done |
| Taste redesign protocol | Done |
| Mobbin structural research | Done |
| Populated 1440 browser pass | **Not done** (no PHP in this environment) |

V01 starts by photographing Dashboard, Contacts, Pipeline, a Contact record, Inbox, Quotes, Settings at 1440 and attaching diffs to this audit. If a finding here is wrong on the populated app, the screenshot wins and this file is amended. Behavior still does not change.

---

## Blockers

| Item | Severity | Notes |
|---|---|---|
| P29 draft PR `#245` not merged | Process | V00 based on latest merged main (`fc57d94`). Rebase V01 if P29 lands. |
| No local PHP / vendor / seed | Audit | 1440 populated pass deferred to V01 start. |
| QRD hex private theme | Visual | Restyle in V08, tokenize earlier if V01 token pass can absorb it without behavior change. |
| Badge `cyan` default | Visual | Fix in V01 bridge. |
| RoomShell second nav | Visual | Policy in V01, consume per screen. |

---

## Open visual questions

1. **Sidebar paper vs residual black-cabinet docs.** Live `app.css` paper rail (`#F7F7F5`) is the law. Brandbook historical black rail stays historical.
2. **Accent-soft:** law `#FFF1EA` vs live 10% rgba. V01 uses the hex wash. Confirm selected-row contrast at 1440.
3. **Success / warning / danger hex** change semantic paint only. Confirm badges and quotes status still read (P26: status is already text + tone).
4. **Saved-view pills:** keep pill radius 999 (exception) or square them to 8? **Keep 999.** They are chips, not cards.
5. **Home 2-column after KPI:** keep two columns (variance 4) or go attention-full + side rail? **Keep two columns** under attention.
6. **Ask Evo topbar Sparkle** opening Command OS is P16 behavior. Do not retarget the control in V-series. Presentation only.
7. **HairlineTable** in ads/outbound/attributes: converge in V15 only if those screens are in scope. They are not a V03–V06 blocker.
8. **Dark cabinet:** out of V01–V15.

---

## Ready for V01

**YES.**

Production UI changed in V00: **NO.**  
P00–P29 preserved: **YES.**  
Do not implement V01 in the V00 branch.
