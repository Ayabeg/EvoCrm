# P0 SECURITY — consolidated dependency remediation

**Date:** 2026-10-14  
**Workstream:** P0 SECURITY  
**Branch:** `security/consolidated-remediation-20261014`  
**Base:** `main` `6ba4f7c6c818c9a3d72cf56ec2069601d84c2edd` (verified)  
**Draft PR title:** `security: consolidated dependency remediation (supersedes #302/#306/#307 candidate)`

This branch is a **new** branch. PRs #302, #306, and #307 were **not** modified.

Machine-readable twin: [`P0-SECURITY-CONSOLIDATED-REMEDIATION.json`](./P0-SECURITY-CONSOLIDATED-REMEDIATION.json)  
Audit JSON evidence: [`security/`](./security/)

## Assumptions

1. Root `package-lock.json` / `composer.lock` are the production installation boundary (not `mobile/` or `scripts/product-rebuild/`).
2. “Minimal compatible” means the **first patched** versions that clear the current advisories, not the latest Laravel 13 / CommonMark patch.
3. #307’s diagnostic workflow is complementary evidence tooling, not required to remediate the advisories.
4. Dev-only npm findings stay visible (no suppressions) and get a follow-up plan only.

---

## 1. Base verification

| Check | Result |
|---|---|
| Local `main` SHA | `6ba4f7c6c818c9a3d72cf56ec2069601d84c2edd` |
| Matches COMMON.md / task | Yes |
| `origin/main` | Same SHA |
| Packagist / npm / getcomposer.org | Reachable in this environment (not blocked) |
| Tooling used | PHP 8.3.6, Composer 2.10.3, Node v22.14.0, npm 10.9.9 |

---

## 2. Review of PRs #302 / #306 / #307

All three heads are descendants of `6ba4f7c6`. None were pushed to, rebased, or edited.

### #302 — npm remediations (`c25fc559`, ready, CI `tests` SUCCESS)

| Item | Detail |
|---|---|
| Files | `package.json`, `package-lock.json` |
| Change | Remove unused production `concurrently@10.0.5` (drops `shell-quote@1.9.0`); resolve `source-map-js` 1.2.1→1.2.2; `dompurify` 3.4.14→3.4.17 |
| Overrides | None |
| Application / CI policy | Unchanged |
| Reproduced here | Yes — `package.json` + `package-lock.json` are byte-identical to #302 |

**Evidence completeness:** Partial.

- Author claimed `npm audit --omit=dev` clean and full audit still showing brace-expansion / js-yaml.
- Existing `tests` workflow does **not** run `npm audit`. CI SUCCESS does not prove the production audit gate.
- No committed audit JSON.

**Reproducibility:** High. Live `npm uninstall concurrently` + `npm update source-map-js dompurify` produced the same resolved versions. A newer npm added five unrelated `"optional": true` flags; those were discarded by reusing #302’s lockfile.

### #306 — CommonMark only (`a9209630`, draft, CI `tests` SUCCESS)

| Item | Detail |
|---|---|
| Files | `composer.lock` only |
| Change | `league/commonmark` 2.10.0→2.10.2 (`692e90b901877bdfd727e51270ce4394633c6e74`) |
| Extra lock metadata | `stability-flags` `[]`→`{}`, `platform-dev` `[]`→`{}`, `plugin-api-version` 2.6.0→2.9.0 (Composer 2.9.5 generation) |
| Leaves unfixed | `laravel/framework` 13.26.1, `phpseclib/phpseclib` 3.0.56 |

**Evidence completeness:** Incomplete for the security claim.

- Author reported local `composer audit` **infrastructure-blocked** (Packagist 403 / exit 100).
- `tests` CI does **not** run `composer audit`.
- CommonMark pin itself is correct and matches #307.

**Reproducibility:** High for the package pin; metadata rewrite is a Composer-version artifact, not a package bump.

### #307 — four Composer advisories (`8d5bc10c`, draft, `composer-audit` + `ci` SUCCESS)

