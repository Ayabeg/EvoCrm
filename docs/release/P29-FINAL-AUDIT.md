# P29 — Final functional convergence & release hardening

**Status:** Audit + compact proof in progress. Not a feature, redesign, architecture, cleanup, dep-upgrade, or perf rewrite.  
**Repo:** `Mohamedbeghanem/EvoCrm`  
**AUTHORITATIVE BASE (`starting_ref` / `origin/main`):** `fc57d94c379968f5a987075aeb426acf0b152180`  
**P00–P28:** Frozen. This phase does not reopen them.  
**V00:** Not started. Visual program waits for Contabo.  
**Contabo / merge:** Not authorized. `READY_FOR_CONTABO: NO` · `MERGE READY: NO`  
**Date:** 2026-09-19.

Mission: prove EvoCRM works as **one product** after P00–P28. Expand code only for genuine **BLOCKER** functional regressions. Classify everything else as POST-VISUAL / POST-V1 / NOT-A-BUG.

---

## 0. Pre-flight

| Check | Result |
|---|---|
| Local `HEAD` at start | `fc57d94c379968f5a987075aeb426acf0b152180` (detached, then branched) |
| `git fetch origin main` | `origin/main` = `fc57d94c379968f5a987075aeb426acf0b152180` |
| Working tree | Clean at branch create |
| Tip of `main` after P27 / P28 | `#243` P27 motion + `#242` P28 leftover deletion |
| PHP / Composer / Node | PHP 8.3.6 · Composer 2.10.3 · Node 22.14 · npm lock install |
| Migrations | 69 files apply on sqlite (`php artisan migrate --force`) |
| `evocrm:product-ready` | Pass (existence gate; does not run Pest). Warns `ProductionSafetyValidator` absent — **NOT-A-BUG**, G6 already documents that |
| `vite build` | Pass (Wayfinder `formVariants: true`) |
| `tsc --noEmit` | Pass **after** Vite Wayfinder generate. Bare `php artisan wayfinder:generate` omits `.form()` — **NOT-A-BUG**, documented generation path |
| `npm run lint:check` | 203 pre-existing errors (import/order, mobile, stylistic). Same class as P28. **POST-V1**. CI does not run eslint |
| P27 / P28 residue | No unfinished P27 motion work. P28 A-deletes stay gone. Two C-compat comments still say “Delete in P28” on `app-header.tsx` / `app-header-layout.tsx` — P28 **kept** those files. **NOT-A-BUG**. Do not delete; tests lock them |
| PHPStan | Pre-existing ~1574 errors (P28). Not a P29 gate. **POST-V1** |
| CI job | `.github/workflows/tests.yml` → `composer setup` + `composer ci:check` → `php artisan test` |

**P27/P28 residue decision:** leave the two “Delete in P28” comments. Updating comments is cleanup. Ownership remains P28 C-COMPATIBILITY.

---

## Freeze law

- No speculative improvements, no while-we’re-here, no new capabilities.
- No V00 paint / hex hunt as a merge gate (MASTER P29 visual QA is **deferred** until after Contabo).
- No Contabo deploy. Research owns Contabo.
- Do not merge.
- BLOCKER-only code expansion. Each fix must name the frozen contract it restores.

---

## Severity rubric

| Class | Meaning | Code? |
|---|---|---|
| **BLOCKER** | Release-blocking functional break: auth/isolation leak, write that does not persist, broken CRM loop, secret in DOM/logs, activation CORE lie, Ask Evo write/side-channel | Yes, smallest safe fix |
| **POST-VISUAL** | Density, hex leftover, <768 craft, DEFER-VISUAL from P25–P27 | No |
| **POST-V1** | Pre-existing lint/phpstan, leftover C-compat files, unused GuidedActionBuilder | No |
| **NOT-A-BUG** | Documented warn, generation-path difference, intentional P28 keep | No |

---

## Method (LEAN)

Do **not** re-run P25–P28 exhaustively. Prove compact journeys:

