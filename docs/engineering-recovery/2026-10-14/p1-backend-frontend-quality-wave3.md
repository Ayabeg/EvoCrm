# P1 — Backend/Frontend quality + Wave 3 recovery

**Date:** 2026-10-14  
**Agent branch:** `test/wave3-gap-coverage-20261014`  
**Baseline SHA:** `6ba4f7c6c818c9a3d72cf56ec2069601d84c2edd` (`main`)  
**Repo:** https://github.com/Evotechly/EvoCrm  

This report is the live-repo evidence for workstream P1. Windows-only Wave 3 export under `C:\Users\Moham\.codex\branch-audits\EvoCrm\2026-10-13\wave5a-evidence-export` was not available. Historical conclusions from that tree are **UNVERIFIED**.

## Re-verified open PRs

Checked 2026-10-14 against GitHub. Heads were not modified.

| PR | Head | Base | Draft | Checks | Notes |
|----|------|------|-------|--------|-------|
| #300 | `71bf04bc` `codex/slice-a-certification` | main | draft | ci SUCCESS | Slice A workspace UX |
| #301 | `41835567` `codex/development-os-v1` | main | draft | Level 3 FAILURE; browser SKIPPED; Certification summary FAILURE | Dev OS |
| #302 | `c25fc559` `security/npm-dependency-remediation` | main | ready | ci SUCCESS | npm security |
| #303 | `efb61fdb` `codex/wave3-selective-recovery` | main | draft | ci SUCCESS | Wave 3 selective tests only |
| #304 | `21acf8aa` `cursor/pr301-ci-recovery-8574` | `codex/development-os-v1` | draft | CONFLICTING; Level 3 FAILURE | PR #301 recovery |
| #306 | `a9209630` `security/composer-commonmark-remediation` | main | draft | ci SUCCESS | CommonMark |
| #307 | `8d5bc10c` `ci/composer-audit-diagnostics-20261014` | main | draft | composer-audit + ci SUCCESS | 4 Composer advisories |

No PR was merged. This branch is based on `main` `6ba4f7c`, not on #303.

## Part 1 — Baseline on `main` `6ba4f7c` (no production changes)

Environment was missing PHP/Composer. Installed locally for this run: PHP 8.3.6, Composer 2.10.3, then `composer install` and root `npm install`. That is setup only; `main` was not edited.

| Check | Command | Result | Classification |
|-------|---------|--------|----------------|
| Composer validate | `composer validate --no-check-publish --strict` | **PASS** — `./composer.json is valid` | — |
| Pest full | `php artisan test --display-skipped` then `--log-junit=/tmp/baseline-pest.xml` | **PASS** — 1220 tests, 1219 passed, 1 skipped, 1 risky, 34,706 assertions (Unit 23/75, Feature 1197/34,631) | skipped = 5; risky = 3 |
| Pint | `vendor/bin/pint --parallel --test` | **FAIL** — 25 files would be rewritten | 3 pre-existing quality debt (style). No mass format applied. |
| PHPStan / Larastan | `vendor/bin/phpstan analyse --no-progress --memory-limit=1G` (`phpstan.neon` level 7, Larastan included) | **FAIL** — 1,670 errors | 3 pre-existing quality debt |
| `tsc` | `php artisan wayfinder:generate --with-form && npx tsc --noEmit` | **FAIL** — 3 errors, exit 2 | see defects |
| Vitest | `npx vitest run` | **PASS** — 27 files, 97 passed | — |
| ESLint | `npx eslint .` | **FAIL** — 618 problems (615 errors, 3 warnings); 523 auto-fixable | 3 pre-existing quality debt (mostly stylistic) |
| Prettier | `npx prettier --check resources/` | **FAIL** — 505 files | 3 cosmetic. Not fixed. |
| Vite build | `npm run build` | **PASS** — built in 26.00s | chunk-size warnings only |
| Mobile typecheck | `cd mobile && npm run typecheck` | **PASS** | — |
| Mobile lint | `cd mobile && npm run lint` | **PASS** | — |
| Mobile unit | `cd mobile && npm test` | **PASS** — 25 suites, 90 tests | overlapping `act()` console noise |
| Mobile config | `cd mobile && npm run config:check` | **PASS** — Expo public config printed | — |

`mobile.yml` also has `doctor` and `export:android`. Those were **NOT RUN** (user asked for tsc/lint/unit/config only).

### Pest skipped / risky

