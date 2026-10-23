# EvoCRM acquisition systems progress log

## 2026-10-23 — resumable import queue chunks

### Completed / verified

- Converted contact and deal import queue processing into bounded 100-row pages. Each worker processes one page, leaves pending rows as the durable cursor, and dispatches a continuation while work remains; synchronous importer calls still drain all pages for local workflows.
- Completed imports are idempotent against stale duplicate workers, and terminal worker/import diagnostics continue to use the shared redaction contract.
- The focused import/redaction gate passes **19 tests / 172 assertions**; the connected acquisition/inbound/enrichment/outbound/funnel/scoring gate passes **132 tests / 970 assertions**. Pint, PHP syntax, and `git diff --check` pass.
- The design was informed by the supplied `Awaisali36/50k-lead-generation-system` reference: staged, bounded processing is adopted while its n8n/Airtable/Apify/Gemini implementation is not copied into EvoCRM.
- The repository-wide PHP regression completed at **1,373 tests; 1,364 passed; 8 known unrelated branding/design-system/automation failures; 35,937 assertions; 1 skipped**. The two existing `InvalidArgumentException` import warnings remain unchanged.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — import diagnostic redaction

### Completed / verified

- Applied the shared workflow redaction contract to contact/deal CSV importer failures and the terminal `ProcessImportBatch` callback, preventing recipient addresses, provider URLs, and authorization tokens from being stored in `error_summary`.
- The focused import/redaction gate passes **18 tests / 168 assertions**; the connected acquisition gate including both import suites passes **131 tests / 966 assertions**. Pint, PHP syntax, and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — current full regression audit

### Completed / verified

- Re-ran the full PHP suite after the latest public-endpoint hardening: **1,371 tests; 1,362 passed; 8 failures; 35,929 assertions; 1 skipped**.
- The connected acquisition/inbound/enrichment/outbound/funnel/scoring gate remains green at **115 tests / 808 assertions**, so the full-suite failures remain outside that acquisition gate and are recorded as repository-level release limitations.
- The two existing `InvalidArgumentException` import warnings remain unchanged.

### Remaining

- Resolve the eight unrelated branding/design-system/automation contract failures before claiming a repository-wide green release; live provider verification, deployment APP_KEY rotation, and legal sign-off for consentless cold outreach also remain open.

## 2026-10-23 — lead-magnet visit abuse boundary

### Completed / verified

- Added a `120 requests/minute` throttle to the public calculator landing page so visit attribution cannot be used to write unbounded funnel rows from one client.
- Added a route-contract regression alongside the public/inbound tests; the focused lead-magnet/inbound gate passes **11 tests / 108 assertions** with Pint, PHP syntax, and `git diff --check` passing.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — durable expansion diagnostic redaction

### Completed / verified

- Reused the shared workflow redaction contract for terminal `ExpandOutboundCampaign` failures, so 50k-scale cursor workers no longer persist recipient addresses, provider URLs, or authorization tokens in `expansion_error`.
- Added a regression covering the terminal failure callback and the existing bounded 250-contact expansion path.
- The focused outbound expansion/redaction gate passes **28 tests / 185 assertions**; Pint, PHP syntax, and `git diff --check` pass.
- The connected acquisition/inbound/enrichment/outbound/funnel/scoring gate passes **115 tests / 808 assertions**; `npm run types:check` and targeted Pint pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — evidence-aware outbound reporting

### Completed / verified

- Replaced the outbound report's empty tracking placeholders with typed metrics for campaign selection, attempted messages, mailer acceptance, provider delivery, bounces, complaints, replies, positive replies, opens, clicks, suppression matches, CRM outcomes, and campaign errors.
- Added contact-attributed demo-requested and meeting-booked funnel metrics to the same report contract; both remain count-only until a stronger campaign attribution key exists.
- Each rate now carries an explicit denominator. Metrics identify whether their evidence is an actual provider/CRM event, an inferred local state, or a campaign snapshot; contact-attributed CRM outcomes do not expose a misleading conversion rate.
- Added the report UI metric panel with evidence quality, count, denominator/rate, definition, and caveat text. Opens are explicitly labeled as unreliable proof of interest.
- The outbound report suite passes **9 tests / 138 assertions**; targeted Pint and `npm run types:check` pass; `git diff --check` passes.
- The full PHP regression after this increment is **1,364 tests; 1,355 passed; 8 existing branding/design-system/automation contract failures; 35,878 assertions; 1 skipped**. No acquisition-system test failed; the two existing `InvalidArgumentException` import warnings remain unchanged.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — lead-magnet delivery error boundary

### Completed / verified

- Removed raw mailer exception text from the public lead-magnet Inertia payload. The calculator still reports a generic failed delivery state while internal delivery diagnostics remain server-side.
- Added regression coverage proving a stored provider error containing an authorization token is not exposed on an idempotent public submission response.
- The public/inbound lead-magnet gate passes **8 tests / 90 assertions**; targeted Pint, TypeScript, and `git diff --check` pass.
- The post-hardening connected acquisition/inbound/enrichment/outbound/funnel gate passes **112 tests / 798 assertions**.
- Delivery diagnostics are also redacted before persistence; the public/inbound/acquisition/report/scoring subset passes **34 tests / 345 assertions** after this follow-up.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — owner-scoped outbound detail reporting

### Completed / verified

- Applied the report page's selected contact-owner filter to outbound detail totals, tracking metrics, campaign/sequence rows, funnel attribution, and positive-reply counts.
- Added a cross-owner regression proving one owner's outbound report cannot include another owner's messages or campaign audience snapshot.
- The focused outbound report suite passes **10 tests / 154 assertions**; the connected acquisition/inbound/enrichment/outbound/funnel gate passes **105 tests / 718 assertions**. PHP syntax, Pint, and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — window-scoped outbound detail reporting

### Completed / verified

