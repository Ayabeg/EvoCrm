# W0 BASELINE-QA — Contract baseline (Agent 04)

Wave 0 technical baseline for the EvoCRM product-layout rebuild. **No product code was modified.** This document records the merge of PR #284 (`feat/hierarchical-crm-sidebar`) before any redesign.

Recorded: 2026-10-06. Agent: W0-A04 Contract Baseline / QA.

---

## 1. Git / worktree identity

| Fact | Value |
|---|---|
| Measurement branch | `rebuild/w0-qa-baseline` (created from the requested SHA) |
| `HEAD` | `89eb45787c207a5550ef0eff60c44444efbc824d` |
| Subject | `Merge pull request #284 from Evotechly/feat/hierarchical-crm-sidebar` |
| `origin/main` at measurement | **same SHA** (`89eb4578`) |
| Local `main` ref on this VM | stale at `3b32adc2` until `git fetch origin main`; fetch updated `origin/main` to `89eb4578` |
| Worktree | clean (`git status --porcelain` empty). Local `.env`, `vendor/`, `node_modules/`, `database/database.sqlite`, and `public/build/` are gitignored and were created only to run the suites. |
| Detached start | VM booted detached at `89eb4578` (requested). Branch created without touching product files. |

**Classification:** git identity matches the contract (`main` @ `89eb457`, PR #284 merge).

---

## 2. Discovered commands (not invented)

From `package.json`, `composer.json`, and `.github/workflows/tests.yml`:

| Surface | Command | Source |
|---|---|---|
| TypeScript | `npm run types:check` → `php artisan wayfinder:generate --with-form && tsc --noEmit` | `package.json` `scripts.types:check` |
| Vitest | `npm test` → `vitest run` | `package.json` `scripts.test` |
| ESLint | `npm run lint:check` → `eslint .` | `package.json` `scripts.lint:check` |
| Vite production | `npm run build` → `vite build` | `package.json` `scripts.build` |
| Pest / CI | `composer ci:check` → `php artisan config:clear` + `php artisan test` | `composer.json` `scripts.ci:check` / `scripts.test` |
| GitHub CI | `composer setup` then **`composer ci:check` only** | `.github/workflows/tests.yml` |

Confirmed: **CI runs Pest only.** It does not run `tsc`, Vitest, ESLint, or `vite build`. `.github/workflows/mobile.yml` typechecks / lints / tests `mobile/` only when those paths change.

Rerun helper: `scripts/product-rebuild/qa-baseline.sh`.

---

## 3. Suite results

Every failure is **PRE-EXISTING**. Every passing suite is **CURRENTLY GREEN**.

| Command | Result | Counts | Classification |
|---|---|---|---|
| `npm run types:check` | FAIL (exit 2) | **3 errors / 0 warnings** | PRE-EXISTING |
| `npm test` (`vitest run`) | PASS (exit 0) | **26 files / 89 tests** | CURRENTLY GREEN |
| `npm run lint:check` | FAIL (exit 1) | **389 problems (386 errors, 3 warnings)** across 114 files | PRE-EXISTING |
| `npm run build` (`vite build`) | PASS (exit 0) | built in 31.98s; 2 build warnings (chunk size, ineffective dynamic import) | CURRENTLY GREEN (warnings noted) |
| `composer ci:check` (`php artisan test`) | PASS (exit 0) | **1200 tests / 1199 passed / 1 skipped / 1 risky** / 33706 assertions / 58.6s | CURRENTLY GREEN (skip + risky are PRE-EXISTING) |
| Headless Playwright authenticated routes | PASS | **12/12 routes HTTP 200**; 0 console errors; 0 console warnings; 0 failed network requests | CURRENTLY GREEN |

CI implication: a green GitHub `ci` job can ship the 3 TypeScript errors and the 386 ESLint errors. Wave 1 must not treat “CI green” as “types/lint green.”

---

## 4. PRE-EXISTING TypeScript errors (verbatim)

`npm run types:check` after Wayfinder generation. Exact `tsc --noEmit` text:

```
resources/js/components/dashboard/dashboard-recent.tsx(53,33): error TS2322: Type '{ children: string; record: RecordRef; mode: "drawer"; className: string; dir: string; }' is not assignable to type 'IntrinsicAttributes & { record: RecordRef; mode?: "full" | "drawer" | undefined; children: ReactNode; className?: string | undefined; }'.
  Property 'dir' does not exist on type 'IntrinsicAttributes & { record: RecordRef; mode?: "full" | "drawer" | undefined; children: ReactNode; className?: string | undefined; }'.
resources/js/evo/data/crm-list/tablecn.tsx(20,44): error TS2305: Module '"@/evo/icons"' has no exported member 'EyeSlash'.
resources/js/evo/data/crm-list/tablecn.tsx(32,23): error TS2305: Module '"@/lib/list-view-config"' has no exported member 'sortableColumnIds'.
```

### 4.1 `dashboard-recent.tsx` — `RecordLink` `dir` (pre-existing, not from #284)

`DashboardRecent` passes `dir="auto"` to `RecordLink` (`resources/js/ds/workspace/quick-record/RecordLink.tsx`). `RecordLink` accepts only `{ record, mode?, children, className? }`. The `dir` prop is invalid. This is a dashboard / RTL leftover, not introduced by the hierarchical sidebar.

### 4.2 `tablecn.tsx` — `EyeSlash` + `sortableColumnIds` (from PR #284, unimported)

`resources/js/evo/data/crm-list/tablecn.tsx` is **not imported** by any page, test, or barrel (repo-wide search hits only the file itself). It still typechecks because `tsc` includes it.

Verified missing exports:

- `@/evo/icons` (`resources/js/evo/icons/index.ts`) has no `EyeSlash` (Phosphor named exports only; `EyeSlash` is not in the barrel).
- `@/lib/list-view-config` exports `columnLabel` and `visibleColumns` but **not** `sortableColumnIds`.

These two errors came in with PR #284 as an unused Tablecn contacts adapter. Wave 1 should either import and finish the file, or delete it — do not leave a dead module that fails `tsc`.

---

## 5. PRE-EXISTING ESLint (verbatim summary)

`eslint .` → `✖ 389 problems (386 errors, 3 warnings)`. 341 errors are auto-fixable (`--fix`). **Do not auto-fix as part of the rebuild** unless a Wave explicitly owns lint.

### 5.1 Rule counts (errors)

| Rule | Count |
|---|---|
| `@stylistic/padding-line-between-statements` | 182 |
| `import/order` | 114 |
| `no-restricted-syntax` | 34 |
| `curly` | 26 |
| `import/consistent-type-specifier-style` | 17 |
| `no-undef` | 6 |
| `@typescript-eslint/no-unused-vars` | 2 |
| `@typescript-eslint/no-require-imports` | 2 |
| `@stylistic/brace-style` | 2 |
| `react-hooks/set-state-in-effect` | 1 (`inline-record-field.tsx:25` — “Calling setState synchronously within an effect can trigger cascading renders”) |

Root `eslint.config.js` lints the whole repo, including `mobile/` CommonJS mocks (`module` / `require` → `no-undef`).

### 5.2 Warnings (verbatim)

`resources/design-lab/pages/ContactsListPage.tsx:29` — `react-hooks/exhaustive-deps`:

> The 'wonIds' object construction makes the dependencies of useMemo Hook (at line 56) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'wonIds' in its own useMemo() Hook

`resources/js/components/crm/tasks-overlay.tsx:45` — `react-hooks/exhaustive-deps`:

> The 'tasks' logical expression could make the dependencies of useMemo Hook (at line 57) change on every render. To fix this, wrap the initialization of 'tasks' in its own useMemo() Hook

`resources/js/components/crm/tasks-overlay.tsx:47` — `react-hooks/exhaustive-deps`:

> React Hook useMemo has an unnecessary dependency: 'open'. Either exclude it or remove the dependency array

### 5.3 Unused-var errors (verbatim)

`resources/js/pages/auth/login.tsx:30` and `resources/js/pages/auth/register.tsx:21`:

> '_canLoginWithGoogle' is defined but never used  `@typescript-eslint/no-unused-vars`

---

## 6. Vite production build (CURRENTLY GREEN)

`npm run build` exit 0. Notable warnings (not failures):

```
[INEFFECTIVE_DYNAMIC_IMPORT] resources/js/pages/auth/auth-screen.tsx is dynamically imported by resources/js/app.tsx but also statically imported by resources/js/layouts/auth-layout.tsx, dynamic import will not move module into another chunk.

Some chunks are larger than 500 kB after minification.
```

Largest chunks after minify: `a11y-*.js` 674.61 kB, `main-*.js` 573.23 kB, `app-*.js` 497.07 kB.

---

## 7. Pest / CI — CURRENTLY GREEN

Exact `composer ci:check` reporter JSON (measured **before** installing Playwright at `/tmp/pw`, which is the CI-equivalent state):

```
{"tool":"pest","result":"passed","tests":1200,"passed":1199,"assertions":33706,"duration_ms":58601,"skipped":1,"risky":1}
```

Exit 0.

### 7.1 Skipped (PRE-EXISTING)

`tests/Feature/GoldenCopyGuardTest.php` — `it loads every golden route in light 1440 and fails on denylisted copy`:

```
Playwright is not installed at /tmp/pw.
```

CI never installs Playwright, so this skip is the GitHub `ci` job’s normal path. The test is in group `golden`.

If `/tmp/pw` **is** present, the same test **fails** (not a baseline CI failure): `phpunit.xml` sets `APP_URL=http://localhost` (no port), and the guard script then does `page.goto('http://localhost/login')` → `net::ERR_CONNECTION_REFUSED`. Do not treat that local fail as a Wave 0 product regression.

### 7.2 Risky (PRE-EXISTING)

Pest reports `risky:1` even with `--exclude-group=golden` (1199 passed, still `risky:1`). JUnit has no `assertions="0"` case. Every run also prints:

```
PHP Warning: The use statement with non-compound name 'InvalidArgumentException' has no effect in /workspace/tests/Feature/EvoTicketsP1ModelTest.php on line 10
PHP Warning: The use statement with non-compound name 'InvalidArgumentException' has no effect in /workspace/tests/Feature/EvoTicketsP4DeskOpenTest.php on line 12
```

Not a failure. Do not “fix” those imports in this Wave 0 PR.

### 7.3 What CI does not run

`.github/workflows/tests.yml` → `composer setup` + `composer ci:check`. **Not** `tsc`, Vitest, ESLint, or `vite build`. A green PR check can ship the three TypeScript errors in §4.

---

## 8. Authenticated Playwright routes — CURRENTLY GREEN

Local app: `.env.example` → key, SQLite, `php artisan migrate --force`, `php artisan db:seed --force`, `npm run build`, `php artisan serve --host=0.0.0.0 --port=8000`.

Login: `owner@evosales.local` / `password` (seeded **Evotechly** owner). Both seeded workspaces have `simple_mode = true`. Login landed on `/dashboard` with no console or network failures.

Headless Chromium (`playwright-core` + system Chrome, 1440×900, light). Per-route wait: `domcontentloaded` + 2.5s. **Not** a repo script and **not** added to `package.json`.

| Route | Path | Final URL | Title | HTTP | Console errors | Console warnings | Failed network |
|---|---|---|---|---|---|---|---|
| Dashboard | `/dashboard` | `/dashboard` | Accueil · EvoCrm | 200 | none | none | none |
| Contacts | `/crm/contacts` | `/crm/contacts` | Contacts · EvoCrm | 200 | none | none | none |
| Contact record | `/crm/contacts/1` | `/crm/contacts/1` | Amine Benali · EvoCrm | 200 | none | none | none |
| Companies | `/crm/companies` | `/crm/companies` | Companies · EvoCrm | 200 | none | none | none |
| Leads | `/crm/leads` | `/crm/leads` | Leads · EvoCrm | 200 | none | none | none |
| Deals list | `/crm/deals` | `/crm/deals` | Affaires · EvoCrm | 200 | none | none | none |
| Deals board | `/crm/deals/board` | `/crm/deals/board` | Affaires · EvoCrm | 200 | none | none | none |
| Deal record | `/crm/deals/1` | `/crm/deals/1` | Clinic website intake · EvoCrm | 200 | none | none | none |
| Inbox | `/inbox` | `/inbox` | Boîte de réception · EvoCrm | 200 | none | none | none |
| Quotes | `/crm/quotes` | `/crm/quotes` | Devis · EvoCrm | 200 | none | none | none |
| Quote detail | `/crm/quotes/1` | `/crm/quotes/1` | Clinic website intake · EvoCrm | 200 | none | none | none |
| Settings | `/settings` | `/settings/profile` | Paramètres du profil · EvoCrm | 200 | none | none | none |

**Console errors/warnings per route:** none recorded.

**Failed network requests per route:** none recorded (status ≥ 400 or `requestfailed`).

Observational (not a Playwright failure): document titles for **Companies** and **Leads** stayed English while Home / Deals / Inbox / Quotes / Settings used French (`APP_LOCALE=fr`). Wave 1 i18n work should treat those two list titles as a parity hole — see §10.8.

---

## 9. Contract tests that protect Wave 1 surfaces

What exists today for the areas Wave 1 will touch. Suites: **Pest** (`tests/Feature`, `tests/Unit`), **Vitest** (`*.test.ts` under `resources/js`), **tests/js** (Node proof files invoked from Pest source-locks).

| Area | Coverage? | Suite / files | What is actually locked |
|---|---|---|---|
| Navigation / `product-nav` | **Partial** | **Vitest** `resources/js/components/shell/product-nav.test.ts` (4 cases: deepest-child active, trailing slash, simple-mode groups, feature + capability filters). **Pest** `EvoShellTest.php` (rail uses `visibleSections`). **Pest** `AgentsShellTest.php` (product-nav must not contain `id: 'agents'`). | Hierarchical IA helpers. **Not** a rendered rail / keyboard / collapsed-state contract. |
| Legacy AppSidebar source-locks | **Stale vs #284** | **Pest** `Wave0ShellChromeTest.php`, `P04AppShellTest.php` still `file_get_contents` `app-sidebar.tsx` and lock flat labels (`Home`, `Vendre`, `Inbox`, `useSimpleMode`). Live chrome is `evo-rail.tsx` + `product-nav.ts`. | Old sidebar file still present; Wave 1 can break the live rail without failing these if `app-sidebar.tsx` is left untouched. |
| Simple Mode | **Yes (server + nav props)** | **Pest** `SimpleModeToggleTest.php`, `SimpleModeNavTest.php`, `SimpleModeGuardTest.php`. Vitest `product-nav.test.ts` simple-mode group filter. | Default-on, owner toggle, member forbidden, hidden power routes 403, `/leads` → board, owner can open quotes + deals board. |
| Permissions / capabilities | **Yes (server + some UI source-locks)** | **Pest** `CrmPermissionsTest.php`, `CrmBulkActionsTest.php`, `ContactImportTest.php`, `ContactMergeTest.php`, `P09QuickRecordDrawerTest.php` (peek `capabilities.activity`), `P16CommandOsTest.php` / `P18QuotesBuilderTest.php` (member without `crm.edit`), `Settings/SettingsInformationArchitectureTest.php` (`capabilities.includes(destination.permission)`). Vitest `product-nav.test.ts` capability filter. **tests/js** `p16-command-os.ts` catalog gated by capabilities. | HTTP boundaries + a few string locks. **No** frontend capability matrix test for the new hierarchical nav items beyond the Vitest helper. |
| QuickRecord | **Yes (heavy Pest source-locks + JS proofs)** | **Pest** `P09QuickRecordDrawerTest.php`, `P10QuickRecordDrawerIntegrationTest.php`, `P16CommandOsTest.php`. **Vitest** `resources/js/evo/crm/record/record-workspace.test.ts`. **tests/js** `p16-command-os.ts` (`handleQuickRecordEscapeKeyDown`). | One drawer, five adapters, peek JSON, escape race, list integration. **Does not** typecheck `RecordLink` props (see §4.1). |
| DataWorkspace URL state | **Yes** | **Pest** `P03CListQueryOwnershipTest.php` (canonical query + “URL is source of truth”). **Vitest** `resources/js/evo/data/adapters/url-state.test.ts` (`replaceListUrl` → Inertia `router.get` with `preserveState` / `preserveScroll` / `replace`). Supporting: `P05DataWorkspaceTest.php`, `P03A` / `P03B` / `P03D`, `CrmListWorkspaceTest.php`. | Contract + one adapter unit. No browser back/forward test. |
| Saved views | **Yes (HTTP)** | **Pest** `CrmSavedViewTest.php` (`?view=my` on contacts + deals). `CrmFilterTest.php` (save filter / groups / counts). `EvoCell1TeamCrmTest.php` (workspace / team visibility). `P03C` saved-view change in the query contract. `P07` / `P08` source-lock “saved views” on deals/quotes lists. | Server filter + Inertia props. **No** Vitest for `SavedViews.tsx` UI. |
| Pipeline DnD | **Partial — announcements + HTTP move, not drag** | **Vitest** `resources/js/evo/crm/pipeline/pipeline.test.ts` (French `onDragStart/Over/End/Cancel` strings). **Pest** `MoveDealTest.php` + `DealStagesTest.php` (HTTP `POST /crm/deals/{id}/move`). `P11DealsPipelineBoardTest.php`, `CrmPipelineWorkspaceTest.php`, `P26AccessibilityTest.php` (source-lock kanban a11y; `pipeline-kanban.tsx` is asserted **not** to contain `dnd-kit`). | Live deals board is `DealPipelineBoard` → `evo/crm/pipeline/Pipeline.tsx` (**does** use `@dnd-kit`). The old `pipeline-kanban.tsx` is still used by `pages/leads/board.tsx`. **No test** asserts dnd-kit collision, drop payload, or lost-reason dialog on drag-to-lost. |
| Inbox composer | **Partial — reply HTTP + chrome source-locks** | **Pest** `DeskComposerTest.php` (POST reply persists when Evolution is disconnected). `P13InboxWorkspaceTest.php`, `P14InboxCrmContextTest.php`, `P26AccessibilityTest.php` (composer a11y strings: reply/note `aria-pressed`, `t('Type your message')`). **Vitest** `resources/js/evo/inbox/inbox.test.ts` (channel chips, canned templates, Algiers clock — **not** Composer). **tests/js** `p13-inbox-workspace.ts`, `p14-inbox-crm-context.ts`. | No Vitest for `evo/inbox/Composer.tsx` (Enter-to-send, note vs reply, template picker, attachment). |
| i18n parity | **Yes for locale files; partial for chrome** | **Pest** `I18nFoundationTest.php` (identical keys across `fr` / `en` / `ar`, placeholder parity, count > 1500). `ConvergencePass02Test.php` (Closer composer keys via `t(...)`). **Vitest** `resources/js/evo/vendor/reui/data-grid/i18n.test.ts` (DataGrid / filter keys present in `fr.json`). | **No** test that new hierarchical nav labels / Simple Mode chrome / pipeline DnD announcements stay in all three locale JSON files beyond the foundation key-set equality (adding an English-only string would fail `I18nFoundationTest`; a missing `t()` wrap would not). |

---

## 10. Gaps Wave 1 should guard (lightweight tests)

These are the holes. Prefer one focused Vitest or one Pest Inertia assertion each — not a new browser suite.

1. **Live rail, not `app-sidebar.tsx`.** Add a Pest/Vitest lock on `product-nav.ts` + `evo-rail.tsx` for section ids, hrefs, and simple-mode visibility. `Wave0ShellChromeTest` / `P04AppShellTest` will stay green if the dead sidebar is untouched.
2. **`RecordLink` props.** Extend the QuickRecord types so `dir` / extra DOM attrs are either allowed or forbidden by a type test. Today `tsc` fails in CI-invisible silence.
3. **Delete or wire `tablecn.tsx`.** Unimported file from #284 is 2 of 3 `tsc` errors.
4. **Pipeline dnd-kit behavior.** One unit test for `Pipeline` `onMove` payload (source column, target column, item id) and one Pest that the deals board page still mounts `DealPipelineBoard` / `@dnd-kit` `DndContext`. Current locks still talk about the old kanban.
5. **Inbox Composer.** Vitest for submit hotkey, mode toggle, and i18n keys on `Composer.tsx`.
6. **Saved view UI.** Vitest or Pest that `SavedViews` emits `listQueryHref` / `view=` and does not `router.get` (P03C already string-locks this — keep it, add a helper test if the component is rewritten).
7. **Capability × hierarchical nav.** Expand `product-nav.test.ts` to every Wave 1 destination (settings children, quotes, inbox) so a redesigned rail cannot re-expose power items in Simple Mode.
8. **i18n wrap, not just key files.** A small source-lock that `product-nav.ts` labels go through `t()` (or are keys present in `fr.json`). `I18nFoundationTest` does not catch raw English in TSX.
9. **Do not add Playwright to CI in Wave 1.** This baseline’s browser pass is a one-off. The repo’s stated strategy (`docs/implementation/test-strategy.md`) still has no first-party Playwright suite.

---

## 11. Environment notes (this run)

- PHP 8.3.6 + Composer 2.10.3 + Node v22.14.0 / npm 10.9.7 installed on the Cloud Agent image (not present at boot).
- App provisioned with `.env.example` → key, SQLite, `php artisan migrate --force`, `php artisan db:seed --force` (`DatabaseSeeder` + `VisualQaSeeder`).
- No deploy. No production access. No product-file edits.

---

## 12. Revision log

| Rev | Contents |
|---|---|
| 1 | Git identity, discovered commands, tsc / vitest / eslint / vite results, contract inventory, gaps. |
| 2 | Pest JSON counts (CI-equivalent skip of GoldenCopy), Playwright 12/12 green with empty console/network tables. |