| Kind | Test | Why |
|------|------|-----|
| Skipped | `GoldenCopyGuardTest` / `it loads every golden route in light 1440 and fails on denylisted copy` | `tests/Feature/GoldenCopyGuardTest.php` calls `markTestSkipped('Playwright is not installed at /tmp/pw.')` when `/tmp/pw/node_modules/playwright-core/index.js` is absent. Classification: **5 infrastructure restriction**. |
| Risky | `I18nFoundationTest` / `it source-locks customer-facing chrome onto t() on critical screens` | 0 assertions. The hardcoded-chrome regex never matches, so `expect()` never runs. Vacuous lock. Classification: **3 pre-existing quality debt**. |

### `tsc` errors (exact)

```
resources/js/components/dashboard/dashboard-recent.tsx(53,33): error TS2322
  Property 'dir' does not exist on RecordLink props.

resources/js/evo/data/crm-list/tablecn.tsx(20,44): error TS2305
  Module '"@/evo/icons"' has no exported member 'EyeSlash'.

resources/js/evo/data/crm-list/tablecn.tsx(32,23): error TS2305
  Module '"@/lib/list-view-config"' has no exported member 'sortableColumnIds'.
```

Vite still builds because `tablecn.tsx` is not in the import graph (Contacts uses `CrmListShell` / `table.tsx`). `RecordLink` drops `dir="auto"` on dashboard recent titles.

## Part 2 — PR #303 and Wave 3 evidence

### Historical inventory files

Searched the working tree and `git log --all` path history. **All four are UNVERIFIED (absent):**

- `valuable-branches-review.md`
- `valuable-branches-matrix.json`
- `integration-roadmap.md`
- `historical-17-branch-inventory.json`

PR #303 body already recorded the same absence. No historical Wave 3 branch was cherry-picked.

### What #303 adds (do not duplicate)

Branch `origin/codex/wave3-selective-recovery` @ `efb61fdb`. **No production diff.** Tests only:

1. `it('keeps Inbox selection and reply authorization inside the current workspace')` — empty inbox + foreign `?thread=` + reply 404
2. `it('stores an internal note and resolves the Inbox thread through the desk contract')` — `as_note` + `resolve`
3. `it('rejects invalid typed company attributes without persisting them')` — number `'many'`
4. `it('does not expose or update a company from another workspace')` — foreign show 404 / attributes PUT 403

This branch is **not** based on #303. Those four tests are not copied.

### Coverage map

Legend: **main** = live tests on `6ba4f7c`. **#303** = only on that PR. **this PR** = added here. **still missing** = confirmed remaining gap.

#### Desk Inbox

| Concern | main | #303 | this PR | still missing |
|---------|------|------|---------|---------------|
| Inertia import regression | PARTIAL source locks in P13/P14; no `@inertiajs/react` vs legacy / test-harness lock | — | `locks Desk Inbox Inertia imports…` | Vite/build import-graph assertion |
| Workspace isolation | P13 list/search; P14 CRM leak; no mixed-inbox deep-link | empty-inbox foreign `thread=` | mixed inbox: own threads listed, foreign `thread=` not selected, reply 404 | — |
| Authorization | workspace `abort_unless` on reply; no role test | foreign reply 404 | member without `desk.manage` → 403 | — |
| Compose / reply | P13 outbound; DeskComposerTest; SMS | internal note + resolve | — | embed-mode compose E2E |

#### Contacts