- Aligned outbound report detail metrics with the selected report window instead of mixing all-time message, sequence, campaign, funnel-event, and daily data into a windowed overview.
- Scoped campaign audience snapshots to campaigns represented by messages in the window, and preserved explicit caveats for contact-attributed CRM outcomes and funnel counts.
- Added regression coverage for older outbound messages and funnel events being excluded from the current report window.
- The connected acquisition/inbound/enrichment/outbound/funnel gate passes **104 tests / 704 assertions**; targeted Pint and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — score-settings input-shape hardening

### Completed / verified

- Completed Codex Security diff review `6dfb53e9-dcb2-4a99-a221-96759f29d7b3` for `07618298` through `cf0268a1`, with complete coverage of the changed report, scoring, configuration, and settings-form surfaces.
- The review found one low-severity malformed nested-input path in score settings: a scalar score-rule pillar could reach `array_key_exists` and fail the update request. Each configured pillar is now explicitly validated as an array before leaf validation.
- The focused lead-scoring and outbound-report suites pass **23 tests / 222 assertions**; targeted Pint and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — connected workflow release gate

### Completed / verified

- Re-ran the shared acquisition, inbound lead-magnet, enrichment, outbound department, campaign runner, consent-policy, and report gates: **70 tests / 513 assertions passed**.
- Re-ran funnel tracking, meeting-booking attribution, reply pause, bounce/complaint handling, consent, and lead-scoring coverage: **34 tests / 189 assertions passed**.
- `npm run types:check` passed, including Wayfinder generation and TypeScript compilation. Existing unrelated working-tree edits remain untouched.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — configurable lead-scoring rules

### Completed / verified

- Moved fit, intent, timing, and data-quality rule points into the central `evosales.lead_score.rules` defaults and added bounded workspace overrides through the existing Qualification settings.
- Preserved threshold-only updates by merging omitted rule values with the current workspace/default rules; score snapshots continue to retain the applied explainable breakdown.
- Added regression coverage proving workspace rule changes alter the computed score without changing the separate threshold/action path. The lead-scoring suite passes **13 tests / 80 assertions**; Pint and `npm run types:check` pass.
- The production Vite build passes after the outbound reporting and scoring UI changes; only the repository's existing font fallback, chunk-size, and ineffective dynamic-import warnings remain.
- The full PHP regression after this increment is **1,365 tests; 1,356 passed; 8 existing branding/design-system/automation contract failures; 35,885 assertions; 1 skipped**. No acquisition-system test failed; the two existing `InvalidArgumentException` import warnings remain unchanged.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — modular email verification

### Completed / verified

- Added the modular email-verification leg to enrichment: a provider contract, disabled-by-default fail-closed fallback, optional DNS syntax/MX evidence adapter, address-bound projection, and workspace/target/address freshness cache. The focused enrichment suite passes 17 tests / 123 assertions; the cross-system acquisition slice passes 68 tests / 394 assertions; Pint passes. DNS evidence is explicitly not mailbox proof.
- Added the configurable authenticated HTTP email-verification adapter: normalized valid/invalid/catch-all/unknown outcomes, bounded provider evidence, secret-free persistence, retryable transport/429/5xx failures, and a cache rule that never suppresses temporary-failure retries. Provider/unit plus acquisition coverage passes 71 tests / 412 assertions; Pint and `git diff --check` pass.
- Added robots-aware public website enrichment: cached per-origin policies, specific `Allow`/`Disallow` matching, fail-closed policy fetches, and robots rechecks after redirects. Website/enrichment/provider coverage passes 78 tests / 439 assertions; Pint passes.

## 2026-10-21 — initial audit and planning

### Completed / verified

