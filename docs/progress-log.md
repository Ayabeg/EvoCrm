# EvoCRM acquisition systems progress log

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
- Added stale-record selection to scheduled enrichment maintenance: `leads:enrich` defaults to seven days, excludes recent queued/proposed/applied runs, and supports an explicit `--stale-hours` window. The enrichment suite passes 12 tests / 106 assertions for this maintenance boundary.
- Repository-wide `php artisan test --compact` was run after the acquisition changes and remains non-zero on pre-existing UI/source-contract failures, including `tests/Feature/P04AppShellTest.php:59`, which still expects the literal `Search EvoCRM` shell text while the current shell renders the translated `Search` label. These failures are outside the acquisition-system files. Acquisition-focused suites remain green, and the two existing InvalidArgumentException import warnings are unchanged.

### In progress

- Lead-magnet delivery/conversion completion (M3): inline result, queued result-email delivery, demo handoff, booking-to-pipeline analytics, and explicit enrichment consent are implemented; release-level integration and security review remain.
- Shared provenance/verification/eligibility contract (A3, E1, O1).
- Campaign audience policy for uncertain email states and provider-level delivery/idempotency verification remain for O1/O2; current local idempotency protects stable message creation, while live provider event semantics remain environment-dependent.
- Exact gap analysis of existing enrichment, outbound eligibility, and lead-capture flows before adding migrations.
- Enrichment orchestration (E3): the existing per-record actions now share a capped workspace-scoped bulk queue endpoint and Contacts exposes a Queue enrichment action for selected records. EnrichRecordJob is unique per workspace/target/type, retries transient failures up to three times with bounded backoff, and the focused suite passes 11 tests / 97 assertions.
- Lead-magnet booking attribution (M3): the demo handoff now carries a same-workspace submission reference into the existing public booking form, and MeetingBooker records one meeting_booked funnel event with contact/lead/deal links and lead-magnet source attribution. Focused meeting/lead-magnet coverage passes 16 tests / 158 assertions.
- End-to-end inbound workflow (I2) is now covered from calculator submission through shared Contact/Lead creation, queued result delivery, demo handoff, booking, and lead-magnet funnel analytics.
- Data maintenance (I3) is in progress: the scheduled enrichment command now has a tested stale-record boundary; stronger evidence preservation and suppression-safe outbound behavior remain under integration review.
- Latest combined acquisition regression pass: 51 tests / 387 assertions passed across inbound workflow, lead-magnet delivery/conversion, funnel analytics, enrichment, and outbound campaign/sequence execution.

### Blocked

- Live provider verification and live outbound delivery are blocked until the relevant external credentials/accounts are configured. Local adapters, validation, idempotency, and failure paths are not blocked.
- Full-suite release verification is not green until the 15 existing UI/source-contract failures are resolved; none of the focused acquisition suites failed in the final verification.

### Next verified task

Finish provider-limit/retry controls and the remaining outbound/data-maintenance integration gates, while keeping live-provider work blocked until credentials are configured.

