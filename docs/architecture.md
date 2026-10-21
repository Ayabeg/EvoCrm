# EvoCRM acquisition architecture

## Scope

Dead Enrichment, EvoCRM Outbound, and Dead Magnet are capabilities inside the existing EvoCRM Laravel application. They share the existing workspace-scoped CRM records and activity/event infrastructure; they are not separate applications or competing customer databases.

## Current runtime

- Laravel HTTP application with Inertia/React screens.
- Eloquent models and migrations are the source of truth for persistence.
- Database-backed queue is the default local queue, with jobs and scheduled Artisan commands for durable work.
- Existing authentication/authorization is workspace-aware; administrative screens must use the existing middleware and policies.
- Existing outbound uses provider abstractions for SMTP/IMAP, campaign/sequence services, suppression, tracking, replies, and quiet hours.

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

Use provider adapters and the existing `EnrichmentService`, `WebsiteEnricher`, `GooglePlacesEnricher`, `EnrichmentPersister`, import batches, and enrichment runs where their current contracts fit. A provider may add a candidate value, evidence, verification status, confidence, and error; it may not erase stronger existing data. Enrichment jobs are idempotent and retry transient failures only.

Lead scoring keeps commercial qualification separate from data quality: the existing fit/intent/timing score remains the qualification authority, while `DataQualityScorer` computes an explainable completeness score from the shared company/contact/source fields and persists it with each score snapshot.

### EvoCRM Outbound

Use existing `CampaignService`, `SequenceEnrollment`, `OutboundDispatcher`, `SuppressionService`, `QuietHoursGuard`, `MailerFactory`, `ImapReplyPoller`, bounce processing, tracking, and scheduler. Add missing eligibility/last-mile checks at the service boundary used by both campaign and sequence paths.

Email verification provenance is projected from an `EnrichmentRun` onto the related contact's `meta.email_verification` record. Invalid, temporary-failure, and unsupported results are never auto-applied to an empty email field; catch-all and unknown states are governed by explicit outbound configuration.

### Dead Magnet

Keep calculator math as a pure domain service with no HTTP or Eloquent dependencies. Persist the offer/submission/assumption result separately from the shared contact/lead record, then record attribution and consent using the existing CRM conventions. Delivery is transactional and separately observable from optional marketing eligibility.

The lead-magnet result-copy job is unique per submission, retryable, and records queued, sending, accepted, or failed state plus the last error. Accepted means the configured mailer accepted the message; it is not proof of inbox delivery. Anonymous calculator use remains inline and does not create a contact.

When a workspace has an enabled MeetingSchedule, the calculator result links to a throttled, workspace-scoped demo redirect. The redirect records a deduplicated demo-requested funnel event for the submission and then hands off to the existing public booking flow; no booking link is invented when no schedule is configured.

## Reliability rules

- Every workspace-scoped write checks ownership and authorization.
- Every cross-entity create/update that must remain consistent is transactional.
- Unique keys and idempotency keys prevent duplicate imports, submissions, sends, and provider events.
- Long-running enrichment and outbound actions run through durable jobs/commands, not in-memory timers.
- Retries use bounded exponential backoff and preserve the original error and attempt history.
- Enrichment jobs are unique for one hour per workspace/target type/record, retry up to three times with bounded backoff, and can be queued from a workspace-scoped bulk action.
- Stronger existing evidence is not silently replaced by weaker or stale evidence.
- Public endpoints validate input, rate-limit where appropriate, and avoid exposing internal identifiers or PII.

## External boundaries

Provider adapters are disabled or fail honestly when credentials are absent. No fake live-service result is used. Sending remains disabled until an explicit campaign activation and the existing mailbox/provider checks succeed.