- Read the requested build brief from the referenced pasted text file.
- Located the active EvoCRM repository at `/home/mia-aya/Documents/Codex/EvoCrm-ayabeg-copy`; the projectless task directory contains no application source.
- Confirmed branch `main`, with existing user modifications in application, resource, and test files. No unrelated changes were altered.
- Confirmed Laravel 13 / PHP 8.3+, Inertia 3, React 19, TypeScript, Tailwind 4, SQLite local default, MySQL-ready schema, Pest 4, Vite, database queue, and scheduled command infrastructure.
- Confirmed reusable CRM entities and current foundations for enrichment runs, lead captures, lead scoring, import batches, consent, outbound campaigns/sequences, suppression, replies, tracking, and conversion funnels.
- Created the required roadmap, architecture, data-model, progress-log, and testing/acceptance documents.
- Implemented and verified `LeadLeakageCalculator`, a pure sequential calculator using only user-provided assumptions; focused Pest suite passes 6 tests / 21 assertions and Pint passes.
- Implemented and verified the public workspace-scoped lead-magnet route, offer/submission schema, duplicate-safe persistence, shared Contact/Lead creation through the existing capture deduper, optional marketing consent, and funnel attribution. Focused feature suite passes 3 tests / 35 assertions; targeted ESLint, TypeScript, Pint, and Vite build pass.
- Implemented and verified optional lead-magnet result-copy delivery through the existing queue/mail stack: unique retryable job, explicit queued/sending/accepted/failed states, persisted error text, and no claim that mailer acceptance equals inbox delivery. Focused lead-magnet suite passes 9 tests / 59 assertions; changed PHP passes Pint, changed page passes ESLint, TypeScript passes, and Vite build passes.
- Hardened broadcast campaign eligibility through the shared last-mile service: invalid or explicitly invalidated addresses are materialized as visible failed outbox records, suppression is rechecked at send time, and campaign message creation remains idempotent. Outbound regression suite passes 27 tests / 159 assertions and changed PHP passes Pint.
- Preserved canonical Google Maps evidence URLs when the Places provider returns them, while leaving evidence blank when the provider does not supply a valid URL. Enrichment suite passes 8 tests / 88 assertions and changed PHP passes Pint.
- Added the lead-magnet conversion handoff: an enabled workspace meeting schedule produces a throttled demo CTA, the redirect records one demo_requested funnel event per submission, and the visitor enters the existing public booking flow. Lead-magnet feature suite passes 4 tests / 52 assertions; changed PHP passes Pint, the page passes ESLint, and TypeScript passes.
- Added bounded server-side landing-page visit attribution to the shared funnel_events ledger; the visit event records the lead-magnet offer and capped UTM values without requiring personal data. Lead-magnet feature suite passes 4 tests / 53 assertions and changed PHP passes Pint.
- Final verification: production Vite build passed. The full PHP suite ran 1,288 tests with 1,272 passing and 15 failures in existing UI/source-contract tests outside the acquisition changes; the focused acquisition suites remained green. These failures are recorded as release-readiness work, not hidden or counted as verified.
- The current worktree contains the lead-magnet delivery slice (`DeliverLeadMagnetSubmission`, result mail, delivery state migration/status props). Its migration imports were corrected in place, and the combined lead-magnet feature test now verifies result-email acceptance honestly.
- Added shared outbound eligibility checks and workspace-scoped message idempotency keys for sequence steps and campaigns. The focused outbound regression set passes 38 tests / 195 assertions.
- Connected enrichment email verification to outbound eligibility: verification provenance is projected onto contact metadata, unsafe invalid/temporary/unsupported results are not auto-applied, catch-all and unknown policies are explicit, and the focused enrichment/outbound set passes 21 tests / 131 assertions.
- Added an explainable `DataQualityScorer` and persisted `lead_scores.data_quality` without changing the existing qualification formula. The combined lead-score/enrichment/outbound regression set passes 49 tests / 326 assertions; the score breakdown records quality factors for later prospect selection.
- Exposed the persisted quality score in the lead score payload and shared lead-list pill, with the targeted ESLint and TypeScript checks passing.
- Completed the lead-magnet booking handoff: the public booking flow carries the submission attribution, creates a deduplicated `meeting_booked` funnel event, and the public lead-magnet plus scheduler regression set passes 15 tests / 150 assertions.
- Connected data quality to prospect selection: contact segments and outbound campaign saved filters can require a minimum persisted lead data-quality score; filter/outbound regression checks pass 31 tests / 258 assertions.
- Added a separate lead-magnet enrichment-consent flag and queued contact enrichment only for explicit opt-in submissions. The public calculator suite passes 5 tests / 55 assertions; ESLint and TypeScript checks pass.
- Added non-sending campaign previews with eligible/ineligible counts, explicit reasons, and a five-contact personalized sample. Outbound page/regression coverage passes 22 tests / 221 assertions; changed PHP passes Pint and the frontend type/lint checks pass.
- Hardened enrichment jobs with workspace-scoped rate limiting, duplicate overlap protection, bounded retry behavior, and the canonical Google Maps field mask; enrichment/bulk coverage passes 12 tests / 104 assertions.
- Added a workspace-scoped Retry action for failed enrichment history rows; the focused enrichment/bulk suite passes 13 tests / 108 assertions and the changed panel passes ESLint.
- Added conservative website CRM-signature detection with detected, not-detected, and conflicting states; results are stored in the existing enrichment provenance ledger and rendered in the record panel. Parser/enrichment/inbound coverage passes 18 tests / 140 assertions, with Pint, ESLint, and TypeScript passing.
- Corrected transient enrichment retry semantics: website/Places 429, 5xx, and transport failures now persist a visible failed run and rethrow for `EnrichRecordJob` backoff; the focused enrichment/integration set passes 19 tests / 142 assertions.
- Added stale-record selection to scheduled enrichment maintenance: `leads:enrich` defaults to seven days, excludes recent queued/proposed/applied runs, and supports an explicit `--stale-hours` window. The enrichment suite passes 12 tests / 106 assertions for this maintenance boundary.
- Repository-wide `php artisan test --compact` currently runs 1,313 tests with 1,299 passing and 13 failures in pre-existing shell/source-contract tests, including `tests/Feature/P04AppShellTest.php:59`, which still expects the literal `Search EvoCRM` shell text while the current shell renders the translated `Search` label. These failures are outside the acquisition-system files. Acquisition-focused suites remain green; the two existing InvalidArgumentException import warnings are unchanged.
- Security review found and fixed unvalidated redirect handling in website enrichment and operator URL capture: redirects are now disabled at the HTTP client, each hop is normalized and checked, and the chain is capped at two hops. Workflow webhooks use the same public-host normalization and do not follow redirects. Redirect regression coverage passes in `tests/Unit/WebsiteFetcherTest.php`, `tests/Feature/LeadCaptureTest.php`, and `tests/Feature/CrmWorkflowsTest.php`.
- Security review found and fixed spreadsheet formula injection in contact and deal CSV exports. String cells beginning with `=`, `+`, `-`, or `@` are prefixed before export while numeric values remain numeric; contact/deal export regression coverage passes 13 tests / 101 assertions.
- Added an idempotent outbound provider-event ledger covering delivery, bounce, and complaint webhooks. Delivery timestamps and complaint timestamps are projected onto outbound messages; complaints and hard bounces suppress the address and pause the related active sequence enrollment. The combined outbound lifecycle regression passes 36 tests / 282 assertions; frontend typecheck, targeted ESLint, and Pint pass.
- Bounded broadcast audience preview and expansion with 250-contact `chunkById` pages, preserving the existing idempotent message creation and eligibility checks for large lists. The campaign regression passes 18 tests / 130 assertions, including a 251-contact boundary case; Pint passes.
- Hardened IMAP reply ingestion: provider message IDs and stable mailbox/UID fallbacks now deduplicate repeated polls, inbound identity has a database uniqueness constraint, and messages are marked seen only after CRM persistence. Reply/acquisition coverage passes 6 tests / 28 assertions; the post-migration reply subset passes 2 tests / 17 assertions and Pint passes.
- Added database-backed outbound send claims for sequence and campaign workers. Fresh `sending` claims block concurrent provider calls, stale claims recover after 15 minutes, and terminal mailer paths clear the claim timestamp. Outbound runner/department/reply coverage passes 28 tests / 169 assertions; migration and Pint pass.
- Refreshed `README.md` and `docs/production-processes.md` to document the three acquisition surfaces, stale enrichment maintenance, durable worker requirements, and the delivery/bounce/complaint webhook contract. Q2 operating documentation is now in progress rather than planned; final release evidence and live-provider configuration remain open.
- Closed the incomplete-import boundary: contact CSV rows with a company or location signal may be imported without an email, phone, or external ID; truly empty/ambiguous rows still report row-level errors. Imported contacts missing email or phone queue workspace-scoped enrichment after the transaction, and an import identity in contact metadata keeps repeated incomplete imports idempotent. Contact import coverage passes 10 tests / 100 assertions; the combined import/acquisition/enrichment subset passes 23 tests / 217 assertions.
- Added conservative reply classification and suppression handling. IMAP replies now persist `interested`, `not_interested`, `out_of_office`, `unsubscribe`, or `needs_review` with confidence and classification time; explicit unsubscribe language creates a workspace suppression and cannot branch follow-ups. Reply/acquisition/runner coverage passes 12 tests / 54 assertions; Pint, targeted ESLint, TypeScript, and the production Vite build pass.
- Current full regression after the import and reply slices: 1,318 tests, 1,304 passed, 13 failures, 35,593 assertions, and 1 skipped. The failures remain the existing UI/source-contract failures outside these acquisition changes; the two existing InvalidArgumentException warnings are unchanged.
- Added the interested-reply handoff: an `interested` inbound reply now creates one durable CRM task for human follow-up, keyed to the inbound message so repeated IMAP ingestion cannot duplicate the task. Reply/acquisition coverage passes 3 tests / 21 assertions for this handoff, and Pint passes.
- Fixed a tenant-isolation issue in public unsubscribe links: raw workspace/address query parameters are now protected by Laravel signed URLs, the endpoint requires a real workspace, and tampered parameters are rejected. Suppression/outbound coverage passes 21 tests / 137 assertions; Pint passes.
- Closed three public/retry security gaps found during the source-backed review: public meeting bookings now require an enabled weekday, configured working hours, and exact slot alignment while schedule-row locking prevents local double-booking races; click tracking requires a real outbound-message token before redirecting; Evolution message events and Meta webhook jobs now use durable provider identities/claims to prevent replay duplication. Meeting/outbound coverage passes 31 tests / 237 assertions, Evolution coverage passes 18 tests / 137 assertions, Meta/funnel coverage passes 21 tests / 85 assertions, and Pint passes.
- Added a 1,000-record ceiling to privileged CRM bulk actions and terminal queue failure callbacks for import and bulk-action jobs, so oversized requests are rejected and worker failures do not leave durable runs falsely processing. Existing bulk/import coverage remains green and changed PHP passes Pint.
- Final full regression after the public-flow, webhook, and worker hardening initially exposed one tracking-pixel compatibility regression; it was fixed and reverified. The current full suite runs 1,323 tests with 1,309 passing, 13 existing UI/source-contract failures, 35,615 assertions, and 1 skipped. The remaining failures are shell/branding/design-system contracts outside the acquisition systems; focused acquisition, security, import, meeting, webhook, Meta, and tracking suites remain green.
- Closed the DNS-rebinding gap in enrichment fetches: every resolvable A/AAAA answer is checked for public range and the first approved address is pinned with Guzzle’s `resolve` option while preserving hostname-based TLS/SNI. Existing redirect/SSRF regression tests pass and Pint passes.
- Closed the direct-PII analytics default: PostHog identity now sends only role plus a stable pseudonymous user ID unless `POSTHOG_IDENTIFY_PII=true` is explicitly configured. Backend privacy regression coverage passes and the changed frontend passes typecheck/lint.
- Removed populated PostHog project keys from `.env.example`, `.env.production.example`, and checked-in UI evidence; templates keep provider values empty and default `POSTHOG_IDENTIFY_PII=false`. The local ignored `.env` remains an external secret-rotation item.
- Re-read the supplied build brief and reviewed `Awaisali36/50k-lead-generation-system` as an implementation reference. Its staged acquisition/enrichment/qualification workflow informed the existing provider boundaries, bounded batch processing, provenance, and explainable scoring without importing its n8n/Airtable/Apify/Gemini assumptions. The complete focused acquisition regression set passes 194 tests / 1,371 assertions.
- Hardened the public funnel visit beacon so UTM/source values are bounded and referrers/paths are stored without query strings, preventing unbounded attribution writes and accidental persistence of query-string PII. The focused funnel suite passes 6 tests / 13 assertions; the complete focused acquisition set passes 195 tests / 1,375 assertions. Commit: `94a5ed64`.
- Completed a standard security/privacy review for the captured `f6693f2f` revision with 7 medium findings across tenant ownership, workflow SSRF, template preview HTML, outbound consent, bulk expansion, Evolution replay identity, and analytics consent. The scan is sealed with partial coverage and explicitly records that the repository changed while it ran.
- Fixed cross-workspace API owner assignment for contacts and activities with workspace-scoped `Rule::exists` validation and regression tests for create/update rejection. Targeted API coverage passes 7 tests / 30 assertions. Commit: `a15645ca`.
- Hardened trust boundaries after the security review: authenticated analytics events now ignore forged client distinct IDs; the OpenManus adapter fails closed with 503 when its bearer token is missing and 401 when invalid; outbound HTML previews use a sandboxed iframe. Targeted analytics/API/outbound coverage passes 34 tests / 214 assertions, Python AST parsing passes, and frontend type checking passes. Commit: `a65d66ba`.
- Closed workflow webhook DNS rebinding by reusing public DNS validation and Guzzle address pinning before POST, with redirects disabled. Workflow/fetcher coverage passes 25 tests / 117 assertions. Commit: `6a76c1ba`.
- Final focused acquisition regression before the Evolution replay fix passed 193 tests / 1,360 assertions. The scan's remaining open follow-ups are outbound consent policy, outbound bulk caps/queueing, analytics consent, and full outbound-email HTML sanitization.
- Closed the Evolution missing-identity replay gap: identity-less payloads now receive a canonical workspace/instance/event/payload hash before event and message persistence, so provider retries return the original message instead of repeating side effects. Evolution webhook coverage passes 4 tests / 13 assertions. Commit: `52470e36`.
- Final focused acquisition regression after the Evolution replay fix passes 194 tests / 1,363 assertions.
- Bounded bulk sequence enrollment to 250 contacts per request, including saved-filter expansion before loading IDs; oversized requests are rejected without creating enrollments. Outbound department coverage passes 20 tests / 135 assertions. Commit: `d3ba9116`.
- Final focused acquisition regression after the bulk-enrollment bound passes 195 tests / 1,367 assertions.
- Added durable large-campaign expansion: audiences over 1,000 enter a resumable 250-contact cursor job with idempotent message creation, retry/failure state, cancellation support, and no request-path materialization. Outbound department coverage passes 21 tests / 142 assertions. Commit: `0764a179`.
- Gated public PostHog boot behind explicit visitor analytics consent and removed login email from the product analytics event. Analytics/privacy coverage passes 13 tests / 86 assertions; `npm run types:check` passes. Commit: `c75b6c48`.
- Sanitized outbound HTML before delivery, link rewriting, and preview, removing executable tags, event handlers, unsafe URLs, and dangerous CSS. Outbound coverage passes 22 tests / 147 assertions. Commit: `24e91025`.
- Final focused acquisition regression after the campaign, analytics, and HTML-safety changes passes 197 tests / 1,381 assertions.
- Made outbound marketing consent policy explicit and safe by default: missing consent blocks eligibility unless a deployment explicitly documents a lawful basis for consentless cold outreach; explicit denial always blocks, and lead-magnet delivery remains separate. The policy regression set plus outbound lifecycle suites pass 39 tests / 216 assertions. Commit: `0332daa5`.
- Final focused acquisition regression after the explicit consent-policy change passes 207 tests / 1,440 assertions. The repository typecheck remains green from the analytics/privacy change.
- The latest repository-wide regression runs 1,334 tests with 1,320 passing, 13 existing UI/source-contract failures, 35,658 assertions, and 1 skipped. The failures remain outside the acquisition-system implementation; the two existing `InvalidArgumentException` import warnings are unchanged.
- Completed the current-tree standard security review (`c38da5d1-4641-46e6-9a7c-7255f7d75f01`) at revision `02cac89f`: no reportable findings across the reviewed acquisition surfaces. Coverage is explicitly partial; live provider webhook semantics, deployment secret rotation, consentless-outreach legal review, and unrelated repository surfaces remain documented limitations.
- Added the release-readiness report with explicit implemented/verified, incomplete, external-blocker, test, commit, and deployment sections. Commit: `1e61cd7c`.

