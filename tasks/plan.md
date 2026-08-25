# Implementation Plan: EvoSales HubSpot Gap Closure

## Overview

Close the highest-value gap between EvoSales and HubSpot for 5–20 seat Algeria-first sales teams without cloning HubSpot's enterprise surface area. Work proceeds in five dependency-ordered phases: make existing automation reliable and secure, make customer migration possible, improve daily seller throughput, complete deal-to-quote execution, then deepen EvoSales' owned outbound and Meta/WhatsApp advantages.

The target is not feature-count parity. The target is a trustworthy sales operating system that a customer can migrate into, use as the daily system of record, and carry from lead capture through a sent and accepted quote.

## Scope and Success Measures

### In scope

- Production scheduler reliability and health visibility
- Tenant-safe webhook routing and Meta credential consistency
- Enforced role and permission policies
- CSV contact/deal import, duplicate handling, and bulk list operations
- Google email/calendar activity synchronization
- Complete lead-to-deal, deal intelligence, line-item, and quote workflows
- Bounce processing and segment-exit automation
- Real scheduled-report delivery

### Explicitly deferred

- Custom objects, tickets, CMS, SEO, and landing-page tooling
- SAML/enterprise SSO and native mobile applications
- HubSpot-scale integration marketplace
- Visual workflow canvas
- Full CPQ, subscriptions, payments, and e-signature
- Breeze-scale vector RAG or autonomous prospecting
- Laravel-owned live-chat product; EvoDesk remains the Desk boundary

### Outcome measures

- Every scheduled subsystem has a production process and a visible freshness signal.
- A new customer can import contacts and deals without creating silent duplicates.
- A rep can select records and perform common actions in bulk.
- Email and meeting activity appears on the CRM timeline from a connected Google account.
- A qualified lead can become a linked deal through one explicit flow.
- A deal can be priced, quoted, emailed, and accepted without disconnected backend-only features.
- Outbound reporting records real bounce outcomes and applies suppression rules.

## Architecture Decisions

- **Preserve the Laravel monolith.** Add focused services, commands, policies, and Inertia slices rather than introducing a second application.
- **Run background processing outside the web process.** The web service remains bound to `0.0.0.0:$PORT`; scheduled work runs in a dedicated worker/service because deploy restarts and ephemeral files cannot be relied on.
- **Use durable database state.** Imports, synchronization cursors, webhook identities, and quote acceptance state must live in MySQL/Postgres-compatible tables, not local files or process memory.
- **Resolve tenancy at integration boundaries.** Webhooks must identify a workspace through a signed token or provider-instance mapping; `Workspace::first()` is not acceptable.
- **Enforce permissions server-side.** UI visibility is supplemental. Controllers and policies own authorization.
- **Ship vertical slices.** Each task includes persistence, server behavior, UI where applicable, and focused tests.
- **Keep provider adapters explicit.** Google, Meta, mail bounce, and future SMS integrations use provider services behind stable domain interfaces.
- **Make imports idempotent.** Re-uploading the same source must update or skip matched records predictably rather than multiplying data.

## Dependency Graph

```text
Production worker + health
  ├── Google synchronization
  ├── scheduled report delivery
  └── outbound bounce processing

Tenant-safe integration identity
  ├── Meta OAuth-backed sync
  ├── Google synchronization
  └── webhook ingestion

Server-enforced permissions
  ├── CSV import
  ├── bulk actions
  └── permission editor

CSV import
  └── duplicate review and merge

Lead conversion
  └── deal commerce
       └── quote send and acceptance
```

## Task List

### Phase 0: Baseline

- [x] Task 0: Audit repository and production architecture

The audit is recorded in [`docs/evolsales-baseline.md`](../docs/evolsales-baseline.md). It establishes the evidenced Docker Compose VPS topology, current process gaps, integration and authorization architecture, baseline quality failures, and external verification blockers.

### Phase 1: Production Trust

- [x] Task 1: Deploy the scheduler as a durable worker
- [x] Task 2: Add scheduler and integration health signals
- [x] Task 3: Make inbound webhooks tenant-safe
- [x] Task 4: Unify Meta OAuth credentials with runtime services
- [x] Task 5: Enforce CRM permissions and expose editable overrides

### Checkpoint: Production Trust

- [x] Scheduled commands execute independently from the HTTP process.
- [x] A workspace cannot receive or mutate another workspace's webhook data.
- [x] Runtime Meta sync uses the connection shown in Settings.
- [x] Permission tests prove forbidden member actions return 403.
- [x] Full test suite and production build pass.

### Phase 1: Migration and Data Operations

- [ ] Task 6: Import contacts from mapped CSV files
- [ ] Task 7: Import deals and associations from mapped CSV files
- [ ] Task 8: Add duplicate review and contact merge
- [ ] Task 9: Add bulk CRM actions

### Checkpoint: Migration

- [ ] A representative HubSpot export imports contacts and deals with associations.
- [ ] Re-importing the same files is idempotent.
- [ ] Duplicate candidates can be resolved without losing timeline or deal links.
- [ ] Bulk actions enforce workspace scope and permissions.

### Phase 2: Daily Seller Workflow

