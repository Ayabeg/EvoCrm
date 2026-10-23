# EvoCRM acquisition architecture

## Scope

Dead Enrichment, EvoCRM Outbound, and Dead Magnet are capabilities inside the existing EvoCRM Laravel application. They share the existing workspace-scoped CRM records and activity/event infrastructure; they are not separate applications or competing customer databases.

## Reference implementation review

The supplied `Awaisali36/50k-lead-generation-system` repository was reviewed as an operational reference. Its n8n/Airtable workflow makes the useful separation explicit: source acquisition, staged enrichment, aggregation, and qualification are separate steps, with a bounded lead batch and a reusable qualification prompt. EvoCRM carries those ideas through native provider adapters, durable jobs, workspace-scoped provenance, chunked audience processing, and explainable data-quality/sales-fit scores.

The reference's Apollo/LinkedIn scraping, Airtable tables, and Gemini-dependent scoring are not copied into the product. EvoCRM does not claim provider results without credentials or authorization, and public collection remains subject to the existing safety, rate-limit, privacy, and terms-of-service boundaries.

## Current runtime

- Laravel HTTP application with Inertia/React screens.
- Eloquent models and migrations are the source of truth for persistence.
- Database-backed queue is the default local queue, with jobs and scheduled Artisan commands for durable work.
- Existing authentication/authorization is workspace-aware; administrative screens must use the existing middleware and policies.
- Existing outbound uses provider abstractions for SMTP/IMAP, campaign/sequence services, suppression, tracking, replies, delivery/bounce/complaint events, and quiet hours.

## Bounded service responsibilities

```text
Public lead magnet
  -> LeadMagnetSubmission / LeadCapture
  -> Contact + Company + Lead (match or create)
  -> consent + attribution + activity/funnel event
  -> optional permitted enrichment
  -> delivery / demo request

Import or existing CRM record
  -> normalization + duplicate review
  -> provider adapters
  -> field evidence/provenance + verification state
  -> data-quality score + sales-fit score
  -> outbound eligibility policy
  -> campaign/sequence enrollment
  -> durable send/follow-up jobs
  -> provider events/replies/suppression/pipeline
```

### Shared CRM core

`Workspace`, `Company`, `Contact`, `Lead`, `Deal`, `Activity`, `ContactConsent`, `LeadCapture`, and existing funnel/event records remain the shared source of truth. New acquisition records reference these entities and carry workspace ownership.

### Dead Enrichment

Use provider adapters and the existing `EnrichmentService`, `WebsiteEnricher`, `GooglePlacesEnricher`, `EmailVerificationEnricher`, `EnrichmentPersister`, import batches, and enrichment runs where their current contracts fit. A provider may add a candidate value, evidence, verification status, confidence, and error; it may not erase stronger existing data. Enrichment jobs are idempotent and retry transient failures only.

Email verification now has an explicit `EmailVerificationProvider` contract, a disabled-by-default provider that records `unsupported` honestly, and an optional safe DNS adapter. The DNS adapter validates syntax and records MX evidence as `evidence_supported`; it never performs SMTP probing, sends test messages, or claims that a mailbox exists. Results are cached per workspace/target/address for the configured freshness window, and stale or provider-backed results remain visible in the existing enrichment ledger.

An approved HTTP verifier can be selected with `EVOSALES_EMAIL_VERIFICATION_DRIVER=http`. Its adapter sends the normalized address over an authenticated request, maps only the documented normalized response statuses, stores a bounded evidence subset, retries transport/429/5xx failures through the enrichment job, and never persists the API key or the provider's unbounded response.

Website enrichment honors `robots.txt` by default before every public fetch hop. Policies are cached per origin for one hour, `Allow`/`Disallow` specificity and wildcard/end-anchor rules are applied for `User-agent: *`, and unavailable or disallowed policies fail closed without fetching the page. A robots denial is recorded as a skipped enrichment run rather than a provider error.

Lead scoring keeps commercial qualification separate from data quality: the existing fit/intent/timing score remains the qualification authority, while `DataQualityScorer` computes an explainable completeness score from the shared company/contact/source fields and persists it with each score snapshot. Default rule points live in `config/evosales.php`; each workspace can override them through Qualification settings, with bounded values and fallback to defaults for omitted rules. Score snapshots retain the rule breakdown that was applied.

### EvoCRM Outbound

Use existing `CampaignService`, `SequenceEnrollment`, `OutboundDispatcher`, `SuppressionService`, `QuietHoursGuard`, `MailerFactory`, `ImapReplyPoller`, provider-event processing, tracking, and scheduler. Add missing eligibility/last-mile checks at the service boundary used by both campaign and sequence paths. Provider events are recorded idempotently before projecting delivery, bounce, or complaint state; hard bounces and complaints suppress the address and pause the related sequence enrollment. IMAP replies are persisted by provider message identity and marked seen only after CRM persistence succeeds. Outbound sends acquire a database-backed `sending` claim. A stale claim after worker interruption is quarantined as `failed` with an unknown-provider-outcome reason instead of being resent automatically, preventing duplicate SMTP delivery when the provider accepted the message before the worker crashed.