### In progress

- Lead-magnet delivery/conversion completion (M3): inline result, queued result-email delivery, demo handoff, booking-to-pipeline analytics, and explicit enrichment consent are implemented; release-level integration and security review remain.
- Shared provenance/verification/eligibility contract (A3, E1, O1).
- Provider-level delivery/idempotency verification remains environment-dependent; local idempotency protects stable message creation and the explicit outbound consent policy is now covered.
- Exact gap analysis of existing enrichment, outbound eligibility, and lead-capture flows before adding migrations.
- Enrichment orchestration (E3): the existing per-record actions now share a capped workspace-scoped bulk queue endpoint and Contacts exposes a Queue enrichment action for selected records. EnrichRecordJob is unique per workspace/target/type, retries transient failures up to three times with bounded backoff, and the focused suite passes 11 tests / 97 assertions.
- Lead-magnet booking attribution (M3): the demo handoff now carries a same-workspace submission reference into the existing public booking form, and MeetingBooker records one meeting_booked funnel event with contact/lead/deal links and lead-magnet source attribution. Focused meeting/lead-magnet coverage passes 16 tests / 158 assertions.
- End-to-end inbound workflow (I2) is now covered from calculator submission through shared Contact/Lead creation, queued result delivery, demo handoff, booking, and lead-magnet funnel analytics.
- Added the first full outbound workflow regression (I1): CSV import → website/Places enrichment → verified-email provenance → lead scoring and quality selection → campaign preview/activation → send → reply capture → pipeline deal linkage. The focused workflow test passes 1 test / 12 assertions.
- End-to-end outbound workflow (I1) is in progress: the local path is covered; live provider delivery/event semantics and broader restart recovery remain environment-dependent.
- Data maintenance (I3) is in progress: the scheduled enrichment command now has a tested stale-record boundary; stronger evidence preservation and suppression-safe outbound behavior remain under integration review.
- Latest combined acquisition regression pass before the provider-event slice: 110 tests / 723 assertions passed across inbound workflow, lead-magnet delivery/conversion, funnel analytics, enrichment, CRM detection, outbound campaign/sequence execution, provider events, exports, and reply pausing. The new provider-event lifecycle subset adds 36 tests / 282 assertions.

