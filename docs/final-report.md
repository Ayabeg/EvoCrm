# Acquisition systems release report

Current implementation revision: `9335676b` (`main`; this release report is maintained in subsequent documentation commits)

This report records the current verified state of Dead Enrichment, EvoCRM Outbound, and Dead Magnet. It is a release-readiness report, not a claim that live providers or the unrelated repository UI contracts are production-ready.

## Implemented and verified

- Shared workspace-scoped CRM integration across companies, contacts, leads, activities, consent, suppression, enrichment provenance, outbound messages, and funnel events.
- Dead Enrichment ingestion, incomplete-row retention, normalization, duplicate-safe re-imports, provider evidence, verification-state projection, CRM detection, explainable data-quality scoring, bounded queueing, retries, and retry actions.
- EvoCRM Outbound eligibility, suppression rechecks, explicit consent policy, template rendering, sanitized HTML, preview, campaign and sequence execution, quiet hours, mailbox caps, durable send claims, provider-event idempotency, reply classification, unsubscribe handling, and interested-reply tasks.
- Durable campaign expansion for audiences over 1,000 contacts using resumable 250-contact cursor jobs and idempotent message creation.
- Dead Magnet Lead Leakage Calculator, validation, duplicate-safe submission persistence, separate delivery/marketing/enrichment consent, shared CRM handoff, queued result delivery with honest failure states, demo handoff, booking attribution, and persisted form-start, calculator-use, submission, demo-request, and booking funnel analytics.
- Public analytics consent gating and pseudonymous authenticated analytics identity.

## Verification evidence

- Previous complete focused acquisition regression: **207 tests / 1,440 assertions passed**.
- Latest post-hardening acquisition integration subset: **181 tests / 1,254 assertions passed**, including lead-magnet engagement tracking, reply safety, imports, enrichment, provider events, and outbound execution.
- Consent and outbound lifecycle regression: **39 tests / 216 assertions passed**.
- Latest repository-wide regression: **1,338 tests; 1,324 passed; 13 existing UI/source-contract failures; 35,678 assertions; 1 skipped**. The 13 failures are outside the acquisition-system implementation.
- `npm run types:check` passed.
- Local browser smoke test passed for the public Lead Leakage Calculator at desktop and 390px mobile widths: the optional contact fields render as text/email controls, the page has no horizontal overflow, and the default calculator submission renders the result panel.
- `git diff --check` passed.
- Current-tree Codex Security standard review `013e6eaf-f741-4d08-ad0f-5ab2bef6f61b`: zero reportable findings across seven reviewed acquisition surfaces; coverage is explicitly partial and limitations are recorded by the scan.
- Committed hardening diff review `8387f1e4-4aca-49d9-98e7-7621a3a338c1` for `29aad813` to `46661ae7`: zero reportable findings with complete coverage of five changed security surfaces. Live provider behavior, deployment secret rotation, and legal compliance remain external limitations.
- Latest acquisition diff review `8ec3adf4-f42c-4c05-b806-d79d4ddb1d45` for `46661ae7` to `286f2634`: zero reportable findings with complete coverage of seven changed security surfaces, including public lead-magnet tracking, outbound stale-claim handling, and reply branching.

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

## Implemented but not fully verified

- Live SMTP/IMAP, mail-stack, Google Places, email-verification, Evolution, and other provider behavior remains unverified without configured external accounts.
- Full repository release verification remains non-green because of the 13 pre-existing UI/source-contract failures.
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
