# EvoCRM acquisition data model

## Existing source-of-truth entities

| Entity | Purpose | Reuse rule |
|---|---|---|
| `workspaces` | Tenant boundary, locale/timezone, scoring settings | Every acquisition record belongs to a workspace |
| `companies` | Organization/business record | Enrichment updates this record only after normalization/conflict handling |
| `contacts` | Individual/business contact methods and attribution | Do not create parallel person records |
| `leads` / `deals` | Qualification and sales pipeline | Lead-magnet and outbound outcomes link here |
| `activities` | CRM timeline | Record meaningful submissions, enrichment decisions, sends, replies, and outcomes |
| `contact_consents` | Channel-specific consent | Delivery consent and optional marketing consent remain distinct |
| `lead_captures` | Existing inbound capture staging | Reuse for raw inbound capture where compatible; add a first-class offer reference rather than duplicating captures |
| `enrichment_runs` | Existing field-level enrichment candidates | Preserve source, field, value, confidence, status, raw evidence, and decision metadata |
| `lead_scores` | Existing scored lead snapshots | Keep data quality separate from sales fit; extend carefully if the current schema cannot represent both |
| `import_batches` | Existing import lifecycle | Add column mapping/row error detail through existing import conventions |
| outbound tables | Mailboxes, templates, sequences, campaigns, enrollments, messages, suppressions, replies | All sends use existing suppression and idempotency paths |

## Required new or clarified records

The implementation should add only records that are not already represented by the current schema. Candidate records are:

### Lead-magnet offers and submissions

- `lead_magnet_offers`: stable offer slug, name, version, status, workspace/global scope, delivery configuration, and calculator definition version.
- `lead_magnet_submissions`: offer/version, workspace, optional contact/company/lead links, idempotency key, result assumptions, calculated result, source attribution, delivery status/error, mailer acceptance timestamp, and timestamps.
- `lead_magnet_events` (or an equivalent existing funnel/event record): visit/start/submit/use/delivery/demo-request outcome with dedupe key and attribution.

The current demo-request event uses the existing funnel_events table with event_type demo_requested and the LeadMagnetSubmission as its subject when a submission id is available.

Submissions may be anonymous until the user supplies delivery details. The calculator result itself must not require unnecessary PII.

Lead-magnet submissions store `marketing_consent` and `enrichment_consent` separately. The latter authorizes the optional background enrichment queue and does not imply permission for outbound marketing.

### Field provenance and verification

The current `enrichment_runs` table is a candidate/evidence ledger, but the broader contract needs explicit status semantics for values used by outbound. Prefer extending it or adding a normalized field-evidence table only if existing consumers cannot safely carry:

- target entity and field;
- normalized value and optional redacted/raw value;
- provider/method and evidence URL;
- retrieved/verified timestamps;
- verification status (`verified`, `evidence_supported`, `unknown`, `not_found`, `not_detected`, `conflicting`, `invalid`);
- confidence/evidence strength;
- decision (`accepted`, `rejected`, `needs_review`) and reason.

For email fields, the current-address projection also stores the exact email, status, source, evidence URL, retrieval time, confidence, and run ID on `contacts.meta.email_verification` so outbound eligibility consumes the same provenance without a competing verification table. Proposals for another address stay in `enrichment_runs` history and do not replace the current address's projection; stronger current-address evidence is retained when later evidence is weaker or inconclusive.

Outbound email sequences and broadcast campaigns persist an `email_verification_policy` (`strict`, `allow_catch_all`, `allow_unknown`, or `allow_uncertain`). `strict` is the database default. A permissive target policy is not sufficient by itself: the deployment must also explicitly disable the matching global block. Only `verified` is unconditional deliverability proof; evidence-only, not-found, not-detected, conflicting, missing, invalid, temporary-failure, and unsupported results remain blocked. An explicit authenticated mailbox test send is operational plumbing, not campaign eligibility.

`lead_scores.data_quality` stores a separate 0–100 completeness score. Its factors are kept in the score breakdown with the `quality` pillar; it does not alter the existing qualification thresholds or commercial score.

### Eligibility and suppression

Use the existing suppression tables and consent records as the enforcement source. If an audit record is needed, record the decision reason and policy version in the outbound enrollment/message or activity/event record; do not create a second suppression list.

## Invariants and indexes

- All new records have `workspace_id` and a foreign key with the existing cascade/null-delete conventions.
- Offer submissions have a workspace/offer/idempotency uniqueness rule so retries do not create duplicate contacts or delivery events.
- Provider events are stored in `outbound_provider_events` with workspace/provider/event-id uniqueness, normalized event type, received timestamp, raw bounded payload, and an optional outbound-message link. Outbound messages project delivery and complaint timestamps while retaining the legacy latest provider event ID for compatibility.
- Subject-scoped `funnel_events` are database-idempotent on workspace, funnel, event type, subject type, and subject ID; subjectless visit beacons intentionally remain append-only.
- Inbound IMAP replies retain the provider `message_id` (or a mailbox/UID fallback) and use a workspace/mailbox/direction/message identity constraint so repeated polls and concurrent workers cannot create duplicate reply records.
- Outbound messages use `sending_at` with a status/send-claim index. A stale claim is quarantined as `failed` with an unknown-provider-outcome reason after the bounded recovery window; a fresh claim prevents concurrent sequence or campaign workers from sending the same message twice.
- Broadcast campaigns store `daily_limit` (default 20) separately from the selected mailbox limit. The campaign runner records `campaign_daily_cap` as a deferred state instead of failing or dropping messages when the per-campaign limit is reached.
- Evidence lookup is indexed by workspace, target, field, status, and recency.
- List screens filter and paginate by workspace; no unbounded public or operator query is allowed.
- Domain/email/phone normalization is deterministic and stored separately from display values when needed.
- Existing user data is never overwritten by a lower-confidence candidate without an explicit decision.