### Blocked

- Live provider verification and live outbound delivery are blocked until the relevant external credentials/accounts are configured. Local adapters, validation, idempotency, and failure paths are not blocked.
- Full-suite release verification is not green until the 13 existing UI/source-contract failures are resolved; none of the focused acquisition suites failed in the final verification.
- The standard Codex Security scan is complete for the captured revision with 7 medium findings and partial coverage. Current-tree owner-assignment, workflow-DNS, Evolution missing-identity, sequence-request and large-campaign expansion bounds, template preview/email HTML safety, and analytics consent are remediated with regression evidence. Outbound consent is safe by default; disabling the requirement remains an explicit lawful-basis/legal-review gate. The local ignored `.env` APP_KEY still requires deployment rotation. Live provider checks remain blocked.

### Next verified task

Run the final release audit after the remaining UI/source-contract checks are resolved or accepted, while keeping live-provider verification and delivery blocked until credentials and legal/deployment sign-off are configured.

## 2026-10-22 — reliability and public-surface hardening

### Completed / verified

- Applied the next hardening slice: queue leases now exceed the longest mutating job timeout; stale outbound send claims are quarantined instead of automatically resent after an uncertain provider outcome; Meta processing leases can be reclaimed within the retry horizon; failed Lead OS nodes no longer advance the graph; nightly deal-health work and webhook payload/fan-out are bounded; tracking destinations require CRM-generated HMAC signatures with atomic counters; unsubscribe is confirmation-based and throttled; and CRM relationship IDs are validated against the active workspace.
- The targeted hardening set passes 84 tests / 492 assertions, and the quote/import regression passes 22 tests / 203 assertions. The latest full suite runs 1,335 tests with 1,321 passing, 13 unrelated UI/source-contract failures, 35,665 assertions, and 1 skipped. The TypeScript check also passes.

