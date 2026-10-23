# Acquisition systems release report

Current implementation revision: `6a794282` (`main`; release report is maintained in subsequent documentation commits)

This report records the current verified state of Dead Enrichment, EvoCRM Outbound, and Dead Magnet. It is a release-readiness report, not a claim that live providers, deployment secrets, or legal approvals are complete.

## Implemented and verified

- Shared workspace-scoped CRM integration across companies, contacts, leads, activities, consent, suppression, enrichment provenance, outbound messages, and funnel events.
- Dead Enrichment ingestion, incomplete-row retention, normalization, duplicate-safe re-imports, provider evidence, verification-state projection, CRM detection, explainable data-quality scoring, bounded queueing, retries, and retry actions.
- Enrichment providers are isolated within a run: transient failures remain retryable, while successful partial results from other providers are preserved.
- Email verification now has a modular provider contract, disabled-by-default fail-closed fallback, optional DNS syntax/MX evidence, address-bound projection, and freshness caching. DNS evidence is explicitly not mailbox-level deliverability proof.
- An approved verifier can be connected through the authenticated HTTP adapter, which normalizes documented statuses, bounds stored response evidence, and retries transport/429/5xx failures without persisting credentials.
- Website enrichment honors `robots.txt` before every public fetch hop, caches policy by origin, and records a skip instead of scraping when a site disallows access or its policy cannot be verified.
- EvoCRM Outbound eligibility, suppression rechecks, explicit consent policy, template rendering, sanitized HTML, preview, campaign and sequence execution, quiet hours, mailbox caps, durable send claims, provider-event idempotency, reply classification, unsubscribe handling, and interested-reply tasks.
- Broadcast campaigns can be edited while draft or scheduled, with workspace-scoped audience/template/mailbox relationships; started campaigns remain immutable.
- Broadcast campaigns persist a configurable 20/day default cap; excess messages remain queued with a durable defer reason and resume on the next day, while mailbox caps remain independently enforced.
- Campaign daily-cap counting and rollover use each workspace's configured timezone rather than the application timezone.
- A shared runner pass isolates daily-cap counts per workspace, so one tenant's timezone cannot affect another tenant's campaign.
- Conservative email-verification eligibility: invalid, temporary-failure, unsupported, catch-all, and unknown states are blocked by default, with explicit deployment configuration required to allow uncertain states.
- Email-verification projections are address-bound and fail closed when stale; stronger current-address evidence is not silently replaced by weaker proposals.
- Missing email-verification metadata is treated as unknown and blocked by default; only the explicit authenticated mailbox test-send path may bypass prospect verification and consent checks, while still validating the recipient and suppression list.
- Explicit uncertain-email campaign policy: sequences and broadcast campaigns persist a strict-by-default policy, and permissive policies are honored only when the deployment-level uncertain-address guard also permits them. Evidence-only, not-found, not-detected, and conflicting states remain blocked because they do not prove deliverability.
- Durable campaign expansion for audiences over 1,000 contacts using resumable 250-contact cursor jobs and idempotent message creation.
- Dead Magnet Lead Leakage Calculator, validation, duplicate-safe submission persistence, separate delivery/marketing/enrichment consent, shared CRM handoff, queued result delivery with honest failure states, demo handoff, booking attribution, and persisted form-start, calculator-use, submission, demo-request, and booking funnel analytics.
- Public analytics consent gating and pseudonymous authenticated analytics identity.
- Database-backed idempotency for subject-scoped funnel events, with atomic recorder behavior and append-only subjectless visit tracking.
- Lead-magnet-to-meeting attribution uses signed booking capabilities; unsigned sequential submission IDs are ignored and ordinary public booking remains available without attribution.
- External repository audit completed: the three Ayabeg repositories are public but empty (size `0`, no remote heads), so there was no implementation to import; the non-empty 50k lead-generation repository was used as a reference for workflow boundaries only.
- Outbound reporting now exposes evidence-aware counts and rates for selection, attempts, mailer acceptance, provider delivery/bounce/complaint events, replies, positive replies, demo requests/bookings, suppression, CRM outcomes, and campaign errors. Every emitted rate includes its denominator; opens/clicks carry explicit caveats and are not treated as interest proof.
- Lead scoring rule points are now configurable per workspace for fit, intent, timing, and data quality, with bounded defaults, fallback for omitted values, and persisted explainable score breakdowns.
- Contact and deal imports now process through resumable 100-row queue pages, dispatching continuations while pending rows remain and refusing to reopen completed batches from stale duplicate workers.
- SMTP transport failures are redacted before persistence in outbound message diagnostics, while safe operational context such as timeout text remains available to operators.
- WhatsApp/SMS outbound and Desk SMS provider errors now use the same redaction contract before persistence.
- Shared CRM bulk-action worker and per-record failures now use the same redaction contract before persistence, including sequence-enrollment operations.
- Enrichment proposal, skip, and failure diagnostics now use the same redaction contract before `EnrichmentRun.error` persistence.
- Lead-capture merge exceptions now use the same redaction contract before `LeadCapture.error` persistence.
- Public URL-capture and Meta webhook worker exceptions now use the same redaction contract before persistence.
- Scheduled-report delivery failures now use the same redaction contract before `ScheduledReport.last_error` persistence.
- The repository-wide branding, shell-frame, dark-cabinet, canonical-token, and localization contracts now match the shipped EvoCRM shell; contact-source labels use the shared translation helper.

