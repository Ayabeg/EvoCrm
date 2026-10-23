# Acquisition systems release report

Current implementation revision: `cd4ac573` (`main`; release report is maintained in subsequent documentation commits)

This report records the current verified state of Dead Enrichment, EvoCRM Outbound, and Dead Magnet. It is a release-readiness report, not a claim that live providers or the unrelated repository UI contracts are production-ready.

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

## Implemented but not fully verified

- Live SMTP/IMAP, mail-stack, Google Places, provider-backed email-verification, Evolution, and other provider behavior remains unverified without configured external accounts. The local email-verification contract and disabled/DNS evidence paths are verified.
- The HTTP adapter is locally verified against controlled fakes; live provider semantics and credentials remain an external release gate. The full PHP regression after this increment is **1,359 tests; 1,350 passed; 8 existing branding/design-system/automation contract failures; 35,837 assertions; 1 skipped**.
- Full repository release verification remains non-green because of the 8 remaining branding/design-system/automation contract failures.
- The funnel-event uniqueness migration performs a non-destructive preflight and stops with an actionable error if historical duplicate subject-scoped rows exist; no destructive reconciliation policy is assumed locally.
- The repository-wide review remains partial by design; the committed hardening diff review covers the quote/import follow-up and the full code change in `46661ae7`.

## Deployment requirements and blockers

- Configure and deliberately test the required provider credentials and webhook contracts in a controlled environment before sending real outreach.
- Rotate the local/deployment `APP_KEY` as part of deployment hygiene; the ignored local `.env` is not committed.
- Keep `EVOSALES_REQUIRE_MARKETING_CONSENT=true` unless a documented lawful basis and legal review approve consentless cold outreach for the target market.
- Resolve or explicitly accept the unrelated UI/source-contract failures before claiming a fully green repository-wide release.
- Preserve the four unrelated user working-tree edits; they were not staged or modified by this work.

## Operating references

- [Implementation roadmap](./implementation-roadmap.md)
- [Architecture](./architecture.md)
- [Data model](./data-model.md)
- [Testing and acceptance](./testing-and-acceptance.md)
- [Progress log](./progress-log.md)