| Concern | main | #303 | this PR | still missing |
|---------|------|------|---------|---------------|
| Selection | P03B / P04 / P10 source + props | — | — | HTTP bulk selection E2E |
| Saved views | `view=my` (CrmSavedViewTest); save POST | — | `filter_id` applies saved city filter | Playwright saved-view flow (lives on #300) |
| Filtering | CrmFilterTest wilaya/unanswered/unassigned | — | saved-filter apply | browser FilterBar E2E (#300) |
| URL state | P03C `q/owner/created/page/view` | — | keys lock for `sort`/`direction` | **URL sort is ignored by backend — failing test in a later commit** |
| QuickRecord | P09 / P10 | — | — | list-row peek E2E (#300) |
| Responsive | P25 shared overflow | — | contacts stay on CrmListShell / PAGE_OVERFLOW; not `tablecn` | viewport E2E 1440→390 (#300) |

#### Company attributes

| Concern | main | #303 | this PR | still missing |
|---------|------|------|---------|---------------|
| Authorized updates | happy-path + required | foreign 403/404 | member without `crm.edit` → 403 | — |
| Type validation | required empty only | invalid number | invalid date + invalid list | — |
| Persistence | dedicated PUT | negative number | main company PUT nested `attributes` | dedicated vs main `enforceRequired` difference (documented, not a fail) |
| Workspace isolation | implicit abort | foreign show/update | — | list-column attribute leak |
| Display | contact/deal only | — | company show Inertia `attributes.values` | — |

PR #300 (`codex/slice-a-certification`) still holds Contacts sort HTTP assertion, Playwright query/saved-view/responsive evidence. It is not merged and was not duplicated.

## Part 3 — Tests added on this branch

Based on `main`, not #303.

**Passing (expected) — `tests/Feature/Wave3GapCoverageTest.php`**

1. Desk Inbox Inertia import lock (`@inertiajs/react`, no test harness imports)
2. Mixed-workspace inbox deep-link isolation
3. `desk.manage` denial on reply
4. Company show displays saved date/list attributes
5. Invalid date/list company attributes rejected without persist
6. Member without `crm.edit` cannot PUT company attributes
7. Nested attributes persist on `PUT /crm/companies/{id}`
8. Contacts `filter_id` URL applies a saved view
9. Contacts chrome stays off orphan `tablecn.tsx` and on shared overflow / sort keys

**Failing product regression (separate commit) — `tests/Feature/Wave3ContactsUrlSortRegressionTest.php`**

- `it('applies URL-owned Contacts sort and direction to the list')`
- Frontend contract (`resources/js/lib/list-query/serialize.ts`, P03C) writes `?sort=name&direction=asc`.
- `CrmFilter::resolve()` sets `'sort' => $saved?->resolvedSort() ?? ListViewConfig::defaultSort($entity)` and **never reads** request `sort` / `direction`.
- Classification: **1 product regression**.

No production files were changed to make tests pass.

## Genuine quality defects (not cosmetic) — proposed focused fixes

Do **not** run Pint/Prettier/ESLint `--fix` across the tree.

| ID | Defect | Class | Proposed focused fix |
|----|--------|-------|----------------------|
| Q1 | Contacts URL `sort`/`direction` ignored | 1 product regression | In `CrmFilter::resolve()`, overlay `parseUrlSort($request->input('sort'), $request->input('direction'))` on top of saved/default sort. Covered by the failing test. |
| Q2 | `RecordLink` drops `dir="auto"` (`dashboard-recent.tsx:53`) | 1 product regression (RTL/bidi) + 3 types | Add optional `dir?: string` to `RecordLink` and pass it to the button/`Link`. |
| Q3 | Orphan `tablecn.tsx` imports missing `EyeSlash` and `sortableColumnIds` | 3 quality debt | Either delete unused `tablecn.tsx` or re-export the symbols and wire it. Contacts production path is `table.tsx`. |
| Q4 | `I18nFoundationTest` chrome lock is risky (0 assertions) | 3 quality debt | Tighten the regex or assert `expect($matches)->not->toBeEmpty()` per file so the lock is real. |
| Q5 | PHPStan 1,670 errors at level 7 | 3 quality debt | Incremental: start with `argument.type` / `property.notFound` on Eloquent `Model` in `RunOutboundSequences` (typed relations). Do not add ignores. |
| Q6 | Pint unused import in `InboxCrmContextComposer` (`lambda_not_used_import`) | 3 quality debt | Remove the unused import only. Do not Pint the other 24 style files in the same change. |
| Q7 | ESLint 618 / Prettier 505 | 3 cosmetic | Out of scope. Do not mass-format. |

Pint 25 files and ESLint/Prettier counts are **not** treated as product regressions.

## Commands run (baseline)

```
composer validate --no-check-publish --strict          → PASS
php artisan test --display-skipped                     → 1219 passed, 1 skipped, 1 risky
php artisan test --log-junit=/tmp/baseline-pest.xml    → 1220 cases
vendor/bin/pint --parallel --test                      → FAIL 25 files
vendor/bin/phpstan analyse --no-progress --memory-limit=1G → FAIL 1670
php artisan wayfinder:generate --with-form && npx tsc --noEmit → FAIL 3
npx vitest run                                         → PASS 27/97
npx eslint .                                           → FAIL 618
npx prettier --check resources/                        → FAIL 505
npm run build                                          → PASS
cd mobile && npm run typecheck                         → PASS
cd mobile && npm run lint                              → PASS
cd mobile && npm test                                  → PASS 25/90
cd mobile && npm run config:check                      → PASS
```

## Verification of this PR

| Command | Result |
|---------|--------|
| `php artisan test --filter=Wave3GapCoverageTest` | **PASS** — 9 tests, 116 assertions |
| `php artisan test --filter=Wave3ContactsUrlSortRegressionTest` | **FAIL** (expected) — `activeFilters.sort.field` is `created_at`, expected `name` |
| `vendor/bin/pint --test` on the two new test files | **PASS** |

The URL-sort failure is the product regression (Q1). It is left red.

## Blockers

- Historical Wave 3 inventory artifacts: **UNVERIFIED / absent**.
- PR #303 is the right place for the four recovered tests; do not merge it from this workstream.
- PHP/Composer were missing on the agent image (installed for this run only).
- Golden-copy Pest skip needs Playwright at `/tmp/pw`.