## Verification evidence

- Previous complete focused acquisition regression: **207 tests / 1,440 assertions passed**.
- Latest post-hardening acquisition integration subset: **181 tests / 1,254 assertions passed**, including lead-magnet engagement tracking, reply safety, imports, enrichment, provider events, and outbound execution.
- Consent and outbound lifecycle regression: **39 tests / 216 assertions passed**.
- Latest repository-wide regression after the signed lead-magnet booking hardening: **1,354 tests; 1,345 passed; 8 existing branding/design-system/automation contract failures; 35,811 assertions; 1 skipped**. The 8 failures are outside the acquisition-system implementation; no acquisition test failed.
- Frontend Vitest suite: **27 test files / 97 tests passed**.
- `npm run types:check` passed.
- Local browser smoke test passed for the public Lead Leakage Calculator at desktop and 390px mobile widths: the optional contact fields render as text/email controls, the page has no horizontal overflow, an isolated submission rendered the result and linked the shared CRM record, and Reset inputs restored defaults and hid the prior result.
- `git diff --check` passed.
- Current-tree Codex Security standard review `013e6eaf-f741-4d08-ad0f-5ab2bef6f61b`: zero reportable findings across seven reviewed acquisition surfaces; coverage is explicitly partial and limitations are recorded by the scan.
- Committed hardening diff review `8387f1e4-4aca-49d9-98e7-7621a3a338c1` for `29aad813` to `46661ae7`: zero reportable findings with complete coverage of five changed security surfaces. Live provider behavior, deployment secret rotation, and legal compliance remain external limitations.
- Latest acquisition diff review `8ec3adf4-f42c-4c05-b806-d79d4ddb1d45` for `46661ae7` to `286f2634`: zero reportable findings with complete coverage of seven changed security surfaces, including public lead-magnet tracking, outbound stale-claim handling, and reply branching.
- Funnel/acquisition idempotency verification on `3d578579`: migration-focused funnel set **20 tests / 152 assertions passed**; broader inbound, lead-magnet, funnel, booking, and outbound regression set **58 tests / 368 assertions passed**; Pint and `git diff --check` passed.
- Outbound verification-policy regression: **19 tests / 69 assertions passed**, including the default block for unknown verification results; Pint and `git diff --check` passed.
- Outbound fail-closed fallback regression: **44 tests / 219 assertions passed**, including behavior when the unknown-verification policy key is absent; Pint and `git diff --check` passed.
- Shell/locale/Aurora contract regression: **38 tests / 475 assertions passed** after restoring the localized `Search EvoCRM…` rail label; TypeScript, targeted ESLint, and `git diff --check` passed.
- Explicit email-policy regression: **44 tests / 223 assertions passed** across enrollment, campaign preview/expansion, and outbound execution paths; Pint, TypeScript, targeted ESLint, and `git diff --check` passed.
- Fail-closed missing-verification regression: **51 tests / 320 assertions passed** across enrollment, campaign execution, ordinary dispatch, and the controlled mailbox test-send path; Pint passed.
- Broadcast campaign editing regression: **8 tests / 108 assertions passed**; the broader outbound lifecycle set passed **64 tests / 383 assertions**; PHP formatting, TypeScript, targeted ESLint, production Vite build, and `git diff --check` passed.
- Per-campaign daily-cap regression: **70 tests / 402 assertions passed** across campaign expansion, rollover, editing, and outbound lifecycle; Pint, targeted ESLint, TypeScript, `git diff --check`, and the production Vite build passed. The build retains only the repository's existing optional-font, chunk-size, and dynamic-import warnings.
- Workspace-timezone campaign-cap regression: **24 tests / 164 assertions passed** for the outbound department; the broader outbound gate passed **72 tests / 411 assertions** with Pint and `git diff --check`.
- Multi-workspace cap-isolation regression: **25 tests / 171 assertions passed** for the outbound department; the focused campaign/outbound slice passed **57 tests / 357 assertions** with Pint and `git diff --check`.
- Signed lead-magnet booking regression: **20 tests / 195 assertions passed** across public calculator, meeting, and inbound workflow paths; Pint, targeted ESLint, TypeScript, and `git diff --check` passed.
- Email-verification provider/cache regression: **17 tests / 123 assertions passed**; the cross-system enrichment/outbound slice passed **68 tests / 394 assertions** with Pint. The disabled provider records an explanatory unsupported result, while an injected provider is cached per current address.
- HTTP verifier/retry regression: **3 tests / 18 assertions passed**; the broader provider/enrichment/outbound slice passed **71 tests / 412 assertions** with Pint and `git diff --check`.
- Robots/enrichment regression: **7 tests / 27 assertions passed**; the combined website/provider/acquisition slice passed **78 tests / 439 assertions** with Pint.
- Outbound report regression: **9 tests / 138 assertions passed**; targeted Pint, TypeScript, and `git diff --check` passed.
- Lead-scoring regression: **13 tests / 80 assertions passed**; targeted Pint and TypeScript passed.
- Score-settings input-shape hardening: **23 tests / 222 assertions passed** across lead scoring and outbound reporting; targeted Pint and `git diff --check` passed. Codex Security review `6dfb53e9-dcb2-4a99-a221-96759f29d7b3` completed with one low-severity finding remediated in the follow-up change.
- Connected workflow release gate: **70 tests / 513 assertions passed** across acquisition, inbound lead magnet, enrichment, outbound execution, consent, and reporting; the follow-up funnel/booking/reply/bounce/scoring gate passed **34 tests / 189 assertions**. `npm run types:check` passed.
- Window-scoped outbound detail reporting: the combined connected gate passed **104 tests / 704 assertions**, including regression coverage that excludes older outbound messages and funnel events from a current report window. Targeted Pint and `git diff --check` passed.
- Owner-scoped outbound detail reporting: the focused report suite passed **10 tests / 154 assertions**, and the connected gate passed **105 tests / 718 assertions**. Detail metrics, campaign rows, funnel attribution, and positive replies now honor the selected contact owner.
- Lead-magnet delivery error boundary: public responses no longer expose raw provider exception text; the focused public/inbound gate passed **8 tests / 90 assertions**, with Pint, TypeScript, and `git diff --check` passing.
- Post-hardening connected gate: **112 tests / 798 assertions passed** across acquisition, lead magnet, enrichment, outbound, funnel, consent, reply, bounce, reporting, and scoring paths.
- Delivery-diagnostic redaction follow-up: **34 tests / 345 assertions passed** across public lead magnet, inbound acquisition, outbound reporting, and scoring paths; provider errors are redacted before persistence as well as omitted from public props.
- Durable campaign expansion diagnostics now use the same redaction contract; the focused outbound expansion/redaction gate passes **28 tests / 185 assertions**.
- The latest connected acquisition/inbound/enrichment/outbound/funnel/scoring gate passes **115 tests / 808 assertions**; `npm run types:check` and targeted Pint pass.
- Public lead-magnet landing-page visits are now throttled at 120 requests/minute; the focused lead-magnet/inbound gate passes **11 tests / 108 assertions**.
- Current full PHP regression: **1,371 tests; 1,362 passed; 8 failures; 35,929 assertions; 1 skipped**. The 115-test acquisition gate remains green; the repository-wide suite is not yet release-green because of the known unrelated contract failures.
- Latest full PHP regression after resumable import queue pages: **1,373 tests; 1,364 passed; 8 known unrelated branding/design-system/automation failures; 35,937 assertions; 1 skipped**. The two existing `InvalidArgumentException` import warnings remain unchanged; the connected acquisition gate remains green at **132 tests / 970 assertions**.
- Latest cumulative full PHP regression after diagnostic hardening: **1,382 tests; 1,373 passed; 8 known unrelated branding/design-system/automation failures; 35,987 assertions; 1 skipped**. The two existing `InvalidArgumentException` import warnings remain unchanged; the connected acquisition gate remains green at **173 tests / 1,217 assertions**.
- Latest full PHP regression after synchronizing the shipped shell/design contracts: **1,382 tests; 1,381 passed; 36,054 assertions; 1 skipped**. The two existing ineffective `InvalidArgumentException` import warnings remain unchanged; the connected acquisition gate remains green at **173 tests / 1,217 assertions**. Prettier, ESLint, Pint, and `git diff --check` also pass.
- Contact/deal import diagnostics now redact terminal worker errors; the focused import/redaction gate passes **18 tests / 168 assertions**, and the connected acquisition gate including imports passes **131 tests / 966 assertions**.
- Resumable import queue pages and diagnostic redaction: the focused import/redaction gate passes **23 tests / 192 assertions**, and the connected acquisition/inbound/enrichment/outbound/funnel/scoring gate passes **135 tests / 987 assertions**. Pint, PHP syntax, and `git diff --check` pass, including 101-row deal-import continuation, stale-worker replay, and row-level exception redaction.
- Production Vite build passed after the outbound reporting and scoring UI changes; existing font fallback, chunk-size, and ineffective dynamic-import warnings remain.
- Full PHP regression after robots enforcement: **1,363 tests; 1,354 passed; 8 existing branding/design-system/automation contract failures; 35,852 assertions; 1 skipped**. No acquisition test failed.
- Full PHP regression after evidence-aware outbound reporting: **1,364 tests; 1,355 passed; 8 existing branding/design-system/automation contract failures; 35,878 assertions; 1 skipped**. No acquisition/report test failed; the two existing `InvalidArgumentException` import warnings remain unchanged.
- Full PHP regression after configurable lead-scoring rules: **1,365 tests; 1,356 passed; 8 existing branding/design-system/automation contract failures; 35,885 assertions; 1 skipped**. No acquisition-system test failed; the two existing `InvalidArgumentException` import warnings remain unchanged.
- The production Vite build passes after the signed booking handoff; only the repository's existing optional-font, chunk-size, and ineffective dynamic-import warnings remain.
- Partial-provider enrichment regression: **14 tests / 113 assertions passed** for enrichment, including a transient website failure with a retained Google Places result; the broader acquisition slice passed **39 tests / 284 assertions** and Pint passed.
- Address-bound verification regression: **19 tests / 127 assertions passed** across enrichment and outbound policy, covering stale-address mismatch and preservation of stronger evidence; Pint and `git diff --check` passed.
- Security review `adf68552-9b4c-4de9-a9df-5c42735668c6` for the conservative verification-policy change from `3d578579` through `d1738420`: complete coverage of the changed eligibility configuration and zero reportable findings.
- Current acquisition diff-scoped Codex Security review `df528cd2-71b4-4b34-a846-e54a368f0cad` for `286f2634` through `5d125577`: complete coverage of three changed security surfaces and zero reportable findings. The subsequent migration-only review is recorded below.
- Migration follow-up security review `e1610fcd-062f-4485-b9c4-b4d08ee6ba00` for `5d125577` through `3d578579`: complete coverage of the migration preflight and zero reportable findings.
- External repository audit verified the absence of reusable source in `Ayabeg/Lead-enrichment-system`, `Ayabeg/outbound-system`, and `Ayabeg/Dead-Magnet`; `Awaisali36/50k-lead-generation-system` remains reference-only and its n8n/Airtable/Apify/Gemini assumptions were not adopted.