| Item | Detail |
|---|---|
| Files | `composer.lock`, `.github/workflows/composer-audit-diagnostics.yml`, `scripts/ci/composer-audit-summary.py` |
| Lock changes | `laravel/framework` 13.26.1→13.30.0 (`9c008e7c9a64a8ea6d6e4f1683bd569acc10bf9e`); `league/commonmark` 2.10.0→2.10.2 (same SHA as #306); `phpseclib/phpseclib` 3.0.56→3.0.57 (`d17e0ddaeaf6f22f7e007cbb437d78792fe2a0e4`) |
| Metadata | Keeps main’s `plugin-api-version` 2.6.0 and empty arrays |
| Extra | Independent audit workflow + summary script (does not weaken gates) |

**Evidence completeness:** Complete for Composer.

- Dedicated Actions audit on the candidate: 0 advisories, 0 abandoned, exit 0.
- Existing `tests` CI also green.
- Local Packagist block in that author’s environment is documented separately.

**Reproducibility:** High. `composer update laravel/framework:13.30.0 league/commonmark:2.10.2 phpseclib/phpseclib:3.0.57 --with-dependencies --minimal-changes` regenerated the **same three versions and git SHAs**. Fresh Composer 2.10.3 also rewrote `vlucas/phpdotenv` source URL and lock metadata; those unrelated refreshes were discarded by reusing #307’s lockfile.

### Overlaps / conflicts

| Pair | Lockfiles | Verdict |
|---|---|---|
| #302 vs #306 / #307 | No shared files | Complementary (npm vs Composer) |
| #306 vs #307 | Both edit `composer.lock` | **Conflicting to merge, compatible on CommonMark.** Package hunks for CommonMark are identical. Conflict is the lock footer (`plugin-api-version` 2.9.0 vs 2.6.0; `[]` vs `{}`). #306 is a **subset** of #307’s package remediations. |

An unconstrained `composer update laravel/framework league/commonmark phpseclib/phpseclib --with-dependencies` on 2026-10-14 resolved **Laravel 13.36.0**, **CommonMark 2.10.3**, and **laravel/prompts 0.3.23→0.3.26**. That is a valid newer compatible set, but it is **not minimal**. This PR keeps the first patched versions from #307.

---

## 3. Current advisory inventory on main (live, not historical)

Commands (on `6ba4f7c6`, after `npm ci --ignore-scripts`; Composer `--locked` because vendor was not installed):

```text
composer audit --locked --format=json --no-interaction   # exit 1
npm audit --omit=dev --json                              # exit 1
npm audit --json                                         # exit 1
```

Raw JSON: [`security/composer-audit-main.json`](./security/composer-audit-main.json), [`security/npm-audit-omit-dev-main.json`](./security/npm-audit-omit-dev-main.json), [`security/npm-audit-full-main.json`](./security/npm-audit-full-main.json).

### Composer (4 advisories / 3 production packages / 0 abandoned)

| Package (main) | Advisory | Severity | CVE | Fixed when | This PR |
|---|---|---|---|---|---|
| laravel/framework **13.26.1** | PKSA-d5tc-s1qs-h781 / [GHSA-jh5r-qr3c-85q8](https://github.com/advisories/GHSA-jh5r-qr3c-85q8) | low | CVE-2026-102279 | ≥13.30.0 | **13.30.0** |
| league/commonmark **2.10.0** | PKSA-m2dq-1fhr-29b1 / [GHSA-97jj-33gv-5xf9](https://github.com/advisories/GHSA-97jj-33gv-5xf9) | medium | none | ≥2.10.2 | **2.10.2** |
| league/commonmark **2.10.0** | PKSA-m4t9-vsgq-8khn / [GHSA-3q6v-r5mr-hxv8](https://github.com/advisories/GHSA-3q6v-r5mr-hxv8) | high | none | ≥2.10.2 | **2.10.2** |
| phpseclib/phpseclib **3.0.56** | PKSA-12sz-bcny-pk4m / [GHSA-q97c-8qh3-fpc6](https://github.com/advisories/GHSA-q97c-8qh3-fpc6) | medium | CVE-2026-84308 | ≥3.0.57 | **3.0.57** |

### npm `--omit=dev` (production graph): 4 findings

| Package (main) | Advisory | Severity | Exposure | This PR |
|---|---|---|---|---|
| concurrently 10.0.5 → shell-quote 1.9.0 | [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) | critical | Direct unused `concurrently` in `dependencies` | **removed** |
| source-map-js 1.2.1 | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | high | Vite / Tailwind / PostCSS | **1.2.2** |
| dompurify 3.4.14 | [GHSA-p98j-92pf-mc4p](https://github.com/advisories/GHSA-p98j-92pf-mc4p), [GHSA-6688-9rhm-gjv2](https://github.com/advisories/GHSA-6688-9rhm-gjv2) | low | `posthog-js` | **3.4.17** |

### npm full: +2 high, **dev-only** (still present after remediations)

| Package (main / after) | Advisory | Via | Reachable in prod? |
|---|---|---|---|
| brace-expansion 1.1.18 | GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p | `eslint-plugin-import` → `minimatch@3.1.5` | No (dev lint) |
| brace-expansion 5.0.9 | same | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch@10.2.6` | No (dev lint) |
| js-yaml 4.3.1 | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | `eslint` → `@eslint/eslintrc` | No (dev lint) |

---

## 4. What this branch changed

| File | Source | Why |
|---|---|---|
| `package.json` | #302 | Drop unused `concurrently` |
| `package-lock.json` | #302 (after live `npm uninstall` / `npm update` confirmed same versions) | Pin `source-map-js@1.2.2`, `dompurify@3.4.17`; remove `shell-quote` |
| `composer.lock` | #307 lockfile (after live pinned `composer update` confirmed same versions/SHAs) | First patched Laravel / CommonMark / phpseclib |
| `docs/engineering-recovery/2026-10-14/**` | this workstream | Review, inventory, evidence, remaining plan |

**Not changed:** application code, `composer.json` constraints, CI workflows, audit policy, `mobile/*`, `scripts/product-rebuild/*`.  
**Not copied:** #307 diagnostic workflow / summary script (complementary).  
**No** downgrades, suppressions, `npm audit fix --force`, or unconstrained dep-wide bumps.

`composer.json` `content-hash` is unchanged (`7516b9f548565910050eb8c72a7f0f26`) because root constraints did not change.

---

## 5. Validation

| Command | Result | Class if fail |
|---|---|---|
| `composer validate --strict --no-check-publish` | **PASS** (exit 0, `./composer.json is valid`) | — |
| `composer audit --locked` (after) | **PASS** (exit 0, 0 advisories, 0 abandoned) | — |
| `npm ci --ignore-scripts` (after #302 lock) | **PASS** (exit 0, 706 packages) | — |
| `npm audit --omit=dev` (after) | **PASS** (exit 0, 0 vulnerabilities) | — |
| `npm audit` (after) | **FAIL expected** — 2 high, both dev-only (`brace-expansion`, `js-yaml`) | 2 security vulnerability (dev-only; documented; not suppressed) |
| Pest full (`php artisan test`) | **PASS** (exit 0): 1220 tests, **1219 passed**, 1 skipped, 1 risky, 34706 assertions, 124.5s. Matches #307’s clean-main assertion count (34706); passed count is +1 vs their 1218 (class: no product regression). Pre-existing PHP warnings in `EvoTicketsP1ModelTest` / `EvoTicketsP4DeskOpenTest` (`InvalidArgumentException` use has no effect) = **3**. | — |
| Vitest (`npm test -- --run`) | **PASS** (exit 0): 27 files, **97 passed** | — |
| `tsc --noEmit` (after `php artisan wayfinder:generate --with-form`) | **FAIL expected** (exit 2): **exactly 3 errors**, same files/messages as the stated main baseline: `dashboard-recent.tsx` (`dir` prop), `tablecn.tsx` (`EyeSlash`), `tablecn.tsx` (`sortableColumnIds`). | 3 pre-existing quality debt |
| `vite build` | **PASS** (exit 0, 16.89s, 7730 modules). Wayfinder types generated during build. | — |

Lockfile identity vs reviewed PRs:

- `git diff c25fc559 -- package.json package-lock.json` → empty
- `git diff 8d5bc10c -- composer.lock` → empty

---

## 6. Remaining dev-only advisories — remediations plan

Do **not** suppress. Do **not** `npm audit fix --force`. Production audit is already clean.

Patched releases **exist** (verified on npm 2026-10-14):

- `brace-expansion@1.1.21` and `brace-expansion@5.0.12`
- `js-yaml@4.3.2` (stay on 4.x; 5.x is a major)

Direct parents are still on vulnerable ranges: `minimatch@3.1.5` (latest 3.x) and `minimatch@10.2.6` (latest 10.x); `eslint@9.39.5` is deprecated and latest eslint is **10.12.0** (major).

**Recommended follow-up (separate PR):**

1. Preview only: `npm update eslint typescript-eslint eslint-plugin-import --dry-run` and inspect whether transitives move. A default `npm update` is unlikely to pull `brace-expansion@1.1.21` / `5.0.12` because `minimatch` does not require them yet.
2. If parents do not move, add **narrow overrides** (justified: two major lines of `brace-expansion` cannot share one version):

```json
"overrides": {
  "minimatch@3": { "brace-expansion": "1.1.21" },
  "minimatch@10": { "brace-expansion": "5.0.12" },
  "js-yaml@4": "4.3.2"
}
```

3. `npm ci`, `npm audit --json`, `npm run lint:check`, Vitest. Do not jump `eslint` 9→10 in the same change.
4. Review date: next dependency hygiene cycle after this PR merges. Classification until then: **2 security vulnerability** (dev-only, lint toolchain).

---

## 7. Disposition of #302 / #306 / #307

| PR | Disposition | Reason |
|---|---|---|
| **#302** | **Superseded** | This branch contains the same `package.json` + `package-lock.json` (identical). |
| **#306** | **Superseded** | CommonMark 2.10.2 is included via the #307 lockfile. #306’s Composer metadata rewrite is not needed and would conflict with #307. |
| **#307** | **Superseded** for the lockfile remediations; **complementary** for the diagnostic workflow/script (not copied here). | Composer lock is identical to #307. The extra CI files are useful evidence tooling but are not required to clear the four advisories; this workstream stores audit JSON under `docs/`. |

#306 and #307 remain **conflicting with each other** if both are merged independently. This PR is the single integration candidate.

Post-test update: Pest, Vitest, and `vite build` passed on this branch. `tsc` matches the 3-error main baseline (class 3). Draft remains unmerged.

---

## 8. Failure classification key

1. product regression  
2. security vulnerability  
3. pre-existing quality debt  
4. CI config defect  
5. infrastructure restriction  
6. missing evidence  

Used above: remaining npm full findings = **2**; #302/#306 CI not running audits = **6** (and **4** if a production audit gate is expected in `tests.yml`). Packagist was **not** class 5 in this environment.