1. Existing Pest contract files that already own the surface (source of truth).
2. One new `P29FinalConvergenceTest` that walks a single workspace through the product loop + isolation.
3. Browser only on integration boundaries if a BLOCKER is suspected and HTTP cannot see it.
4. Full Pest + types + build + CI once before stop — not after every edit.

---

## Journeys

Evidence is filled as gates run. “Owner” is the frozen contract, not a new one.

### 1. Auth / workspace / permissions + isolation

| | |
|---|---|
| Owner | Fortify auth · `EnforceProductPermissions` · G4 policies · `forWorkspace` |
| Proof | Login → dashboard. Guest `/dashboard` unauthenticated. Foreign contact show/peek 404. Member cannot `PUT /settings/workspace`. Command search and Ask Evo omit other-workspace rows |
| Existing | `Auth/AuthenticationTest`, `CrmPermissionsTest`, `CrmPolicyTest`, `WebhookTenantIsolationTest`, `Api/V1/ContactWorkspaceTest` |
| Verdict | Pending focused Pest |

### 2. Shell / nav / Command OS / deep links

| | |
|---|---|
| Owner | P02 / P16 · Home href `/dashboard` · one palette |
| Proof | `data-command="os"` · search hits workspace records · `evoSearchIndex` empty · no `/home` |
| Existing | `Wave0ShellChromeTest`, `P16CommandOsTest`, `SimpleModeNavTest` |
| Verdict | Pending focused Pest |

### 3. CRM E2E Contacts / Companies / Leads / Deals / Pipeline / Quotes

| | |
|---|---|
| Owner | P04–P08 · create POSTs · `LeadConverter` · `Deal::moveTo` · quote on deal |
| Proof | One HTTP loop: company → contact → lead → deal → move → quote (Mail::fake send) |
| Existing | `CreateContactTest`, `CrmCreateDrawerTest`, `LeadConversionTest`, `MoveDealTest`, `QuoteAcceptanceTest` |
| Verdict | Pending focused Pest |

### 4. DataWorkspace contract

| | |
|---|---|
| Owner | P03A–D · `CrmListShell` `resultMode="shared-table"` |
| Proof | Contacts/Companies/Leads/Deals/Quotes still mount `CrmListShell` + `DataWorkspace`. No `rows={[]}` stub. Tickets stay off this wave |
| Existing | `CrmListWorkspaceTest`, `P03A`–`P03D`, `P04`–`P08` |
| Verdict | Pending focused Pest |

### 5. QRD Contact / Company / Deal / Quote

| | |
|---|---|
| Owner | P09 / P10 · `GET /crm/records/{type}/{id}/peek` · `?peek=` |
| Proof | Peek JSON 200 for contact/company/lead/deal/quote. Foreign 404. No writes |
| Existing | `P09QuickRecordDrawerTest`, `P10QuickRecordDrawerIntegrationTest` |
| Verdict | Pending focused Pest |

### 6. Pipeline persistence / permissions

| | |
|---|---|
| Owner | P11 / P12 · `POST /crm/deals/{deal}/move` · `PipelinePolicy` |
| Proof | Move persists after follow-up GET. Member cannot create pipelines |
| Existing | `MoveDealTest`, `P12PipelineAttentionTest`, `PipelineSettingsTest` |
| Verdict | Pending focused Pest |

### 7. Inbox native (+ embed compatibility only)

| | |
|---|---|
| Owner | P13 / P14 · `data-inbox="native"` + `data-inbox="embed"` · CSP |
| Proof | Native four-pane lock + embed flag + `InboxCspHeadersTest`. No third inbox |
| Existing | `P13InboxWorkspaceTest`, `P14InboxCrmContextTest`, `InboxCspHeadersTest` |
| Verdict | Pending focused Pest |

### 8. Activities