## Key implementation commits

- `0764a179` — durable large-campaign expansion.
- `c75b6c48` — public analytics consent and privacy hardening.
- `24e91025` — outbound HTML sanitization.
- `0332daa5` — explicit outbound consent policy.
- `02cac89f` — current release documentation and regression evidence.
- `46661ae7` — reliability, public-endpoint, workspace-boundary, quote-token, and import concurrency hardening.
- `e8b37ceb` — quarantined unknown outbound provider outcomes across idempotent retries.
- `61223d06` — paused non-positive reply branches, including out-of-office handling.
- `9335676b` — persisted lead-magnet form-start and calculator-use engagement events.
- `286f2634` — recorded the latest full regression evidence.
- `a561bdb0` — made subject-scoped funnel event recording race-safe with a database uniqueness constraint.
- `3d578579` — added the non-destructive duplicate preflight before applying the funnel-event uniqueness constraint.
- `7010768d` — recorded the external repository audit.
- `207b3d7e` — blocked outbound prospects without a verification record and isolated the authenticated mailbox test-send exception.
- `b15b3d6d` — added workspace-scoped editing for draft and scheduled outbound campaigns.
- `67b24b2c` — added configurable per-campaign daily caps with durable rollover deferral.
- `d821eef2` — preserved partial enrichment results when one provider is transiently unavailable.
- `fe929a47` — bound email-verification projections to the current address and preserved stronger evidence.
- `5438a835` — kept explicit invalid verification results fail-closed.
- `0e3b0660` — applied workspace timezones to campaign daily-cap counting and rollover.
- `3d7798b2` — isolated campaign daily-cap counts by workspace in shared runner passes.
- `58e83570` — signed lead-magnet booking attribution through the public meeting form.
- `ed59f1b5` — modular email-verification provider contract, disabled fallback, optional DNS evidence, and cache coverage.
- `93b93be9` — authenticated HTTP email-verification adapter, normalized provider response handling, and temporary-failure retry preservation.
- `dea586da` — robots-aware public website enrichment with redirect-hop enforcement.
- `cd4ac573` — validated configurable score-rule pillar shapes and recorded the follow-up security evidence.
- `89b946b5` — aligned outbound detail metrics and campaign/sequence rows with the selected report window.
- `87585337` — applied the selected contact-owner filter to outbound detail reporting.
- `fc9bedf4` — removed raw lead-magnet delivery errors from the public response contract.
- `45aae861` — redacted lead-magnet delivery diagnostics before persistence.
- `94d08465` — redacted durable campaign-expansion diagnostics before persistence.
- `aaa61631` — throttled public lead-magnet landing-page visits and added route coverage.
- `a946078f` — redacted contact/deal import and import-worker diagnostics before persistence.
- `6a794282` — made contact/deal imports resumable through bounded queue pages with stale-worker idempotency.
- `b84aab2d` — covered 101-row deal-import continuation and stale completed-worker behavior.
- `27980623` — redacted contact/deal row-level import exceptions before persistence.
- `5439c977` — redacted persisted SMTP transport diagnostics.
- `721d2645` — redacted persisted WhatsApp/SMS and Desk provider diagnostics.
- `28ba56d3` — redacted terminal and row-level bulk-action diagnostics.
- `be408b57` — centralized redaction of persisted enrichment diagnostics.
- `83288f63` — redacted persisted lead-capture merge diagnostics.
- `39aa616d` — redacted persisted public URL-capture and Meta webhook diagnostics.
- `0eca2b25` — redacted persisted scheduled-report transport diagnostics.