### Completed / verified

- The current-tree Codex Security review is sealed as scan 013e6eaf-f741-4d08-ad0f-5ab2bef6f61b with zero reportable findings across seven reviewed acquisition surfaces. Coverage is explicitly partial; the report records live-provider signature/delivery semantics, deployment secret rotation, legal review, and unrelated repository surfaces as limitations. The scan snapshot predates the quote/import follow-up and final documentation edits; those follow-ups have separate targeted regression evidence.
- A committed diff-scoped Codex Security review is also sealed as scan 8387f1e4-4aca-49d9-98e7-7621a3a338c1 for 29aad813 to 46661ae7, with zero reportable findings and complete coverage of five changed security surfaces. Live provider behavior, deployment secret rotation, and legal compliance remain external limitations.
- Committed the hardening slice as 46661ae7. The four unrelated user edits remain unstaged and untouched.
- Corrected the architecture, data-model, and production-process documentation to match the current two-minute Meta processing lease and the failed/quarantined handling of stale outbound SMTP claims.
- Closed the stale-claim idempotency loophole: reusing the original outbound idempotency key now preserves the failed/unknown-provider state instead of automatically re-sending. The outbound runner and department regression set passes 32 tests / 187 assertions, and Pint passes.
- Tightened reply branching so only explicitly interested replies can take a configured positive branch; out-of-office and review-needed replies now pause the enrollment for human handling. The reply/runner/department regression set passes 35 tests / 199 assertions, and Pint passes.
- Added bounded lead-magnet form-start analytics and an idempotent calculator-use event keyed to each submission. The public lead-magnet, inbound workflow, meeting attribution, and funnel-tracking subset passes 14 tests / 94 assertions; Pint, TypeScript, and the diff check pass.
- Latest repository-wide regression after the outbound reply and lead-magnet analytics hardening: 1,338 tests, 1,324 passed, 13 unrelated UI/source-contract failures, 35,678 assertions, and 1 skipped. The acquisition integration subset remains green.
- Completed acquisition diff-scoped Codex Security review `8ec3adf4-f42c-4c05-b806-d79d4ddb1d45` for `46661ae7` to `286f2634`: all seven changed security surfaces were reviewed with complete coverage and zero reportable findings. The scan covers public lead-magnet tracking, event persistence, stale outbound provider outcomes, reply automation branching, and the changed regression tests.
- Fixed a public calculator capture defect found by browser verification: optional Name and Clinic/Business fields now render as text inputs instead of inheriting the numeric calculator input type. The focused calculator/inbound suite passes 7 tests / 72 assertions; TypeScript, targeted ESLint, production Vite build, desktop browser submission, isolated shared-contact persistence, and 390px mobile no-overflow checks pass.
- Re-ran the full repository regression after the calculator fix: 1,338 tests, 1,324 passed, 13 existing UI/source-contract failures, 35,678 assertions, and 1 skipped. No acquisition-system test failed; the two existing InvalidArgumentException warnings remain unchanged.
- Added explicit lead-magnet reset behavior: the action restores all calculator assumptions and consent fields, clears validation errors, rotates the submission idempotency key, and hides the previous result. The focused calculator/inbound/domain suite passes 13 tests / 93 assertions; TypeScript, targeted ESLint, production Vite build, and browser reset verification pass.
- Re-ran the full PHP and frontend suites on the reset revision: PHP remains at 1,338 tests with 1,324 passed, 13 existing UI/source-contract failures, 35,678 assertions, and 1 skipped; Vitest passes 27 files / 97 tests. No acquisition-system PHP test failed.
- Re-ran the full PHP suite after the funnel-event uniqueness migration: 1,338 tests, 1,324 passed, 13 existing UI/source-contract failures, 35,680 assertions, and 1 skipped. No acquisition-system PHP test failed; the two existing InvalidArgumentException warnings remain unchanged.

### Remaining

- Resolve or explicitly accept the 13 unrelated UI/source-contract failures, configure and verify live providers, rotate deployment APP_KEY, and obtain legal sign-off before any consentless cold-outreach configuration.

## 2026-10-23 — funnel event idempotency hardening

### Completed / verified

- Closed the shared funnel-event check-then-insert race: subject-scoped events now use a database unique key across workspace, funnel, event type, subject type, and subject ID, while `FunnelEventRecorder` uses Laravel's atomic `createOrFirst` path and reports whether a row was newly recorded. Null-subject visit beacons remain append-only.
- Updated funnel fixtures that previously manually inserted rows already created by CRM observers, preserving the same reporting assertions under the new database invariant.
- The migration-focused funnel/acquisition set passes 20 tests / 152 assertions; the broader inbound, lead-magnet, funnel, booking, and outbound regression set previously passed 58 tests / 368 assertions. Pint and `git diff --check` pass.
- Committed as `a561bdb0` (`fix: make subject funnel events race safe`).
- Completed current acquisition diff-scoped Codex Security review `df528cd2-71b4-4b34-a846-e54a368f0cad` for `286f2634` through `5d125577`: complete coverage of the three changed security surfaces, zero reportable findings, and the historical duplicate-row migration preflight recorded as an operational limitation.
- Added a non-destructive migration preflight: the funnel-event unique constraint now stops with an actionable error when historical subject-scoped duplicates exist, instead of failing later with an opaque database-index error. The focused funnel regression remains green; the repository-wide baseline still has the documented 13 unrelated UI/source-contract failures.
- Rechecked the migration follow-up with Codex Security scan `e1610fcd-062f-4485-b9c4-b4d08ee6ba00` for `5d125577` to `3d578579`: complete coverage of the migration surface and zero reportable findings.
- Added a direct migration regression that removes only the test database's new index, inserts duplicate subject events, and verifies the preflight fails before schema creation; the migration-focused set now passes 20 tests / 152 assertions.
- Latest full PHP regression after the migration preflight test: 1,339 tests, 1,325 passed, 13 existing UI/source-contract failures, 35,682 assertions, and 1 skipped. No acquisition-system PHP test failed; the two existing InvalidArgumentException warnings remain unchanged.