- [ ] Task 10: Convert a qualified lead into a linked deal
- [ ] Task 11: Synchronize Google email activity
- [ ] Task 12: Synchronize Google Calendar activity
- [ ] Task 13: Surface deal health and forecast guidance

### Checkpoint: Seller Workflow

- [ ] A rep can move from qualified lead to active deal without duplicate records.
- [ ] Connected email and meetings appear once on the correct contact/deal timeline.
- [ ] Deal-health and forecast indicators are derived from current CRM data.
- [ ] Sync failures are visible and retryable.

### Phase 3: Deal-to-Quote Completion

- [ ] Task 14: Restore deal line-item editing on the record page
- [ ] Task 15: Add deal-split editing
- [ ] Task 16: Generate and email quote PDFs
- [ ] Task 17: Add secure quote acceptance

### Checkpoint: Revenue Loop

- [ ] Deal totals follow line items consistently.
- [ ] Split allocations validate to the configured total.
- [ ] A quote can be generated, sent, viewed, and accepted.
- [ ] Quote events appear on the deal timeline and can trigger workflows.

### Phase 4: Moat and Manager Completeness

- [ ] Task 18: Process real outbound bounce events
- [ ] Task 19: Trigger automation when contacts leave segments
- [ ] Task 20: Deliver real scheduled reports
- [ ] Task 21: Add multi-pipeline selection to the deals list

### Checkpoint: Complete

- [ ] Outbound metrics distinguish delivered, bounced, opened, clicked, and replied.
- [ ] Hard bounces suppress future sends.
- [ ] Segment entry and exit are both auditable automation events.
- [ ] Scheduled reports contain actual report output.
- [ ] Managers can filter the deals list by pipeline.
- [ ] All tests, static checks, formatting checks, and frontend builds pass.

## Delivery Strategy

Each numbered task should land as a separate logical change. Tasks 1–5 are release blockers and remain sequential where they touch integration identity or authorization. After the Production Trust checkpoint:

- Tasks 6 and 10 may proceed independently.
- Tasks 11 and 12 may proceed in parallel after their shared Google synchronization contract is defined.
- Tasks 14 and 15 may proceed in parallel.
- Task 18 and Task 19 may proceed in parallel.
- Task 20 depends on Task 1.
- Task 17 depends on Task 16; Task 16 depends on Task 14.

Do not begin a later checkpoint if a prior checkpoint has unresolved correctness, authorization, or data-loss findings.

## Verification Standard

Every task must run its focused Pest file plus:

```bash
composer lint:check
composer types:check
npm run lint:check
npm run types:check
npm run build
composer test
```

Provider-dependent tasks also require contract tests with mocked provider responses and one staging smoke test using non-production credentials. Production secrets must remain in environment configuration.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scheduler deployment differs from local Docker | High | Confirm the production orchestrator before Task 1; provide separate web and worker definitions |
| Webhook providers do not include a direct workspace key | High | Persist provider instance/account mappings and require a signed per-workspace webhook secret |
| Existing permission claims do not match current behavior | High | Inventory mutating/export routes and add denial tests before exposing an editor |
| CSV imports create duplicates or partial graphs | High | Use preview, stable matching rules, transactions, row-level errors, and import idempotency keys |
| Google synchronization duplicates events | High | Store provider message/event IDs and incremental sync cursors with unique constraints |
| Quote links leak customer data | High | Use random signed tokens, expiration/revocation, minimal public payloads, and audit events |
| Bounce formats vary by mail provider | Medium | Define a normalized bounce event and implement one adapter at a time with fixture tests |
| Large imports and campaigns exhaust web requests | High | Persist batches and process chunks through workers; show progress from durable state |
| Scope expands into HubSpot enterprise cloning | Medium | Enforce the explicit defer list and require evidence of customer demand before adding deferred areas |

## Phase 5: Wave 6 seller trust

Stacked on segment membership history. Do not start canvas, Breeze, tickets, e-sign, SAML, or marketplace.

- [ ] Task 23: Workspace audit / login trail
- [ ] Task 24: Calculated list columns and association filters
- [ ] Task 25: Record playbooks

### Checkpoint: Wave 6

- [ ] Login, import, merge, quote send/accept, and permission changes write durable audit events
- [ ] Audit page is workspace-scoped and owner/admin only
- [ ] List column chooser includes custom/calculated attributes and renders their values
- [ ] Contacts can be filtered by associated deal stage and open-deal presence
- [ ] Playbooks can be authored in settings and shown on contact and deal records
- [ ] Full test suite and production build pass

## Open Questions

1. Which production orchestrator currently runs EvoSales, and does it support a dedicated worker service?
2. Which production database is authoritative: MySQL or PostgreSQL?
3. Should CSV matching prefer email, phone, an external HubSpot record ID, or a configurable order?
4. Is Google Workspace the only synchronization target for the first release, or is Microsoft 365 required simultaneously?
5. Which mail system will emit bounce events, and what webhook or mailbox format does it provide?
6. Should quote acceptance be a simple acknowledgement or require typed-name/IP evidence?
7. Which roles may import, bulk delete, merge contacts, edit splits, and send quotes?

Implementation should begin only after the plan and these decisions are reviewed.