| | |
|---|---|
| Owner | P15 · `POST /crm/activities` · work queue |
| Proof | Task create appears on `/crm/activities` and Home work |
| Existing | `ActivityCreateTest`, `P15ActivitiesWorkQueueTest`, `ActivitiesIndexTest` |
| Verdict | Pending focused Pest |

### 9. Dashboard composition → record navigation

| | |
|---|---|
| Owner | P17 · attention / work / recent / pipeline hrefs |
| Proof | Recent item `recordRef` points at a live record GET 200. KPI 2×2 frozen (do not restyle) |
| Existing | `P17DashboardOperatingHomeTest` |
| Verdict | Pending focused Pest |

### 10. Quotes lifecycle (no live external email)

| | |
|---|---|
| Owner | P18 · `QuoteMailer` / `QuoteAcceptor` |
| Proof | Create + `Mail::fake()` send + public accept. Snapshot immutable after send |
| Existing | `P18QuotesBuilderTest`, `QuoteDeliveryTest`, `QuoteAcceptanceTest` |
| Verdict | Pending focused Pest |

### 11. Automation authoring / history / safety

| | |
|---|---|
| Owner | P19 / P20 · structured builder · `WorkflowExecutionRedactor` |
| Proof | No canvas. History redacts tokens/URLs. No unsafe outbound side effects in this phase |
| Existing | `P19AutomationAuthoringTest`, `P20AutomationHistoryTest`, `WorkflowExecutionRedactorTest` |
| Verdict | Pending focused Pest |

### 12. Settings IA sample saves

| | |
|---|---|
| Owner | P21 · existing hrefs · `PUT /settings/workspace` |
| Proof | Owner toggles `simple_mode`; value persists on GET. Member 403 |
| Existing | `SimpleModeToggleTest`, `EvoCrmWave5SettingsChromeTest` |
| Verdict | Pending focused Pest |

### 13. Integrations status / mask / reveal / isolation

| | |
|---|---|
| Owner | P22 · `masked_url` + reveal POST · never print secrets |
| Proof | GET `/settings/meta` has no workspace webhook key. Reveal returns this workspace only |
| Existing | `Settings/P22IntegrationsTest`, `WorkspaceMetaCredentialsTest` |
| Verdict | Pending focused Pest |

### 14. Activation CORE contract

| | |
|---|---|
| Owner | P23 · `WorkspaceActivationService` |
| Proof | Empty workspace `activated=false`. After contact + deal + activity → `activated=true`. Optional steps do not block. Dismiss ≠ complete |
| Existing | `P23ActivationTest` |
| Verdict | Pending focused Pest |

### 15. Ask Evo (read / explain only)

| | |
|---|---|
| Owner | P24 · authorize-before-build · secret redactor |
| Proof | Foreign entity → `unauthorized` + empty facts. Logger allowlist only. No write tools |
| Existing | `P24ContextualAskEvoTest`, `P24AskEvoSecurityTest` |
| Verdict | Pending focused Pest |

### 16. Responsive / a11y / motion samples

| | |
|---|---|
| Owner | P25 / P26 / P27 |
| Proof | Reuse source locks: `PAGE_OVERFLOW_CLASS`, focus/names, P27 tokens, reduced-motion kill. Viewports 1440 / 1024 / 768. 1280 only if needed. No H-overflow class regressions |
| Existing | `P25ResponsiveHardeningTest`, `P26AccessibilityTest`, `P27MotionTest` |
| Verdict | Pending focused Pest. Live Contabo walk is Research-owned |

### 17. Error / empty / loading samples

| | |
|---|---|
| Owner | Wave6 · DataWorkspace skeleton · inbox empty |
| Proof | Empty titles locked. Loading is immediate skeleton (no fake delay) |
| Existing | `EvoCrmWave6EmptyMotionTest` |
| Verdict | Pending focused Pest |

### 18. Persistence after refresh / logout

| | |
|---|---|
| Owner | Session + Eloquent writes |
| Proof | After logout + login, created contact and deal still GET 200. Pipeline move still on the new stage |
| Existing | Auth tests + P29 loop |
| Verdict | Pending focused Pest |

