# EvoCRM acquisition testing and acceptance contract

## Verification status

No feature in the requested three-system expansion is marked complete merely because a screen or class exists. Each status must include the command/check actually run and the observed result in `docs/progress-log.md`.

## Test layers

### Unit tests

- Calculator math, input bounds, rounding, reset behavior, and assumption labeling.
- Domain normalization for emails, domains, phone numbers, company names, and categorical values.
- Verification/field-evidence precedence and conflict decisions.
- Email-verification provider selection, syntax/MX evidence boundaries, unsupported fallback, address binding, and freshness caching.
- Authenticated HTTP verifier status normalization, bounded evidence, secret exclusion, and retryable provider outages.
- Temporary verifier failures must remain retryable and must not be treated as fresh cached results.
- Scoring breakdowns and configurable thresholds.
- Eligibility policy decisions, including unknown/catch-all email states and suppression.
- Template rendering and personalization fallbacks without invented claims.

### Feature/integration tests

- CSV preview/import with complete, incomplete, malformed, duplicate, and re-imported rows.
- Enrichment provider success, partial result, stale result, conflict, timeout, retry, and permanent failure.
- Robots policy parsing, disallowed-page skips, policy-unavailable fail-closed behavior, and rechecking after redirects.
- Configured email-verifier projection, disabled-provider error visibility, and repeat-run cache behavior.
- Workspace authorization, pagination, filtering, and duplicate review.
- Workspace-scoped bulk enrichment queueing, cross-workspace ID rejection, unique job keys, and retry configuration.
- Campaign creation/editing, activation, preview/test send, last-mile suppression check, mailbox and per-campaign daily limits, quiet hours, and duplicate send prevention.
- Provider event idempotency, delivery projection, bounce/complaint/unsubscribe handling, complaint suppression, sequence pause, idempotent IMAP reply ingestion, reply pause, database send claims, stale-claim recovery, and restart-safe follow-up scheduling.
- Outbound report metric contracts, including selected/attempted/provider-accepted denominators, actual provider-event quality, reply classification, suppression counts, CRM outcome caveats, and the explicit warning that opens are not proof of interest.
- Subject-scoped funnel event idempotency is enforced by a database uniqueness constraint and exercised through duplicate recorder calls; subjectless public visits remain append-only.
- Lead-magnet submission persistence, duplicate request handling, separate delivery/marketing consent, contact/lead matching, delivery error state, and demo-request conversion.
- Lead-magnet demo-to-booking attribution, same-workspace submission binding, booking event deduplication, and contact/lead/deal linkage.
- Result-copy delivery through the configured mailer, including unique retry-safe job dispatch and the distinction between mailer acceptance and actual inbox delivery.

### End-to-end workflow tests

1. Import → normalize/deduplicate → enrich → verify → score → outbound eligibility → preview → explicit activation → provider event/reply → pipeline update.
2. Landing page → calculator use → submission → CRM match/create → attribution/consent → delivery → demo request → analytics.
3. Stale/incomplete record → re-enrichment → provenance-preserving update → verification refresh → suppression remains enforced.

## Required checks before a milestone is verified

- `composer test` or the narrowest relevant Pest test command.
- `composer lint:check` for PHP changes.
- `npm run lint:check`, `npm run types:check`, and `npm run build` for frontend/API contract changes as applicable.
- Migration tests against the configured SQLite test database.
- Manual review of changed routes, authorization, logs, and environment examples for secrets/PII.

## Acceptance gates

- **Enrichment:** incomplete data stays incomplete; results have traceable evidence/status; provider failures are visible/retryable; scoring is explainable; repeated runs are idempotent.
- **Outbound:** only eligible records can send; suppression is checked immediately before send; activation is explicit; follow-ups survive restarts; replies/events stop or route work correctly; metrics have explicit denominators.
- **Lead magnet:** page is responsive/accessibile; calculator is useful and transparent; input validation works; duplicate submissions are safe; delivery and marketing consent are separate; records enter the shared CRM model; delivery errors are visible; form-start, calculator-use, submission, demo-request, and booking events are persisted with bounded attribution.
- **Integration:** all three workflows are covered with failure/recovery cases and use the same company/contact/lead/deal/activity/consent/suppression records.

