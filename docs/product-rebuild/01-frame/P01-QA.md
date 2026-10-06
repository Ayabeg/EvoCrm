# P0.1 QA — Contract certification (Gate A, final stack)

**Agent:** 04 · Contract QA  
**Product head:** `rebuild/p01-workspace-frame` `39c7de4e` (draft PR #291, includes shell `1e5eb94`)  
**Cert branch:** `rebuild/p01-certification` (draft PR #292)  
**Main:** `1e146ffb`  
**Date:** 6 October 2026  
**Host:** localhost only (`:8000` head, `:8001` main worktree). No deploy, DNS, production, secrets, or extra seed records.  
**Seed:** `DatabaseSeeder` + `VisualQaSeeder`. Login `owner@evosales.local` / `password`.  
**Inbox:** workspace `inbox_url` forced `null`; `.env` `EVOSALES_INBOX_URL=` / `EVODESK_URL=`.

Supersedes the `02fa629` pass. Product code was not modified on the cert branch.

---

## 1. Identity

| Fact | main | head |
|---|---|---|
| SHA | `1e146ffb` | product `39c7de4e` (cert HEAD is docs-on-top of that) |
| Worktree | `/tmp/p01-qa-main` | `/workspace` |
| Serve | `:8001` | `:8000` |

`scripts/product-rebuild/qa-baseline.sh` always `cd`s to the script’s repo root. Main suites were run **inside** `/tmp/p01-qa-main` so they actually measure `1e146ff`.

---

## 2. Suite results (same environment)

| Command | main `1e146ff` | head `39c7de4` | Classification |
|---|---|---|---|
| `npm run types:check` | FAIL exit 2 · **3 errors** | FAIL exit 2 · **same 3 errors** | PRE-EXISTING |
| `npm test` | PASS · **26 files / 89 tests** | PASS · **27 files / 96 tests** | GREEN. Head +1 file / +7 tests |
| `npm run lint:check` | FAIL · **439 (436e / 3w)** | FAIL · **436 (433e / 3w)** | PRE-EXISTING. Head cleaner. Same-env main is 439, not Wave 0’s 389 |
| `npm run build` | PASS · 15.26s | PASS · 20.04s | GREEN |
| `composer ci:check` | PASS · **1200 / 1199 + 1 skip + 1 risky** / 33706 assertions | PASS · **1214 / 1213 + 1 skip + 1 risky** / 33885 assertions | GREEN. Head +14 Pest locks |
| Playwright 12 routes | 12/12 HTTP 200 · 0 console / pageerror / requestfailed | same | GREEN |

### TypeScript (verbatim, both SHAs)

```
resources/js/components/dashboard/dashboard-recent.tsx(53,33): error TS2322: … Property 'dir' does not exist …
resources/js/evo/data/crm-list/tablecn.tsx(20,44): error TS2305: … no exported member 'EyeSlash'.
resources/js/evo/data/crm-list/tablecn.tsx(32,23): error TS2305: … no exported member 'sortableColumnIds'.
```

---

## 3. Playwright route sweep

| Route | main | head | console / pageerror / requestfailed |
|---|---|---|---|
| `/dashboard` | 200 | 200 | none |
| `/crm/contacts` | 200 | 200 | none |
| `/crm/contacts/1` | 200 | 200 | none |
| `/crm/companies` | 200 | 200 | none |
| `/crm/leads` | 200 | 200 | none |
| `/crm/deals` | 200 | 200 | none |
| `/crm/deals/board` | 200 | 200 | none |
| `/crm/deals/1` | 200 | 200 | none |
| `/inbox` | 200 | 200 | none |
| `/crm/quotes` | 200 | 200 | none |
| `/crm/quotes/1` | 200 | 200 | none |
| `/settings` → `/settings/profile` | 200 | 200 | none |

After recapture (`inbox_url` null): **103/103** `console-errors.json` entries empty.

---

## 4. Manual contract checks (head `39c7de4`)

18 original + 3 review-fix checks.

| Check | Result | Evidence |
|---|---|---|
| Saved view applies | **PASS** | `?owner=1&view=my` |
| Filters/sort/page write URL | **PASS** | `?direction=asc&owner=1&page=2&sort=name&view=my` |
| URL survives reload | **PASS** | same query |
| URL survives Back | **PASS** | query intact |
| URL survives Forward | **PASS** | Forward → `/dashboard` |
| QuickRecord from Contacts | **PASS** | Enter on peek row → 448px dialog |
| Deals DnD move request | **PASS** | `POST /crm/deals/1/move` `{"stage_id":2}` |
| Deal stage restored | **PASS** | `stage_id=1` |
| Inbox composer anchored | **PASS** | y=636 h=248 bottom=884; Envoyer visible; **no CSP banner** |
| Inbox list/thread independent scroll | **PASS** | list 300×826; thread 341×485 `overflow-y:auto`; page does not scroll |
| Simple Mode nav unchanged | **PASS** | `missingSimple=[]` `leakedPower=[]` |
| Cmd+K opens search | **PASS** | dialog width 640 |
| Cmd+J absent Simple | **PASS** | no Ask Evo drawer |
| Cmd+J present Full | **PASS** | drawer present |
| Rail collapse persists | **PASS** | width 56; cookie `false` after reload |
| Mobile overlay does not resize | **PASS** | 390 before and while open |
| Escape closes overlay | **PASS** | overlay closed |
| Tab order + teal on rail/header | **PASS** | collapse / search / create / Accueil / Inbox / CRM = `rgb(15, 76, 92)` |
| Reduced motion | **PASS** | rail `1e-05s` |
| **Nested-nav focus ring teal (R05-02)** | **FAIL** | Top-level Accueil/Inbox/CRM are teal. Contacts *child* via Tab: `outline: rgb(74, 90, 99) solid 2px` (ink-secondary). Source uses the same `rowClass` + `--evo-focus`; computed child ring is not teal. **NEW P3** |
| **No 224→56 first-paint snap (R05-01)** | **PASS** | Cookie `sidebar_state=false` pre-set. First nonzero sample t=138ms w=56; maxW=56; never saw 224 |
| **Deals forecast/attention visible default (R06-01)** | **PASS** | List « À traiter » visible; board forecast + attention visible; `details` empty (no closed disclosure) |

**Score: 20 / 21 PASS.** The one fail is a focus-color residual on nested children, not a contract break.

G-chord shortcuts (`G A`, `G C`, …): **NOT TESTED**.

---

## 5. Gate A vs Wave 2

Do not treat as NEW P1s: Contacts y=209; board y=793; list y=717; DataWorkspace bands; Settings modal; lead English; Companies/Leads document scroller.

---

## 6. Classification

| Failure | PRE-EXISTING | NEW |
|---|---|---|
| tsc 3 | yes | no |
| ESLint ~436–439 | yes | no |
| Pest skip + risky | yes | no |
| Nested child focus gray | no | **P3** |
| Playwright console | none | none |

**Gate A contract QA: GO** (no NEW P0/P1).