### 19. Migrations / deploy sanity

| | |
|---|---|
| Owner | `database/migrations` · Dockerfile `php artisan serve --host=0.0.0.0` |
| Proof | Fresh sqlite migrate OK. Dockerfile binds `0.0.0.0:${PORT:-8000}`. Filesystem treated ephemeral (sqlite is local/dev). **Do not deploy Contabo** |
| Verdict | Pre-flight PASS. Contabo remains Research |

### 20. Logging / secret safety

| | |
|---|---|
| Owner | `AskEvoLogger` allowlist · `WorkflowExecutionRedactor` · P22 mask |
| Proof | Ask Evo logs operational keys only. Workflow errors redact tokens. Integration GET never embeds raw webhook keys |
| Existing | `P24AskEvoSecurityTest`, `WorkflowExecutionRedactorTest`, `P22IntegrationsTest` |
| Verdict | Pending focused Pest |

---

## BLOCKERS found / fixed

None yet. Code expansion remains **zero** until a journey fails as a functional regression.

---

## NON-BLOCKING DEBT

| ID | Class | Item | Owner |
|---|---|---|---|
| N1 | POST-V1 | Repo-wide eslint 203 errors (import/order, stylistic, unused `StepFields`) | Pre-P29 |
| N2 | POST-V1 | PHPStan ~1574 pre-existing | Pre-P29 |
| N3 | NOT-A-BUG | `app-header` / `app-header-layout` “Delete in P28” comments on C-compat files P28 kept | P28 |
| N4 | NOT-A-BUG | `evocrm:product-ready` warns missing `ProductionSafetyValidator` | G6 |
| N5 | NOT-A-BUG | `tsc` fails after artisan-only Wayfinder generate (no `formVariants`) | Tooling |
| N6 | POST-V1 | `GuidedActionBuilder` leftover, not on Home payload | P17 / P23 |
| N7 | POST-VISUAL | MASTER P29 hex `rg` / density polish | V00+ after Contabo |
| N8 | POST-VISUAL | P25 DEFER-VISUAL rows (phone <768, inline table min-widths) | V00–V15 |
| N9 | POST-VISUAL | P26 DEFER-VISUAL contrast leftovers | Visual program |
| N10 | POST-V1 | Vite 500kB `app` chunk warning | Perf, not functional |

---

## DEFERRED TO V00–V15 / POST-V1

- Visual program (V00–V15). `READY FOR VISUAL PROGRAM: NO` until Contabo.
- Hex leftover hunt from MASTER P29.
- ESLint / PHPStan cleanup.
- Deleting P28 C-compat files (`app-header`, Lucide leftover pages tests still lock).
- Adding `ProductionSafetyValidator`.
- Contabo deploy and populated QA.

---

## Gates (this PR)

| Gate | Result |
|---|---|
| Focused P29 + owner Pest | Pending |
| Full Pest | Pending |
| `tsc --noEmit` (after Vite Wayfinder) | PASS |
| `vite build` | PASS |
| ESLint | Pre-existing red — not a CI gate |
| CI (`composer ci:check`) | Pending |

---

## Report (parent)

| Field | Value |
|---|---|
| BASE | `fc57d94c379968f5a987075aeb426acf0b152180` |
| TIP | This branch (update at stop) |
| PR URL | Pending |
| AUDIT | `docs/release/P29-FINAL-AUDIT.md` |
| BLOCKERS found/fixed | None yet |
| NON-BLOCKING DEBT | N1–N10 |
| DEFERRED | V00–V15 visual · POST-V1 lint/stan · Contabo |
| CI | Pending |
| READY_FOR_CONTABO | NO |
| MERGE READY | NO |
| P00–P29 FROZEN | NO until Contabo |
| READY FOR VISUAL PROGRAM | NO until Contabo |

STOP after CI green and this file is final. Do not merge. Do not deploy. Do not start V00.