## Implemented but not fully verified

- Live SMTP/IMAP, mail-stack, Google Places, provider-backed email-verification, Evolution, and other provider behavior remains unverified without configured external accounts. The local email-verification contract and disabled/DNS evidence paths are verified.
- The HTTP adapter is locally verified against controlled fakes; live provider semantics and credentials remain an external release gate. The full PHP regression after this increment is **1,359 tests; 1,350 passed; 8 existing branding/design-system/automation contract failures; 35,837 assertions; 1 skipped**.
- The repository-wide PHP suite and `php artisan evocrm:product-ready` are green. The product-ready gate correctly warns that no `ProductionSafetyValidator` is present rather than inventing one.
- The funnel-event uniqueness migration performs a non-destructive preflight and stops with an actionable error if historical duplicate subject-scoped rows exist; no destructive reconciliation policy is assumed locally.
- The repository-wide review remains partial by design; the committed hardening diff review covers the quote/import follow-up and the full code change in `46661ae7`.

## Deployment requirements and blockers

- Configure and deliberately test the required provider credentials and webhook contracts in a controlled environment before sending real outreach.
- Rotate the local/deployment `APP_KEY` as part of deployment hygiene; the ignored local `.env` is not committed.
- Keep `EVOSALES_REQUIRE_MARKETING_CONSENT=true` unless a documented lawful basis and legal review approve consentless cold outreach for the target market.
- Live provider verification remains pending; deployment APP_KEY rotation and legal sign-off are still required before production outreach.
- Preserve the four unrelated user working-tree edits; they were not staged or modified by this work.

## Operating references

- [Implementation roadmap](./implementation-roadmap.md)
- [Architecture](./architecture.md)
- [Data model](./data-model.md)
- [Testing and acceptance](./testing-and-acceptance.md)
- [Progress log](./progress-log.md)
