# W02 — Deals composition report

**Wave:** 2 · **Lane:** Deals / Pipeline presentation + shared lang  
**Branch:** `cursor/w02-deals-impl-5d72`  
**Base:** `cursor/simple-mode-nav-c02-fa6d`  
**PR:** draft into that base  
**Host:** localhost only (`http://127.0.0.1:8000`). No deploy, DNS, production, or invented records.

**Login:** `owner@evosales.local` / `password`  
**Workspace:** Evotechly · Full Mode · 15 seeded deals · 1 pipeline · 6 stages  
**Capture:** `scripts/product-rebuild/deals-after-capture.mjs` (same band + first-useful selectors as the W02 audit) → `artifacts/product-rebuild/02-wave/after/deals/`

---

## 1. What shipped

C-18 approved: no permanent Forecast / Attention slab. Functionality stays.

| Before (default stack) | After |
|---|---|
| WorkspaceHeader | WorkspaceHeader (identity + compact Saved Views + forecast one-liner) |
| DealForecastBar slab | `DealForecastSummary` in header slot L (`data-testid="forecast-summary"`) |
| DealAttentionQueue slab | Follow-up saved-view tab → existing `attention=needs_attention` |
| SavedViews sibling band | Embedded in header views row (Deals `chromeDensity="compact"` only) |
| FilterBar | One compact toolbar (pipeline when >1, List/Board, search, filters, advanced) |
| StagePills on Deals | Removed. Column headers show stage, count, value from the pipeline |
| List / Board | Same `deal-layout.ts` state. No `view=open`, no forecast route, no `/crm/deals/attention` |

Tickets still render StagePills. Contacts / Quotes stay on default stacked chrome (`chromeDensity` default). `DealForecastBar` (`forecast-totals`) and `DealAttentionQueue` (View all) remain in tree for P12 / forecast math; they are not default-mounted.

---

## 2. Files changed

**Chrome / Deals**

- `resources/js/pages/crm/deals/board.tsx`, `index.tsx`, `deal-pipeline-board.tsx`
- `resources/js/components/crm/crm-list-shell.tsx`, `deal-forecast-summary.tsx` (new), `deal-forecast-bar.tsx`, `deal-attention-queue.tsx`, `board-options-sheet.tsx`, `pipeline-switcher.tsx`
- `resources/js/ds/chrome/PageHeader.tsx`
- `resources/js/ds/workspace/DataWorkspace.tsx`, `FilterBar.tsx`, `SavedViews.tsx`, `types.ts`, `QuickRecordDrawer.tsx`, `record-adapters/deal.ts`
- `resources/js/lib/deal-attention.ts`
- `app/Services/Crm/DealAttentionEvaluator.php`

**Shared lang (fr / en / ar together)**

- `lang/fr.json`, `lang/en.json`, `lang/ar.json` — identical 2002 keys
- Quotes call sites migrated to `Amount (DA)`: `quotes/index.tsx`, `quote-split-builder.tsx`
- `Amount (DZD)` key left in place (storage / automation / other owners)
- `You're all caught up.` **not** edited

**Tests**

- Retargeted: `P01WorkspaceFrameTest` (C-18), `P11DealsPipelineBoardTest:65`, `CrmPipelineWorkspaceTest`, `P07DealsWorkspaceTest` (StagePills ticket-only)
- P12 overdue reason now asserts `:subject was due :when` + `reason_replace.subject`
- New: `tests/Feature/W02DealsCompositionTest.php`

**Verify / docs**

- `scripts/product-rebuild/deals-after-capture.mjs`
- `artifacts/product-rebuild/02-wave/after/deals/**`
- this file

---

## 3. First useful content Y (FR light, same selectors as the audit)

Audit first-useful = first **deal card** (board) or first **table row** (list). Column headers are also useful pipeline content (stage + count + value); both are reported.

| Viewport | Board card Y before → after | Board column header after | List row Y before → after | List thead after |
|---|---|---|---|---|
| 1440×1000 | 792.5 → **211** | **156** | 717 → **186** | **150** |
| 1280×900 | 836.5 → 211 | 156 | 761 → 186 | 150 |
| 1024×768 | 831 → 211 | 156 | 761 → 186 | 150 |
| 768×1024 | 956.5 → 259 | 204 | 881 → 234 | 198 |
| 430×932 | 995 → 259 | 204 | 0 → 0 | 0 (row box 0×0, same as before) |
| 390×844 | 907 → 259 | 204 | 0 → 0 | 0 (same pre-existing measure) |

1440 list **186 ≤ 200**. 1440 board **column header 156 ≤ 200**; first **card** 211 (11 px over the card-selector target). Not gamed: header identity + views is 96 px, one toolbar 44 px (104–148), then pipeline chrome.

≤768 adds the 48 px mobile header, so first card sits at 259. Forecast one-liner hides below 1024 (`max-[1023px]:hidden`).

---

## 4. Permanent bands before → after (1440 FR light)

| Band | Before list | Before board | After list | After board |
|---|---|---|---|---|
| WorkspaceHeader | yes | yes | yes (96 px, views inside) | yes (96 px, views + forecast one-liner) |
| DealForecastBar slab | — | yes | **gone** | **gone** (file kept) |
| DealAttentionQueue slab | yes | yes | **gone** (Follow-up tab) | **gone** (Follow-up tab) |
| SavedViews sibling | yes | yes | merged into header | merged into header |
| FilterBar | yes | yes | one compact row | one compact row |
| StagePills | yes | yes | **gone** | **gone** |
| Active chips | only when filtered | only when filtered | same | same |

