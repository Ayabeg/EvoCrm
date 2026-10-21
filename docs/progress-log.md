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
- The current worktree contains the lead-magnet delivery slice (`DeliverLeadMagnetSubmission`, result mail, delivery state migration/status props). Its migration imports were corrected in place, and the combined lead-magnet feature test now verifies result-email acceptance honestly.
- Added shared outbound eligibility checks and workspace-scoped message idempotency keys for sequence steps and campaigns. The focused outbound regression set passes 38 tests / 195 assertions.

### In progress

- Lead-magnet delivery/conversion completion (M3): inline result, queued result-email delivery, and the demo-request handoff are implemented; completed booking-to-pipeline analytics and optional permitted enrichment remain.
- Shared provenance/verification/eligibility contract (A3, E1, O1).
- Campaign audience policy for uncertain email states and provider-level delivery/idempotency verification remain for O1/O2; current local idempotency protects stable message creation, while live provider event semantics remain environment-dependent.
- Exact gap analysis of existing enrichment, outbound eligibility, and lead-capture flows before adding migrations.

### Blocked

- Live provider verification and live outbound delivery are blocked until the relevant external credentials/accounts are configured. Local adapters, validation, idempotency, and failure paths are not blocked.

### Next verified task

Audit and harden the shared outbound eligibility and idempotency changes already present in the worktree, then add the smallest missing enrichment verification/normalization behavior.