### Remaining

- The unique migration now checks for historical duplicate subject-scoped rows and stops before schema changes when they exist; production still needs an explicit reconciliation decision before rerunning after such a failure. Live-provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the 13 unrelated UI/source-contract failures remain open.

## 2026-10-23 — conservative outbound verification policy

### Completed / verified

- Changed the outbound default so contacts with an `unknown` email-verification result are blocked from enrollment unless a deployment explicitly sets `EVOSALES_BLOCK_UNKNOWN_EMAIL=false` under a documented policy. The catch-all block remains enabled by default.
- Added the policy to both environment templates, documented the behavior in the architecture contract, and added enrollment regression coverage. The outbound eligibility subset passes 19 tests / 69 assertions; Pint and `git diff --check` pass.

### Remaining

- Live verification-provider semantics and any explicit policy allowing uncertain addresses remain environment/legal decisions; no real prospect messages are sent by local tests.
- Latest full PHP regression after the conservative unknown-verification default: 1,340 tests, 1,326 passed, 13 existing UI/source-contract failures, 35,684 assertions, and 1 skipped. No acquisition-system PHP test failed; the two existing InvalidArgumentException warnings remain unchanged.
- Completed security review `adf68552-9b4c-4de9-a9df-5c42735668c6` for the conservative verification-policy change from `3d578579` through `d1738420`: complete coverage of the changed eligibility configuration and zero reportable findings.

## 2026-10-23 — external repository audit

### Completed / verified

- Checked the user-provided `Ayabeg/Lead-enrichment-system`, `Ayabeg/outbound-system`, and `Ayabeg/Dead-Magnet` repositories through their GitHub remotes and API metadata. All three are public repositories with size `0`, no remote heads, and no source or history available to integrate.
- Reconfirmed `Awaisali36/50k-lead-generation-system` as the available non-empty reference repository. Its staged acquisition workflow informed provider boundaries, bounded processing, provenance, and qualification decisions; its n8n, Airtable, Apify, and Gemini-specific assumptions were not imported into EvoCRM.
- No external source was copied, and no repository-local user changes were touched. The existing EvoCRM implementation remains the source of truth for all three connected systems.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the 13 unrelated UI/source-contract failures remain open. No external repository currently supplies code that removes those dependencies.

## 2026-10-23 — fail-closed verification fallback

### Completed / verified

- Hardened `OutboundEligibility` so an absent `evosales.outbound.block_unknown_verification` configuration key still blocks `unknown` email-verification results instead of failing open.
- Added a regression that removes the nested policy key while preserving the other outbound settings and verifies enrollment remains rejected. The focused enrollment test passes 7 tests / 15 assertions; the broader outbound safety set passes 44 tests / 219 assertions. Pint and `git diff --check` pass.
- Latest repository-wide regression: 1,341 tests, 1,327 passed, 13 existing UI/source-contract failures, 35,686 assertions, and 1 skipped. No acquisition-system test failed; the two existing InvalidArgumentException warnings remain unchanged.

### Remaining

- Live verification-provider semantics, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the 13 unrelated UI/source-contract failures remain open.

## 2026-10-23 — shell search-label contract alignment

### Completed / verified

- Restored the localized `Search EvoCRM…` label in the live EvoRail's accessible name, visible control, and collapsed-rail tooltip. This matches the existing translation catalog and shell contract rather than the generic `Search` fallback.
- The affected shell, locale, and Aurora contract set passes 38 tests / 475 assertions. `npm run types:check`, targeted ESLint, and `git diff --check` pass.
- Latest repository-wide regression after strict verification-state hardening: 1,344 tests, 1,335 passed, 8 existing branding/design-system/automation contract failures, 35,756 assertions, and 1 skipped. No acquisition-system test failed; the two existing InvalidArgumentException warnings remain unchanged.

### Remaining

- The remaining eight branding/design-system/automation contract failures are outside the acquisition systems. Live verification-provider semantics, deployment APP_KEY rotation, and legal sign-off for consentless cold outreach remain open.

## 2026-10-23 — explicit uncertain-email campaign policy

### Completed / verified

- Added workspace-scoped persistence for an explicit email-verification policy on sequences and broadcast campaigns. `strict` is the database default; `allow_catch_all`, `allow_unknown`, and `allow_uncertain` are available only as deliberate target settings.
- Routed the policy through enrollment, campaign preview/expansion, scheduled campaign sends, and sequence last-mile dispatch. The deployment-level `EVOSALES_BLOCK_CATCH_ALL_EMAIL` and `EVOSALES_BLOCK_UNKNOWN_EMAIL` guards remain fail-closed, so a target policy cannot override an environment that has not approved uncertain delivery.
- Added policy controls to sequence and campaign creation/edit surfaces and regression coverage for sequence enrollment and campaign preview. The outbound regression set passes 43 tests / 215 assertions; Pint, TypeScript, targeted ESLint, and `git diff --check` pass.

### Remaining

- Live verification-provider semantics, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.
## 2026-10-23 — strict verification-state semantics

### Completed / verified

- Closed the strict-policy gap for `evidence_supported`, `not_found`, `not_detected`, and `conflicting` email-verification states. These states are evidence or absence signals, not confirmed deliverability, and now fail outbound eligibility even when a target explicitly allows catch-all or unknown addresses.
- Updated the outbound policy labels and architecture/data-model contracts to describe the actual semantics without claiming that missing verification metadata is proof of delivery.
- The expanded outbound regression set passes 44 tests / 223 assertions; Pint, TypeScript, targeted ESLint, and `git diff --check` pass.

### Remaining

- Live provider semantics, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — release-readiness audit

### Completed / verified

