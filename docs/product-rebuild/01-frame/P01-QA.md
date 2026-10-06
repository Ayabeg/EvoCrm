# P0.1 QA — Contract certification (Gate A)

**Agent:** 04 · Contract QA  
**Head:** `rebuild/p01-workspace-frame` `02fa629f` (draft PR #291)  
**Shell base:** `rebuild/p01-shell` `22b14d1` (PR #290)  
**Main:** `1e146ffb`  
**Date:** 6 October 2026  
**Host:** localhost only (`http://127.0.0.1:8000` head, `http://127.0.0.1:8001` main worktree). No deploy, DNS, production, secrets, or extra seed records.  
**Seed:** `DatabaseSeeder` + `VisualQaSeeder`. Login `owner@evosales.local` / `password`.

This document compares the same environment on **main `1e146ff`** and **head `02fa629`**. Product code was not modified. Certification artifacts live on `rebuild/p01-certification`.

Rerun helper: `scripts/product-rebuild/qa-baseline.sh`. Same-env logs: `/tmp/qa-baseline-main` (and `/tmp/qa-baseline-main-pest2` after the vendor-symlink false fail) and `/tmp/qa-baseline-head`.

---

## 1. Git / worktree identity

| Fact | main | head |
|---|---|---|
| SHA | `1e146ffb` | `02fa629f` |
| Subject | Merge pull request #289 (`rebuild/w0-master-migration-map`) | `test(workspace): capture P0.1 after proof and FRAME-NOTES` |
| Worktree | `/tmp/p01-qa-main` (detached / worktree) | `/workspace` on `rebuild/p01-certification` |
| Serve | `:8001` | `:8000` |
| Product edits this run | none | none |

First Pest run on main **failed 20 tests (EXIT 2)** because the worktree `vendor/` was a symlink into HEAD, so `resource_path()` read P0.1 source-locks against main’s older files. That failure is an **environment artifact, not a product regression**. After copying a real `vendor/` into the worktree, Pest passed (see §3). Classify that first fail as **not PRE-EXISTING product debt** and **not NEW**.

---

## 2. Suite results (same environment)

Every failure that exists on both SHAs is **PRE-EXISTING**. Head must not be worse.

| Command | main `1e146ff` | head `02fa629` | Classification |
|---|---|---|---|
| `npm run types:check` (`tsc --noEmit`) | **FAIL** exit 2 — **3 errors / 0 warnings** | **FAIL** exit 2 — **same 3 errors** | PRE-EXISTING (identical text) |
| `npm test` (`vitest run`) | **PASS** exit 0 — **26 files / 89 tests** | **PASS** exit 0 — **27 files / 95 tests** | CURRENTLY GREEN. Head +1 file / +6 tests (`workspace.test.ts`). Not a regression. |
| `npm run lint:check` (`eslint .`) | **FAIL** exit 1 — **439 problems (436 errors, 3 warnings)** | **FAIL** exit 1 — **436 problems (433 errors, 3 warnings)** | PRE-EXISTING. Head is **3 errors better**, not worse. Same-env main is 439, not Wave 0’s written 389 — do not treat 389→436 as NEW P0.1 debt. |
| `npm run build` (`vite build`) | **PASS** exit 0 — 15.14s | **PASS** exit 0 — 15.52s | CURRENTLY GREEN |
| `composer ci:check` (`php artisan test`) | **PASS** exit 0 — **1200 tests / 1199 passed / 1 skipped / 1 risky** / 33706 assertions / 49.3s (rerun after vendor copy) | **PASS** exit 0 — **1210 tests / 1209 passed / 1 skipped / 1 risky** / 33855 assertions / 47.5s | CURRENTLY GREEN. Head +10 Pest locks (`P01WorkspaceFrameTest` + retargets). Skip + risky PRE-EXISTING. |
| Playwright authenticated route sweep | **PASS** — **12/12 HTTP 200**; 0 `console` errors; 0 `pageerror`; 0 `requestfailed` | **PASS** — **12/12 HTTP 200**; 0 / 0 / 0 | CURRENTLY GREEN on both |

CI implication unchanged from Wave 0: GitHub `ci` runs **Pest only**. A green CI job can still ship the 3 TypeScript errors and the ~430 ESLint errors.

### 2.1 TypeScript errors (verbatim, both SHAs)

```
resources/js/components/dashboard/dashboard-recent.tsx(53,33): error TS2322: Type '{ children: string; record: RecordRef; mode: "drawer"; className: string; dir: string; }' is not assignable to type 'IntrinsicAttributes & { record: RecordRef; mode?: "full" | "drawer" | undefined; children: ReactNode; className?: string | undefined; }'.
  Property 'dir' does not exist on type 'IntrinsicAttributes & { record: RecordRef; mode?: "full" | "drawer" | undefined; children: ReactNode; className?: string | undefined; }'.
resources/js/evo/data/crm-list/tablecn.tsx(20,44): error TS2305: Module '"@/evo/icons"' has no exported member 'EyeSlash'.
resources/js/evo/data/crm-list/tablecn.tsx(32,23): error TS2305: Module '"@/lib/list-view-config"' has no exported member 'sortableColumnIds'.
```

Same three lines as `docs/product-rebuild/00-baseline/BASELINE-QA.md` §4. **PRE-EXISTING. Not introduced by #290 / #291.**

### 2.2 Pest skip + risky (both SHAs)

- **Skipped:** `GoldenCopyGuardTest` — Playwright not installed at `/tmp/pw`. PRE-EXISTING. Do not install `/tmp/pw` if you want the CI-equivalent path.
- **Risky:** 1 (same as Wave 0). Also prints the two `InvalidArgumentException` use-statement warnings in `EvoTicketsP1ModelTest` / `EvoTicketsP4DeskOpenTest`. PRE-EXISTING.

### 2.3 ESLint same-env note

Wave 0 wrote **389** problems on a different measurement (`89eb457`). This VM’s full-repo lint on **main `1e146ff` is 439**. Head is 436. Owned P0.1 files were cleaned on #290 / #291. The 389→439 gap is **PRE-EXISTING on this environment**, not a Wave 1 introduction.

---

## 3. Playwright route sweep (console / pageerror / requestfailed)

Authenticated Chromium, 1440×900, FR light, `domcontentloaded` + settle. Routes match Wave 0 §8.

| Route | Path | main HTTP | head HTTP | console / pageerror / requestfailed |
|---|---|---|---|---|
| Dashboard | `/dashboard` | 200 | 200 | none / none / none |
| Contacts | `/crm/contacts` | 200 | 200 | none / none / none |
| Contact record | `/crm/contacts/1` | 200 | 200 | none / none / none |
| Companies | `/crm/companies` | 200 | 200 | none / none / none |
| Leads | `/crm/leads` | 200 | 200 | none / none / none |
| Deals list | `/crm/deals` | 200 | 200 | none / none / none |
| Deals board | `/crm/deals/board` | 200 | 200 | none / none / none |
| Deal record | `/crm/deals/1` | 200 | 200 | none / none / none |
| Inbox | `/inbox` | 200 | 200 | none / none / none |
| Quotes | `/crm/quotes` | 200 | 200 | none / none / none |
| Quote detail | `/crm/quotes/1` | 200 | 200 | none / none / none |
| Settings | `/settings` → `/settings/profile` | 200 | 200 | none / none / none |

**Browser console result (head):** empty on all 12 sweep routes and on all 103 after-capture routes (`artifacts/product-rebuild/01-frame/after/console-errors.json`). Titles for Companies / Leads stay English in FR chrome — PRE-EXISTING i18n hole (Wave 0 §10.8).

---

## 4. Manual contract checks (head `02fa629`)

Exercised on `http://127.0.0.1:8000` against the seeded Evotechly workspace. No extra records created. Deal #1 was moved then restored.

| Check | Result | Evidence |
|---|---|---|
| Contacts saved view applies | **PASS** | Click « Mes contacts » → ` /crm/contacts?owner=1&view=my` |
| Contacts filters / sort / page write URL | **PASS** | Canonical query `?direction=asc&owner=1&page=2&sort=name&view=my` |
| URL state survives reload | **PASS** | Same query after `location.reload()` |
| URL state survives Back | **PASS** | From dashboard, Back restores the full query |
| URL state survives Forward | **PASS** | Contacts (query) → Dashboard → Back (query intact) → Forward (`/dashboard`) |
| Saved view applies (reload of `?view=my`) | **PASS** | Covered by the saved-view + URL-write rows |
| QuickRecord opens from Contacts | **PASS** | `tr[data-row-peek=true]` (aria « Inspect Sara Khelifi ») + **Enter** opens a 448×900 dialog: name, company, « Open full », « Vue d’ensemble ». Click on nested `a` / `tel` / `mailto` correctly does **not** peek (P10). |
| Deals board DnD issues the same move request | **PASS** | Card `[data-testid=deal-card-1]` → `[data-testid=stage-column-qualified]`. Network: `POST /crm/deals/1/move` body `{"stage_id":2}`. Stage 1 → 2. |
| Deal stage restored after DnD | **PASS** | `Deal::moveTo` original stage. Fresh `stage_id=1`. |
| Inbox composer anchored | **PASS** | Visible `[data-inbox=composer]` y=636 h=248 bottom=884 (viewport 900). « Envoyer » visible. |
| Inbox list + thread scroll independently | **PASS** | List column 300×778; thread 341×437 `overflow-y: auto`. `document.scrollingElement` does **not** page-scroll. |
| Simple Mode nav membership unchanged | **PASS** | Hrefs: `/dashboard`, `/inbox`, `/crm/contacts`, `/crm/companies`, `/crm/leads`, `/crm/activities`, `/crm/deals`, `/crm/quotes`, `/settings`. `missingSimple=[]`, `leakedPower=[]`. C-02 still OPEN (not changed). |
| Cmd+K opens search | **PASS** | Dialog width **640**. Mentions present. |
| Cmd+J absent in Simple Mode | **PASS** | No Ask Evo drawer. C-07 honored. |
| Cmd+J present in Full Mode | **PASS** | Drawer + copy present when `simple_mode=false`. |
| Rail collapse persists across reload | **PASS** | Collapsed width **56**; cookie `sidebar_state=false`; still 56 after reload. |
| Mobile overlay does not resize workspace | **PASS** | At 390: workspace `width=390` before and while overlay open. |
| Escape closes mobile overlay | **PASS** | Overlay `open=false` after Escape. |
| Keyboard tab order + teal focus on rail / header | **PASS** | First chrome targets (collapse, Rechercher ⌘K, Créer, CRM group) show `outline: rgb(15, 76, 92) solid 2px` (`--evo-teal`). Nested Contacts / Sociétés links fall through to the browser default — PRE-EXISTING child-link behavior, not a new Gate A fail. |
| Reduced motion respected | **PASS** | `prefers-reduced-motion: reduce` matches. Rail `transitionDuration=1e-05s` (effectively 0 ms). |

**Manual score:** 18 / 18 PASS. No NEW contract break.

---

## 5. What Wave 1 must not treat as a Gate A fail

These still fail the **blueprint** budget / page-internal laws. They are **out of Gate A ownership** (DataWorkspace views/filters, board chrome, Desk internals, Settings modal). Listed so they are not forgotten; **not counted as NEW P1s**.

- Contacts first row y=209 (target ≤150). SavedViews + FilterBar + thead still live in DataWorkspace.
- Deals board first card y=393 (target ≤200 / ≈148). Views + search/filters + stage pills remain.
- Companies / Leads lists still use the document scroller (not acceptance-migrated).
- Settings is still a dialog.
- Lead record is still an English island with an orange status control.

See `P01-VISUAL-CERTIFICATION.md`.

---

## 6. Classification summary

| Failure | PRE-EXISTING | NEW (#290 / #291) |
|---|---|---|
| `tsc` 3 errors | yes | no |
| ESLint ~436–439 | yes (same-env) | no (head is cleaner) |
| Pest skip + risky | yes | no |
| Playwright console / pageerror / requestfailed | none | none |
| Manual contract | none failed | none failed |
| Main Pest 20-fail (vendor symlink) | n/a — environment | n/a |

**Gate A contract QA: GO** (no NEW suite or manual regression).

---

## 7. Environment notes

- PHP 8.3 + Composer 2.10.3 + Node 22 / npm 10 on this VM.
- Head `.env` from `.env.example`; inbox / desk URLs and PostHog keys cleared for the live QA server so `/inbox` is the native desk.
- After-capture `metrics.json` still records `inbox_url=https://desk.evotechly.com` from the Agent 06 capture session — that is why some after Inbox PNGs show the CSP banner. Live QA and the Wave 0 baseline cleared that URL. Not a product-code change in #291.
- No production access. No migrations beyond local SQLite seed.