Email verification provenance is projected from an `EnrichmentRun` onto the related contact's `meta.email_verification` record, including the exact address it describes. A proposal for another address remains in history but cannot change the current contact's outbound state; stronger current-address evidence is retained when a later proposal is weaker or inconclusive. Outbound eligibility treats provenance for a different current address as unknown and fails closed. Invalid, temporary-failure, unsupported, evidence-only, not-found, not-detected, conflicting, and missing verification results are not deliverability proof and are blocked by outbound policy. Catch-all and unknown states are blocked by default; allowing either requires both an explicit sequence/campaign policy and a deployment configuration that permits the corresponding uncertain state. The deployment guard remains fail-closed even when a campaign policy is permissive. The authenticated mailbox test-send action is a separate, explicit operational check: it still validates the address and suppression list but does not treat the test recipient as a campaign prospect.

Marketing consent is required by default for outbound eligibility, and an explicit denial always suppresses that channel. The opt-out for consentless cold outreach is an explicit deployment configuration that requires a documented lawful basis and legal review; lead-magnet delivery remains separate from optional marketing consent and never auto-enrolls a submission into cold outreach.

Outbound reporting exposes a typed evidence-aware metric contract rather than placeholder rates. It reports campaign audience snapshots, messages leaving the queue, mailer-accepted sends, provider delivery/bounce/complaint events, reply sync and classification, suppression matches, demo requests/bookings, and CRM outcomes. Every rate carries its denominator; contact-attributed funnel and CRM outcomes intentionally have no conversion rate until a stronger attribution key exists. Opens and clicks are first-party tracking events with explicit caveats and are never treated as proof of interest.

### Dead Magnet

Keep calculator math as a pure domain service with no HTTP or Eloquent dependencies. Persist the offer/submission/assumption result separately from the shared contact/lead record, then record attribution and consent using the existing CRM conventions. Delivery is transactional and separately observable from optional marketing eligibility.

The lead-magnet result-copy job is unique per submission, retryable, and records queued, sending, accepted, or failed state plus the last error. Accepted means the configured mailer accepted the message; it is not proof of inbox delivery. Anonymous calculator use remains inline and does not create a contact.

When a workspace has an enabled MeetingSchedule, the calculator result links to a throttled, workspace-scoped demo redirect. The redirect records a deduplicated demo-requested funnel event for the submission and then hands off to the existing public booking flow. Calculator results emit a signed booking capability, and the booking controller ignores unsigned submission IDs so sequential record IDs cannot attach another submission to a booking; no booking link is invented when no schedule is configured.

The public form has separate marketing and enrichment consent flags. Enrichment is queued only for a linked contact when the visitor explicitly permits relevant public-business enrichment; anonymous use and marketing-only consent never trigger enrichment.

Completed bookings record a deduplicated meeting_booked funnel event against the booking Activity. If the booking came from a same-workspace lead-magnet submission, the event keeps the submission's contact/lead attribution and marks its source as lead_magnet; ordinary bookings remain attributed to booking or the contact source.

## Reliability rules

- Every workspace-scoped write checks ownership and authorization.
- Every cross-entity create/update that must remain consistent is transactional.
- Unique keys and idempotency keys prevent duplicate imports, submissions, sends, provider events, and subject-scoped funnel events. Funnel-event recording uses a database unique constraint plus `createOrFirst` so concurrent callbacks cannot pass a check-then-insert gap.
- Long-running enrichment and outbound actions run through durable jobs/commands, not in-memory timers.
- Contact and deal imports run through durable 100-row worker pages. Pending import rows are the resumable cursor; each continuation is safe to replay, and a completed batch is not reopened by a stale duplicate worker.
- Campaign audiences over 1,000 contacts use `ExpandOutboundCampaign` cursor jobs in 250-contact pages; each page persists progress and reuses the workspace/idempotency boundary before the campaign becomes sendable.
- Broadcast campaigns persist a configurable daily send cap (20 messages by default). Messages beyond that cap remain queued with a durable `campaign_daily_cap` defer reason and become eligible after the next workspace-local day; the mailbox cap remains an independent lower bound. A shared runner groups cap counts by workspace before applying each workspace's local-day window.
- Retries use bounded exponential backoff and preserve the original error and attempt history.
- Enrichment jobs are unique for one hour per workspace/target type/record, retry up to three times with bounded backoff, and can be queued from a workspace-scoped bulk action.
- Stronger existing evidence is not silently replaced by weaker or stale evidence.
- Public endpoints validate input, rate-limit where appropriate, and avoid exposing internal identifiers or PII.
- Public PostHog collection is disabled until a visitor explicitly grants analytics consent; authenticated product events use pseudonymous server-derived identities and do not include login email by default.
- Outbound HTML is sanitized before preview, tracking-link rewriting, and provider delivery; the CRM preview is additionally sandboxed.

## External boundaries

Provider adapters are disabled or fail honestly when credentials are absent. No fake live-service result is used. Sending remains disabled until an explicit campaign activation and the existing mailbox/provider checks succeed.