Filtered board (`attention=needs_attention`): Follow-up tab active, chip « Attention: À traiter », 6 deals, forecast `6 · 940 000 DA`. No second filter bag.

---

## 5. Trust items

### Deals-owned T-D-*

| ID | Sev | Status |
|---|---|---|
| T-D-01 | P0 | **Fixed.** Board options drawer through `t()`. Existing Cancel/Save/Board keys reused. |
| T-D-15 | P1 | **Fixed.** New key `Amount (DA)` / « Montant (DA) » / « المبلغ (DA) ». Storage still DZD. |
| T-D-16 | P1 | **Fixed.** Close dates use `formatDate` (Africa/Algiers + active locale). FR « 11 oct. »; AR أكتوبر + Latin digits. |
| T-D-18 | P1 | **Fixed.** QuickRecord labels `t()`; `stageLabel` so New → Nouveau; `Deal #:id`. |
| T-D-19 | P1 | **Fixed.** `Open full` / `Associations` / `Quick record` in fr+en+ar. Drawer: « Ouvrir la fiche », « Fiches liées ». |
| T-D-09 | P1 | **Fixed.** Parameterized `:subject was due :when` + `reason_replace`; drawer and queue call `t(reason, replace)`. |
| T-D-12 | P1 | **Fixed.** Backtest uses `Within 15% · :count deals` / `:pct% off · :count deals`. |
| T-D-24 | P2 | **Fixed.** `t('Import')`. |
| T-D-31 | P2 | **Fixed.** `lang={currentLocale()}` on native date inputs. |
| T-D-23 | P2 | **Fixed.** `t('Pipeline')`, `t('(default)')`. |
| T-D-27 | P3 | **Left.** FR `Pipeline` stays a loanword (shared key). |
| T-D-28 | P3 | **Left.** Empty-copy alignment not hit on this seed. |
| T-D-20 | P3 | **Keys added** for QR errors; hydrate strings still English until a later pass. |

### Shared T-S-*

| ID | Status |
|---|---|
| T-S-01 | **Fixed.** FR `nav.crm.leads` → « Pistes ». Warmup / Outbox: « Chauffe » / « Boîte d’envoi ». |
| T-S-02 | **Fixed.** New `Amount (DA)` on Deals + Quotes together. Old key unchanged. |
| T-S-03 | **Left to Inbox.** `You're all caught up.` not edited. New Inbox keys added so I18n stays identical (`Pick a conversation from the list.` etc.) without wiring Inbox. |
| T-S-04 | **Fixed.** Missing keys landed in fr+en+ar in the same commit (2002 keys, placeholder parity). |
| T-S-05 | **Partial.** `My Inbox` and the CRM-inbox embed sentence rewritten as Arabic. Remaining mash (settings/connectors) not Wave 2 Deals chrome. |
| T-S-06 | **Recorded.** FR `Contacts` / `Pipeline` loanwords kept. |

User-generated titles, bodies, and stage slugs were not rewritten.

---

## 6. Test results

| Suite | Result |
|---|---|
| Pest (full) | **1219 passed**, 1 skipped, 1 risky. No new failures. |
| Vitest | **97 passed** (27 files). |
| `tsc --noEmit` (after `wayfinder:generate`) | **3 errors**, all pre-existing: `dashboard-recent.tsx` (`dir`), `tablecn.tsx` (`EyeSlash`, `sortableColumnIds`). No Deals/chrome errors. |
| `vite build` | **OK** |
| Console on after-shots | **0** errors / pageerrors (75 captures) |

P12 contracts kept: `attentionQueue` Inertia prop, View all → `attention=needs_attention`, no `/crm/deals/attention`, forecast math, `POST /crm/deals/{id}/move`. Tickets StagePills locked. Contacts do not pass `chromeDensity`.

---

## 7. NEW issues (honest)

| ID | Sev | Notes |
|---|---|---|
| W02-D-01 | **P1** | 1440 board **first card** y=211 vs LAW-06 ≤200. Column header (stage / count / value) is **156**. Closing the 11 px would mean shrinking identity or views — hierarchy first, not done. |
| W02-D-02 | P2 | Mobile list first-row measure is still **y=0** (0×0 row box). Same as the before audit. Cards/rows are visible on the 390 list shot; the table-row selector does not see a painted box. |
| W02-D-03 | P2 | Compact toolbar H-scrolls on 390 (List/Board + search + four quick filters). One row, not a second band. |
| — | — | **No NEW P0.** |

---

## 8. Named after-shots

Under `artifacts/product-rebuild/02-wave/after/deals/`:

| Requested | File |
|---|---|
| Board default | `deals-board__1440x1000__fr__light.png` |
| Board filtered | `deals-board-filtered__1440x1000__fr__light.png` |
| List | `deals-list__1440x1000__fr__light.png` |
| QuickRecord | `deals-quickrecord__1440x1000__fr__light.png` |
| Mobile board | `deals-board__390x844__fr__light.png` |
| Mobile list | `deals-list__390x844__fr__light.png` |

Also captured: FR/EN/AR × light/dark × 1440/1280/1024/768/430/390 for list + board, plus metrics.json and console-errors.json.

---

## 9. Out of scope (untouched)

Inbox product, Records migration, Settings, Dashboard, Quotes redesign (only the shared `Amount (DA)` key). Backend deal engine, move route, forecast math, and saved-view API unchanged.