- Re-read the complete build brief and audited the current roadmap, architecture, data model, testing contract, release report, working tree, and latest implementation revision.
- Re-ran the repository-wide PHP regression after fail-closed missing-verification hardening: 1,346 tests, 1,337 passed, 8 existing branding/design-system/automation contract failures, 35,760 assertions, and 1 skipped. No acquisition-system test failed; the two existing `InvalidArgumentException` import warnings remain unchanged.
- Re-ran the broader acquisition integration gate across imports, enrichment, lead-magnet capture and funnel attribution, outbound lifecycle, suppression, and CRM filtering: 131 tests / 883 assertions passed.
- Confirmed the four pre-existing user edits remain unstaged and outside this acquisition-system work.
- Aligned the roadmap and release report with the authoritative current revision (`207b3d7e`) and current full-suite baseline.

## 2026-10-23 — fail-closed missing email verification

### Completed / verified

- Changed last-mile outbound eligibility so a contact with a usable email but no verification record is treated as `unknown` and blocked by default. An explicit deployment opt-in plus `allow_unknown` target policy remains required for uncertain addresses.
- Added a narrowly scoped authenticated mailbox test-send exception. It still validates the recipient format and suppression list, but does not use the test recipient as a campaign prospect or bypass normal sequence/campaign eligibility.
- Added regression coverage for missing verification and ordinary dispatcher sends; the focused outbound gate passes 51 tests / 320 assertions.
- The test-only `ContactFactory::withVerifiedEmail()` state makes positive outbound fixtures explicit rather than implying that every contact is verified.

### Remaining

- Live verification-provider semantics, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — broadcast campaign editing

### Completed / verified

- Added workspace-scoped campaign editing for draft and scheduled broadcasts, including audience filter, template, mailbox, subject/body, verification policy, and schedule changes.
- Foreign saved-filter, template, and mailbox IDs are ignored rather than attached across workspaces; campaigns that have started remain immutable and return a conflict response.
- Added the edit form to the campaign detail surface and kept the explicit send-now activation path separate from saving changes.
- Campaign feature coverage passes **8 tests / 108 assertions**; the broader outbound lifecycle set passes **64 tests / 383 assertions**. PHP formatting, TypeScript, targeted ESLint, production Vite build, and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — signed lead-magnet booking attribution

### Completed / verified

- Replaced unsigned sequential lead-magnet submission attribution with signed booking capabilities. The calculator returns a signed meeting URL, the booking form preserves it through POST, and unsigned IDs are ignored.
- Restricted the legacy lead-magnet demo redirect to signed requests and the active calculator offer in the same workspace.
- The public calculator, meeting, and inbound workflow regression passes **20 tests / 195 assertions**; Pint, targeted ESLint, TypeScript, and `git diff --check` pass.
- The production Vite build passes after the signed booking handoff; only the repository's existing optional-font, chunk-size, and ineffective dynamic-import warnings remain.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — workspace-timezone campaign cap

### Completed / verified

- Aligned broadcast campaign daily-cap counting and rollover with each workspace's configured timezone. A message deferred near midnight now resumes at the next workspace-local day rather than the application server's date.
- Added a cross-midnight regression with a non-default workspace timezone. The outbound department set passes **24 tests / 164 assertions**; the broader outbound gate passes **72 tests / 411 assertions**; Pint and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — multi-workspace campaign-cap isolation

### Completed / verified

- Grouped campaign-cap counts by workspace in the shared outbound runner. Each tenant now uses its own local-day boundary even when a single run processes messages from multiple workspaces.
- Added a two-workspace timezone regression. The outbound department set passes **25 tests / 171 assertions**; the focused campaign/outbound slice passes **57 tests / 357 assertions**; Pint and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — address-bound verification provenance

### Completed / verified

- Bound projected email-verification state to the exact current contact address. A stale proposal for another address remains traceable in enrichment history without changing outbound eligibility.
- Preserved stronger `verified` or evidence-supported state when a later current-address proposal is weaker or inconclusive; mismatched legacy/current projections fail closed as unknown.
- The focused enrichment and outbound-policy regression passes **19 tests / 127 assertions**; Pint and `git diff --check` pass.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — partial-provider enrichment recovery

### Completed / verified

- Isolated website and Google Places enrichment providers inside one record run. A transient failure is recorded and rethrown for queue backoff after the other provider has completed, preserving useful partial results instead of aborting the run early.
- Added a regression for a transient website outage with a successful Google Places result. The focused enrichment set passes **14 tests / 113 assertions**; the broader acquisition slice passes **39 tests / 284 assertions**; Pint passes.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — per-campaign outbound daily cap

### Completed / verified

- Added a workspace-scoped `daily_limit` to broadcast campaigns with a default of 20 messages per day, independent of the selected mailbox cap.
- The campaign runner counts provider-accepted sends for the current day, defers excess queued messages with `campaign_daily_cap`, and resumes them after the next workspace day without dropping or failing them.
- Added the limit to campaign create/edit surfaces, the design-lab fixture, the data model, and the operating documentation.
- The outbound regression set passes **70 tests / 402 assertions**; Pint, targeted ESLint, TypeScript, and `git diff --check` pass.
- The production Vite build passes after the cap fields were added; only the repository's existing optional-font, chunk-size, and dynamic-import warnings remain.
- Repository-wide PHP regression after this increment: **1,349 tests, 1,340 passed, 8 existing branding/design-system/automation contract failures, 35,781 assertions, and 1 skipped**. No acquisition-system test failed; the two existing `InvalidArgumentException` import warnings remain unchanged.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.

## 2026-10-23 — current repository-wide regression baseline

### Completed / verified

- Re-ran the complete PHP suite after the partial-provider, address-bound verification, workspace-isolated campaign-cap, and signed booking increments: **1,354 tests, 1,345 passed, 8 existing branding/design-system/automation contract failures, 35,811 assertions, and 1 skipped**.
- No acquisition-system test failed. The two existing `InvalidArgumentException` import warnings remain unchanged.

### Remaining

- Live provider verification, deployment APP_KEY rotation, legal sign-off for consentless cold outreach, and the eight unrelated branding/design-system/automation contract failures remain open.
